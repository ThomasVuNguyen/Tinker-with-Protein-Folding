import './ProteinInfo.css'

function ProteinInfo({ data }) {
  if (!data) return null;

  return (
    <div className="protein-info">
      <h3>{data.name}</h3>
      <div className="info-grid">
        <div className="info-item">
          <span className="label">Gene</span>
          <span className="value">{data.gene}</span>
        </div>
        <div className="info-item">
          <span className="label">Organism</span>
          <span className="value">{data.organism}</span>
        </div>
        <div className="info-item">
          <span className="label">Accession</span>
          <span className="value badge">{data.accession}</span>
        </div>
        <div className="info-item">
          <span className="label">Length</span>
          <span className="value">{data.length} aa</span>
        </div>
        <div className="info-item">
          <span className="label">Source</span>
          <span className="value source-badge">{data.source}</span>
        </div>
        {data.confidence && (
          <div className="info-item">
            <span className="label">pLDDT (Confidence)</span>
            <span className={`value plddt ${data.confidence > 90 ? 'high' : (data.confidence > 70 ? 'med' : 'low')}`}>
              {data.confidence.toFixed(1)}
            </span>
          </div>
        )}
      </div>
      
      {data.paeImageUrl && (
        <div className="pae-plot">
          <h4>Predicted Aligned Error</h4>
          <img src={data.paeImageUrl} alt="PAE Plot" />
        </div>
      )}
    </div>
  )
}

export default ProteinInfo
