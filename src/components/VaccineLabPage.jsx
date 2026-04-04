import { useState, useCallback, useRef } from 'react'
import {
  FEATURED_VIRUSES,
  GROUND_TRUTH_BY_PROTEIN,
  HLA_ALLELES,
  PEPTIDE_LENGTHS,
  BINDING_THRESHOLDS,
} from '../data/virusDatabase'
import {
  searchVirusProteins,
  fetchProteinDetails,
  fetchProteinStructure,
  predictMHCBinding,
} from '../data/apiServices'
import './VaccineLabPage.css'

// ─── Plain-English Explainers ───────────────────────
const TIPS = {
  viralProtein: 'Viruses are made of proteins. To make a vaccine, we first pick one of these proteins — usually one on the virus\'s surface — so your immune system can learn to recognize it.',
  sequence: 'Every protein is a long chain of amino acids (letters like A, G, L, V…). This sequence determines the protein\'s shape, and its shape determines how your immune system sees it.',
  structure3d: 'Proteins fold into 3D shapes. Knowing the shape helps us find the parts that stick out and are easy for immune cells to grab onto.',
  hla: 'Your HLA type is like your immune fingerprint. Different people have different HLA types, which means different people\'s immune systems recognize different parts of the virus.',
  mhci: 'MHC-I is the "display shelf" on your cells. It shows small virus pieces to killer T-cells — if they recognize a piece, they destroy the infected cell.',
  epitope: 'An epitope is a small piece of the virus protein that your immune system learns to recognize. These are what make a vaccine work.',
  percentile: 'Lower = better binding. A peptide at 0.5% means it binds better than 99.5% of all random peptides tested.',
  netmhcpan: 'NetMHCpan is a neural network trained on thousands of real lab experiments. It\'s the gold-standard tool used by pharma companies like Moderna and Pfizer.',
  vaccine: 'A multi-epitope vaccine strings together the best immune targets with short linkers. Your cells read this like a recipe card and display each piece to train your immune system.',
  validation: 'Scientists tested real patients\' blood to see which virus pieces their immune systems responded to. We\'re checking if our AI predictions match those real-world results.',
  recall: 'Of all the known real immune targets, what percentage did we find? Higher recall = we\'re not missing important targets.',
  precision: 'Of everything we predicted as a target, what percentage turned out to be real? Higher = fewer false alarms.',
  f1: 'A combined score balancing recall and precision — like a GPA for the whole prediction.',
}

function Tip({ id, children }) {
  const [open, setOpen] = useState(false)
  return (
    <span className="vlp-tip-wrap">
      {children}
      <button
        className="vlp-tip-btn"
        onClick={(e) => { e.stopPropagation(); setOpen(!open) }}
        title="What does this mean?"
      >?</button>
      {open && (
        <div className="vlp-tip-popup" onClick={(e) => e.stopPropagation()}>
          <div className="vlp-tip-text">{TIPS[id]}</div>
          <button className="vlp-tip-close" onClick={() => setOpen(false)}>Got it</button>
        </div>
      )}
    </span>
  )
}

// ════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════
export default function VaccineLabPage() {
  // ─── Wizard State ───────────────────────────────────
  const [currentStep, setCurrentStep] = useState(1)

  // Step 1: Target selection
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState(null)
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState(null)
  const [selectedTarget, setSelectedTarget] = useState(null)

  // Step 2: Protein details
  const [proteinDetails, setProteinDetails] = useState(null)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [detailsError, setDetailsError] = useState(null)

  // Step 3: 3D structure
  const [structureData, setStructureData] = useState(null)
  const [structureLoading, setStructureLoading] = useState(false)
  const [structureError, setStructureError] = useState(null)

  // Step 4: IEDB prediction
  const [hlaAllele, setHlaAllele] = useState('HLA-A*02:01')
  const [peptideLength, setPeptideLength] = useState(9)
  const [predictions, setPredictions] = useState(null)
  const [predictionProgress, setPredictionProgress] = useState(null)
  const [predictionLoading, setPredictionLoading] = useState(false)
  const [predictionError, setPredictionError] = useState(null)

  // Step 5: Vaccine design
  const [selectedEpitopes, setSelectedEpitopes] = useState(new Set())
  const [vaccineConstruct, setVaccineConstruct] = useState(null)

  // Step 6: Validation
  const [validation, setValidation] = useState(null)

  const viewerRef = useRef(null)

  // ═══════════════════════════════════════════════════
  // STEP 1: Search for virus proteins
  // ═══════════════════════════════════════════════════
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return
    setSearchLoading(true)
    setSearchError(null)
    setSearchResults(null)
    try {
      const results = await searchVirusProteins(searchQuery)
      setSearchResults(results)
    } catch (err) {
      setSearchError(err.message)
    } finally {
      setSearchLoading(false)
    }
  }, [searchQuery])

  const handleSelectTarget = useCallback((target) => {
    setSelectedTarget(target)
    setCurrentStep(2)
    // Auto-fetch details
    loadProteinDetails(target.accession)
  }, [])

  const handleSelectFeatured = useCallback((virus) => {
    const target = {
      accession: virus.uniprot,
      name: virus.protein,
      organism: virus.organism,
      length: virus.length,
      gene: '—',
      sequence: '', // Will be fetched
    }
    setSelectedTarget(target)
    setCurrentStep(2)
    loadProteinDetails(virus.uniprot)
  }, [])

  // ═══════════════════════════════════════════════════
  // STEP 2: Fetch full protein details
  // ═══════════════════════════════════════════════════
  const loadProteinDetails = useCallback(async (accession) => {
    setDetailsLoading(true)
    setDetailsError(null)
    try {
      const details = await fetchProteinDetails(accession)
      setProteinDetails(details)
      // Update selected target with the full sequence
      setSelectedTarget((prev) => ({ ...prev, sequence: details.sequence, name: details.name }))
    } catch (err) {
      setDetailsError(err.message)
    } finally {
      setDetailsLoading(false)
    }
  }, [])

  const proceedToStructure = useCallback(() => {
    setCurrentStep(3)
    loadStructure()
  }, [proteinDetails])

  // ═══════════════════════════════════════════════════
  // STEP 3: Fetch 3D structure
  // ═══════════════════════════════════════════════════
  const loadStructure = useCallback(async () => {
    if (!proteinDetails) return
    setStructureLoading(true)
    setStructureError(null)
    try {
      const result = await fetchProteinStructure(
        proteinDetails.accession,
        proteinDetails.pdbRefs
      )
      setStructureData(result)
    } catch (err) {
      setStructureError(err.message)
    } finally {
      setStructureLoading(false)
    }
  }, [proteinDetails])

  const proceedToPrediction = useCallback(() => {
    setCurrentStep(4)
  }, [])

  // ═══════════════════════════════════════════════════
  // STEP 4: Run IEDB prediction
  // ═══════════════════════════════════════════════════
  const runPrediction = useCallback(async () => {
    if (!proteinDetails?.sequence) return
    setPredictionLoading(true)
    setPredictionError(null)
    setPredictions(null)
    setPredictionProgress(null)

    try {
      const results = await predictMHCBinding(
        proteinDetails.sequence,
        hlaAllele,
        peptideLength,
        (progress) => setPredictionProgress(progress)
      )
      setPredictions(results)
      setCurrentStep(5)
    } catch (err) {
      setPredictionError(err.message)
    } finally {
      setPredictionLoading(false)
    }
  }, [proteinDetails, hlaAllele, peptideLength])

  // ═══════════════════════════════════════════════════
  // STEP 5: Design Vaccine
  // ═══════════════════════════════════════════════════
  const toggleEpitope = useCallback((peptide) => {
    setSelectedEpitopes((prev) => {
      const next = new Set(prev)
      if (next.has(peptide)) next.delete(peptide)
      else next.add(peptide)
      return next
    })
  }, [])

  const buildVaccine = useCallback(() => {
    if (selectedEpitopes.size === 0) return
    const LINKER = 'AAY' // Common cleavage-optimized linker
    const epitopeList = Array.from(selectedEpitopes)
    const construct = epitopeList.join(LINKER)
    setVaccineConstruct({
      epitopes: epitopeList,
      linker: LINKER,
      sequence: construct,
      totalLength: construct.length,
    })
    setCurrentStep(6)
  }, [selectedEpitopes])

  // ═══════════════════════════════════════════════════
  // STEP 6: Validation
  // ═══════════════════════════════════════════════════
  const runValidation = useCallback(() => {
    if (!predictions || !proteinDetails) return
    const groundTruth = GROUND_TRUTH_BY_PROTEIN[proteinDetails.accession]
    if (!groundTruth || !groundTruth.alleles[hlaAllele]) {
      setValidation({
        available: false,
        message: `No curated ground-truth data available for ${proteinDetails.accession} + ${hlaAllele}. This is a real research gap — your predictions are generating new hypotheses.`,
      })
      return
    }

    const known = groundTruth.alleles[hlaAllele]
    const predictedBinders = predictions.filter((p) => p.percentile_rank <= BINDING_THRESHOLDS.MODERATE)

    const details = known.map((gt) => {
      const match = predictedBinders.find((p) => p.peptide === gt.peptide)
      return {
        ...gt,
        found: !!match,
        predictedRank: match ? predictedBinders.indexOf(match) + 1 : null,
        percentile: match?.percentile_rank ?? null,
      }
    })

    const tp = details.filter((d) => d.found).length
    const total = known.length
    const pb = predictedBinders.length
    const recall = total > 0 ? tp / total : 0
    const precision = pb > 0 ? tp / pb : 0
    const f1 = recall + precision > 0 ? (2 * recall * precision) / (recall + precision) : 0

    setValidation({
      available: true,
      source: groundTruth.source,
      truePositives: tp,
      totalKnown: total,
      predictedBinders: pb,
      recall,
      precision,
      f1,
      details,
    })
  }, [predictions, proteinDetails, hlaAllele])

  // ─── Reset ─────────────────────────────────────────
  const resetAll = () => {
    setCurrentStep(1)
    setSearchQuery('')
    setSearchResults(null)
    setSelectedTarget(null)
    setProteinDetails(null)
    setStructureData(null)
    setPredictions(null)
    setPredictionProgress(null)
    setSelectedEpitopes(new Set())
    setVaccineConstruct(null)
    setValidation(null)
    setSearchError(null)
    setDetailsError(null)
    setStructureError(null)
    setPredictionError(null)
  }

  // Helper: classify binders
  const binders = predictions?.filter((p) => p.percentile_rank <= BINDING_THRESHOLDS.MODERATE) || []
  const strongBinders = predictions?.filter((p) => p.percentile_rank <= BINDING_THRESHOLDS.STRONG) || []

  // ════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════
  const STEPS = [
    { num: 1, label: 'Choose Target', icon: '🦠' },
    { num: 2, label: 'Fetch Sequence', icon: '🧬' },
    { num: 3, label: '3D Structure', icon: '🔬' },
    { num: 4, label: 'Predict Targets', icon: '🎯' },
    { num: 5, label: 'Design Vaccine', icon: '💉' },
    { num: 6, label: 'Validate', icon: '✅' },
  ]

  return (
    <div className="vlp">
      {/* ─── Step Progress Bar ───────────────────────── */}
      <div className="vlp-stepper">
        {STEPS.map((s, i) => (
          <div key={s.num} className={`vlp-step-item ${currentStep === s.num ? 'active' : currentStep > s.num ? 'done' : 'pending'}`}>
            <div className="vlp-step-dot">
              {currentStep > s.num ? '✓' : s.icon}
            </div>
            <span className="vlp-step-label">{s.label}</span>
            {i < STEPS.length - 1 && <div className="vlp-step-line" />}
          </div>
        ))}
        {currentStep > 1 && (
          <button className="vlp-restart-btn" onClick={resetAll}>↺ Start Over</button>
        )}
      </div>

      {/* ═══════════════════════════════════════════════ */}
      {/* STEP 1: Choose Your Target                     */}
      {/* ═══════════════════════════════════════════════ */}
      {currentStep === 1 && (
        <div className="vlp-step-content fadeInUp">
          <div className="vlp-step-header">
            <div className="vlp-step-badge">Step 1 of 6</div>
            <h1>Choose Your <span className="accent">Target Virus</span></h1>
            <p className="vlp-step-desc">
              <Tip id="viralProtein">Every vaccine starts by picking a viral protein</Tip> to target.
              Search for any virus, or pick one of the well-studied targets below.
            </p>
          </div>

          {/* Search */}
          <div className="vlp-search-section">
            <div className="vlp-search-bar">
              <input
                type="text"
                className="vlp-search-input"
                placeholder="Search for a virus or protein (e.g., COVID, HIV, Ebola, Influenza...)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <button
                className="vlp-search-btn"
                onClick={handleSearch}
                disabled={searchLoading || !searchQuery.trim()}
              >
                {searchLoading ? '⏳ Searching UniProt...' : '🔍 Search'}
              </button>
            </div>
            <div className="vlp-search-note">
              Searching the <strong>UniProt</strong> database — {'>'}250 million real protein entries from across all life
            </div>

            {searchError && <div className="vlp-error">{searchError}</div>}

            {searchResults && (
              <div className="vlp-search-results">
                <h3>{searchResults.length} results from UniProt</h3>
                {searchResults.length === 0 && (
                  <div className="vlp-no-results">No reviewed viral proteins found. Try a different search term.</div>
                )}
                {searchResults.map((r) => (
                  <button key={r.accession} className="vlp-result-card" onClick={() => handleSelectTarget(r)}>
                    <div className="vlp-result-name">{r.name}</div>
                    <div className="vlp-result-meta">
                      <span className="vlp-result-org">{r.organism}</span>
                      <span className="vlp-result-acc">{r.accession}</span>
                      <span className="vlp-result-len">{r.length} AA</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Featured Targets */}
          <div className="vlp-featured">
            <h2 className="vlp-section-title">⚡ Quick Start — Popular Vaccine Targets</h2>
            <div className="vlp-featured-grid">
              {FEATURED_VIRUSES.map((v) => (
                <button key={v.id} className="vlp-featured-card" onClick={() => handleSelectFeatured(v)}>
                  <div className="vlp-featured-icon">{v.icon}</div>
                  <div className="vlp-featured-info">
                    <div className="vlp-featured-virus">{v.virus}</div>
                    <div className="vlp-featured-protein">{v.protein}</div>
                    <div className="vlp-featured-desc">{v.description}</div>
                    <div className="vlp-featured-tags">
                      <span className={`vlp-difficulty ${v.difficulty.toLowerCase()}`}>{v.difficulty}</span>
                      <span className="vlp-tag-small">{v.length} AA</span>
                      {v.knownEpitopes > 0 && (
                        <span className="vlp-tag-small">{v.knownEpitopes} known epitopes</span>
                      )}
                    </div>
                  </div>
                  <div className="vlp-featured-arrow">→</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════ */}
      {/* STEP 2: Fetch Sequence                         */}
      {/* ═══════════════════════════════════════════════ */}
      {currentStep === 2 && (
        <div className="vlp-step-content fadeInUp">
          <div className="vlp-step-header">
            <div className="vlp-step-badge">Step 2 of 6</div>
            <h1>Fetching <span className="accent">Protein Data</span></h1>
            <p className="vlp-step-desc">
              Pulling real data from <strong>UniProt</strong> for{' '}
              <strong>{selectedTarget?.name}</strong> ({selectedTarget?.accession})
            </p>
          </div>

          {detailsLoading && (
            <div className="vlp-loading-card">
              <div className="vlp-spinner" />
              <div>Fetching from UniProt...</div>
              <div className="vlp-loading-sub">Retrieving amino acid sequence, protein features, and cross-references</div>
            </div>
          )}

          {detailsError && <div className="vlp-error">{detailsError}</div>}

          {proteinDetails && (
            <div className="vlp-details-content">
              {/* Protein info card */}
              <div className="vlp-detail-card main-card">
                <div className="vlp-detail-header">
                  <h2>{proteinDetails.name}</h2>
                  <span className="vlp-detail-badge">{proteinDetails.entryType === 'UniProtKB reviewed (Swiss-Prot)' ? '⭐ Reviewed' : 'Unreviewed'}</span>
                </div>
                <div className="vlp-detail-grid">
                  <div className="vlp-detail-item">
                    <span className="vlp-detail-label">Organism</span>
                    <span className="vlp-detail-value">{proteinDetails.organism}</span>
                  </div>
                  <div className="vlp-detail-item">
                    <span className="vlp-detail-label">UniProt ID</span>
                    <span className="vlp-detail-value">{proteinDetails.accession}</span>
                  </div>
                  <div className="vlp-detail-item">
                    <span className="vlp-detail-label">Gene</span>
                    <span className="vlp-detail-value">{proteinDetails.gene}</span>
                  </div>
                  <div className="vlp-detail-item">
                    <span className="vlp-detail-label">Length</span>
                    <span className="vlp-detail-value">{proteinDetails.length} amino acids</span>
                  </div>
                </div>

                {proteinDetails.function && (
                  <div className="vlp-detail-function">
                    <h3>📖 What This Protein Does</h3>
                    <p>{proteinDetails.function}</p>
                  </div>
                )}
              </div>

              {/* Sequence display */}
              <div className="vlp-detail-card">
                <h3><Tip id="sequence">Amino Acid Sequence</Tip></h3>
                <div className="vlp-sequence-display">
                  <code className="vlp-sequence-text">
                    {proteinDetails.sequence.match(/.{1,60}/g)?.map((line, i) => (
                      <div key={i} className="vlp-seq-line">
                        <span className="vlp-seq-num">{i * 60 + 1}</span>
                        {line.match(/.{1,10}/g)?.join(' ')}
                      </div>
                    ))}
                  </code>
                </div>
                <div className="vlp-seq-stats">
                  <span>{proteinDetails.sequence.length} residues</span>
                  <span>•</span>
                  <span>Source: UniProt {proteinDetails.accession}</span>
                </div>
              </div>

              {/* Protein regions */}
              {proteinDetails.features.length > 0 && (
                <div className="vlp-detail-card">
                  <h3>🗺️ Protein Regions</h3>
                  <div className="vlp-features-list">
                    {proteinDetails.features.slice(0, 15).map((f, i) => (
                      <div key={i} className="vlp-feature-row">
                        <span className="vlp-feature-type">{f.type}</span>
                        <span className="vlp-feature-name">{f.name}</span>
                        <span className="vlp-feature-pos">{f.start}–{f.end}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* PDB cross-refs */}
              {proteinDetails.pdbRefs.length > 0 && (
                <div className="vlp-detail-card">
                  <h3>🏗️ Available 3D Structures</h3>
                  <div className="vlp-pdb-list">
                    {proteinDetails.pdbRefs.slice(0, 8).map((pdb) => (
                      <div key={pdb.id} className="vlp-pdb-item">
                        <span className="vlp-pdb-id">{pdb.id}</span>
                        <span className="vlp-pdb-method">{pdb.method}</span>
                        {pdb.resolution && <span className="vlp-pdb-res">{pdb.resolution}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button className="vlp-next-btn" onClick={proceedToStructure}>
                View 3D Structure →
              </button>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════ */}
      {/* STEP 3: 3D Structure                           */}
      {/* ═══════════════════════════════════════════════ */}
      {currentStep === 3 && (
        <div className="vlp-step-content fadeInUp">
          <div className="vlp-step-header">
            <div className="vlp-step-badge">Step 3 of 6</div>
            <h1>Viewing <span className="accent">3D Structure</span></h1>
            <p className="vlp-step-desc">
              <Tip id="structure3d">The 3D shape of your target protein</Tip> — fetched from{' '}
              <strong>AlphaFold DB</strong> or <strong>RCSB PDB</strong>.
            </p>
          </div>

          {structureLoading && (
            <div className="vlp-loading-card">
              <div className="vlp-spinner" />
              <div>Fetching 3D structure...</div>
              <div className="vlp-loading-sub">Trying AlphaFold DB → RCSB PDB fallback</div>
            </div>
          )}

          {structureError && <div className="vlp-error">{structureError}</div>}

          {structureData && (
            <div className="vlp-structure-content">
              <div className="vlp-structure-info">
                <span className="vlp-tag-small">Source: {structureData.source}</span>
                {structureData.confidence && (
                  <span className="vlp-tag-small">
                    Confidence: {(structureData.confidence * 100).toFixed(0)}%
                  </span>
                )}
              </div>
              <div className="vlp-viewer-container" ref={viewerRef}>
                <StructureViewer pdbData={structureData.pdbData} containerRef={viewerRef} />
              </div>
            </div>
          )}

          {!structureLoading && !structureData && !structureError && (
            <div className="vlp-info-card">
              <p>No 3D structure available for this protein. This is common for less-studied proteins.</p>
            </div>
          )}

          {/* Sticky action bar */}
          {(structureData || (!structureLoading && !structureError)) && (
            <div className="vlp-sticky-action-bar">
              <button className="vlp-next-btn" onClick={proceedToPrediction}>
                {structureData ? 'Predict Immune Targets →' : 'Skip → Predict Immune Targets'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════ */}
      {/* STEP 4: IEDB Prediction                        */}
      {/* ═══════════════════════════════════════════════ */}
      {currentStep === 4 && (
        <div className="vlp-step-content fadeInUp">
          <div className="vlp-step-header">
            <div className="vlp-step-badge">Step 4 of 6</div>
            <h1>Predicting <span className="accent">Immune Targets</span></h1>
            <p className="vlp-step-desc">
              Using <Tip id="netmhcpan">NetMHCpan</Tip> via the <strong>IEDB API</strong> to predict
              which pieces of {proteinDetails?.name || 'the protein'} your immune system would recognize.
            </p>
          </div>

          {!predictionLoading && !predictions && (
            <div className="vlp-config-section">
              <div className="vlp-config-row">
                <div className="vlp-field">
                  <label className="vlp-field-label">
                    <Tip id="hla">HLA Allele</Tip>
                    <span className="vlp-field-hint">Your immune fingerprint</span>
                  </label>
                  <select
                    className="vlp-select"
                    value={hlaAllele}
                    onChange={(e) => setHlaAllele(e.target.value)}
                  >
                    {HLA_ALLELES.map((a) => (
                      <option key={a.value} value={a.value}>
                        {a.label} — {a.population}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="vlp-field">
                  <label className="vlp-field-label">
                    <Tip id="epitope">Peptide Length</Tip>
                    <span className="vlp-field-hint">Amino acids per piece</span>
                  </label>
                  <div className="vlp-len-btns">
                    {PEPTIDE_LENGTHS.map((len) => (
                      <button
                        key={len}
                        className={`vlp-len-btn ${peptideLength === len ? 'active' : ''}`}
                        onClick={() => setPeptideLength(len)}
                      >
                        {len}-mer
                        {len === 9 && <span className="vlp-len-rec">most common</span>}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="vlp-config-summary-box">
                <div className="vlp-config-stat">
                  <span className="vlp-config-stat-val">{((proteinDetails?.length || 0) - peptideLength + 1).toLocaleString()}</span>
                  <span className="vlp-config-stat-lbl">peptides to evaluate</span>
                </div>
                <div className="vlp-config-stat">
                  <span className="vlp-config-stat-val">NetMHCpan</span>
                  <span className="vlp-config-stat-lbl">prediction method</span>
                </div>
                <div className="vlp-config-stat">
                  <span className="vlp-config-stat-val">IEDB</span>
                  <span className="vlp-config-stat-lbl">data source</span>
                </div>
              </div>

              <div className="vlp-api-note">
                ⚡ This calls the real <strong>IEDB Tools API</strong> (Immune Epitope Database).
                For a protein of {proteinDetails?.length || 0} AA, this may take 30–90 seconds.
                The IEDB server will run <strong>NetMHCpan</strong>, a neural network trained on thousands of lab experiments.
              </div>

              <button className="vlp-launch-btn" onClick={runPrediction}>
                <span className="vlp-launch-icon">▶</span>
                Run Real IEDB Prediction
              </button>
            </div>
          )}

          {predictionLoading && (
            <div className="vlp-prediction-live">
              <div className="vlp-pred-header">
                <h2>🔬 Running IEDB Prediction...</h2>
                <p>
                  Sending {proteinDetails?.name} sequence to the IEDB server.
                  NetMHCpan is analyzing each possible {peptideLength}-mer peptide for {hlaAllele} binding.
                </p>
              </div>

              {predictionProgress && (
                <div className="vlp-pred-progress">
                  <div className="vlp-progress-header">
                    <span>
                      {predictionProgress.phase === 'sending' && '📡 Sending to IEDB...'}
                      {predictionProgress.phase === 'predicting' && `🧬 Processing chunk ${predictionProgress.chunk} / ${predictionProgress.totalChunks}`}
                      {predictionProgress.phase === 'done' && '✅ Complete!'}
                    </span>
                    <span className="vlp-progress-pct">
                      {Math.round(predictionProgress.percentComplete || 0)}%
                    </span>
                  </div>
                  <div className="vlp-progress-bar">
                    <div
                      className="vlp-progress-fill"
                      style={{ width: `${predictionProgress.percentComplete || 5}%` }}
                    />
                  </div>
                  {predictionProgress.resultsFound != null && (
                    <div className="vlp-pred-live-stat">
                      {predictionProgress.resultsFound.toLocaleString()} peptides scored so far
                    </div>
                  )}
                </div>
              )}

              {!predictionProgress && (
                <div className="vlp-loading-card">
                  <div className="vlp-spinner" />
                  <div>Connecting to IEDB server...</div>
                  <div className="vlp-loading-sub">This may take 30-90 seconds for large proteins</div>
                </div>
              )}
            </div>
          )}

          {predictionError && (
            <div className="vlp-error">
              <strong>IEDB API Error:</strong> {predictionError}
              <button className="vlp-retry-btn" onClick={runPrediction}>Retry</button>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════ */}
      {/* STEP 5: Analyze + Design Vaccine               */}
      {/* ═══════════════════════════════════════════════ */}
      {currentStep === 5 && predictions && (
        <div className="vlp-step-content fadeInUp">
          <div className="vlp-step-header">
            <div className="vlp-step-badge">Step 5 of 6</div>
            <h1>Design Your <span className="accent">Vaccine</span></h1>
            <p className="vlp-step-desc">
              IEDB returned <strong>{predictions.length.toLocaleString()}</strong> predictions.
              Select the best <Tip id="epitope">epitopes</Tip> to include in your{' '}
              <Tip id="vaccine">multi-epitope vaccine construct</Tip>.
            </p>
          </div>

          {/* Stats */}
          <div className="vlp-stats-row">
            <div className="vlp-stat-card">
              <div className="vlp-stat-val">{predictions.length.toLocaleString()}</div>
              <div className="vlp-stat-lbl">Total Peptides Scored</div>
              <div className="vlp-stat-sub">by IEDB NetMHCpan</div>
            </div>
            <div className="vlp-stat-card blue">
              <div className="vlp-stat-val">{binders.length}</div>
              <div className="vlp-stat-lbl">Predicted Binders</div>
              <div className="vlp-stat-sub"><Tip id="percentile">Percentile ≤ 2.0</Tip></div>
            </div>
            <div className="vlp-stat-card green">
              <div className="vlp-stat-val">{strongBinders.length}</div>
              <div className="vlp-stat-lbl">Strong Binders</div>
              <div className="vlp-stat-sub">Percentile ≤ 0.5</div>
            </div>
            <div className="vlp-stat-card purple">
              <div className="vlp-stat-val">{selectedEpitopes.size}</div>
              <div className="vlp-stat-lbl">Selected for Vaccine</div>
              <div className="vlp-stat-sub">Click rows below to select</div>
            </div>
          </div>

          {/* Top predictions table */}
          <div className="vlp-card">
            <h3>Top Predicted Immune Targets</h3>
            <p className="vlp-card-desc">
              Click on any row to add/remove it from your vaccine design. These are ranked by IEDB binding strength.
            </p>
            <div className="vlp-table-wrap">
              <table className="vlp-table">
                <thead>
                  <tr>
                    <th>Select</th>
                    <th>#</th>
                    <th>Peptide</th>
                    <th>Position</th>
                    <th>Percentile</th>
                    <th>Strength</th>
                  </tr>
                </thead>
                <tbody>
                  {binders.slice(0, 50).map((p, i) => (
                    <tr
                      key={i}
                      className={selectedEpitopes.has(p.peptide) ? 'row-selected' : ''}
                      onClick={() => toggleEpitope(p.peptide)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedEpitopes.has(p.peptide)}
                          readOnly
                          className="vlp-checkbox"
                        />
                      </td>
                      <td className="cell-dim">{i + 1}</td>
                      <td><code className="cell-pep">{p.peptide}</code></td>
                      <td>{p.start}–{p.end}</td>
                      <td className="cell-score">{p.percentile_rank.toFixed(3)}</td>
                      <td>
                        <span className={`vlp-strength ${
                          p.percentile_rank <= 0.5 ? 'strong' :
                          p.percentile_rank <= 2.0 ? 'moderate' : 'weak'
                        }`}>
                          {p.percentile_rank <= 0.5 ? '●●● Strong' :
                           p.percentile_rank <= 2.0 ? '●●○ Moderate' : '●○○ Weak'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Auto-select + Build */}
          <div className="vlp-design-actions">
            <button
              className="vlp-auto-select-btn"
              onClick={() => {
                const top = strongBinders.slice(0, 10).map((p) => p.peptide)
                setSelectedEpitopes(new Set(top))
              }}
            >
              ⚡ Auto-Select Top 10 Strong Binders
            </button>

            <button
              className="vlp-launch-btn"
              onClick={buildVaccine}
              disabled={selectedEpitopes.size === 0}
            >
              <span className="vlp-launch-icon">💉</span>
              Build Vaccine from {selectedEpitopes.size} Epitopes →
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════ */}
      {/* STEP 6: Validation                             */}
      {/* ═══════════════════════════════════════════════ */}
      {currentStep === 6 && (
        <div className="vlp-step-content fadeInUp">
          <div className="vlp-step-header">
            <div className="vlp-step-badge">Step 6 of 6</div>
            <h1><span className="accent">Validate</span> Your Vaccine</h1>
            <p className="vlp-step-desc">
              <Tip id="validation">Compare your predictions against experimental data</Tip> from
              real patient studies to see how well your vaccine design would work.
            </p>
          </div>

          {/* Vaccine construct */}
          {vaccineConstruct && (
            <div className="vlp-card vaccine-card">
              <h3>💉 Your Vaccine Construct</h3>
              <div className="vlp-vaccine-stats">
                <span>{vaccineConstruct.epitopes.length} epitopes</span>
                <span>•</span>
                <span>Linker: {vaccineConstruct.linker}</span>
                <span>•</span>
                <span>{vaccineConstruct.totalLength} AA total</span>
              </div>
              <div className="vlp-vaccine-sequence">
                <code>
                  {vaccineConstruct.epitopes.map((ep, i) => (
                    <span key={i}>
                      <span className="vlp-vax-epitope">{ep}</span>
                      {i < vaccineConstruct.epitopes.length - 1 && (
                        <span className="vlp-vax-linker">{vaccineConstruct.linker}</span>
                      )}
                    </span>
                  ))}
                </code>
              </div>
            </div>
          )}

          {/* Validation trigger */}
          {!validation && (
            <div className="vlp-validate-section">
              <div className="vlp-info-card">
                <h3>🧪 Ready to Validate?</h3>
                <p>
                  We'll compare your IEDB predictions against experimentally confirmed epitopes
                  from published scientific studies. This tells us whether your vaccine design
                  would actually trigger an immune response.
                </p>
                <button className="vlp-launch-btn" onClick={runValidation}>
                  <span className="vlp-launch-icon">🎯</span>
                  Run Validation
                </button>
              </div>
            </div>
          )}

          {/* Validation results */}
          {validation && !validation.available && (
            <div className="vlp-info-card">
              <h3>🔬 No Ground Truth Available</h3>
              <p>{validation.message}</p>
              <p className="vlp-info-sub">
                This means you're at the frontier — your predictions are new hypotheses
                that would need lab testing to confirm.
              </p>
            </div>
          )}

          {validation && validation.available && (
            <div className="vlp-validation-results">
              {/* Score rings */}
              <div className="vlp-sc-rings">
                {[
                  { key: 'recall', label: 'Recall', val: validation.recall, color: 'var(--accent-green)', sub: `${validation.truePositives}/${validation.totalKnown} found` },
                  { key: 'precision', label: 'Precision', val: validation.precision, color: 'var(--accent-blue)', sub: `${validation.truePositives}/${validation.predictedBinders} correct` },
                  { key: 'f1', label: 'F1 Score', val: validation.f1, color: 'var(--accent-purple)', sub: 'Combined accuracy' },
                ].map((m) => (
                  <div key={m.key} className="vlp-sc-ring-card">
                    <div className="vlp-sc-ring">
                      <svg viewBox="0 0 120 120">
                        <circle cx="60" cy="60" r="52" className="vlp-ring-bg" />
                        <circle
                          cx="60" cy="60" r="52"
                          className="vlp-ring-fill"
                          style={{ stroke: m.color, strokeDasharray: `${m.val * 327} 327` }}
                        />
                      </svg>
                      <span className="vlp-sc-ring-val">{(m.val * 100).toFixed(0)}%</span>
                    </div>
                    <div className="vlp-sc-ring-label"><Tip id={m.key}>{m.label}</Tip></div>
                    <div className="vlp-sc-ring-sub">{m.sub}</div>
                  </div>
                ))}
              </div>

              {/* Verdict */}
              <div className={`vlp-verdict ${validation.recall >= 0.6 ? 'pass' : 'warn'}`}>
                <span className="vlp-verdict-icon">{validation.recall >= 0.6 ? '🏆' : '⚠️'}</span>
                <div>
                  <div className="vlp-verdict-title">
                    {validation.recall >= 0.6
                      ? 'Pipeline Validated — Your Predictions Match Real Data!'
                      : 'Pipeline Needs Tuning — Try Different Parameters'}
                  </div>
                  <div className="vlp-verdict-desc">
                    {validation.recall >= 0.6
                      ? `Your IEDB predictions correctly identified ${(validation.recall * 100).toFixed(0)}% of experimentally confirmed T-cell epitopes. This validates that the computational pipeline works.`
                      : `Only ${(validation.recall * 100).toFixed(0)}% of known targets were found. Try a different HLA allele or peptide length.`}
                  </div>
                </div>
              </div>

              {/* Epitope breakdown */}
              <div className="vlp-card">
                <h3>Epitope-by-Epitope Breakdown</h3>
                <p className="vlp-card-desc">Source: {validation.source}</p>
                <div className="vlp-epi-list">
                  {validation.details.map((d, i) => (
                    <div key={i} className={`vlp-epi-item ${d.found ? 'hit' : 'miss'} ${d.immunodominant ? 'dominant' : ''}`}>
                      <span className="vlp-epi-icon">
                        {d.immunodominant && d.found ? '⭐' : d.found ? '✅' : '❌'}
                      </span>
                      <div className="vlp-epi-info">
                        <div className="vlp-epi-top">
                          <code>{d.peptide}</code>
                          {d.immunodominant && <span className="vlp-epi-tag dominant">⭐ immunodominant</span>}
                          <span className="vlp-epi-tag region">{d.region}</span>
                        </div>
                        <div className="vlp-epi-bottom">
                          {d.found ? (
                            <>
                              ✅ Found at rank <strong>#{d.predictedRank}</strong> •
                              Percentile <strong>{d.percentile.toFixed(2)}</strong>
                            </>
                          ) : (
                            <>❌ Not predicted as a binder by IEDB</>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}


// ─── Inline 3D Viewer ─────────────────────────────────
function StructureViewer({ pdbData }) {
  const containerRef = useRef(null)

  const initViewer = useCallback((node) => {
    if (!node || !pdbData) return
    containerRef.current = node

    // Dynamically use 3Dmol
    import('3dmol/build/3Dmol-min.js').then(($3Dmol) => {
      const viewer = $3Dmol.createViewer(node, {
        backgroundColor: '#080c18',
        antialias: true,
      })
      viewer.addModel(pdbData, 'pdb')
      viewer.setStyle({}, { cartoon: { color: 'spectrum' } })
      viewer.zoomTo()
      viewer.render()
    })
  }, [pdbData])

  return (
    <div
      ref={initViewer}
      className="vlp-3d-viewer"
      style={{ width: '100%', height: '55vh', maxHeight: '500px', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}
    />
  )
}
