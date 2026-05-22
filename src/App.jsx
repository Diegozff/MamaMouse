import { useState, useEffect, useRef, useCallback } from 'react'
import AdminApp from './admin/AdminApp'
import TopBar from './components/TopBar'
import Sidebar from './components/Sidebar'
import BottomTabs from './components/BottomTabs'
import Overview from './components/Overview'
import PaymentStatus from './components/PaymentStatus'
import Itinerary from './components/Itinerary'
import GuidesLibrary from './components/GuidesLibrary'
import Benefits from './components/Benefits'
import SplashScreen from './components/SplashScreen'
import WelcomePage from './components/WelcomePage'

function getEstado(items = []) {
  let total = 0, paid = 0
  for (const it of items) {
    total += it.total
    paid  += it.pagos.reduce((s, p) => s + Number(p.monto), 0)
  }
  const saldo = total - paid
  if (saldo <= 0) return { label: '✅ Totalmente Pagado', cls: 'estado-total' }
  if (paid === 0)  return { label: '⏳ Pendiente de Pago', cls: 'estado-pendiente' }
  return { label: '🔄 Pago Parcial', cls: 'estado-parcial' }
}

const params  = new URLSearchParams(window.location.search)
const isAdmin = params.has('admin')
const urlId   = params.get('id')

/* ── Componente principal ─────────────────────────────────────────────── */
export default function App() {
  if (isAdmin) return <AdminApp />
  if (!urlId)  return <WelcomeFlow />
  return <BookingView id={urlId} />
}

/* ── WelcomeFlow: logo2 fijo como página de inicio ───────────────────── */
function WelcomeFlow() {
  return (
    <div className="welcome-home">
      <img src="/logo2.jpeg" alt="Mama Mouse" className="welcome-home-logo" />
      <div className="welcome-home-contact">
        <a
          href="https://wa.me/5493412143631"
          target="_blank"
          rel="noreferrer"
          className="welcome-home-btn welcome-home-wa"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.118 1.528 5.85L.057 23.998l6.304-1.654A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.894a9.879 9.879 0 01-5.031-1.378l-.361-.214-3.741.981.998-3.648-.235-.374A9.855 9.855 0 012.106 12C2.106 6.58 6.58 2.106 12 2.106S21.894 6.58 21.894 12 17.42 21.894 12 21.894z"/></svg>
          +54 9 341 2-143631
        </a>
        <a
          href="https://instagram.com/mamamouse12"
          target="_blank"
          rel="noreferrer"
          className="welcome-home-btn welcome-home-ig"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
          @mamamouse12
        </a>
      </div>
    </div>
  )
}

/* ── Vista de reserva (solo se monta cuando hay ?id) ──────────────────── */
function BookingView({ id }) {
  const [booking,    setBooking]    = useState(null)
  const [status,     setStatus]     = useState('loading')
  const [tab,        setTab]        = useState('overview')
  const [showSplash, setShowSplash] = useState(true)
  const contentRef = useRef(null)

  const handleSplashDone = useCallback(() => setShowSplash(false), [])

  useEffect(() => {
    if (contentRef.current) contentRef.current.scrollTop = 0
  }, [tab])

  useEffect(() => {
    fetch(`/bookings/${id}.json`)
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(d  => { setBooking(d); setStatus('ok') })
      .catch(() => setStatus('error'))
  }, [id])

  if (showSplash) return <SplashScreen onDone={handleSplashDone} />

  if (status === 'loading') return <div className="loading"><div className="loading-spinner"/></div>
  if (status === 'error') return (
    <div className="not-found">
      <div className="not-found-icon">🧭</div>
      <h2>Reserva no encontrada</h2>
      <p>El link de tu viaje no es válido.<br/>Contactá a Mama Mouse para obtener tu link correcto.</p>
    </div>
  )

  const estado = getEstado(booking.items)

  return (
    <div className="dashboard">
      <TopBar titular={booking.titular} destinos={booking.destinos} estado={estado} />
      <div className="dashboard-body">
        <Sidebar activeTab={tab} onTabChange={setTab} />
        <main className="content-area" ref={contentRef}>
          {tab === 'overview'   && <Overview   booking={booking} onTabChange={setTab} />}
          {tab === 'pagos'      && <PaymentStatus items={booking.items} />}
          {tab === 'itinerario' && <Itinerary  itinerario={booking.itinerario} />}
          {tab === 'guias'      && <GuidesLibrary />}
          {tab === 'beneficios' && <Benefits   booking={booking} />}
        </main>
      </div>
      <BottomTabs activeTab={tab} onTabChange={setTab} />
    </div>
  )
}
