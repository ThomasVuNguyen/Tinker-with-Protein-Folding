/**
 * Real API Services
 * =================
 * All external API calls for the vaccine design pipeline.
 * No mocks, no simulations — every call hits a real endpoint.
 */

// ─── UniProt API ─────────────────────────────────────

/**
 * Search UniProt for viral proteins matching a query.
 * Returns reviewed (Swiss-Prot) entries only for quality.
 */
export async function searchVirusProteins(query) {
  const q = encodeURIComponent(
    `(${query}) AND (taxonomy_id:10239) AND (reviewed:true)`
  );
  const url = `https://rest.uniprot.org/uniprotkb/search?query=${q}&format=json&size=15&fields=accession,protein_name,organism_name,length,gene_names,sequence`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`UniProt search failed: ${res.status}`);
  const data = await res.json();

  return data.results.map((entry) => ({
    accession: entry.primaryAccession,
    name: entry.proteinDescription?.recommendedName?.fullName?.value
      || entry.proteinDescription?.submittedName?.[0]?.fullName?.value
      || 'Unknown protein',
    organism: entry.organism?.scientificName || 'Unknown',
    length: entry.sequence?.length || 0,
    gene: entry.genes?.[0]?.geneName?.value || '—',
    sequence: entry.sequence?.value || '',
  }));
}

/**
 * Fetch full protein details from UniProt by accession.
 */
export async function fetchProteinDetails(accession) {
  const url = `https://rest.uniprot.org/uniprotkb/${accession}?format=json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`UniProt fetch failed for ${accession}: ${res.status}`);
  const entry = await res.json();

  // Extract features (regions, domains, etc.)
  const features = (entry.features || [])
    .filter((f) => ['Chain', 'Domain', 'Region', 'Topological domain', 'Signal peptide', 'Transit peptide', 'Transmembrane'].includes(f.type))
    .map((f) => ({
      type: f.type,
      name: f.description || f.type,
      start: f.location?.start?.value || 0,
      end: f.location?.end?.value || 0,
    }));

  // Extract PDB cross-references
  const pdbRefs = (entry.uniProtKBCrossReferences || [])
    .filter((x) => x.database === 'PDB')
    .map((x) => ({
      id: x.id,
      method: x.properties?.find((p) => p.key === 'Method')?.value || '',
      resolution: x.properties?.find((p) => p.key === 'Resolution')?.value || '',
      chains: x.properties?.find((p) => p.key === 'Chains')?.value || '',
    }));

  // Extract function description
  const functionComment = (entry.comments || []).find((c) => c.commentType === 'FUNCTION');
  const functionText = functionComment?.texts?.[0]?.value || '';

  return {
    accession: entry.primaryAccession,
    name: entry.proteinDescription?.recommendedName?.fullName?.value
      || entry.proteinDescription?.submittedName?.[0]?.fullName?.value
      || 'Unknown protein',
    organism: entry.organism?.scientificName || 'Unknown',
    lineage: entry.organism?.lineage || [],
    gene: entry.genes?.[0]?.geneName?.value || '—',
    sequence: entry.sequence?.value || '',
    length: entry.sequence?.length || 0,
    function: functionText,
    features,
    pdbRefs,
    entryType: entry.entryType,
  };
}


// ─── AlphaFold / Structure API ───────────────────────

/**
 * Fetch 3D structure from AlphaFold DB, with PDB fallback.
 * Returns { pdbData, source, confidence }
 */
export async function fetchProteinStructure(accession, pdbRefs = []) {
  // Try AlphaFold DB first
  try {
    const afRes = await fetch(`https://alphafold.ebi.ac.uk/api/prediction/${accession}`);
    if (afRes.ok) {
      const afData = await afRes.json();
      const entry = afData[0];
      if (entry?.pdbUrl) {
        const pdbRes = await fetch(entry.pdbUrl);
        if (pdbRes.ok) {
          const pdbData = await pdbRes.text();
          return {
            pdbData,
            source: 'AlphaFold DB',
            confidence: entry.globalMetricValue,
            paeImageUrl: entry.paeImageUrl,
          };
        }
      }
    }
  } catch (e) {
    console.warn('AlphaFold DB unavailable, trying PDB fallback:', e.message);
  }

  // Fallback to RCSB PDB
  if (pdbRefs.length > 0) {
    const bestPdb = pdbRefs[0]; // First entry is usually best
    try {
      const pdbRes = await fetch(`https://files.rcsb.org/download/${bestPdb.id}.pdb`);
      if (pdbRes.ok) {
        const pdbData = await pdbRes.text();
        return {
          pdbData,
          source: `RCSB PDB (${bestPdb.id})`,
          confidence: null,
          paeImageUrl: null,
        };
      }
    } catch (e) {
      console.warn('RCSB PDB fetch failed:', e.message);
    }
  }

  return null;
}


// ─── IEDB MHC-I Binding Prediction ──────────────────

/**
 * Parse IEDB TSV response into structured data.
 * IEDB returns lines like:
 *   allele  seq_num  start  end  length  peptide  method  percentile_rank  ...
 */
function parseIEDBResponse(tsv) {
  const lines = tsv.trim().split('\n');
  if (lines.length < 2) return [];

  // Find header line (skip any comment lines)
  let headerIdx = 0;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('allele') && lines[i].includes('peptide')) {
      headerIdx = i;
      break;
    }
  }

  const headers = lines[headerIdx].split('\t').map((h) => h.trim());
  const results = [];

  for (let i = headerIdx + 1; i < lines.length; i++) {
    const cols = lines[i].split('\t');
    if (cols.length < 4) continue;

    const row = {};
    headers.forEach((h, j) => {
      row[h] = cols[j]?.trim() || '';
    });

    // Parse into our standard format
    const percentile = parseFloat(row.percentile_rank || row.ic50 || '100');
    if (!isNaN(percentile)) {
      results.push({
        allele: row.allele || '',
        peptide: row.peptide || '',
        start: parseInt(row.start || '0', 10),
        end: parseInt(row.end || '0', 10),
        length: parseInt(row.length || '9', 10),
        percentile_rank: percentile,
        method: row.method || '',
      });
    }
  }

  return results;
}

/**
 * Run MHC-I binding prediction via IEDB Tools API.
 * Proxied through Vite dev server to avoid CORS.
 *
 * For large sequences, we chunk into segments and merge results.
 * onProgress callback reports live status.
 */
export async function predictMHCBinding(sequence, allele, length, onProgress) {
  const CHUNK_SIZE = 300; // AA per chunk (with overlap to catch boundary peptides)
  const OVERLAP = length - 1; // Overlap = peptide length - 1

  // For short sequences, send as single request
  if (sequence.length <= CHUNK_SIZE) {
    onProgress?.({ phase: 'sending', chunk: 1, totalChunks: 1 });
    const results = await callIEDB(sequence, allele, length, 0);
    onProgress?.({ phase: 'done', chunk: 1, totalChunks: 1, results: results.length });
    return results;
  }

  // Chunk large sequences
  const chunks = [];
  for (let i = 0; i < sequence.length; i += CHUNK_SIZE - OVERLAP) {
    const end = Math.min(i + CHUNK_SIZE, sequence.length);
    chunks.push({ start: i, sequence: sequence.slice(i, end) });
    if (end === sequence.length) break;
  }

  let allResults = [];
  for (let c = 0; c < chunks.length; c++) {
    onProgress?.({
      phase: 'predicting',
      chunk: c + 1,
      totalChunks: chunks.length,
      percentComplete: ((c) / chunks.length) * 100,
    });

    const chunkResults = await callIEDB(chunks[c].sequence, allele, length, chunks[c].start);
    allResults = allResults.concat(chunkResults);

    onProgress?.({
      phase: 'predicting',
      chunk: c + 1,
      totalChunks: chunks.length,
      percentComplete: ((c + 1) / chunks.length) * 100,
      resultsFound: allResults.length,
    });
  }

  // Deduplicate (overlap regions may produce duplicate peptides)
  const seen = new Set();
  const deduped = allResults.filter((r) => {
    const key = `${r.peptide}-${r.start}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  deduped.sort((a, b) => a.percentile_rank - b.percentile_rank);
  onProgress?.({ phase: 'done', totalResults: deduped.length });
  return deduped;
}

/**
 * Single IEDB API call for one sequence chunk.
 *  Uses Vite proxy: /api/iedb/tools_api/mhci/ → tools-cluster-interface.iedb.org/tools_api/mhci/
 */
async function callIEDB(sequence, allele, length, startOffset) {
  const body = new URLSearchParams({
    method: 'netmhcpan_ba',
    sequence_text: sequence,
    allele: allele,
    length: String(length),
  });

  const res = await fetch('/api/iedb/tools_api/mhci/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`IEDB API error (${res.status}): ${text.slice(0, 200)}`);
  }

  const tsv = await res.text();
  const results = parseIEDBResponse(tsv);

  // Adjust positions for chunk offset
  if (startOffset > 0) {
    results.forEach((r) => {
      r.start += startOffset;
      r.end += startOffset;
    });
  }

  return results;
}
