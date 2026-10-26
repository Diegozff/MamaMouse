import { useState, useEffect } from 'react'
import { localYMD } from '../booking'

const DIAS  = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb']
const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

const ESTADO_COLOR = { pagado: '#16a34a', parcial: '#d97706', pendiente: '#dc2626' }
const ESTADO_BG    = { pagado: '#dcfce7', parcial: '#fef3c7', pendiente: '#fee2e2' }

function toYMD(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function getCalDays(year, month) {
  const firstDay    = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const days = []
  for (let i = 0; i < firstDay; i++) days.push(null)
  for (let d = 1; d <= daysInMonth; d++) days.push(d)
  // pad to complete last row
  while (days.length % 7 !== 0) days.push(null)
  return days
}

function diasDuracion(inicio, fin) {
  if (!inicio || !fin || fin <= inicio) return null
  const diff = new Date(fin + 'T00:00:00') - new Date(inicio + 'T00:00:00')
  return Math.round(diff / 86400000)
}

export default function CalendarAdmin({ onBack, onOpenBooking }) {
  const today = new Date()
  const [year,     setYear]     = useState(today.getFullYear())
  const [month,    setMonth]    = useState(today.getMonth())
  const [bookings, setBookings] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [hovered,  setHovered]  = useState(null)

  useEffect(() => {
    fetch('/api/bookings')
      .then(r => r.json())
      .then(d => { if (d.ok) setBookings(d.bookings.filter(b => b.fechaViaje)) })
      .finally(() => setLoading(false))
  }, [])

  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
  }
  const goToday = () => { setYear(today.getFullYear()); setMonth(today.getMonth()) }

  const calDays = getCalDays(year, month)
  const todayStr = localYMD(today)

  // Map: dateStr → [booking, ...]  (all days the trip is active)
  const byDate = {}
  for (const b of bookings) {
    const inicio = b.fechaViaje
    const fin    = b.fechaFin || inicio
    if (!inicio) continue
    // Walk every day from inicio to fin
    const cur = new Date(inicio + 'T00:00:00')
    const end = new Date(fin   + 'T00:00:00')
    while (cur <= end) {
      const ds = localYMD(cur)
      if (!byDate[ds]) byDate[ds] = []
      byDate[ds].push({ ...b, isStart: ds === inicio, isEnd: ds === fin })
      cur.setDate(cur.getDate() + 1)
    }
  }

  // Bookings this month (for legend)
  const thisMonthStart = `${year}-${String(month + 1).padStart(2, '0')}-01`
  const thisMonthEnd   = `${year}-${String(month + 1).padStart(2, '0')}-31`
  const thisMonth = bookings.filter(b => b.fechaViaje >= thisMonthStart && b.fechaViaje <= thisMonthEnd)

  return (
    <div className="admin-shell">
      <header className="admin-topbar">
        <div className="admin-topbar-brand">
          <img src="/logo.png" alt="Mama Mouse" className="admin-topbar-logo" />
          <div>
            <div className="admin-topbar-name">MAMA MOUSE</div>
            <div className="admin-topbar-sub">Calendario de Viajes</div>
          </div>
        </div>
        <div className="admin-topbar-right">
          <button className="admin-btn admin-btn-ghost" onClick={onBack}>← Volver</button>
        </div>
      </header>

      <main className="cal-main">
        {/* ── Navegación de mes ── */}
        <div className="cal-nav">
          <button className="cal-nav-btn" onClick={prevMonth}>‹</button>
          <div className="cal-nav-center">
            <span className="cal-nav-title">{MESES[month]} {year}</span>
            <button className="cal-today-btn" onClick={goToday}>Hoy</button>
          </div>
          <button className="cal-nav-btn" onClick={nextMonth}>›</button>
        </div>

        {/* ── Resumen del mes ── */}
        {!loading && thisMonth.length > 0 && (
          <div className="cal-summary">
            <span className="cal-summary-count">{thisMonth.length} {thisMonth.length === 1 ? 'viaje' : 'viajes'} este mes</span>
            <div className="cal-summary-chips">
              {thisMonth.map(b => (
                <span
                  key={b.id}
                  className="cal-summary-chip"
                  style={{ background: ESTADO_BG[b.estado], color: ESTADO_COLOR[b.estado], borderColor: ESTADO_COLOR[b.estado] }}
                  onClick={() => onOpenBooking(b.id)}
                >
                  {b.titular.split(' ')[0]} · {b.destinos[0] || '—'}
                </span>
              ))}
            </div>
          </div>
        )}

        {loading ? (
          <div className="dash-loading"><div className="loading-spinner" /><span>Cargando…</span></div>
        ) : (
          <div className="cal-grid-wrap">
            {/* Cabecera días */}
            <div className="cal-grid">
              {DIAS.map(d => (
                <div key={d} className="cal-header-cell">{d}</div>
              ))}

              {/* Celdas */}
              {calDays.map((day, i) => {
                if (day === null) return <div key={`e${i}`} className="cal-cell cal-cell-empty" />
                const dateStr     = toYMD(year, month, day)
                const dayBookings = byDate[dateStr] || []
                const isToday     = dateStr === todayStr

                return (
                  <div
                    key={dateStr}
                    className={`cal-cell ${isToday ? 'cal-cell-today' : ''}`}
                  >
                    <div className={`cal-day-num ${isToday ? 'cal-day-today' : ''}`}>{day}</div>
                    <div className="cal-events">
                      {dayBookings.slice(0, 3).map((b, ei) => {
                        const dur = b.isStart ? diasDuracion(b.fechaViaje, b.fechaFin) : null
                        return (
                          <div
                            key={`${b.id}-${ei}`}
                            className={`cal-event ${b.isStart ? 'cal-event-start' : ''} ${b.isEnd ? 'cal-event-end' : ''}`}
                            style={{ background: ESTADO_BG[b.estado], color: ESTADO_COLOR[b.estado], borderLeft: b.isStart ? `3px solid ${ESTADO_COLOR[b.estado]}` : 'none' }}
                            onClick={() => onOpenBooking(b.id)}
                            title={`${b.titular} · ${b.destinos.join(', ')}`}
                            onMouseEnter={() => setHovered(b.id)}
                            onMouseLeave={() => setHovered(null)}
                          >
                            {b.isStart && (
                              <span className="cal-event-name">
                                {b.titular.split(' ')[0]}
                                {dur ? <span className="cal-event-dur"> {dur}d</span> : null}
                              </span>
                            )}
                            {!b.isStart && <span className="cal-event-cont">·</span>}
                          </div>
                        )
                      })}
                      {dayBookings.length > 3 && (
                        <div className="cal-event-more">+{dayBookings.length - 3}</div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── Leyenda ── */}
        <div className="cal-legend">
          {Object.entries({ pagado: '✅ Pagado', parcial: '🔄 Pago parcial', pendiente: '⏳ Sin pago' }).map(([k, v]) => (
            <span key={k} className="cal-legend-item">
              <span className="cal-legend-dot" style={{ background: ESTADO_COLOR[k] }} />
              {v}
            </span>
          ))}
        </div>
      </main>
    </div>
  )
}
