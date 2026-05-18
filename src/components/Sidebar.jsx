import { TABS } from '../tabs'

export default function Sidebar({ activeTab, onTabChange }) {
  return (
    <nav className="sidebar">
      <div className="sidebar-brand">
        <img
          src="/logo.png"
          alt="Mama Mouse"
          className="sidebar-logo"
          onError={e => { e.currentTarget.style.display = 'none' }}
        />
        <div className="sidebar-brand-text">
          <div className="sidebar-brand-name">MAMA MOUSE</div>
          <div className="sidebar-brand-sub">Agente Oficial</div>
        </div>
      </div>

      <div className="sidebar-section-label">Mi Viaje</div>

      {TABS.map(tab => (
        <button
          key={tab.id}
          className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => onTabChange(tab.id)}
        >
          <span className="nav-icon">{tab.icon}</span>
          <span className="nav-label">{tab.label}</span>
        </button>
      ))}

      <div className="sidebar-footer">
        <div className="sidebar-footer-brand">✨ Disney · Universal · Hotels</div>
      </div>
    </nav>
  )
}
