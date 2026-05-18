export default function TravelGuide({ tips }) {
  return (
    <div className="fade-in">
      <div className="content-header">
        <div className="content-title">Guías y Tips 💡</div>
        <div className="content-subtitle">Consejos exclusivos de Mama Mouse para tu viaje</div>
      </div>

      {tips.map((cat, i) => (
        <div key={i} className="card grid-1">
          <div className="card-header">
            <div className="card-header-icon">{cat.icono}</div>
            <span className="card-header-title">{cat.categoria}</span>
          </div>
          <div className="card-body">
            <div className="tips-category" style={{ marginBottom:0 }}>
              {cat.items.map((tip, j) => (
                <div key={j} className="tip-item">
                  <div className="tip-dot" />
                  <span className="tip-text">{tip}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
