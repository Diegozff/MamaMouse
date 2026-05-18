import { TABS } from '../tabs'

export default function BottomTabs({ activeTab, onTabChange }) {
  return (
    <div className="bottom-tabs">
      {TABS.map(tab => (
        <button
          key={tab.id}
          className={`bottom-tab ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => onTabChange(tab.id)}
        >
          {activeTab === tab.id && <div className="bottom-tab-indicator" />}
          <span className="bottom-tab-icon">{tab.icon}</span>
          <span className="bottom-tab-label">{tab.label}</span>
        </button>
      ))}
    </div>
  )
}
