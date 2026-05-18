function formatDate(dateStr) {
  const [, month, day] = dateStr.split('-')
  const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
  const dow = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb']
  const d = new Date(dateStr + 'T12:00:00')
  return `${dow[d.getDay()]} ${parseInt(day)} ${months[parseInt(month)-1]}`
}

export default function Itinerary({ itinerario }) {
  return (
    <div className="fade-in">
      <div className="content-header">
        <div className="content-title">Itinerario Día a Día 🗺️</div>
        <div className="content-subtitle">Tu plan de aventura completo</div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-header-icon">📅</div>
          <span className="card-header-title">{itinerario.length} días de magia</span>
        </div>
        <div className="card-body">
          <div className="itinerary-list">
            {itinerario.map(item => (
              <div key={item.dia} className="itinerary-item">
                <div className="itinerary-day-circle">D{item.dia}</div>
                <div className="itinerary-text">
                  <div className="itinerary-date">{formatDate(item.fecha)}</div>
                  <div className="itinerary-plan">{item.plan}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
