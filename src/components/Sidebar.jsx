import { TABS } from '../tabs'

export default function Sidebar({ activeTab, onTabChange }) {
  return (
    <nav className="sidebar">
      <div className="sidebar-section-label">MI VIAJE</div>
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
