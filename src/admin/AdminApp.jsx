import { useState, useCallback, useRef, useEffect } from 'react'
import AdminLogin      from './AdminLogin'
import BookingForm     from './BookingForm'
import ImportBooking   from './ImportBooking'
import BookingsList    from './BookingsList'

// ── WhatsApp helpers ──────────────────────────────────────────────────────────
function formatWAPhone(phone) {
  if (!phone) return ''
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('54')) return digits
  if (digits.startsWith('0'))  return '54' + digits.slice(1)
  return '54' + digits
}

function money(n, cur = 'USD') {
  return `$${Number(n).toLocaleString('es-AR')} ${cur}`
}

function buildWAMessage(type, booking, bookingId) {
  const url   = `${window.location.origin}/?id=${bookingId}`
  const nom   = booking.titular || ''
  const dests = (booking.destinos || []).join(', ')

  let totalViaje = 0, totalPagado = 0
  for (const it of (booking.items || [])) {
    totalViaje  += Number(it.total) || 0
    totalPagado += (it.pagos || []).reduce((s, p) => s + Number(p.monto), 0)
  }
  const saldo = totalViaje - totalPagado
  const pct   = totalViaje > 0 ? Math.round((totalPagado / totalViaje) * 100) : 0

  const itemsList = (booking.items || []).map(it => {
    const paid  = (it.pagos || []).reduce((s, p) => s + Number(p.monto), 0)
    const sal   = it.total - paid
    return `${it.icono} *${it.tipo}*: ${money(it.total, it.moneda)}${sal > 0 ? ` _(saldo: ${money(sal, it.moneda)})_` : ' ✅'}`
  }).join('\n')

  if (type === 'bienvenida') return `🐭 *¡Bienvenidos a Mama Mouse!*
Hola *${nom}* 🎉

Tu reserva de viaje está confirmada. ¡Prepárate para la aventura!

🌍 *Destinos:* ${dests}

📋 *Ítems contratados:*
${itemsList}

👉 Ver todos los detalles de tu viaje:
${url}

¿Tenés alguna consulta? ¡Escribinos! 💛`

  if (type === 'actualizacion') return `📝 *Reserva actualizada*
🐭 *Mama Mouse*

Hola *${nom}* 👋

Actualizamos los datos de tu reserva.

👉 Revisá los cambios aquí:
${url}

¿Tenés alguna duda? ¡Escribinos! 💛`

  if (type === 'resumen') return `💳 *Resumen de pagos*
🐭 *Mama Mouse*

Hola *${nom}* 👋

📊 *Estado de tu viaje: ${pct}% pagado*
✅ Abonado: ${money(totalPagado, 'USD')}
${saldo > 0 ? `💳 Saldo restante: ${money(saldo, 'USD')}` : '🎉 ¡Viaje totalmente pagado!'}

📋 *Detalle:*
${itemsList}

👉 Ver tu reserva completa:
${url}`

  return ''
}

function openWhatsApp(phone, message) {
  const num = formatWAPhone(phone)
  if (!num) return
  const url = `https://wa.me/${num}?text=${encodeURIComponent(message)}`
  window.open(url, '_blank')
}

const NAV_SECTIONS = [
  { id: 'sec-general',    icon: '👤', label: 'General'    },
  { id: 'sec-viajeros',   icon: '👥', label: 'Viajeros'   },
  { id: 'sec-items',      icon: '💳', label: 'Ítems'      },
  { id: 'sec-beneficios', icon: '🎁', label: 'Beneficios' },
  { id: 'sec-vouchers',   icon: '📄', label: 'Bauchers'   },
]

function emptyBooking(id = '') {
  return {
    id,
    titular: '',
    destinos: ['Disney World'],
    items: [],
    promos: [],
    regalos: [],
    tips: [],
    viajeros: [],
    itinerario: [],
    vouchers: [],
  }
}

export default function AdminApp() {
  const [authed,      setAuthed]      = useState(() => sessionStorage.getItem('mm_admin') === '1')
  const [bookingId,   setBookingId]   = useState('')
  const [inputId,     setInputId]     = useState('')
  const [booking,     setBooking]     = useState(null)
  const [saveStatus,  setSaveStatus]  = useState('idle')
  const [activeNav,   setActiveNav]   = useState('sec-general')
  const [notifStatus, setNotifStatus] = useState('idle') // idle | sending | ok | error | no_contact
  const [copyStatus,  setCopyStatus]  = useState('idle') // idle | copied
  const [showImport,  setShowImport]  = useState(false)
  const [showList,    setShowList]    = useState(false)

  const mainRef = useRef(null)

  const handleLogin = useCallback(() => {
    sessionStorage.setItem('mm_admin', '1')
    setAuthed(true)
  }, [])

  const handleLogout = () => {
    sessionStorage.removeItem('mm_admin')
    setAuthed(false)
    setBooking(null)
  }

  const handleBack = () => {
    setBooking(null)
    setBookingId('')
    setInputId('')
    setActiveNav('sec-general')
  }

  const loadBooking = async () => {
    const id = inputId.trim().toLowerCase().replace(/\s+/g, '-')
    if (!id) return
    try {
      const r = await fetch(`/bookings/${id}.json?t=${Date.now()}`)
      setBooking(r.ok ? await r.json() : emptyBooking(id))
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

  const handleImported = (id, data) => {
    setShowImport(false)
    setBooking(data)
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
      if (r.ok) { setSaveStatus('ok'); setTimeout(() => setSaveStatus('idle'), 3000) }
      else throw new Error()
    } catch {
      setSaveStatus('error')
      setTimeout(() => setSaveStatus('idle'), 3000)
    }
  }

  const deleteBooking = async () => {
    if (!window.confirm(`¿Eliminar la reserva "${bookingId}"?\n\nEsta acción no se puede deshacer.`)) return
    try {
      const r = await fetch(`/api/booking/${encodeURIComponent(bookingId)}`, { method: 'DELETE' })
      if (r.ok) { handleBack() }
      else { const d = await r.json(); alert('Error: ' + d.error) }
    } catch (e) { alert('Error al eliminar: ' + e.message) }
  }

  // Enviar notificación manual
  const sendNotification = async (currentBooking, type = 'summary') => {
    if (!currentBooking?.email && !currentBooking?.telefono) {
      setNotifStatus('no_contact')
      setTimeout(() => setNotifStatus('idle'), 4000)
      return
    }
    setNotifStatus('sending')
    try {
      const endpoint = type === 'update' ? '/api/notify/update' : '/api/notify/summary'
      const r = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ booking: { ...currentBooking, id: bookingId } }),
      })
      if (r.ok) { setNotifStatus('ok'); setTimeout(() => setNotifStatus('idle'), 4000) }
      else throw new Error()
    } catch {
      setNotifStatus('error')
      setTimeout(() => setNotifStatus('idle'), 4000)
    }
  }

  const copyLink = () => {
    const base = process.env.APP_URL || window.location.origin
    const link = `${window.location.origin}/?id=${bookingId}`
    navigator.clipboard.writeText(link).then(() => {
      setCopyStatus('copied')
      setTimeout(() => setCopyStatus('idle'), 2500)
    })
  }

  // Scroll-to-section using the admin-main scroll container
  const scrollToSection = (id) => {
    const el      = document.getElementById(id)
    const container = mainRef.current
    if (!el || !container) return
    const top = el.offsetTop - 16
    container.scrollTo({ top, behavior: 'smooth' })
  }

  // Track active section via IntersectionObserver on scroll container
  useEffect(() => {
    if (!booking || !mainRef.current) return
    const container = mainRef.current
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter(e => e.isIntersecting)
        if (visible.length) setActiveNav(visible[0].target.id)
      },
      { root: container, rootMargin: '-10% 0px -60% 0px', threshold: 0 }
    )
    NAV_SECTIONS.forEach(s => {
      const el = document.getElementById(s.id)
      if (el) obs.observe(el)
    })
    return () => obs.disconnect()
  }, [booking])

  if (!authed) return <AdminLogin onLogin={handleLogin} />

  /* ── SELECTOR (no booking loaded) ── */
  if (!booking) {
    return (
      <div className="admin-shell">
        <header className="admin-topbar">
          <div className="admin-topbar-brand">
            <img src="/logo.png" alt="Mama Mouse" className="admin-topbar-logo" />
            <div>
              <div className="admin-topbar-name">MAMA MOUSE</div>
              <div className="admin-topbar-sub">Panel de Administración</div>
            </div>
          </div>
          <div className="admin-topbar-right">
            <button className="admin-btn admin-btn-ghost" onClick={handleLogout}>Salir</button>
          </div>
        </header>
        <div className="admin-content">
          {showList ? (
            <div className="admin-list-view">
              <div className="admin-list-topbar">
                <button className="admin-btn admin-btn-ghost" onClick={() => setShowList(false)}>
                  ← Volver
                </button>
                <button className="admin-btn admin-btn-primary" onClick={newBooking}>
                  + Nueva reserva
                </button>
                <button className="admin-btn admin-btn-secondary" onClick={() => { setShowList(false); setShowImport(true) }}>
                  📧 Importar por Email
                </button>
              </div>
              <BookingsList onOpen={id => { setShowList(false); setInputId(id); setTimeout(() => { setInputId(id); loadBooking() }, 0); fetch(`/bookings/${id}.json?t=${Date.now()}`).then(r => r.json()).then(d => { setBooking(d); setBookingId(id) }) }} />
            </div>
          ) : (
            <div className="admin-home">
              <div className="admin-home-hero">
                <img src="/logo.png" alt="Mama Mouse" className="admin-home-logo" />
                <h1 className="admin-home-title">Panel de Administración</h1>
                <p className="admin-home-sub">Bienvenida, Carolina ✨</p>
              </div>

              {/* Buscador */}
              <div className="admin-home-search-card">
                <div className="admin-home-search-label">Buscar reserva por ID</div>
                <div className="admin-selector-row">
                  <input
                    className="admin-input"
                    placeholder="Ej: beltrando, garcia…"
                    value={inputId}
                    onChange={e => setInputId(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && loadBooking()}
                    autoFocus
                  />
                  <button className="admin-btn admin-btn-primary" onClick={loadBooking}>Buscar</button>
                </div>
              </div>

              {/* Acciones */}
              <div className="admin-home-actions">
                <button className="admin-home-action-btn" onClick={() => setShowList(true)}>
                  <span className="admin-home-action-icon">📋</span>
                  <span className="admin-home-action-label">Ver Reservas</span>
                </button>
                <button className="admin-home-action-btn" onClick={() => setShowImport(true)}>
                  <span className="admin-home-action-icon">📧</span>
                  <span className="admin-home-action-label">Importar Email</span>
                </button>
                <button className="admin-home-action-btn" onClick={newBooking}>
                  <span className="admin-home-action-icon">✏️</span>
                  <span className="admin-home-action-label">Nueva Reserva</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {showImport && (
          <ImportBooking
            onImported={handleImported}
            onCancel={() => setShowImport(false)}
          />
        )}
      </div>
    )
  }

  /* ── EDITOR (booking loaded) ── */
  return (
    <div className="admin-shell admin-shell-editor">
      {/* STICKY TOPBAR */}
      <header className="admin-topbar admin-topbar-sticky">
        <div className="admin-topbar-brand">
          <img src="/logo.png" alt="Mama Mouse" className="admin-topbar-logo" />
          <div>
            <div className="admin-topbar-name">MAMA MOUSE</div>
            <div className="admin-topbar-sub">Panel de Administración</div>
          </div>
        </div>
        <div className="admin-topbar-center">
          <span className="admin-topbar-booking-id">Reserva: <strong>{bookingId}</strong></span>
          <code className="admin-topbar-link">/?id={bookingId}</code>
        </div>
        <div className="admin-topbar-right">
          {saveStatus === 'ok'    && <span className="save-badge save-ok">✅ Guardado</span>}
          {saveStatus === 'error' && <span className="save-badge save-err">❌ Error</span>}
          {saveStatus === 'saving'&& <span className="save-badge">⏳ Guardando…</span>}
          <a href={`/?id=${bookingId}`} target="_blank" rel="noreferrer"
             className="admin-btn admin-btn-ghost">
            👁 Ver viajero
          </a>
          <button className="admin-btn admin-btn-ghost" onClick={handleLogout}>Salir</button>
        </div>
      </header>

      {/* BODY: sidebar + main */}
      <div className="admin-body">

        {/* ── SIDEBAR ── */}
        <aside className="admin-sidebar">
          {/* booking info */}
          <div className="asb-booking-card">
            <div className="asb-booking-label">Reserva activa</div>
            <div className="asb-booking-id">{bookingId}</div>
          </div>

          {/* section nav */}
          <nav className="asb-nav">
            <div className="asb-nav-title">Secciones</div>
            {NAV_SECTIONS.map(s => (
              <button
                key={s.id}
                className={`asb-nav-btn ${activeNav === s.id ? 'asb-nav-active' : ''}`}
                onClick={() => scrollToSection(s.id)}
              >
                <span className="asb-nav-icon">{s.icon}</span>
                <span className="asb-nav-label">{s.label}</span>
                {activeNav === s.id && <span className="asb-nav-dot" />}
              </button>
            ))}
          </nav>

          {/* link de la reserva */}
          <div className="asb-notify-section">
            <div className="asb-nav-title">Link del viajero</div>
            <button
              className="asb-notify-btn"
              onClick={copyLink}
            >
              <span>{copyStatus === 'copied' ? '✅' : '🔗'}</span>
              <span>{copyStatus === 'copied' ? '¡Link copiado!' : 'Copiar link'}</span>
            </button>
            <div className="asb-notif-hint">
              Enviá este link a la familia para que vean su reserva.
            </div>
          </div>

          {/* notifications */}
          <div className="asb-notify-section">
            <div className="asb-nav-title">Notificaciones</div>

            <button
              className={`asb-notify-btn ${notifStatus === 'sending' ? 'sending' : ''}`}
              onClick={() => sendNotification(booking, 'summary')}
              disabled={notifStatus === 'sending'}
              title={!booking?.email && !booking?.telefono ? 'Agregá email o teléfono en la sección General' : ''}
            >
              <span>📣</span>
              <span>{notifStatus === 'sending' ? 'Enviando…' : 'Enviar bienvenida'}</span>
            </button>

            <button
              className={`asb-notify-btn ${notifStatus === 'sending' ? 'sending' : ''}`}
              onClick={() => sendNotification(booking, 'update')}
              disabled={notifStatus === 'sending'}
              title={!booking?.email && !booking?.telefono ? 'Agregá email o teléfono en la sección General' : ''}
              style={{ marginTop: 6 }}
            >
              <span>📝</span>
              <span>{notifStatus === 'sending' ? 'Enviando…' : 'Notificar actualización'}</span>
            </button>

            {/* status feedback */}
            {notifStatus === 'ok' && (
              <div className="asb-notif-badge asb-notif-ok">✅ Notificación enviada</div>
            )}
            {notifStatus === 'error' && (
              <div className="asb-notif-badge asb-notif-err">❌ Error al enviar</div>
            )}
            {notifStatus === 'no_contact' && (
              <div className="asb-notif-badge asb-notif-warn">⚠️ Sin email ni teléfono</div>
            )}

            <div className="asb-notif-hint">
              Los pagos nuevos se notifican automáticamente al guardar.
            </div>
          </div>

          {/* WhatsApp rápido */}
          {booking?.telefono && (
            <div className="asb-notify-section">
              <div className="asb-nav-title">WhatsApp rápido</div>
              <button className="asb-notify-btn asb-wa-btn"
                onClick={() => openWhatsApp(booking.telefono, buildWAMessage('bienvenida', booking, bookingId))}>
                <span>💬</span><span>Enviar bienvenida</span>
              </button>
              <button className="asb-notify-btn asb-wa-btn"
                onClick={() => openWhatsApp(booking.telefono, buildWAMessage('actualizacion', booking, bookingId))}
                style={{ marginTop: 6 }}>
                <span>💬</span><span>Notificar actualización</span>
              </button>
              <button className="asb-notify-btn asb-wa-btn"
                onClick={() => openWhatsApp(booking.telefono, buildWAMessage('resumen', booking, bookingId))}
                style={{ marginTop: 6 }}>
                <span>💬</span><span>Resumen de pagos</span>
              </button>
              <div className="asb-notif-hint">
                Abre WhatsApp Web con el mensaje listo para enviar.
              </div>
            </div>
          )}

          {/* footer actions */}
          <div className="asb-footer">
            <button
              className="admin-btn admin-btn-ghost asb-footer-btn"
              onClick={handleBack}
            >
              ← Cambiar reserva
            </button>
            <button
              className="asb-delete-btn"
              onClick={deleteBooking}
              title="Eliminar esta reserva permanentemente"
            >
              🗑 Eliminar reserva
            </button>
          </div>
        </aside>

        {/* ── MAIN CONTENT ── */}
        <main className="admin-main" ref={mainRef}>
          <BookingForm
            initialData={booking}
            onSave={saveBooking}
            saving={saveStatus === 'saving'}
            onNotify={sendNotification}
          />
        </main>

      </div>
    </div>
  )
}
