import { useState, useEffect } from 'react'

const ESTADO = {
  pagado:    { label: 'Pagado Total',   cls: 'bl-estado-pagado',    icon: '✅' },
  parcial:   { label: 'Pago Parcial',   cls: 'bl-estado-parcial',   icon: '🔄' },
  pendiente: { label: 'Sin Pago',       cls: 'bl-estado-pendiente', icon: '⏳' },
}

function formatDate(d) {
  if (!d) return '—'
  const [y, m, day] = d.split('-')
  const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
  return `${parseInt(day)} ${meses[parseInt(m)-1]} ${y}`
}

export default function BookingsList({ onOpen }) {
  const [bookings, setBookings] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState('')
  const [filtro,   setFiltro]   = useState('todos') // todos | pagado | parcial | pendiente
  const [busqueda, setBusqueda] = useState('')

  useEffect(() => {
    fetch('/api/bookings')
      .then(r => r.json())
      .then(d => { if (d.ok) setBookings(d.bookings); else setError(d.error) })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const filtered = bookings.filter(b => {
    if (filtro !== 'todos' && b.estado !== filtro) return false
    if (busqueda) {
      const q = busqueda.toLowerCase()
      return b.titular?.toLowerCase().includes(q) ||
             b.id?.toLowerCase().includes(q) ||
             b.destinos?.some(d => d.toLowerCase().includes(q))
    }
    return true
  })

  const counts = {
    todos:    bookings.length,
    pagado:   bookings.filter(b => b.estado === 'pagado').length,
    parcial:  bookings.filter(b => b.estado === 'parcial').length,
    pendiente:bookings.filter(b => b.estado === 'pendiente').length,
  }

  if (loading) return (
    <div className="bl-loading">
      <div className="loading-spinner" />
      <span>Cargando reservas…</span>
    </div>
  )

  if (error) return (
    <div className="bl-error">❌ {error}</div>
  )

  return (
    <div className="bl-root">

      {/* Header */}
      <div className="bl-header">
        <div className="bl-title">📋 Todas las Reservas</div>
        <div className="bl-stats">
          <span className="bl-stat-chip bl-chip-pagado">✅ {counts.pagado} pagadas</span>
          <span className="bl-stat-chip bl-chip-parcial">🔄 {counts.parcial} parciales</span>
          <span className="bl-stat-chip bl-chip-pendiente">⏳ {counts.pendiente} sin pago</span>
        </div>
      </div>

      {/* Filtros + búsqueda */}
      <div className="bl-filters">
        <div className="bl-filter-tabs">
          {[['todos','Todas'],['pagado','Pagado Total'],['parcial','Pago Parcial'],['pendiente','Sin Pago']].map(([v, l]) => (
            <button
              key={v}
              className={`bl-filter-btn ${filtro === v ? 'active' : ''}`}
              onClick={() => setFiltro(v)}
            >
              {l} <span className="bl-filter-count">{counts[v]}</span>
            </button>
          ))}
        </div>
        <input
          className="admin-input bl-search"
          placeholder="🔍 Buscar por nombre, ID o destino…"
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
        />
      </div>

      {/* Lista */}
      {filtered.length === 0 ? (
        <div className="bl-empty">No hay reservas que coincidan con el filtro.</div>
      ) : (
        <div className="bl-list">
          {filtered.map(b => {
            const est = ESTADO[b.estado] || ESTADO.pendiente
            const pct = b.total > 0 ? Math.min(100, Math.round((b.paid / b.total) * 100)) : 100
            const initials = b.titular?.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
            return (
              <div key={b.id} className="bl-row" onClick={() => onOpen(b.id)}>
                <div className="bl-row-avatar">{initials}</div>
                <div className="bl-row-info">
                  <div className="bl-row-titular">{b.titular}</div>
                  <div className="bl-row-meta">
                    <span className="bl-row-id">/{b.id}</span>
                    {b.destinos.slice(0, 2).map(d => (
                      <span key={d} className="bl-row-dest">{d}</span>
                    ))}
                    {b.fechaViaje && (
                      <span className="bl-row-fecha">✈️ {formatDate(b.fechaViaje)}</span>
                    )}
                  </div>
                  {b.total > 0 && (
                    <div className="bl-row-bar-wrap">
                      <div className="bl-row-bar-fill" style={{ width: `${pct}%`, background: b.estado === 'pagado' ? '#16a34a' : b.estado === 'parcial' ? '#d97706' : '#dc2626' }} />
                    </div>
                  )}
                </div>
                <div className="bl-row-right">
                  {b.total > 0 && (
                    <div className="bl-row-total">
                      USD {b.total.toLocaleString('es-AR')}
                    </div>
                  )}
                  <span className={`bl-estado-badge ${est.cls}`}>
                    {est.icon} {est.label}
                  </span>
                  <span className="bl-row-arrow">→</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
