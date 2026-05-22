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
    <div className="splash">
      <img src="/logo2.jpeg" alt="Mama Mouse" className="splash-logo" />
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
