import { useState, useCallback } from 'react'
import AdminLogin from './AdminLogin'
import BookingForm from './BookingForm'

function emptyBooking(id = '') {
  return {
    id,
    titular: '',
    destinos: ['Disney World'],
    items: [],
    promos: [],
    regalos: [],
    tips: [],
    itinerario: [],
  }
}

export default function AdminApp() {
  const [authed,     setAuthed]     = useState(() => sessionStorage.getItem('mm_admin') === '1')
  const [bookingId,  setBookingId]  = useState('')
  const [inputId,    setInputId]    = useState('')
  const [booking,    setBooking]    = useState(null)
  const [saveStatus, setSaveStatus] = useState('idle') // idle | saving | ok | error

  const handleLogin = useCallback(() => {
    sessionStorage.setItem('mm_admin', '1')
    setAuthed(true)
  }, [])

  const handleLogout = () => {
    sessionStorage.removeItem('mm_admin')
    setAuthed(false)
    setBooking(null)
  }

  const loadBooking = async () => {
    const id = inputId.trim().toLowerCase().replace(/\s+/g, '-')
    if (!id) return
    try {
      const r = await fetch(`/bookings/${id}.json?t=${Date.now()}`)
      if (r.ok) { setBooking(await r.json()) }
      else       { setBooking(emptyBooking(id)) }
      setBookingId(id)
    } catch {
      setBooking(emptyBooking(id))
      setBookingId(id)
    }
  }

  const newBooking = () => {
    const id = inputId.trim().toLowerCase().replace(/\s+/g, '-') || 'nuevo-viajero'
    setBooking(emptyBooking(id))
    setBookingId(id)
  }

  const saveBooking = async (data) => {
    setSaveStatus('saving')
    try {
      const r = await fetch('/api/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: bookingId, data: { ...data, id: bookingId } }),
      })
      if (r.ok) {
        setSaveStatus('ok')
        setTimeout(() => setSaveStatus('idle'), 3000)
      } else throw new Error()
    } catch {
      setSaveStatus('error')
      setTimeout(() => setSaveStatus('idle'), 3000)
    }
  }

  if (!authed) return <AdminLogin onLogin={handleLogin} />

  return (
    <div className="admin-shell">
      {/* TOP BAR */}
      <header className="admin-topbar">
        <div className="admin-topbar-brand">
          <img src="/logo.png" alt="Mama Mouse" className="admin-topbar-logo" />
          <div>
            <div className="admin-topbar-name">MAMA MOUSE</div>
            <div className="admin-topbar-sub">Panel de Administración</div>
          </div>
        </div>
        <div className="admin-topbar-right">
          {bookingId && (
            <a
              href={`/?id=${bookingId}`}
              target="_blank"
              rel="noreferrer"
              className="admin-btn admin-btn-ghost"
            >
              👁 Ver como viajero
            </a>
          )}
          <button className="admin-btn admin-btn-ghost" onClick={handleLogout}>
            Salir
          </button>
        </div>
      </header>

      <div className="admin-content">
        {/* BOOKING SELECTOR */}
        {!booking ? (
          <div className="admin-selector">
            <div className="admin-selector-card">
              <h2 className="admin-selector-title">¿Qué reserva querés gestionar?</h2>
              <p className="admin-selector-sub">Ingresá el ID del viajero (ej: familia-garcia)</p>
              <div className="admin-selector-row">
                <input
                  className="admin-input"
                  placeholder="ID del viajero"
                  value={inputId}
                  onChange={e => setInputId(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && loadBooking()}
                />
                <button className="admin-btn admin-btn-primary" onClick={loadBooking}>
                  Cargar
                </button>
                <button className="admin-btn admin-btn-secondary" onClick={newBooking}>
                  + Nueva reserva
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* BOOKING HEADER */}
            <div className="admin-booking-header">
              <div>
                <div className="admin-booking-id">Reserva: <strong>{bookingId}</strong></div>
                <div className="admin-booking-link">
                  Link del viajero: <code>/?id={bookingId}</code>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {saveStatus === 'ok'    && <span className="save-badge save-ok">✅ Guardado</span>}
                {saveStatus === 'error' && <span className="save-badge save-err">❌ Error al guardar</span>}
                {saveStatus === 'saving'&& <span className="save-badge">⏳ Guardando...</span>}
                <button
                  className="admin-btn admin-btn-ghost"
                  onClick={() => { setBooking(null); setBookingId(''); setInputId('') }}
                >
                  ← Cambiar reserva
                </button>
              </div>
            </div>

            <BookingForm
              initialData={booking}
              onSave={saveBooking}
              saving={saveStatus === 'saving'}
            />
          </>
        )}
      </div>
    </div>
  )
}
