import { useState, useEffect } from 'react'

function formatDate(dateStr) {
  const [year, month, day] = dateStr.split('-')
  const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
  return `${parseInt(day)} ${months[parseInt(month)-1]} ${year}`
}

function nightsBetween(a, b) {
  return Math.round((new Date(b) - new Date(a)) / (1000*60*60*24))
}

function calcCountdown(dateStr) {
  if (!dateStr) return null
  const diff = new Date(dateStr + 'T00:00:00') - new Date()
  if (diff <= 0) return null
  return {
    days:    Math.floor(diff / (1000*60*60*24)),
    hours:   Math.floor((diff % (1000*60*60*24)) / (1000*60*60)),
    minutes: Math.floor((diff % (1000*60*60)) / (1000*60)),
    seconds: Math.floor((diff % (1000*60)) / 1000),
  }
}

// Derive trip start/end from items fechaInicio/fechaFin, fallback to hotel
function tripDates(items = [], hotel = {}) {
  const starts = items.map(i => i.fechaInicio).filter(Boolean).sort()
  const ends   = items.map(i => i.fechaFin).filter(Boolean).sort()
  return {
    checkIn:  starts[0]              || hotel?.checkIn  || '',
    checkOut: ends[ends.length - 1]  || hotel?.checkOut || '',
  }
}

function StatCard({ icon, value, label, iconClass, valueClass }) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${iconClass}`}>{icon}</div>
      <div className={`stat-value ${valueClass}`}>{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  )
}

function InfoRow({ label, value }) {
  return (
    <div className="info-row">
      <span className="info-label">{label}</span>
      <span className="info-value">{value}</span>
    </div>
  )
}

function calcEdad(fechaNac) {
  if (!fechaNac) return null
  const hoy = new Date()
  const nac = new Date(fechaNac)
  let edad = hoy.getFullYear() - nac.getFullYear()
  if (hoy < new Date(hoy.getFullYear(), nac.getMonth(), nac.getDate())) edad--
  return edad
}

function formatFechaNac(d) {
  if (!d) return '—'
  const [y, m, day] = d.split('-')
  const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
  return `${parseInt(day)} ${meses[parseInt(m)-1]} ${y}`
}

export default function Overview({ booking, onTabChange }) {
  const { hotel = {}, items = [], destinos, viajeros = [] } = booking
  const { checkIn, checkOut } = tripDates(items, hotel)

  const [cd, setCd] = useState(() => calcCountdown(checkIn))

  useEffect(() => {
    const t = setInterval(() => setCd(calcCountdown(checkIn)), 1000)
    return () => clearInterval(t)
  }, [checkIn])

  const pad    = n => String(n).padStart(2, '0')
  const nights = checkIn && checkOut ? nightsBetween(checkIn, checkOut) : null

  // Financial totals from items
  const byCur = {}
  for (const it of items) {
    if (!byCur[it.moneda]) byCur[it.moneda] = { total: 0, paid: 0 }
    byCur[it.moneda].total += it.total
    byCur[it.moneda].paid  += it.pagos.reduce((s, p) => s + Number(p.monto), 0)
  }
  const mainCur   = byCur['USD'] || Object.values(byCur)[0] || { total: 0, paid: 0 }
  const mainLabel = byCur['USD'] ? 'USD' : (Object.keys(byCur)[0] || 'USD')
  const pct = mainCur.total > 0 ? Math.round((mainCur.paid / mainCur.total) * 100) : 0

  return (
    <div className="fade-in">
      <div className="content-header">
        <div className="content-title">Resumen del Viaje ✨</div>
        <div className="content-subtitle">Todo lo que necesitás saber de tu aventura mágica</div>
      </div>

      {/* STATS */}
      <div className="stats-grid">
        <StatCard
          icon="✈️"
          value={cd ? cd.days : '🎉'}
          label={cd ? 'Días para viajar' : '¡Ya viajaste!'}
          iconClass="stat-icon-blue"
          valueClass="stat-value-blue"
        />
        <StatCard
          icon="🌙"
          value={nights ?? '–'}
          label="Noches de estadía"
          iconClass="stat-icon-purple"
          valueClass="stat-value-purple"
        />
        <StatCard
          icon="🎢"
          value={destinos.length}
          label="Parques incluidos"
          iconClass="stat-icon-pink"
          valueClass="stat-value-pink"
        />
        <StatCard
          icon="💰"
          value={`${pct}%`}
          label="Pago abonado"
          iconClass="stat-icon-green"
          valueClass="stat-value-green"
        />
      </div>

      {/* COUNTDOWN */}
      {cd && (
        <div className="countdown-hero">
          <div className="countdown-hero-label">Tu aventura comienza en</div>
          <div className="countdown-grid">
            {[['days','Días'],['hours','Horas'],['minutes','Min'],['seconds','Seg']].map(([k,u]) => (
              <div key={k} className="countdown-item">
                <div className="countdown-num">{pad(cd[k])}</div>
                <div className="countdown-unit">{u}</div>
              </div>
            ))}
          </div>
          {checkIn && checkOut && (
            <div className="countdown-dates">
              <div className="date-pill">🛬 {formatDate(checkIn)}</div>
              <div className="date-pill">🛫 {formatDate(checkOut)}</div>
            </div>
          )}
        </div>
      )}

      {/* PAGOS CARD */}
      <div className="grid-2">
        {/* Fechas del viaje */}
        {(checkIn || checkOut) && (
          <div className="card">
            <div className="card-header">
              <div className="card-header-icon">📅</div>
              <span className="card-header-title">Fechas del Viaje</span>
            </div>
            <div className="card-body">
              {checkIn  && <InfoRow label="Salida"  value={formatDate(checkIn)} />}
              {checkOut && <InfoRow label="Regreso" value={formatDate(checkOut)} />}
              {nights && <InfoRow label="Duración" value={`${nights} noches`} />}
              {destinos.map(d => (
                <InfoRow key={d} label="Destino" value={d} />
              ))}
            </div>
          </div>
        )}

        <div className="card" style={{ cursor:'pointer' }} onClick={() => onTabChange('pagos')}>
          <div className="card-header">
            <div className="card-header-icon">💳</div>
            <span className="card-header-title">Estado de Pago</span>
          </div>
          <div className="card-body">
            <div style={{ textAlign:'center', padding:'8px 0 12px' }}>
              <div style={{ fontSize:28, fontWeight:900, color:'var(--purple)' }}>
                ${mainCur.total.toLocaleString('es-AR')} {mainLabel}
              </div>
              <div style={{ fontSize:11, fontWeight:700, color:'var(--text-light)', textTransform:'uppercase', marginTop:2 }}>
                Total del viaje
              </div>
            </div>
            <div className="progress-bar-wrap">
              <div className="progress-bar-fill" style={{ width:`${pct}%` }} />
            </div>
            <div className="progress-labels">
              <span className="progress-paid">${mainCur.paid.toLocaleString('es-AR')} abonados</span>
              <span className="progress-pct">{pct}%</span>
            </div>
            <div style={{ marginTop:10, fontSize:12, fontWeight:600, color:'var(--purple)', textAlign:'center' }}>
              Ver detalle →
            </div>
          </div>
        </div>
      </div>

      {/* VIAJEROS */}
      {viajeros.length > 0 && (
        <div className="card">
          <div className="card-header">
            <div className="card-header-icon">👥</div>
            <span className="card-header-title">Viajeros</span>
          </div>
          <div className="card-body">
            {viajeros.map((v, i) => {
              const edad = calcEdad(v.fechaNac)
              return (
                <div key={v.id || i} className="ov-viajero-row">
                  <div className="ov-viajero-avatar">
                    {v.nombre?.[0]}{v.apellido?.[0]}
                  </div>
                  <div className="ov-viajero-info">
                    <div className="ov-viajero-nombre">{v.nombre} {v.apellido}</div>
                    <div className="ov-viajero-meta">
                      {v.fechaNac && <span>🎂 {formatFechaNac(v.fechaNac)}{edad !== null ? ` (${edad} años)` : ''}</span>}
                      {v.nroDoc   && <span>🪪 {v.tipoDoc || 'DNI'} {v.nroDoc}</span>}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ITEMS CONTRATADOS */}
      {items.length > 0 && (
        <div className="card grid-1">
          <div className="card-header">
            <div className="card-header-icon">🎒</div>
            <span className="card-header-title">Ítems Contratados</span>
          </div>
          <div className="card-body">
            {items.map(it => {
              const paid  = it.pagos.reduce((s, p) => s + Number(p.monto), 0)
              const saldo = it.total - paid
              const p     = it.total > 0 ? Math.min(100, Math.round((paid / it.total) * 100)) : 0
              return (
                <div key={it.id} className="overview-item-row">
                  <span className="overview-item-icon">{it.icono}</span>
                  <div className="overview-item-info">
                    <span className="overview-item-tipo">{it.tipo}</span>
                    <div className="overview-item-bar-wrap">
                      <div className="overview-item-bar-fill" style={{ width:`${p}%` }} />
                    </div>
                  </div>
                  <div className="overview-item-amounts">
                    <span className="overview-item-total">${it.total.toLocaleString('es-AR')} {it.moneda}</span>
                    {saldo > 0 && (
                      <span className="overview-item-saldo">-${saldo.toLocaleString('es-AR')}</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
