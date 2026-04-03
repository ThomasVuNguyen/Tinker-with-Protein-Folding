import { useState, useRef } from 'react'
import './SearchPanel.css'

const POPULAR_PROTEINS = [
  { name: 'Lysozyme', accession: 'P61626', gene: 'LYZ', organism: 'Homo sapiens' },
  { name: 'Insulin', accession: 'P01308', gene: 'INS', organism: 'Homo sapiens' },
  { name: 'Hemoglobin α', accession: 'P69905', gene: 'HBA1', organism: 'Homo sapiens' },
  { name: 'p53 Tumor Suppressor', accession: 'P04637', gene: 'TP53', organism: 'Homo sapiens' },
  { name: 'EGFR', accession: 'P00533', gene: 'EGFR', organism: 'Homo sapiens' },
  { name: 'Green Fluorescent Protein', accession: 'P42212', gene: 'GFP', organism: 'Aequorea victoria' },
]

const FAMOUS_COMPLEXES = [
  { name: 'SARS-CoV-2 Spike & ACE2', pdbId: '6M0J', organism: 'SARS / Human', desc: 'Viral entry mechanism' },
  { name: 'Actin & Myosin', pdbId: '1YCQ', organism: 'Multiple', desc: 'Muscle motor protein complex' },
  { name: 'Insulin & Receptor', pdbId: '4ZXB', organism: 'Homo sapiens', desc: 'Metabolic signaling docking' },
  { name: 'Antibody (IgG)', pdbId: '1IGT', organism: 'Mus musculus', desc: 'Classic immune structure fit' },
]

function SearchPanel({ activeTab, onProteinSelect, onESMFold, onComplexSelect, loading }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [sequence, setSequence] = useState('')
  const debounceRef = useRef(null)

  const searchUniProt = async (q) => {
    if (!q || q.length < 2) {
      setResults([])
      return
    }

    setSearching(true)
    try {
      const url = `https://rest.uniprot.org/uniprotkb/search?query=${encodeURIComponent(q)}&format=json&size=12&fields=accession,protein_name,gene_names,organism_name`
      const res = await fetch(url)
      if (!res.ok) throw new Error('Search failed')
      const data = await res.json()

      const parsed = data.results.map((r) => {
        const proteinName =
          r.proteinDescription?.recommendedName?.fullName?.value ||
          r.proteinDescription?.submissionNames?.[0]?.fullName?.value ||
          'Unknown'
        const gene = r.genes?.[0]?.geneName?.value || '—'
        const organism = r.organism?.scientificName || '—'
        return {
          accession: r.primaryAccession,
          name: proteinName,
          gene,
          organism,
        }
      })
      setResults(parsed)
    } catch (err) {
      console.error(err)
      setResults([])
    } finally {
      setSearching(false)
    }
  }

  const handleQueryChange = (e) => {
    const val = e.target.value
    setQuery(val)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => searchUniProt(val), 350)
  }

  const handleDirectLookup = () => {
    if (!query.trim()) return
    // Check if input looks like a UniProt accession
    const q = query.trim().toUpperCase()
    if (/^[A-Z0-9]{6,10}$/.test(q)) {
      onProteinSelect({ accession: q, name: q, gene: '—', organism: '—' })
    }
  }

  if (activeTab === 'complexes') {
    return (
      <div className="search-panel">
        <div className="panel-section">
          <label className="sp-label">Famous Protein Complexes</label>
          <p className="sp-subtitle" style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: '1.4' }}>
            Experimental structures from the PDB showing how multiple protein chains naturally fit together into larger machines.
          </p>
          <ul className="sp-results">
            {FAMOUS_COMPLEXES.map((c) => (
              <li
                key={c.pdbId}
                className="sp-result-item"
                onClick={() => onComplexSelect(c)}
              >
                <div className="sp-result-main">
                  <span className="sp-result-name">{c.name}</span>
                  <span className="sp-result-acc">{c.pdbId}</span>
                </div>
                <div className="sp-result-meta">
                  <span className="sp-result-gene">{c.desc}</span>
                  <span className="sp-result-org">{c.organism}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    )
  }

  if (activeTab === 'esmfold') {
    return (
      <div className="search-panel">
        <div className="panel-section">
          <label className="sp-label">Amino Acid Sequence</label>
          <textarea
            className="sp-textarea"
            value={sequence}
            onChange={(e) => setSequence(e.target.value)}
            placeholder={"Paste your amino acid sequence...\n\nExample:\nMKALIVLGLVLLSVTVQGKVFERCELARTLKRLGMDGYRGISLANWMCLAKWESGYNTRATNYNAGDRSTDYGIFQINSRYWCNDGKTPGAVNACHLSCSALLQDNIADAVACAKRVVRDPQGIRAWVAWRNRCQNRDVRQYVQGCGV"}
            rows={8}
            spellCheck={false}
          />
          <div className="sp-quick-tags">
            <span className="sp-tag" onClick={() => setSequence('MKALIVLGLVLLSVTVQGKVFERCELARTLKRLGMDGYRGISLANWMCLAKWESGYNTRATNYNAGDRSTDYGIFQINSRYWCNDGKTPGAVNACHLSCSALLQDNIADAVACAKRVVRDPQGIRAWVAWRNRCQNRDVRQYVQGCGV')}>
              Lysozyme
            </span>
            <span className="sp-tag" onClick={() => setSequence('MALWMRLLPLLALLALWGPDPAAAFVNQHLCGSHLVEALYLVCGERGFFYTPKTRREAEDLQVGQVELGGGPGAGSLQPLALEGSLQKRGIVEQCCTSICSLYQLENYCN')}>
              Insulin
            </span>
          </div>
          <button
            className="sp-fold-btn"
            onClick={() => onESMFold(sequence.replace(/\s+/g, ''))}
            disabled={loading || !sequence.trim()}
          >
            {loading ? (
              <><span className="sp-spinner" /> Predicting Structure...</>
            ) : (
              <>⚡ Fold with ESMFold</>
            )}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="search-panel">
      <div className="panel-section">
        <label className="sp-label">Search Proteins</label>
        <div className="sp-search-row">
          <div className="sp-input-wrap">
            <svg className="sp-search-icon" viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
              <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd"/>
            </svg>
            <input
              type="text"
              className="sp-input"
              value={query}
              onChange={handleQueryChange}
              onKeyDown={(e) => e.key === 'Enter' && handleDirectLookup()}
              placeholder="Search by name, gene, or UniProt ID..."
            />
            {searching && <span className="sp-searching-indicator" />}
          </div>
        </div>
      </div>

      {results.length > 0 && (
        <div className="panel-section sp-results-section">
          <label className="sp-label sp-label-sm">Results</label>
          <ul className="sp-results">
            {results.map((r) => (
              <li
                key={r.accession}
                className="sp-result-item"
                onClick={() => {
                  onProteinSelect(r)
                  setResults([])
                  setQuery('')
                }}
              >
                <div className="sp-result-main">
                  <span className="sp-result-name">{r.name}</span>
                  <span className="sp-result-acc">{r.accession}</span>
                </div>
                <div className="sp-result-meta">
                  <span className="sp-result-gene">{r.gene}</span>
                  <span className="sp-result-org">{r.organism}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {results.length === 0 && !searching && (
        <div className="panel-section">
          <label className="sp-label sp-label-sm">Popular Proteins</label>
          <ul className="sp-results">
            {POPULAR_PROTEINS.map((p) => (
              <li
                key={p.accession}
                className="sp-result-item"
                onClick={() => onProteinSelect(p)}
              >
                <div className="sp-result-main">
                  <span className="sp-result-name">{p.name}</span>
                  <span className="sp-result-acc">{p.accession}</span>
                </div>
                <div className="sp-result-meta">
                  <span className="sp-result-gene">{p.gene}</span>
                  <span className="sp-result-org">{p.organism}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default SearchPanel
