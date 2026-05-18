import { useState, useEffect } from 'react'

function formatDate(dateStr) {
  const [year, month, day] = dateStr.split('-')
  const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
  return `${parseInt(day)} ${months[parseInt(month)-1]} ${year}`
}

function nightsBetween(a, b) {
  return Math.round((new Date(b) - new Date(a)) / (1000*60*60*24))
}

function calcCountdown(checkIn) {
  const diff = new Date(checkIn + 'T00:00:00') - new Date()
  if (diff <= 0) return null
  return {
    days:    Math.floor(diff / (1000*60*60*24)),
    hours:   Math.floor((diff % (1000*60*60*24)) / (1000*60*60)),
    minutes: Math.floor((diff % (1000*60*60)) / (1000*60)),
    seconds: Math.floor((diff % (1000*60)) / 1000),
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

export default function Overview({ booking, onTabChange }) {
  const { hotel, tickets, financiero, destinos } = booking
  const [cd, setCd] = useState(() => calcCountdown(hotel.checkIn))

  useEffect(() => {
    const t = setInterval(() => setCd(calcCountdown(hotel.checkIn)), 1000)
    return () => clearInterval(t)
  }, [hotel.checkIn])

  const pad = n => String(n).padStart(2, '0')
  const nights = nightsBetween(hotel.checkIn, hotel.checkOut)
  const totalPaid = financiero.pagos.reduce((s, p) => s + p.monto, 0)
  const pct = Math.round((totalPaid / financiero.total) * 100)

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
          value={nights}
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
          <div className="countdown-dates">
            <div className="date-pill">🛬 {formatDate(hotel.checkIn)}</div>
            <div className="date-pill">🛫 {formatDate(hotel.checkOut)}</div>
          </div>
        </div>
      )}

      {/* HOTEL + PAGOS side by side */}
      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <div className="card-header-icon">🏨</div>
            <span className="card-header-title">Hospedaje</span>
          </div>
          <div className="card-body">
            <InfoRow label="Hotel"       value={hotel.nombre} />
            <InfoRow label="Habitación"  value={hotel.habitacion} />
            <InfoRow label="Check-In"    value={formatDate(hotel.checkIn)} />
            <InfoRow label="Check-Out"   value={formatDate(hotel.checkOut)} />
          </div>
        </div>

        <div className="card" style={{ cursor: 'pointer' }} onClick={() => onTabChange('pagos')}>
          <div className="card-header">
            <div className="card-header-icon">💳</div>
            <span className="card-header-title">Estado de Pago</span>
          </div>
          <div className="card-body">
            <div style={{ textAlign:'center', padding:'8px 0 12px' }}>
              <div style={{ fontSize:28, fontWeight:900, color:'var(--purple)' }}>
                ${financiero.total.toLocaleString('es-AR')} {financiero.moneda}
              </div>
              <div style={{ fontSize:11, fontWeight:700, color:'var(--text-light)', textTransform:'uppercase', marginTop:2 }}>
                Total del paquete
              </div>
            </div>
            <div className="progress-bar-wrap">
              <div className="progress-bar-fill" style={{ width:`${pct}%` }} />
            </div>
            <div className="progress-labels">
              <span className="progress-paid">${totalPaid.toLocaleString('es-AR')} abonados</span>
              <span className="progress-pct">{pct}%</span>
            </div>
            <div style={{ marginTop:10, fontSize:12, fontWeight:600, color:'var(--purple)', textAlign:'center' }}>
              Ver detalle →
            </div>
          </div>
        </div>
      </div>

      {/* TICKETS */}
      <div className="card grid-1">
        <div className="card-header">
          <div className="card-header-icon">🎟️</div>
          <span className="card-header-title">Tickets y Experiencias</span>
        </div>
        <div className="card-body">
          {tickets.disney   && <InfoRow label="Disney"   value={tickets.disney} />}
          {tickets.universal && <InfoRow label="Universal" value={tickets.universal} />}
        </div>
      </div>
    </div>
  )
}
