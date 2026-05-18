function SectionCard({ icon, title, children }) {
  return (
    <div className="section-card">
      <div className="section-header">
        <span className="section-icon">{icon}</span>
        <span className="section-title">{title}</span>
      </div>
      <div className="section-body">{children}</div>
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

function formatDate(dateStr) {
  const [year, month, day] = dateStr.split('-')
  const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
  return `${parseInt(day)} ${months[parseInt(month) - 1]} ${year}`
}

export default function BookingSummary({ booking }) {
  const { hotel, tickets, extras, auto, asistencia, promos, regalos } = booking

  return (
    <>
      {/* HOSPEDAJE */}
      <SectionCard icon="🏨" title="Hospedaje y Estadía">
        <InfoRow label="Hotel" value={hotel.nombre} />
        <InfoRow label="Categoría" value={hotel.categoria} />
        <InfoRow label="Habitación" value={hotel.habitacion} />
        <div className="info-divider" />
        <InfoRow label="Check-In" value={formatDate(hotel.checkIn)} />
        <InfoRow label="Check-Out" value={formatDate(hotel.checkOut)} />
      </SectionCard>

      {/* TICKETS */}
      <SectionCard icon="🎟️" title="Tickets y Experiencias">
        {tickets.disney && <InfoRow label="Disney" value={tickets.disney} />}
        {tickets.universal && <InfoRow label="Universal" value={tickets.universal} />}
        {extras?.length > 0 && (
          <>
            <div className="info-divider" />
            <div className="info-row" style={{ flexDirection: 'column', gap: 8 }}>
              <span className="info-label">Extras</span>
              <div className="chips-list">
                {extras.map((e, i) => <span key={i} className="chip">{e}</span>)}
              </div>
            </div>
          </>
        )}
      </SectionCard>

      {/* LOGÍSTICA */}
      {(auto || asistencia) && (
        <SectionCard icon="🚗" title="Logística y Protección">
          {auto && (
            <>
              <InfoRow label="Auto" value={`${auto.empresa} – ${auto.categoria}`} />
              <InfoRow label="Retiro" value={formatDate(auto.retiro)} />
              <InfoRow label="Devolución" value={formatDate(auto.devolucion)} />
            </>
          )}
          {asistencia && (
            <>
              {auto && <div className="info-divider" />}
              <InfoRow label="Asistencia" value={asistencia.plan} />
              <InfoRow label="Cobertura" value={asistencia.cobertura} />
            </>
          )}
        </SectionCard>
      )}

      {/* BENEFICIOS */}
      {((promos?.length > 0) || (regalos?.length > 0)) && (
        <SectionCard icon="🎁" title="Beneficios Mama Mouse">
          {promos?.length > 0 && (
            <div className="info-row" style={{ flexDirection: 'column', gap: 8 }}>
              <span className="info-label">Promos</span>
              <div className="chips-list">
                {promos.map((p, i) => <span key={i} className="chip chip-green">{p}</span>)}
              </div>
            </div>
          )}
          {promos?.length > 0 && regalos?.length > 0 && <div className="info-divider" />}
          {regalos?.length > 0 && (
            <div className="info-row" style={{ flexDirection: 'column', gap: 8 }}>
              <span className="info-label">Tus Regalos</span>
              <div className="chips-list">
                {regalos.map((r, i) => <span key={i} className="chip chip-pink">{r}</span>)}
              </div>
            </div>
          )}
        </SectionCard>
      )}
    </>
  )
}
