import { useState, useEffect, useRef } from 'react'

/* ─── DATA ─────────────────────────────────────────────────────────────── */
const BENEFICIOS = [
  { icon: '🎯', title: 'Monitoreo de Ofertas', desc: 'Si Disney lanza una promo después de tu reserva, la aplicamos automáticamente. Tu precio siempre es el mejor disponible.' },
  { icon: '⚡', title: 'Estrategia de Filas', desc: 'Lightning Lane, Genie+, Virtual Queue y Universal Express Pass. Aprovechás cada minuto sin perder tiempo en colas.' },
  { icon: '🍽️', title: 'Experiencias Reservadas', desc: 'Character Dining, restaurantes temáticos y shows exclusivos reservados con la anticipación exacta que cada uno requiere.' },
  { icon: '💬', title: 'Asesoría Sin Costo Extra', desc: 'Tu agente de confianza antes, durante y después del viaje. Sin costos adicionales. Sin sorpresas.' },
]

const DESTINOS = [
  {
    emoji: '🏰', grad: 'lp-card-disney',
    name: 'Walt Disney World',
    location: 'Orlando, Florida',
    desc: '4 parques temáticos, 2 parques acuáticos y la magia más grande del mundo. La experiencia Disney definitiva.',
    tags: ['Magic Kingdom', 'EPCOT', 'Hollywood Studios', 'Animal Kingdom'],
  },
  {
    emoji: '🎢', grad: 'lp-card-universal',
    name: 'Universal Orlando',
    location: 'Orlando, Florida',
    desc: 'Harry Potter, Minions y el revolucionario Epic Universe. Adrenalina, tecnología y entretenimiento sin límites.',
    tags: ['Islands of Adventure', 'Universal Studios', 'Epic Universe'],
  },
  {
    emoji: '🚢', grad: 'lp-card-cruise',
    name: 'Disneyland & Cruceros',
    location: 'California · Alta Mar',
    desc: 'El parque original de Walt Disney en California y la experiencia única de navegar con la magia Disney.',
    tags: ['Disneyland', 'California Adventure', 'Disney Cruise Line'],
  },
]

const PASOS = [
  { num: '01', icon: '📋', title: 'Contame tu sueño', desc: 'Completás el formulario con fechas, destino y preferencias. Es gratis y sin compromiso.' },
  { num: '02', icon: '✨', title: 'Tu plan a medida', desc: 'Diseño un itinerario personalizado con presupuesto detallado, hotel, tickets y experiencias.' },
  { num: '03', icon: '🔒', title: 'Reservamos todo', desc: 'Me encargo de cada detalle: hotel, tickets, restaurantes, traslados y más.' },
  { num: '04', icon: '🎉', title: '¡A disfrutar!', desc: 'Viajás tranquilo sabiendo que tenés soporte antes y durante tu aventura.' },
]

const TESTIMONIOS = [
  { nombre: 'Familia Rodríguez', origen: 'Rosario', avatar: '👨‍👩‍👧', texto: '¡Nunca imaginé que viajar a Disney pudiera ser tan fácil! Mama Mouse se encargó de absolutamente todo. Fue el viaje de nuestra vida, sin un solo estrés.', destino: 'Walt Disney World' },
  { nombre: 'Laura & Martín', origen: 'Córdoba', avatar: '👫', texto: 'Gracias al monitoreo de ofertas nos ahorraron USD 400 cuando Disney lanzó una promo. Una profesional de verdad, siempre atenta y disponible.', destino: 'Disney + Universal' },
  { nombre: 'Familia Sánchez', origen: 'Buenos Aires', avatar: '👨‍👩‍👦‍👦', texto: 'Los consejos sobre Lightning Lane y los restaurantes fueron clave. Aprovechamos cada minuto en los parques sin hacer largas filas. ¡Volvemos el año que viene!', destino: 'Universal Orlando' },
]

const DESTINOS_OPT = ['Walt Disney World', 'Universal Orlando', 'Disneyland', 'Disney Cruise Line', 'Disney + Universal', 'No sé aún / Consultame']

/* ─── NAVBAR ────────────────────────────────────────────────────────────── */
function Navbar({ onLoginClick }) {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const scroll = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    setMenuOpen(false)
  }

  return (
    <nav className={`lp-nav ${scrolled ? 'lp-nav-solid' : ''}`}>
      <div className="lp-nav-inner">
        <div className="lp-nav-brand" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <img src="/logo.png" alt="Mama Mouse" className="lp-nav-logo" />
          <span className="lp-nav-brand-text">MAMA MOUSE</span>
        </div>

        <div className={`lp-nav-links ${menuOpen ? 'lp-nav-open' : ''}`}>
          <button onClick={() => scroll('destinos')}>Destinos</button>
          <button onClick={() => scroll('por-que')}>Por qué nosotros</button>
          <button onClick={() => scroll('proceso')}>Proceso</button>
          <button onClick={() => scroll('cotizar')}>Cotizar</button>
          <button className="lp-nav-reserva-btn" onClick={() => { setMenuOpen(false); onLoginClick() }}>
            🔑 Mi Reserva
          </button>
        </div>

        <button className="lp-hamburger" onClick={() => setMenuOpen(o => !o)}>
          <span /><span /><span />
        </button>
      </div>
    </nav>
  )
}

/* ─── HERO ──────────────────────────────────────────────────────────────── */
function Hero({ onCotizarClick, onLoginClick }) {
  return (
    <section className="lp-hero">
      <div className="lp-hero-overlay" />
      <div className="lp-hero-content">
        <div className="lp-hero-badge">🌟 Agente Oficial Disney · Universal · Disneyland</div>
        <h1 className="lp-hero-title">
          Tu viaje mágico a<br />
          <span className="lp-hero-title-highlight">Orlando empieza aquí</span>
        </h1>
        <p className="lp-hero-sub">
          Planificación experta y a medida para Disney y Universal,<br className="lp-hero-br" />
          sin estrés y sin costos adicionales por asesoría.
        </p>
        <div className="lp-hero-ctas">
          <button className="lp-btn-primary" onClick={onCotizarClick}>
            ✈️ Cotizar mi viaje gratis
          </button>
          <button className="lp-btn-ghost" onClick={onLoginClick}>
            🔑 Acceder a mi reserva
          </button>
        </div>
        <div className="lp-hero-stats">
          <div className="lp-hero-stat"><strong>+500</strong><span>familias felices</span></div>
          <div className="lp-hero-divider" />
          <div className="lp-hero-stat"><strong>100%</strong><span>asesoría gratuita</span></div>
          <div className="lp-hero-divider" />
          <div className="lp-hero-stat"><strong>10 años</strong><span>de experiencia</span></div>
        </div>
      </div>
      <div className="lp-hero-scroll">
        <span>↓</span>
      </div>
    </section>
  )
}

/* ─── POR QUÉ ───────────────────────────────────────────────────────────── */
function PorQue() {
  return (
    <section id="por-que" className="lp-section lp-section-light">
      <div className="lp-container">
        <div className="lp-section-header">
          <div className="lp-section-badge">¿Por qué elegirnos?</div>
          <h2 className="lp-section-title">La diferencia de trabajar con<br />una Agente Oficial</h2>
          <p className="lp-section-sub">No somos un simple buscador de vuelos. Somos tu equipo de expertos con acceso directo a las mejores tarifas, herramientas y estrategias de los parques.</p>
        </div>

        <div className="lp-seal-row">
          <div className="lp-seal">
            <span className="lp-seal-icon">🏆</span>
            <div>
              <div className="lp-seal-title">Agente Oficial Certificada</div>
              <div className="lp-seal-sub">Disney · Universal · IATA</div>
            </div>
          </div>
        </div>

        <div className="lp-benefits-grid">
          {BENEFICIOS.map((b, i) => (
            <div key={i} className="lp-benefit-card">
              <div className="lp-benefit-icon">{b.icon}</div>
              <h3 className="lp-benefit-title">{b.title}</h3>
              <p className="lp-benefit-desc">{b.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── DESTINOS ──────────────────────────────────────────────────────────── */
function Destinos({ onCotizarClick }) {
  return (
    <section id="destinos" className="lp-section">
      <div className="lp-container">
        <div className="lp-section-header">
          <div className="lp-section-badge">Destinos</div>
          <h2 className="lp-section-title">¿A dónde querés ir?</h2>
          <p className="lp-section-sub">Especializados en los destinos más mágicos del mundo. Cada viaje diseñado a tu medida.</p>
        </div>
        <div className="lp-destinos-grid">
          {DESTINOS.map((d, i) => (
            <div key={i} className={`lp-destino-card ${d.grad}`}>
              <div className="lp-destino-emoji">{d.emoji}</div>
              <div className="lp-destino-location">{d.location}</div>
              <h3 className="lp-destino-name">{d.name}</h3>
              <p className="lp-destino-desc">{d.desc}</p>
              <div className="lp-destino-tags">
                {d.tags.map((t, j) => <span key={j} className="lp-destino-tag">{t}</span>)}
              </div>
              <button className="lp-destino-cta" onClick={onCotizarClick}>
                Cotizar este destino →
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── PROCESO ───────────────────────────────────────────────────────────── */
function Proceso({ onCotizarClick }) {
  return (
    <section id="proceso" className="lp-section lp-section-gradient">
      <div className="lp-container">
        <div className="lp-section-header lp-section-header-light">
          <div className="lp-section-badge lp-badge-light">Proceso</div>
          <h2 className="lp-section-title lp-title-light">¿Cómo planeamos tu viaje?</h2>
          <p className="lp-section-sub lp-sub-light">Simple, transparente y sin sorpresas.</p>
        </div>
        <div className="lp-pasos-grid">
          {PASOS.map((p, i) => (
            <div key={i} className="lp-paso-card">
              <div className="lp-paso-num">{p.num}</div>
              <div className="lp-paso-icon">{p.icon}</div>
              <h3 className="lp-paso-title">{p.title}</h3>
              <p className="lp-paso-desc">{p.desc}</p>
              {i < PASOS.length - 1 && <div className="lp-paso-arrow">→</div>}
            </div>
          ))}
        </div>
        <div className="lp-proceso-cta">
          <button className="lp-btn-primary lp-btn-white" onClick={onCotizarClick}>
            Empezar ahora — es gratis ✨
          </button>
        </div>
      </div>
    </section>
  )
}

/* ─── FORMULARIO DE COTIZACIÓN ──────────────────────────────────────────── */
function Cotizar() {
  const [form, setForm]     = useState({ nombre: '', email: '', telefono: '', destino: '', fechas: '', adultos: '2', ninos: '0', mensaje: '' })
  const [status, setStatus] = useState('idle') // idle | sending | ok | error

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setStatus('sending')
    try {
      const r = await fetch('/api/cotizar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      setStatus(r.ok ? 'ok' : 'error')
    } catch {
      setStatus('error')
    }
  }

  if (status === 'ok') return (
    <section id="cotizar" className="lp-section lp-section-light">
      <div className="lp-container">
        <div className="lp-cotizar-success">
          <div className="lp-success-icon">🎉</div>
          <h2>¡Recibimos tu consulta!</h2>
          <p>Te contactamos en las próximas <strong>24 horas</strong> para empezar a diseñar tu viaje soñado.</p>
          <div className="lp-success-contact">
            <a href="https://wa.me/5493412143631" target="_blank" rel="noreferrer" className="lp-btn-primary">
              💬 Hablar por WhatsApp ahora
            </a>
          </div>
        </div>
      </div>
    </section>
  )

  return (
    <section id="cotizar" className="lp-section lp-section-light">
      <div className="lp-container">
        <div className="lp-section-header">
          <div className="lp-section-badge">Cotización Gratuita</div>
          <h2 className="lp-section-title">Diseñá tu viaje mágico</h2>
          <p className="lp-section-sub">Completá el formulario y en menos de 24 horas te enviamos una propuesta personalizada. Sin costo, sin compromiso.</p>
        </div>

        <form className="lp-form" onSubmit={handleSubmit}>
          <div className="lp-form-grid">
            <div className="lp-form-field">
              <label>Nombre completo *</label>
              <input required value={form.nombre} onChange={e => set('nombre', e.target.value)} placeholder="Ej: María González" />
            </div>
            <div className="lp-form-field">
              <label>Email *</label>
              <input required type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="tu@email.com" />
            </div>
            <div className="lp-form-field">
              <label>WhatsApp / Teléfono *</label>
              <input required value={form.telefono} onChange={e => set('telefono', e.target.value)} placeholder="+54 9 341 000 0000" />
            </div>
            <div className="lp-form-field">
              <label>Destino de interés *</label>
              <select required value={form.destino} onChange={e => set('destino', e.target.value)}>
                <option value="">— Seleccioná —</option>
                {DESTINOS_OPT.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div className="lp-form-field">
              <label>Fechas estimadas de viaje</label>
              <input value={form.fechas} onChange={e => set('fechas', e.target.value)} placeholder="Ej: Julio 2026, sin definir aún..." />
            </div>
            <div className="lp-form-field lp-form-pasajeros">
              <label>Pasajeros</label>
              <div className="lp-form-pasajeros-row">
                <div>
                  <span>Adultos</span>
                  <input type="number" min="1" max="20" value={form.adultos} onChange={e => set('adultos', e.target.value)} />
                </div>
                <div>
                  <span>Niños</span>
                  <input type="number" min="0" max="20" value={form.ninos} onChange={e => set('ninos', e.target.value)} />
                </div>
              </div>
            </div>
            <div className="lp-form-field lp-form-full">
              <label>¿Algo más que quieras contarnos?</label>
              <textarea value={form.mensaje} onChange={e => set('mensaje', e.target.value)} placeholder="Primeras veces, celebraciones especiales, necesidades especiales, presupuesto aproximado..." />
            </div>
          </div>

          {status === 'error' && <div className="lp-form-error">❌ Hubo un error al enviar. Escribinos directo por WhatsApp.</div>}

          <div className="lp-form-footer">
            <button type="submit" className="lp-btn-primary lp-btn-submit" disabled={status === 'sending'}>
              {status === 'sending' ? '⏳ Enviando…' : '✈️ Quiero cotizar mi viaje'}
            </button>
            <span className="lp-form-hint">También podés escribirnos directo por{' '}
              <a href="https://wa.me/5493412143631" target="_blank" rel="noreferrer">WhatsApp</a>
            </span>
          </div>
        </form>
      </div>
    </section>
  )
}

/* ─── TESTIMONIOS ───────────────────────────────────────────────────────── */
function Testimonios() {
  return (
    <section className="lp-section">
      <div className="lp-container">
        <div className="lp-section-header">
          <div className="lp-section-badge">Testimonios</div>
          <h2 className="lp-section-title">Familias que ya vivieron la magia</h2>
          <p className="lp-section-sub">Más de 500 familias confiaron en Mama Mouse para el viaje de su vida.</p>
        </div>
        <div className="lp-testimonios-grid">
          {TESTIMONIOS.map((t, i) => (
            <div key={i} className="lp-testimonio-card">
              <div className="lp-testimonio-stars">⭐⭐⭐⭐⭐</div>
              <p className="lp-testimonio-texto">"{t.texto}"</p>
              <div className="lp-testimonio-author">
                <div className="lp-testimonio-avatar">{t.avatar}</div>
                <div>
                  <div className="lp-testimonio-nombre">{t.nombre}</div>
                  <div className="lp-testimonio-meta">{t.origen} · {t.destino}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── VIAJEROS (Login) ──────────────────────────────────────────────────── */
function SeccionViajeros({ onLoginClick }) {
  return (
    <section className="lp-section lp-section-viajeros">
      <div className="lp-container">
        <div className="lp-viajeros-card">
          <div className="lp-viajeros-left">
            <div className="lp-section-badge lp-badge-light">Portal de Viajeros</div>
            <h2 className="lp-viajeros-title">¿Ya tenés tu reserva?</h2>
            <p className="lp-viajeros-desc">
              Accedé a tu portal personalizado para ver el estado de tu reserva, los pagos, el itinerario completo y toda la información de tu viaje.
            </p>
            <ul className="lp-viajeros-features">
              <li>✅ Estado de pagos en tiempo real</li>
              <li>🗓️ Itinerario día a día</li>
              <li>🏨 Datos de hotel y tickets</li>
              <li>📄 Documentos y vouchers</li>
              <li>🎁 Beneficios y sorpresas</li>
            </ul>
            <button className="lp-btn-primary lp-btn-white" onClick={onLoginClick}>
              🔑 Ingresar a mi reserva
            </button>
          </div>
          <div className="lp-viajeros-right">
            <div className="lp-viajeros-mockup">
              <div className="lp-mock-bar">
                <div className="lp-mock-dot" /><div className="lp-mock-dot" /><div className="lp-mock-dot" />
              </div>
              <div className="lp-mock-content">
                <div className="lp-mock-logo">🐭</div>
                <div className="lp-mock-title">Mi Reserva</div>
                <div className="lp-mock-item lp-mock-item-green">🏰 Tickets Disney · ✅ Pagado</div>
                <div className="lp-mock-item lp-mock-item-yellow">🏨 Hotel Disney · 🔄 Parcial</div>
                <div className="lp-mock-item lp-mock-item-green">🌟 Pack Universal · ✅ Pagado</div>
                <div className="lp-mock-progress">
                  <div className="lp-mock-pct">84%</div>
                  <div className="lp-mock-bar-fill"><div /></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ─── FOOTER ────────────────────────────────────────────────────────────── */
function Footer() {
  return (
    <footer className="lp-footer">
      <div className="lp-container">
        <div className="lp-footer-grid">
          <div className="lp-footer-brand">
            <img src="/logo.png" alt="Mama Mouse" className="lp-footer-logo" />
            <p className="lp-footer-tagline">No vendo viajes...<br /><em>hago que el tuyo sea la mejor experiencia de tu vida.</em></p>
            <div className="lp-footer-social">
              <a href="https://wa.me/5493412143631" target="_blank" rel="noreferrer" className="lp-social-btn lp-social-wa">
                <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.118 1.528 5.85L.057 23.998l6.304-1.654A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.894a9.879 9.879 0 01-5.031-1.378l-.361-.214-3.741.981.998-3.648-.235-.374A9.855 9.855 0 012.106 12C2.106 6.58 6.58 2.106 12 2.106S21.894 6.58 21.894 12 17.42 21.894 12 21.894z"/></svg>
                +54 9 341 2-143631
              </a>
              <a href="https://instagram.com/mamamouse12" target="_blank" rel="noreferrer" className="lp-social-btn lp-social-ig">
                <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                @mamamouse12
              </a>
            </div>
          </div>

          <div className="lp-footer-links">
            <div className="lp-footer-col">
              <h4>Destinos</h4>
              <a href="#destinos">Walt Disney World</a>
              <a href="#destinos">Universal Orlando</a>
              <a href="#destinos">Disneyland</a>
              <a href="#destinos">Disney Cruise Line</a>
            </div>
            <div className="lp-footer-col">
              <h4>Nosotros</h4>
              <a href="#por-que">Por qué elegirnos</a>
              <a href="#proceso">Proceso de trabajo</a>
              <a href="#cotizar">Cotizar gratis</a>
            </div>
          </div>
        </div>

        <div className="lp-footer-bottom">
          <p className="lp-footer-legal">
            © {new Date().getFullYear()} Mama Mouse Viajes. Todos los derechos reservados.
          </p>
          <p className="lp-footer-disclaimer">
            Mama Mouse Viajes es una agencia de viajes independiente. Los nombres, logos y marcas de Disney®, Universal Studios®, Walt Disney World®, Disneyland® y sus respectivos parques son propiedad exclusiva de The Walt Disney Company y Universal Parks & Resorts. No estamos afiliados, patrocinados ni respaldados oficialmente por estas empresas.
          </p>
        </div>
      </div>
    </footer>
  )
}

/* ─── MAIN LANDING PAGE ─────────────────────────────────────────────────── */
export default function LandingPage({ onLoginClick }) {
  const cotizarRef = useRef(null)
  const scrollToCotizar = () => document.getElementById('cotizar')?.scrollIntoView({ behavior: 'smooth' })

  return (
    <div className="lp-root">
      <Navbar onLoginClick={onLoginClick} />
      <Hero onCotizarClick={scrollToCotizar} onLoginClick={onLoginClick} />
      <PorQue />
      <Destinos onCotizarClick={scrollToCotizar} />
      <Proceso onCotizarClick={scrollToCotizar} />
      <Cotizar />
      <Testimonios />
      <SeccionViajeros onLoginClick={onLoginClick} />
      <Footer />

      {/* WhatsApp flotante */}
      <a href="https://wa.me/5493412143631?text=Hola!%20Me%20gustaría%20cotizar%20mi%20viaje%20a%20Disney%2FUniversal"
        target="_blank" rel="noreferrer" className="lp-wa-float" title="Consultar por WhatsApp">
        <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.118 1.528 5.85L.057 23.998l6.304-1.654A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.894a9.879 9.879 0 01-5.031-1.378l-.361-.214-3.741.981.998-3.648-.235-.374A9.855 9.855 0 012.106 12C2.106 6.58 6.58 2.106 12 2.106S21.894 6.58 21.894 12 17.42 21.894 12 21.894z"/></svg>
      </a>
    </div>
  )
}
