import { useEffect, useRef } from 'react'
import './ProteinViewer.css'

function ProteinViewer({ pdbData, loading }) {
  const viewerRef = useRef(null)
  const viewerInstance = useRef(null)

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
      viewer.setStyle({}, { cartoon: { color: 'spectrum' } })
      viewer.zoomTo()
      viewer.render()
    }
  }, [pdbData])

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
          <div className="vc-hint">
            <strong>Pro Tip:</strong> Click & Drag to Rotate • Scroll to Zoom • Ctrl+Drag to Pan
          </div>
        </div>
      )}
      
      {pdbData && !loading && (
        <div className="viewer-legend">
          <span className="legend-label">N-Terminus</span>
          <div className="legend-gradient"></div>
          <span className="legend-label">C-Terminus</span>
        </div>
      )}
    </div>
  )
}

export default ProteinViewer
