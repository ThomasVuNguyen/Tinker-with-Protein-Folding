import { useState } from 'react'
import {
  SPIKE_METADATA,
  SPIKE_SEQUENCE,
  HLA_ALLELES,
  PEPTIDE_LENGTHS,
  GROUND_TRUTH_EPITOPES,
  BINDING_THRESHOLDS,
} from '../data/spikeProtein'
import './VaccineLab.css'

function VaccineLab({ vaccineState, onRunPrediction, onRunBlindTest, onReset }) {
  const { step, predictions, comparison, progress, hlaAllele, peptideLength } = vaccineState
  const [selectedAllele, setSelectedAllele] = useState(hlaAllele)
  const [selectedLength, setSelectedLength] = useState(peptideLength)

  const alleleInfo = HLA_ALLELES.find((a) => a.value === selectedAllele)
  const groundTruthForAllele = GROUND_TRUTH_EPITOPES.filter((e) => e.allele === selectedAllele)

  const bindersCount = predictions.filter(
    (p) => p.percentile_rank <= BINDING_THRESHOLDS.MODERATE
  ).length
  const strongBindersCount = predictions.filter(
    (p) => p.percentile_rank <= BINDING_THRESHOLDS.STRONG
  ).length

  const isPredicting = step === 'predicting'
  const hasPredictions = step === 'predicted' || step === 'comparing' || step === 'complete'
  const isComparing = step === 'comparing'
  const isComplete = step === 'complete'

  return (
    <div className="vaccine-lab">
      {/* Header */}
      <div className="vl-header">
        <div className="vl-header-icon">🧬</div>
        <div>
          <h2 className="vl-title">Vaccine Design Lab</h2>
          <p className="vl-subtitle">COVID-19 Blind Benchmark</p>
        </div>
      </div>

      {/* Step 1: Target */}
      <div className={`vl-step ${true ? 'completed' : ''}`}>
        <div className="vl-step-header">
          <span className="vl-step-badge done">✓</span>
          <span className="vl-step-label">Target Protein</span>
        </div>
        <div className="vl-step-body">
          <div className="vl-target-card">
            <div className="vl-target-name">{SPIKE_METADATA.name}</div>
            <div className="vl-target-meta">
              <span className="vl-tag">{SPIKE_METADATA.strain}</span>
              <span className="vl-tag">{SPIKE_METADATA.length} aa</span>
              <span className="vl-tag">PDB: {SPIKE_METADATA.pdb}</span>
            </div>
            <div className="vl-sequence-preview">
              <code>{SPIKE_SEQUENCE.slice(0, 60)}...</code>
            </div>
            {/* Protein region map */}
            <div className="vl-region-map">
              {SPIKE_METADATA.regions.map((r) => (
                <div
                  key={r.name}
                  className="vl-region-bar"
                  style={{
                    width: `${((r.end - r.start + 1) / SPIKE_METADATA.length) * 100}%`,
                    left: `${((r.start - 1) / SPIKE_METADATA.length) * 100}%`,
                    backgroundColor: r.color,
                  }}
                  title={`${r.name} (${r.start}-${r.end})`}
                />
              ))}
            </div>
            <div className="vl-region-legend">
              {SPIKE_METADATA.regions.slice(0, 4).map((r) => (
                <span key={r.name} className="vl-region-label">
                  <span className="vl-region-dot" style={{ backgroundColor: r.color }} />
                  {r.name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Step 2: Configure */}
      <div className={`vl-step ${hasPredictions ? 'completed' : 'active'}`}>
        <div className="vl-step-header">
          <span className={`vl-step-badge ${hasPredictions ? 'done' : 'num'}`}>
            {hasPredictions ? '✓' : '2'}
          </span>
          <span className="vl-step-label">Configure</span>
        </div>
        <div className="vl-step-body">
          <div className="vl-field">
            <label className="vl-field-label">HLA Allele</label>
            <select
              className="vl-select"
              value={selectedAllele}
              onChange={(e) => setSelectedAllele(e.target.value)}
              disabled={isPredicting}
            >
              {HLA_ALLELES.map((a) => (
                <option key={a.value} value={a.value}>
                  {a.label}
                </option>
              ))}
            </select>
            {alleleInfo && (
              <span className="vl-field-hint">Coverage: {alleleInfo.population}</span>
            )}
          </div>
          <div className="vl-field">
            <label className="vl-field-label">Peptide Length</label>
            <div className="vl-length-btns">
              {PEPTIDE_LENGTHS.map((len) => (
                <button
                  key={len}
                  className={`vl-len-btn ${selectedLength === len ? 'active' : ''}`}
                  onClick={() => setSelectedLength(len)}
                  disabled={isPredicting}
                >
                  {len}-mer
                </button>
              ))}
            </div>
          </div>
          <div className="vl-info-box">
            <span className="vl-info-icon">💡</span>
            <span>
              MHC-I presents {selectedLength}-aa peptides to CD8+ T-cells.
              {selectedLength === 9
                ? ' 9-mers are the most common length.'
                : ` ${selectedLength}-mers are less common but still relevant.`}
            </span>
          </div>
        </div>
      </div>

      {/* Step 3: Run Prediction */}
      <div
        className={`vl-step ${hasPredictions ? 'completed' : isPredicting ? 'active' : ''}`}
      >
        <div className="vl-step-header">
          <span className={`vl-step-badge ${hasPredictions ? 'done' : 'num'}`}>
            {hasPredictions ? '✓' : '3'}
          </span>
          <span className="vl-step-label">Predict Epitopes</span>
        </div>
        <div className="vl-step-body">
          {!isPredicting && !hasPredictions && (
            <button
              className="vl-run-btn"
              onClick={() => onRunPrediction(selectedAllele, selectedLength)}
            >
              <span className="vl-run-icon">▶</span>
              Run IEDB MHC-I Prediction
            </button>
          )}

          {isPredicting && (
            <div className="vl-progress-area">
              <div className="vl-progress-label">
                <span>Scanning {SPIKE_SEQUENCE.length - selectedLength + 1} peptide windows...</span>
                <span className="vl-progress-pct">{Math.round(progress)}%</span>
              </div>
              <div className="vl-progress-bar">
                <div className="vl-progress-fill" style={{ width: `${progress}%` }} />
              </div>
              <span className="vl-progress-hint">
                IEDB NetMHCpan prediction • This may take 30–90 seconds
              </span>
            </div>
          )}

          {hasPredictions && (
            <div className="vl-prediction-summary">
              <div className="vl-stat-row">
                <div className="vl-stat">
                  <div className="vl-stat-value">{predictions.length}</div>
                  <div className="vl-stat-label">Total peptides</div>
                </div>
                <div className="vl-stat highlight">
                  <div className="vl-stat-value">{bindersCount}</div>
                  <div className="vl-stat-label">Predicted binders</div>
                </div>
                <div className="vl-stat strong">
                  <div className="vl-stat-value">{strongBindersCount}</div>
                  <div className="vl-stat-label">Strong binders</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Step 4: Blind Test */}
      <div className={`vl-step ${isComplete ? 'completed' : hasPredictions ? 'active' : 'locked'}`}>
        <div className="vl-step-header">
          <span className={`vl-step-badge ${isComplete ? 'done' : hasPredictions ? 'num' : 'locked'}`}>
            {isComplete ? '✓' : '4'}
          </span>
          <span className="vl-step-label">Blind Test</span>
          {!hasPredictions && <span className="vl-locked-hint">🔒</span>}
        </div>
        {hasPredictions && (
          <div className="vl-step-body">
            {!isComparing && !isComplete && (
              <>
                <div className="vl-info-box warn">
                  <span className="vl-info-icon">🎯</span>
                  <span>
                    Compare your {bindersCount} predicted binders against{' '}
                    <strong>{groundTruthForAllele.length} experimentally validated</strong>{' '}
                    epitopes from human T-cell assays.
                  </span>
                </div>
                <button className="vl-run-btn secondary" onClick={onRunBlindTest}>
                  <span className="vl-run-icon">🔬</span>
                  Run Blind Comparison
                </button>
              </>
            )}
            {isComparing && (
              <div className="vl-progress-area">
                <div className="vl-progress-bar">
                  <div className="vl-progress-fill comparing" style={{ width: '100%' }} />
                </div>
                <span className="vl-progress-hint">Comparing predictions vs ground truth...</span>
              </div>
            )}
            {isComplete && comparison && (
              <div className="vl-score-summary">
                <div className="vl-verdict-badge">
                  {comparison.recall >= 0.6 ? '✅ Pipeline Validated' : '⚠️ Needs Tuning'}
                </div>
                <div className="vl-score-row">
                  <span className="vl-score-label">Recall</span>
                  <div className="vl-score-bar-wrap">
                    <div
                      className="vl-score-bar recall"
                      style={{ width: `${comparison.recall * 100}%` }}
                    />
                  </div>
                  <span className="vl-score-value">{(comparison.recall * 100).toFixed(1)}%</span>
                </div>
                <div className="vl-score-row">
                  <span className="vl-score-label">Precision</span>
                  <div className="vl-score-bar-wrap">
                    <div
                      className="vl-score-bar precision"
                      style={{ width: `${comparison.precision * 100}%` }}
                    />
                  </div>
                  <span className="vl-score-value">
                    {(comparison.precision * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="vl-score-row">
                  <span className="vl-score-label">F1 Score</span>
                  <div className="vl-score-bar-wrap">
                    <div
                      className="vl-score-bar f1"
                      style={{ width: `${comparison.f1 * 100}%` }}
                    />
                  </div>
                  <span className="vl-score-value">{(comparison.f1 * 100).toFixed(1)}%</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Reset */}
      {hasPredictions && (
        <button className="vl-reset-btn" onClick={onReset}>
          ↺ Reset & Try Different Parameters
        </button>
      )}
    </div>
  )
}

export default VaccineLab
