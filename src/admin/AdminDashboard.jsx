import { useState, useEffect } from 'react'

function diasHasta(dateStr) {
  if (!dateStr) return null
  const diff = new Date(dateStr + 'T00:00:00') - new Date()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

function formatDate(d) {
  if (!d) return '—'
  const [y, m, day] = d.split('-')
  const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
  return `${parseInt(day)} ${meses[parseInt(m)-1]}`
}

function money(n) {
  return `$${Math.round(n).toLocaleString('es-AR')}`
}

function KpiCard({ icon, value, label, sub, color }) {
  return (
    <div className="dash-kpi" style={{ borderTop: `3px solid ${color}` }}>
      <div className="dash-kpi-icon" style={{ color }}>{icon}</div>
      <div className="dash-kpi-value" style={{ color }}>{value}</div>
      <div className="dash-kpi-label">{label}</div>
      {sub && <div className="dash-kpi-sub">{sub}</div>}
    </div>
  )
}

export default function AdminDashboard({ onOpenBooking, onNewBooking, onImport, onList, onGuides }) {
  const [bookings, setBookings] = useState([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    fetch('/api/bookings')
      .then(r => r.json())
      .then(d => { if (d.ok) setBookings(d.bookings) })
      .finally(() => setLoading(false))
  }, [])

  // ── KPIs ──────────────────────────────────────────────────────────────────
  const totalReservas  = bookings.length
  const totalSaldo     = bookings.reduce((s, b) => s + (b.saldo || 0), 0)
  const pagadas        = bookings.filter(b => b.estado === 'pagado').length
  const parciales      = bookings.filter(b => b.estado === 'parcial').length
  const sinPago        = bookings.filter(b => b.estado === 'pendiente').length

  // Próximos viajes (30 días)
  const today = new Date().toISOString().slice(0, 10)
  const proximosViajes = bookings
    .filter(b => b.fechaViaje && b.fechaViaje >= today)
    .sort((a, b) => a.fechaViaje.localeCompare(b.fechaViaje))
    .slice(0, 6)

  // Vencimientos próximos con saldo (30 días)
  const vencimientos = bookings
    .filter(b => b.proximoVencimiento)
    .map(b => ({ ...b.proximoVencimiento, titular: b.titular, id: b.id, dias: diasHasta(b.proximoVencimiento.fecha) }))
    .filter(v => v.dias !== null && v.dias >= 0 && v.dias <= 30)
    .sort((a, b) => a.dias - b.dias)
    .slice(0, 6)

  const vencUrgentes = vencimientos.filter(v => v.dias <= 5).length

  return (
    <div className="dash-root">

      {/* ── BIENVENIDA ── */}
      <div className="dash-hero">
        <img src="/logo.png" alt="Mama Mouse" className="dash-logo" />
        <div>
          <div className="dash-hero-title">Bienvenida, Carolina ✨</div>
          <div className="dash-hero-sub">Panel de Administración · Mama Mouse</div>
        </div>
      </div>

      {/* ── KPIs ── */}
      {loading ? (
        <div className="dash-loading"><div className="loading-spinner" /><span>Cargando datos…</span></div>
      ) : (
        <div className="dash-kpis">
          <KpiCard icon="🗂️" value={totalReservas}  label="Reservas total"
            sub={`✅ ${pagadas} · 🔄 ${parciales} · ⏳ ${sinPago}`} color="#9B7EC8" />
          <KpiCard icon="💰" value={`USD ${money(totalSaldo)}`} label="Saldo total pendiente"
            sub={totalSaldo > 0 ? 'a cobrar' : '¡Todo cobrado!'} color={totalSaldo > 0 ? '#E65100' : '#16a34a'} />
          <KpiCard icon="⚠️" value={vencUrgentes || '—'} label="Vencimientos ≤ 5 días"
            sub={vencUrgentes > 0 ? 'requieren atención' : 'sin urgencias'} color={vencUrgentes > 0 ? '#C62828' : '#9B7EC8'} />
          <KpiCard icon="✈️" value={proximosViajes.length} label="Viajes próximos 30 días"
            sub={proximosViajes[0] ? `Próximo: ${formatDate(proximosViajes[0].fechaViaje)}` : 'Sin viajes próximos'} color="#1565C0" />
        </div>
      )}

      {/* ── ACCIONES RÁPIDAS ── */}
      <div className="dash-section-title">Acciones rápidas</div>
      <div className="dash-actions">
        <button className="dash-action-btn" onClick={onList}>
          <span className="dash-action-icon">📋</span>
          <span className="dash-action-label">Ver Reservas</span>
        </button>
        <button className="dash-action-btn dash-action-primary" onClick={onNewBooking}>
          <span className="dash-action-icon">✏️</span>
          <span className="dash-action-label">Nueva Reserva</span>
        </button>
        <button className="dash-action-btn" onClick={onImport}>
          <span className="dash-action-icon">📧</span>
          <span className="dash-action-label">Importar Email</span>
        </button>
        <button className="dash-action-btn" onClick={onGuides}>
          <span className="dash-action-icon">📚</span>
          <span className="dash-action-label">Gestionar Guías</span>
        </button>
      </div>

      {/* ── DOS COLUMNAS ── */}
      {!loading && (
        <div className="dash-cols">

          {/* Vencimientos próximos */}
          <div className="dash-card">
            <div className="dash-card-header">
              <span>⚠️</span>
              <span>Vencimientos próximos</span>
              <span className="dash-card-sub">30 días</span>
            </div>
            {vencimientos.length === 0 ? (
              <div className="dash-empty">✅ Sin vencimientos próximos</div>
            ) : (
              <div className="dash-table">
                {vencimientos.map((v, i) => (
                  <div
                    key={i}
                    className={`dash-row ${v.dias <= 3 ? 'dash-row-urgent' : v.dias <= 7 ? 'dash-row-warn' : ''}`}
                    onClick={() => onOpenBooking(v.id)}
                  >
                    <div className="dash-row-left">
                      <div className="dash-row-name">{v.titular}</div>
                      <div className="dash-row-detail">{v.icono} {v.tipo} · {money(v.saldo)} {v.moneda}</div>
                    </div>
                    <div className="dash-row-right">
                      <div className="dash-row-date">{formatDate(v.fecha)}</div>
                      <div className={`dash-row-dias ${v.dias <= 3 ? 'dias-urgent' : v.dias <= 7 ? 'dias-warn' : 'dias-ok'}`}>
                        {v.dias === 0 ? '¡Hoy!' : `${v.dias}d`}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Próximos viajes */}
          <div className="dash-card">
            <div className="dash-card-header">
              <span>✈️</span>
              <span>Próximos viajes</span>
              <span className="dash-card-sub">30 días</span>
            </div>
            {proximosViajes.length === 0 ? (
              <div className="dash-empty">Sin viajes en los próximos 30 días</div>
            ) : (
              <div className="dash-table">
                {proximosViajes.map(b => {
                  const dias = diasHasta(b.fechaViaje)
                  const pct  = b.total > 0 ? Math.min(100, Math.round((b.paid / b.total) * 100)) : 100
                  return (
                    <div key={b.id} className="dash-row" onClick={() => onOpenBooking(b.id)}>
                      <div className="dash-row-left">
                        <div className="dash-row-name">{b.titular}</div>
                        <div className="dash-row-detail">
                          {b.destinos.slice(0,2).join(' · ')}
                          <span className={`dash-row-estado ${b.estado}`}>
                            {b.estado === 'pagado' ? '✅' : b.estado === 'parcial' ? '🔄' : '⏳'}
                          </span>
                        </div>
                        <div className="dash-row-bar">
                          <div className="dash-row-bar-fill" style={{
                            width: `${pct}%`,
                            background: b.estado === 'pagado' ? '#16a34a' : b.estado === 'parcial' ? '#d97706' : '#dc2626'
                          }} />
                        </div>
                      </div>
                      <div className="dash-row-right">
                        <div className="dash-row-date">{formatDate(b.fechaViaje)}</div>
                        <div className={`dash-row-dias ${dias <= 7 ? 'dias-urgent' : dias <= 14 ? 'dias-warn' : 'dias-ok'}`}>
                          {dias === 0 ? '¡Hoy!' : `${dias}d`}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  )
}
