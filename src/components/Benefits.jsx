export default function Benefits({ booking }) {
  const { promos, regalos, extras, auto, asistencia } = booking

  return (
    <div className="fade-in">
      <div className="content-header">
        <div className="content-title">Beneficios Mama Mouse 🎁</div>
        <div className="content-subtitle">Todo lo que incluye tu paquete</div>
      </div>

      {promos?.length > 0 && (
        <div className="card grid-1">
          <div className="card-header">
            <div className="card-header-icon">🏷️</div>
            <span className="card-header-title">Promociones Aplicadas</span>
          </div>
          <div className="card-body">
            <div className="chips-list">
              {promos.map((p, i) => <span key={i} className="chip chip-green">{p}</span>)}
            </div>
          </div>
        </div>
      )}

      {regalos?.length > 0 && (
        <div className="card grid-1">
          <div className="card-header">
            <div className="card-header-icon">🎀</div>
            <span className="card-header-title">Tus Regalos y Sorpresas</span>
          </div>
          <div className="card-body">
            <div className="chips-list">
              {regalos.map((r, i) => <span key={i} className="chip chip-pink">{r}</span>)}
            </div>
          </div>
        </div>
      )}

      {extras?.length > 0 && (
        <div className="card grid-1">
          <div className="card-header">
            <div className="card-header-icon">⭐</div>
            <span className="card-header-title">Extras Incluidos</span>
          </div>
          <div className="card-body">
            <div className="chips-list">
              {extras.map((e, i) => <span key={i} className="chip">{e}</span>)}
            </div>
          </div>
        </div>
      )}

      {(auto || asistencia) && (
        <div className="card grid-1">
          <div className="card-header">
            <div className="card-header-icon">🛡️</div>
            <span className="card-header-title">Logística y Protección</span>
          </div>
          <div className="card-body">
            {auto && (
              <div className="info-row">
                <span className="info-label">Auto</span>
                <span className="info-value">{auto.empresa} – {auto.categoria}</span>
              </div>
            )}
            {asistencia && (
              <>
                <div className="info-row">
                  <span className="info-label">Asistencia</span>
                  <span className="info-value">{asistencia.plan}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Cobertura</span>
                  <span className="info-value">{asistencia.cobertura}</span>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
