import './Header.css'

function Header({ activePage, onNavigate }) {
  return (
    <header className="header">
      <div className="header-inner">
        <div className="header-left">
          <div className="header-brand">
            <span className="header-logo">🧪</span>
            <h1 className="header-title">Protein Tinker</h1>
          </div>
          <nav className="header-nav">
            <button
              className={`header-nav-btn ${activePage === 'explorer' ? 'active' : ''}`}
              onClick={() => onNavigate('explorer')}
            >
              <span className="header-nav-icon">🔬</span>
              Explorer
            </button>
            <button
              className={`header-nav-btn ${activePage === 'vaccine' ? 'active' : ''}`}
              onClick={() => onNavigate('vaccine')}
            >
              <span className="header-nav-icon">💉</span>
              Vaccine Lab
            </button>
          </nav>
        </div>
        <p className="header-subtitle">
          {activePage === 'explorer'
            ? 'Search the AlphaFold Database · Fold with ESMFold · Visualize in 3D'
            : 'COVID-19 Vaccine Design — Computational Blind Benchmark'}
        </p>
      </div>
    </header>
  )
}

export default Header
