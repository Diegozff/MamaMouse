import { useState, useEffect, useRef } from 'react'
import TopBar from './components/TopBar'
import Sidebar from './components/Sidebar'
import BottomTabs from './components/BottomTabs'
import Overview from './components/Overview'
import PaymentStatus from './components/PaymentStatus'
import Itinerary from './components/Itinerary'
import TravelGuide from './components/TravelGuide'
import Benefits from './components/Benefits'
import { TABS } from './tabs'

function getEstado(financiero) {
  const paid = financiero.pagos.reduce((s, p) => s + p.monto, 0)
  const saldo = financiero.total - paid
  if (saldo <= 0) return { label: '✅ Totalmente Pagado', cls: 'estado-total' }
  if (paid === 0)  return { label: '⏳ Pendiente de Pago', cls: 'estado-pendiente' }
  return { label: '🔄 Pago Parcial', cls: 'estado-parcial' }
}

export default function App() {
  const [booking, setBooking] = useState(null)
  const [status,  setStatus]  = useState('loading')
  const [tab,     setTab]     = useState('overview')
  const contentRef = useRef(null)

  useEffect(() => {
    if (contentRef.current) contentRef.current.scrollTop = 0
  }, [tab])

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('id') || 'demo'
    fetch(`/bookings/${id}.json`)
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(d  => { setBooking(d); setStatus('ok') })
      .catch(() => setStatus('error'))
  }, [])

  if (status === 'loading') return <div className="loading"><div className="loading-spinner"/></div>
  if (status === 'error')   return (
    <div className="not-found">
      <div className="not-found-icon">🧭</div>
      <h2>Reserva no encontrada</h2>
      <p>El link de tu viaje no es válido.<br/>Contactá a Mama Mouse para obtener tu link correcto.</p>
    </div>
  )

  const estado = getEstado(booking.financiero)

  return (
    <div className="dashboard">
      <TopBar titular={booking.titular} destinos={booking.destinos} estado={estado} />
      <div className="dashboard-body">
        <Sidebar activeTab={tab} onTabChange={setTab} />
        <main className="content-area" ref={contentRef}>
          {tab === 'overview'   && <Overview   booking={booking} onTabChange={setTab} />}
          {tab === 'pagos'      && <PaymentStatus financiero={booking.financiero} />}
          {tab === 'itinerario' && <Itinerary  itinerario={booking.itinerario} />}
          {tab === 'guias'      && <TravelGuide tips={booking.tips} />}
          {tab === 'beneficios' && <Benefits   booking={booking} />}
        </main>
      </div>
      <BottomTabs activeTab={tab} onTabChange={setTab} />
    </div>
  )
}
