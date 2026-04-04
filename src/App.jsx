import { useState } from 'react'
import Header from './components/Header'
import SearchPanel from './components/SearchPanel'
import ProteinViewer from './components/ProteinViewer'
import ProteinInfo from './components/ProteinInfo'
import VaccineLabPage from './components/VaccineLabPage'
import './App.css'

function App() {
  const [activePage, setActivePage] = useState('explorer')
  const [activeTab, setActiveTab] = useState('alphafold')
  const [proteinData, setProteinData] = useState(null)
  const [pdbData, setPdbData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [viewerMode, setViewerMode] = useState('spectrum')

  // ─── Existing handlers ─────────────────────────
  const handleComplexSelect = async (complex) => {
    setLoading(true)
    setError(null)
    setPdbData(null)
    setProteinData(null)
    setViewerMode('chain')

    try {
      const res = await fetch(`https://files.rcsb.org/download/${complex.pdbId}.pdb`)
      if (!res.ok) throw new Error(`Failed to fetch PDB complex ${complex.pdbId} from RCSB`)
      const pdb = await res.text()
      setPdbData(pdb)
      setProteinData({
        name: complex.name,
        gene: '—',
        organism: '—',
        accession: complex.pdbId,
        confidence: null,
        plddt: null,
        sequence: '—',
        length: 'Multi-chain',
        paeImageUrl: null,
        entryId: complex.pdbId,
        source: 'RCSB PDB',
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleProteinSelect = async (protein) => {
    setLoading(true)
    setError(null)
    setPdbData(null)
    setProteinData(null)
    setViewerMode('spectrum')

    try {
      const afRes = await fetch(`https://alphafold.ebi.ac.uk/api/prediction/${protein.accession}`)
      if (!afRes.ok) throw new Error(`No AlphaFold structure found for ${protein.accession}`)
      const afData = await afRes.json()
      const entry = afData[0]

      setProteinData({
        name: protein.name,
        gene: protein.gene,
        organism: protein.organism,
        accession: protein.accession,
        confidence: entry.globalMetricValue,
        plddt: {
          veryHigh: entry.fractionPlddtVeryHigh,
          confident: entry.fractionPlddtConfident,
          low: entry.fractionPlddtLow,
          veryLow: entry.fractionPlddtVeryLow,
        },
        sequence: entry.sequence,
        length: entry.sequenceEnd - entry.sequenceStart + 1,
        paeImageUrl: entry.paeImageUrl,
        entryId: entry.entryId,
        source: 'AlphaFold DB',
      })

      const pdbRes = await fetch(entry.pdbUrl)
      if (!pdbRes.ok) throw new Error('Failed to download PDB file')
      const pdb = await pdbRes.text()
      setPdbData(pdb)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleESMFold = async (sequence) => {
    setLoading(true)
    setError(null)
    setPdbData(null)
    setProteinData(null)
    setViewerMode('spectrum')

    try {
      const res = await fetch('https://api.esmatlas.com/foldSequence/v1/pdb/', {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: sequence,
      })
      if (!res.ok) throw new Error(`ESMFold API error: ${res.status}`)
      const pdb = await res.text()
      setPdbData(pdb)
      setProteinData({
        name: 'Custom Sequence',
        gene: '—',
        organism: '—',
        accession: '—',
        confidence: null,
        plddt: null,
        sequence: sequence,
        length: sequence.length,
        paeImageUrl: null,
        entryId: 'ESMFold',
        source: 'ESMFold (Meta)',
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app">
      <Header activePage={activePage} onNavigate={setActivePage} />

      {activePage === 'explorer' && (
        <main className="main-layout">
          <aside className="sidebar">
            <div className="tab-bar">
              <button
                className={`tab-btn ${activeTab === 'alphafold' ? 'active' : ''}`}
                onClick={() => setActiveTab('alphafold')}
              >
                <span className="tab-icon">🔬</span>
                AlphaFold DB
              </button>
              <button
                className={`tab-btn ${activeTab === 'esmfold' ? 'active' : ''}`}
                onClick={() => setActiveTab('esmfold')}
              >
                <span className="tab-icon">🧬</span>
                ESMFold
              </button>
              <button
                className={`tab-btn ${activeTab === 'complexes' ? 'active' : ''}`}
                onClick={() => setActiveTab('complexes')}
              >
                <span className="tab-icon">🧩</span>
                Complexes
              </button>
            </div>
            <SearchPanel
              activeTab={activeTab}
              onProteinSelect={handleProteinSelect}
              onESMFold={handleESMFold}
              onComplexSelect={handleComplexSelect}
              loading={loading}
            />
            {error && <div className="error-banner">{error}</div>}
            {proteinData && <ProteinInfo data={proteinData} />}
          </aside>
          <section className="viewer-area">
            <ProteinViewer pdbData={pdbData} loading={loading} viewerMode={viewerMode} />
          </section>
        </main>
      )}

      {activePage === 'vaccine' && (
        <main className="main-full">
          <VaccineLabPage />
        </main>
      )}
    </div>
  )
}

export default App
