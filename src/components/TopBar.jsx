function LogoImg() {
  return (
    <div className="topbar-logo">
      <img
        src="/logo.png"
        alt="Mama Mouse"
        onError={e => { e.currentTarget.style.display = 'none'; e.currentTarget.nextSibling.style.display = 'flex' }}
      />
      <span style={{ display: 'none', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', fontSize: 18 }}>🐭</span>
    </div>
  )
}

export default function TopBar({ titular, destinos, estado }) {
  const initials = titular.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()

  return (
    <header className="topbar">
      <div className="topbar-brand">
        <LogoImg />
        <span className="topbar-name">MAMA MOUSE</span>
      </div>

      <div className="topbar-divider" />

      <div className="topbar-trip">
        <span className="topbar-trip-label">Viaje de</span>
        <span className="topbar-trip-name">{titular}</span>
        {destinos?.map(d => (
          <span key={d} className="destino-chip" style={{ fontSize: 11 }}>{d}</span>
        ))}
      </div>

      <div className="topbar-right">
        <span className={`estado-badge ${estado.cls}`}>{estado.label}</span>
        <div className="avatar">{initials}</div>
      </div>
    </header>
  )
}
