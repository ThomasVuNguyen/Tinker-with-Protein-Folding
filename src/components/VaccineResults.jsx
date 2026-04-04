import { useState, useMemo } from 'react'
import { BINDING_THRESHOLDS, SPIKE_METADATA, getRegionForPosition } from '../data/spikeProtein'
import './VaccineResults.css'

function VaccineResults({ vaccineState }) {
  const { step, predictions, comparison, hlaAllele } = vaccineState
  const [activeView, setActiveView] = useState('overview')
  const [sortField, setSortField] = useState('percentile_rank')
  const [sortDir, setSortDir] = useState('asc')

  const isIdle = step === 'idle' || step === 'configuring'
  const isPredicting = step === 'predicting'
  const hasPredictions = ['predicted', 'comparing', 'complete'].includes(step)
  const isComplete = step === 'complete'

  // Sorted and classified predictions
  const classifiedPredictions = useMemo(() => {
    if (!predictions.length) return []
    return predictions
      .map((p, idx) => ({
        ...p,
        originalRank: idx + 1,
        strength:
          p.percentile_rank <= BINDING_THRESHOLDS.STRONG
            ? 'strong'
            : p.percentile_rank <= BINDING_THRESHOLDS.MODERATE
              ? 'moderate'
              : p.percentile_rank <= BINDING_THRESHOLDS.WEAK
                ? 'weak'
                : 'none',
        region: getRegionForPosition(p.start),
        isValidated: comparison
          ? comparison.matches.some((m) => m.peptide === p.peptide)
          : false,
        isImmunodominant: comparison
          ? comparison.matches.some((m) => m.peptide === p.peptide && m.immunodominant)
          : false,
      }))
      .sort((a, b) => {
        const aVal = a[sortField]
        const bVal = b[sortField]
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sortDir === 'asc' ? aVal - bVal : bVal - aVal
        }
        return sortDir === 'asc'
          ? String(aVal).localeCompare(String(bVal))
          : String(bVal).localeCompare(String(aVal))
      })
  }, [predictions, comparison, sortField, sortDir])

  const binders = classifiedPredictions.filter((p) => p.strength !== 'none')

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  const sortIcon = (field) => {
    if (sortField !== field) return '↕'
    return sortDir === 'asc' ? '↑' : '↓'
  }

  // ─── Idle State ──────────────────────────────
  if (isIdle) {
    return (
      <div className="vr-container">
        <div className="vr-welcome">
          <div className="vr-welcome-glow" />
          <div className="vr-welcome-content">
            <div className="vr-welcome-icon">🧬</div>
            <h2 className="vr-welcome-title">COVID-19 Vaccine Design Challenge</h2>
            <p className="vr-welcome-desc">
              Can your algorithm design a working COVID vaccine?
            </p>
            <div className="vr-welcome-steps">
              <div className="vr-wstep">
                <span className="vr-wstep-num">1</span>
                <div>
                  <strong>Predict</strong> T-cell epitopes from the SARS-CoV-2 spike protein
                  using IEDB's MHC-I binding prediction
                </div>
              </div>
              <div className="vr-wstep">
                <span className="vr-wstep-num">2</span>
                <div>
                  <strong>Compare</strong> your predictions against experimentally validated
                  epitopes from real human immune responses
                </div>
              </div>
              <div className="vr-wstep">
                <span className="vr-wstep-num">3</span>
                <div>
                  <strong>Score</strong> your pipeline — "Would your vaccine have worked?"
                </div>
              </div>
            </div>
            <div className="vr-welcome-footer">
              <div className="vr-welcome-stat">
                <span className="vr-welcome-stat-val">1,273</span>
                <span className="vr-welcome-stat-lbl">amino acids</span>
              </div>
              <div className="vr-welcome-stat">
                <span className="vr-welcome-stat-val">FREE</span>
                <span className="vr-welcome-stat-lbl">all APIs</span>
              </div>
              <div className="vr-welcome-stat">
                <span className="vr-welcome-stat-val">~2min</span>
                <span className="vr-welcome-stat-lbl">runtime</span>
              </div>
            </div>
            <p className="vr-welcome-hint">← Configure parameters in the sidebar to begin</p>
          </div>
        </div>
      </div>
    )
  }

  // ─── Predicting State ────────────────────────
  if (isPredicting) {
    return (
      <div className="vr-container">
        <div className="vr-loading">
          <div className="vr-loading-helix">
            <div className="vr-helix-strand strand-1" />
            <div className="vr-helix-strand strand-2" />
          </div>
          <h3 className="vr-loading-title">Running IEDB MHC-I Prediction</h3>
          <p className="vr-loading-desc">
            Analyzing binding affinity of every peptide window in the spike protein
            against <strong>{hlaAllele}</strong>
          </p>
          <div className="vr-loading-details">
            <span>Method: NetMHCpan (recommended)</span>
            <span>•</span>
            <span>Source: IEDB.org</span>
          </div>
        </div>
      </div>
    )
  }

  // ─── Results State ───────────────────────────
  return (
    <div className="vr-container">
      {/* View Toggle */}
      <div className="vr-toolbar">
        <div className="vr-view-tabs">
          <button
            className={`vr-view-tab ${activeView === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveView('overview')}
          >
            📊 Overview
          </button>
          <button
            className={`vr-view-tab ${activeView === 'table' ? 'active' : ''}`}
            onClick={() => setActiveView('table')}
          >
            📋 Predictions
          </button>
          {isComplete && (
            <button
              className={`vr-view-tab ${activeView === 'scorecard' ? 'active' : ''}`}
              onClick={() => setActiveView('scorecard')}
            >
              🎯 Scorecard
            </button>
          )}
        </div>
        <div className="vr-toolbar-info">
          <span className="vr-toolbar-allele">{hlaAllele}</span>
        </div>
      </div>

      {/* ─── Overview View ─── */}
      {activeView === 'overview' && (
        <div className="vr-overview">
          {/* Top stats */}
          <div className="vr-stats-grid">
            <div className="vr-stat-card">
              <div className="vr-stat-card-value">{predictions.length}</div>
              <div className="vr-stat-card-label">Total Peptides</div>
              <div className="vr-stat-card-sub">All sliding windows</div>
            </div>
            <div className="vr-stat-card accent-blue">
              <div className="vr-stat-card-value">{binders.length}</div>
              <div className="vr-stat-card-label">Predicted Binders</div>
              <div className="vr-stat-card-sub">Percentile rank &lt; 2.0</div>
            </div>
            <div className="vr-stat-card accent-green">
              <div className="vr-stat-card-value">
                {classifiedPredictions.filter((p) => p.strength === 'strong').length}
              </div>
              <div className="vr-stat-card-label">Strong Binders</div>
              <div className="vr-stat-card-sub">Percentile rank &lt; 0.5</div>
            </div>
            {isComplete && comparison && (
              <div className="vr-stat-card accent-amber">
                <div className="vr-stat-card-value">{comparison.truePositives}</div>
                <div className="vr-stat-card-label">Validated Hits</div>
                <div className="vr-stat-card-sub">
                  of {comparison.totalGroundTruth} known epitopes
                </div>
              </div>
            )}
          </div>

          {/* Region distribution */}
          <div className="vr-card">
            <h3 className="vr-card-title">Binder Distribution by Region</h3>
            <div className="vr-region-dist">
              {SPIKE_METADATA.regions.map((region) => {
                const count = binders.filter(
                  (b) => b.start >= region.start && b.start <= region.end
                ).length
                const maxCount = Math.max(
                  ...SPIKE_METADATA.regions.map((r) =>
                    binders.filter((b) => b.start >= r.start && b.start <= r.end).length
                  ),
                  1
                )
                return (
                  <div key={region.name} className="vr-region-row">
                    <span className="vr-region-name">
                      <span className="vr-region-dot" style={{ backgroundColor: region.color }} />
                      {region.name}
                    </span>
                    <div className="vr-region-bar-wrap">
                      <div
                        className="vr-region-bar"
                        style={{
                          width: `${(count / maxCount) * 100}%`,
                          backgroundColor: region.color,
                        }}
                      />
                    </div>
                    <span className="vr-region-count">{count}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Top 10 */}
          <div className="vr-card">
            <h3 className="vr-card-title">Top 10 Predicted Epitopes</h3>
            <div className="vr-mini-table">
              <div className="vr-mini-header">
                <span className="vr-mini-col rank">#</span>
                <span className="vr-mini-col peptide">Peptide</span>
                <span className="vr-mini-col pos">Position</span>
                <span className="vr-mini-col score">%ile Rank</span>
                <span className="vr-mini-col strength">Strength</span>
              </div>
              {classifiedPredictions.slice(0, 10).map((p, i) => (
                <div
                  key={i}
                  className={`vr-mini-row ${p.isValidated ? 'validated' : ''} ${p.isImmunodominant ? 'immunodominant' : ''}`}
                >
                  <span className="vr-mini-col rank">{i + 1}</span>
                  <span className="vr-mini-col peptide">
                    <code>{p.peptide}</code>
                    {p.isImmunodominant && <span className="vr-star">⭐</span>}
                    {p.isValidated && !p.isImmunodominant && <span className="vr-check">✓</span>}
                  </span>
                  <span className="vr-mini-col pos">{p.start}–{p.end}</span>
                  <span className="vr-mini-col score">{p.percentile_rank.toFixed(2)}</span>
                  <span className={`vr-mini-col strength badge-${p.strength}`}>
                    {p.strength === 'strong' ? '●●●' : p.strength === 'moderate' ? '●●○' : '●○○'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── Predictions Table View ─── */}
      {activeView === 'table' && (
        <div className="vr-table-view">
          <div className="vr-table-wrap">
            <table className="vr-table">
              <thead>
                <tr>
                  <th onClick={() => handleSort('percentile_rank')}>
                    Rank {sortIcon('percentile_rank')}
                  </th>
                  <th>Peptide</th>
                  <th onClick={() => handleSort('start')}>Start {sortIcon('start')}</th>
                  <th onClick={() => handleSort('end')}>End {sortIcon('end')}</th>
                  <th onClick={() => handleSort('percentile_rank')}>
                    %ile Rank {sortIcon('percentile_rank')}
                  </th>
                  <th>Region</th>
                  <th>Strength</th>
                  {isComplete && <th>Validated?</th>}
                </tr>
              </thead>
              <tbody>
                {classifiedPredictions.slice(0, 100).map((p, i) => (
                  <tr
                    key={i}
                    className={`${p.isValidated ? 'row-validated' : ''} ${p.isImmunodominant ? 'row-immunodominant' : ''}`}
                  >
                    <td className="cell-rank">{i + 1}</td>
                    <td className="cell-peptide">
                      <code>{p.peptide}</code>
                      {p.isImmunodominant && <span className="vr-star">⭐</span>}
                    </td>
                    <td>{p.start}</td>
                    <td>{p.end}</td>
                    <td className="cell-score">{p.percentile_rank.toFixed(3)}</td>
                    <td>
                      <span
                        className="vr-region-chip"
                        style={{
                          backgroundColor: `${p.region.color}20`,
                          color: p.region.color,
                          borderColor: `${p.region.color}40`,
                        }}
                      >
                        {p.region.name}
                      </span>
                    </td>
                    <td>
                      <span className={`vr-strength-chip ${p.strength}`}>
                        {p.strength}
                      </span>
                    </td>
                    {isComplete && (
                      <td className="cell-validated">
                        {p.isImmunodominant
                          ? '⭐ Immunodominant'
                          : p.isValidated
                            ? '✅ Confirmed'
                            : p.strength !== 'none'
                              ? '—'
                              : ''}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {classifiedPredictions.length > 100 && (
            <div className="vr-table-footer">
              Showing top 100 of {classifiedPredictions.length} peptides
            </div>
          )}
        </div>
      )}

      {/* ─── Scorecard View ─── */}
      {activeView === 'scorecard' && isComplete && comparison && (
        <div className="vr-scorecard">
          {/* Big metrics */}
          <div className="vr-sc-metrics">
            <div className="vr-sc-metric recall">
              <div className="vr-sc-metric-ring">
                <svg viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="52" className="vr-ring-bg" />
                  <circle
                    cx="60"
                    cy="60"
                    r="52"
                    className="vr-ring-fill"
                    style={{
                      strokeDasharray: `${comparison.recall * 327} 327`,
                    }}
                  />
                </svg>
                <span className="vr-sc-metric-val">
                  {(comparison.recall * 100).toFixed(0)}%
                </span>
              </div>
              <div className="vr-sc-metric-label">Recall</div>
              <div className="vr-sc-metric-sub">
                {comparison.truePositives}/{comparison.totalGroundTruth} validated found
              </div>
            </div>
            <div className="vr-sc-metric precision">
              <div className="vr-sc-metric-ring">
                <svg viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="52" className="vr-ring-bg" />
                  <circle
                    cx="60"
                    cy="60"
                    r="52"
                    className="vr-ring-fill"
                    style={{
                      strokeDasharray: `${comparison.precision * 327} 327`,
                    }}
                  />
                </svg>
                <span className="vr-sc-metric-val">
                  {(comparison.precision * 100).toFixed(0)}%
                </span>
              </div>
              <div className="vr-sc-metric-label">Precision</div>
              <div className="vr-sc-metric-sub">
                {comparison.truePositives}/{comparison.predictedBinders} predictions correct
              </div>
            </div>
            <div className="vr-sc-metric f1">
              <div className="vr-sc-metric-ring">
                <svg viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="52" className="vr-ring-bg" />
                  <circle
                    cx="60"
                    cy="60"
                    r="52"
                    className="vr-ring-fill"
                    style={{
                      strokeDasharray: `${comparison.f1 * 327} 327`,
                    }}
                  />
                </svg>
                <span className="vr-sc-metric-val">{(comparison.f1 * 100).toFixed(0)}%</span>
              </div>
              <div className="vr-sc-metric-label">F1 Score</div>
              <div className="vr-sc-metric-sub">Harmonic mean</div>
            </div>
          </div>

          {/* Verdict */}
          <div
            className={`vr-sc-verdict ${comparison.recall >= 0.6 ? 'pass' : 'warn'}`}
          >
            <div className="vr-sc-verdict-icon">
              {comparison.recall >= 0.6 ? '🏆' : '⚠️'}
            </div>
            <div>
              <div className="vr-sc-verdict-title">
                {comparison.recall >= 0.6
                  ? 'Pipeline Validated — Your Vaccine Would Work!'
                  : 'Pipeline Needs Tuning'}
              </div>
              <div className="vr-sc-verdict-desc">
                {comparison.recall >= 0.6
                  ? `Your algorithm correctly identified ${(comparison.recall * 100).toFixed(0)}% of experimentally validated T-cell epitopes. This is comparable to state-of-the-art immunoinformatics tools used by Pfizer and Moderna research teams.`
                  : `Your algorithm only identified ${(comparison.recall * 100).toFixed(0)}% of validated epitopes. Try adjusting the HLA allele or using a different peptide length.`}
              </div>
            </div>
          </div>

          {/* Matches detail */}
          <div className="vr-sc-matches">
            <h3 className="vr-sc-section-title">Epitope-by-Epitope Results</h3>
            {comparison.details.map((d, i) => (
              <div
                key={i}
                className={`vr-sc-match ${d.found ? 'hit' : 'miss'} ${d.immunodominant ? 'immunodominant' : ''}`}
              >
                <div className="vr-sc-match-icon">
                  {d.immunodominant && d.found ? '⭐' : d.found ? '✅' : '❌'}
                </div>
                <div className="vr-sc-match-info">
                  <div className="vr-sc-match-peptide">
                    <code>{d.peptide}</code>
                    {d.immunodominant && (
                      <span className="vr-sc-match-tag idominant">immunodominant</span>
                    )}
                    <span className="vr-sc-match-tag region">{d.region}</span>
                  </div>
                  <div className="vr-sc-match-detail">
                    {d.found ? (
                      <>
                        Predicted at rank <strong>#{d.predictedRank}</strong> with percentile{' '}
                        <strong>{d.percentileRank.toFixed(2)}</strong>
                      </>
                    ) : (
                      <>
                        Not predicted as a binder (rank too low) —{' '}
                        <span className="vr-sc-match-ref">{d.reference}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default VaccineResults
