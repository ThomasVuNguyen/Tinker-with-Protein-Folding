import { useEffect, useRef, useState } from 'react'
import './ProteinViewer.css'

function ProteinViewer({ pdbData, loading, viewerMode = 'spectrum' }) {
  const viewerRef = useRef(null)
  const viewerInstance = useRef(null)
  const [representation, setRepresentation] = useState('cartoon')
  const [isExploded, setIsExploded] = useState(false)

  useEffect(() => {
    if (!viewerRef.current || !window.$3Dmol) return

    if (!viewerInstance.current) {
      viewerInstance.current = window.$3Dmol.createViewer(viewerRef.current, {
        backgroundColor: 'transparent',
      })
    }

    const viewer = viewerInstance.current
    viewer.clear()

    if (pdbData) {
      viewer.addModel(pdbData, 'pdb')
      
      if (isExploded) {
        const m = viewer.getModel()
        const atoms = m.selectedAtoms({})
        
        let globalCM = { x: 0, y: 0, z: 0 }
        let numAtoms = 0
        const chainCM = {}
        const chainCount = {}

        for (let i = 0; i < atoms.length; i++) {
          const a = atoms[i]
          globalCM.x += a.x; globalCM.y += a.y; globalCM.z += a.z;
          numAtoms++;

          if (!chainCM[a.chain]) {
            chainCM[a.chain] = { x: 0, y: 0, z: 0 }
            chainCount[a.chain] = 0
          }
          chainCM[a.chain].x += a.x; chainCM[a.chain].y += a.y; chainCM[a.chain].z += a.z;
          chainCount[a.chain]++;
        }

        if (numAtoms > 0) {
          globalCM.x /= numAtoms; globalCM.y /= numAtoms; globalCM.z /= numAtoms;
          
          for (let chain in chainCM) {
            chainCM[chain].x /= chainCount[chain];
            chainCM[chain].y /= chainCount[chain];
            chainCM[chain].z /= chainCount[chain];
          }

          const explodeFactor = 30; // 30 Angstroms
          
          for (let i = 0; i < atoms.length; i++) {
            const a = atoms[i]
            const cm = chainCM[a.chain]
            
            let dx = cm.x - globalCM.x;
            let dy = cm.y - globalCM.y;
            let dz = cm.z - globalCM.z;
            
            let len = Math.sqrt(dx*dx + dy*dy + dz*dz);
            if (len > 0.0001) {
              dx /= len; dy /= len; dz /= len;
              a.x += dx * explodeFactor;
              a.y += dy * explodeFactor;
              a.z += dz * explodeFactor;
            }
          }
        }
      }

      const colorConfig = viewerMode === 'chain' 
        ? { colorscheme: 'chain' } 
        : { color: 'spectrum' }

      if (representation === 'surface') {
        viewer.setStyle({}, { line: { hidden: true } }) // hide default lines
        viewer.addSurface(window.$3Dmol.SurfaceType.VDW, { ...colorConfig, opacity: 1.0 })
      } else {
        viewer.setStyle({}, { cartoon: colorConfig })
      }

      viewer.zoomTo()
      viewer.render()
    }
  }, [pdbData, viewerMode, representation, isExploded])

  useEffect(() => {
    if (!viewerRef.current) return;
    const resizeObserver = new ResizeObserver(() => {
      if (viewerInstance.current) {
        viewerInstance.current.resize();
        // zoomTo recalculates the bounding box ensuring it is centered
        if (pdbData && !loading) {
          viewerInstance.current.zoomTo();
          viewerInstance.current.render();
        }
      }
    });
    // Let's observe the parent container
    resizeObserver.observe(viewerRef.current.parentElement);
    return () => resizeObserver.disconnect();
  }, [pdbData, loading]);

  const handleZoomIn = () => { if (viewerInstance.current) { viewerInstance.current.zoom(1.2); } }
  const handleZoomOut = () => { if (viewerInstance.current) { viewerInstance.current.zoom(0.8); } }
  const handleReset = () => { if (viewerInstance.current) { viewerInstance.current.zoomTo(); } }
  const handlePan = (dx, dy) => { if (viewerInstance.current) { viewerInstance.current.translate(dx, dy); viewerInstance.current.render(); } }

  return (
    <div className="protein-viewer-container">
      {loading && (
        <div className="viewer-overlay">
          <div className="viewer-spinner"></div>
          <p>Fetching 3D coordinates...</p>
        </div>
      )}
      {!pdbData && !loading && (
        <div className="viewer-placeholder">
          <div className="icon">🧬</div>
          <h3>Awaiting Protein</h3>
          <p>Search for a protein or paste a sequence to render its 3D structure.</p>
        </div>
      )}
      <div className="protein-viewer" ref={viewerRef} />
      
      {pdbData && !loading && (
        <div className="viewer-controls">
          <div className="vc-group">
            <button className="vc-btn" onClick={() => handlePan(-20, 0)} title="Pan Left">⬅️</button>
            <button className="vc-btn" onClick={() => handlePan(20, 0)} title="Pan Right">➡️</button>
            <button className="vc-btn" onClick={() => handlePan(0, -20)} title="Pan Up">⬆️</button>
            <button className="vc-btn" onClick={() => handlePan(0, 20)} title="Pan Down">⬇️</button>
          </div>
          <div className="vc-group">
            <button className="vc-btn vc-icon-btn" onClick={handleZoomIn} title="Zoom In">➕</button>
            <button className="vc-btn vc-icon-btn" onClick={handleZoomOut} title="Zoom Out">➖</button>
          </div>
          <div className="vc-group">
            <button className="vc-btn vc-icon-btn" onClick={handleReset} title="Reset View">🔄</button>
          </div>
          <div className="vc-group">
            <button 
              className="vc-btn" 
              onClick={() => setRepresentation('cartoon')}
              title="Ribbon / Cartoon Mode"
              style={representation === 'cartoon' ? { background: 'var(--brand-primary)', color: 'white' } : {}}
            >
              🎀
            </button>
            <button 
              className="vc-btn" 
              onClick={() => setRepresentation('surface')}
              title="Surface Mode (Lego Fit)"
              style={representation === 'surface' ? { background: 'var(--brand-primary)', color: 'white' } : {}}
            >
              🧱
            </button>
            <button 
              className="vc-btn" 
              onClick={() => setIsExploded(!isExploded)}
              title="Exploded View (Pull Chains Apart)"
              style={isExploded ? { background: 'var(--brand-primary)', color: 'white' } : {}}
            >
              💥
            </button>
          </div>
          <div className="vc-hint">
            <strong>Pro Tip:</strong> Click & Drag to Rotate • Scroll to Zoom • Ctrl+Drag to Pan
          </div>
        </div>
      )}
      
      {pdbData && !loading && (
        <div className="viewer-legend">
          {viewerMode === 'spectrum' ? (
            <>
              <span className="legend-label">N-Terminus</span>
              <div className="legend-gradient"></div>
              <span className="legend-label">C-Terminus</span>
            </>
          ) : (
            <div className="legend-chain-mode" style={{ width: '100%', textAlign: 'center', padding: '4px 0' }}>
              <span className="legend-label">Visualization: Colored by Chain (Complex)</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default ProteinViewer
