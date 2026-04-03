import './Header.css'

function Header() {
  return (
    <header className="header">
      <div className="header-inner">
        <div className="header-brand">
          <span className="header-logo">🧪</span>
          <h1 className="header-title">Protein Tinker</h1>
        </div>
        <p className="header-subtitle">
          Search the AlphaFold Database · Fold with ESMFold · Visualize in 3D
        </p>
      </div>
    </header>
  )
}

export default Header
