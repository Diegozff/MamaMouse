import { useState, useEffect, useRef } from 'react'

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

async function deleteBooking(id, titular, setBookings) {
  if (!window.confirm(`¿Eliminar la reserva de "${titular}"?\n\nEsta acción no se puede deshacer.`)) return
  try {
    const r = await fetch(`/api/booking/${encodeURIComponent(id)}`, { method: 'DELETE' })
    if (r.ok) setBookings(prev => prev.filter(b => b.id !== id))
    else { const d = await r.json(); alert('Error: ' + d.error) }
  } catch (e) { alert('Error: ' + e.message) }
}

export default function BookingsList({ onOpen }) {
  const [bookings,   setBookings]   = useState([])
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState('')
  const [filtro,     setFiltro]     = useState('todos')
  const [busqueda,   setBusqueda]   = useState('')
  const [showScroll, setShowScroll] = useState(false)
  const scrollRef = useRef(null)

  const handleScroll = () => setShowScroll(scrollRef.current?.scrollTop > 180)
  const scrollTop    = () => scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  const scrollBottom = () => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })

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
    <>
      {/* Header + filtros fijos */}
      <div className="bl-sticky-header">
        <div className="bl-header">
          <div className="bl-title">📋 Todas las Reservas</div>
          <div className="bl-stats">
            <span className="bl-stat-chip bl-chip-pagado">✅ {counts.pagado} pagadas</span>
            <span className="bl-stat-chip bl-chip-parcial">🔄 {counts.parcial} parciales</span>
            <span className="bl-stat-chip bl-chip-pendiente">⏳ {counts.pendiente} sin pago</span>
          </div>
        </div>
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
      </div>

      {/* Lista scrolleable */}
      <div className="bl-root" ref={scrollRef} onScroll={handleScroll}>
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
                  <div className="bl-row-actions" onClick={e => e.stopPropagation()}>
                    <button
                      className="bl-delete-btn"
                      title="Eliminar reserva"
                      onClick={() => deleteBooking(b.id, b.titular, setBookings)}
                    >🗑</button>
                    <span className="bl-row-arrow">→</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Botones flotantes de scroll */}
      {showScroll && (
        <div className="bl-scroll-nav">
          <button className="bl-scroll-btn" onClick={scrollTop} title="Ir arriba">↑</button>
          <button className="bl-scroll-btn" onClick={scrollBottom} title="Ir abajo">↓</button>
        </div>
      )}
      </div>
    </>
  )
}
