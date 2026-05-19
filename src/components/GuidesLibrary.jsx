import { useState, useEffect } from 'react'

const CATEGORIAS = ['Todos', 'Disney World', 'Universal', 'Destino']

function GuideCard({ guide }) {
  const [exists, setExists] = useState(null) // null=checking, true=ok, false=missing

  useEffect(() => {
    fetch(`/guides/${guide.archivo}`, { method: 'HEAD' })
      .then(r => setExists(r.ok))
      .catch(() => setExists(false))
  }, [guide.archivo])

  const handleDownload = () => {
    if (!exists) return
    const a = document.createElement('a')
    a.href = `/guides/${guide.archivo}`
    a.download = guide.archivo
    a.click()
  }

  return (
    <div className="guide-card">
      {/* Color accent bar */}
      <div className="guide-card-accent" style={{ background: guide.color }} />

      <div className="guide-card-body">
        <div className="guide-card-top">
          <div className="guide-icon" style={{ background: guide.color + '22', color: guide.color }}>
            {guide.icono}
          </div>
          <span className="guide-categoria">{guide.categoria}</span>
        </div>

        <div className="guide-nombre">{guide.nombre}</div>
        <div className="guide-desc">{guide.descripcion}</div>

        <div className="guide-meta">
          <span>📄 {guide.tamano}</span>
          <span>🗓 {guide.actualizado}</span>
        </div>

        <button
          className={`guide-download-btn ${exists === false ? 'guide-download-soon' : ''}`}
          onClick={handleDownload}
          disabled={exists === false}
          style={exists ? { background: guide.color } : {}}
        >
          {exists === null && '⏳ Verificando...'}
          {exists === true  && '📥 Descargar Guía'}
          {exists === false && '🔜 Próximamente'}
        </button>
      </div>
    </div>
  )
}

export default function GuidesLibrary() {
  const [guides,   setGuides]   = useState([])
  const [catActiva, setCat]     = useState('Todos')
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    fetch('/guides/index.json')
      .then(r => r.json())
      .then(data => { setGuides(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const filtradas = catActiva === 'Todos'
    ? guides
    : guides.filter(g => g.categoria === catActiva)

  return (
    <div className="fade-in">
      <div className="content-header">
        <div className="content-title">Guías de Destino 📚</div>
        <div className="content-subtitle">Descargá las guías exclusivas de Mama Mouse para cada parque</div>
      </div>

      {/* FILTROS */}
      <div className="guides-filter-row">
        {CATEGORIAS.map(cat => (
          <button
            key={cat}
            className={`guides-filter-btn ${catActiva === cat ? 'active' : ''}`}
            onClick={() => setCat(cat)}
          >
            {cat === 'Disney World' && '🏰 '}
            {cat === 'Universal'    && '🎬 '}
            {cat === 'Destino'      && '🌴 '}
            {cat === 'Todos'        && '✨ '}
            {cat}
          </button>
        ))}
      </div>

      {/* CARDS GRID */}
      {loading ? (
        <div className="guides-loading">Cargando guías...</div>
      ) : (
        <div className="guides-grid">
          {filtradas.map(guide => (
            <GuideCard key={guide.id} guide={guide} />
          ))}
        </div>
      )}

      {/* FOOTER NOTE */}
      <div className="guides-note">
        💡 Las guías se actualizan regularmente. Si necesitás una guía personalizada para tu viaje, contactá a tu agente Mama Mouse.
      </div>
    </div>
  )
}
