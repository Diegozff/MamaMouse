import { useState, useEffect } from 'react'

function formatDate(dateStr) {
  const [year, month, day] = dateStr.split('-')
  const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
  return `${parseInt(day)} ${months[parseInt(month) - 1]} ${year}`
}

function calcCountdown(checkIn) {
  const now = new Date()
  const target = new Date(checkIn + 'T00:00:00')
  const diff = target - now

  if (diff <= 0) return null

  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((diff % (1000 * 60)) / 1000)
  return { days, hours, minutes, seconds }
}

export default function HeroCard({ checkIn, checkOut, destinos }) {
  const [countdown, setCountdown] = useState(() => calcCountdown(checkIn))

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(calcCountdown(checkIn))
    }, 1000)
    return () => clearInterval(interval)
  }, [checkIn])

  const pad = n => String(n).padStart(2, '0')
  const alreadyTraveling = !countdown

  return (
    <div className="hero-card">
      <div className="hero-destinos">
        {destinos.map(d => (
          <span key={d} className="destino-chip">{d}</span>
        ))}
      </div>

      {alreadyTraveling ? (
        <div className="hero-viajo-label">🎉 ¡Ya estás de viaje!</div>
      ) : (
        <>
          <div className="countdown-label">Tu aventura comienza en</div>
          <div className="countdown-grid">
            <div className="countdown-item">
              <div className="countdown-num">{pad(countdown.days)}</div>
              <div className="countdown-unit">Días</div>
            </div>
            <div className="countdown-item">
              <div className="countdown-num">{pad(countdown.hours)}</div>
              <div className="countdown-unit">Horas</div>
            </div>
            <div className="countdown-item">
              <div className="countdown-num">{pad(countdown.minutes)}</div>
              <div className="countdown-unit">Min</div>
            </div>
            <div className="countdown-item">
              <div className="countdown-num">{pad(countdown.seconds)}</div>
              <div className="countdown-unit">Seg</div>
            </div>
          </div>
        </>
      )}

      <div className="hero-dates">
        <div className="date-pill">
          <span>🛬</span> {formatDate(checkIn)}
        </div>
        <div className="date-pill">
          <span>🛫</span> {formatDate(checkOut)}
        </div>
      </div>
    </div>
  )
}
