import { useState, useEffect, useRef } from 'react'

/* ─── DATA ─────────────────────────────────────────────────────────────── */
const BENEFICIOS = [
  { icon: '🎯', title: 'Monitoreo de Ofertas', desc: 'Si Disney o Universal lanzan una promo después de tu reserva, la aplicamos automáticamente. Tu precio siempre es el mejor disponible.' },
  { icon: '⚡', title: 'Estrategia de Filas', desc: 'Lightning Lane, Genie+, Virtual Queue y Universal Express Pass. Aprovechás cada minuto sin perder tiempo en colas.' },
  { icon: '🍽️', title: 'Experiencias Reservadas', desc: 'Character Dining, restaurantes temáticos y shows exclusivos reservados con la anticipación exacta que cada uno requiere.' },
  { icon: '💬', title: 'Asesoría Sin Costo Extra', desc: 'Tu agente de confianza antes, durante y después del viaje. Sin costos adicionales. Sin sorpresas.' },
]

const DESTINOS_PRINCIPALES = [
  {
    emoji: '🏰', grad: 'lp-card-disney',
    name: 'Walt Disney World',
    location: 'Orlando, Florida',
    logo: '/walt disney world.png',
    desc: '4 parques temáticos, 2 parques acuáticos y la magia más grande del mundo. La experiencia Disney definitiva.',
    tags: ['Magic Kingdom', 'EPCOT', 'Hollywood Studios', 'Animal Kingdom'],
  },
  {
    emoji: '🎢', grad: 'lp-card-universal',
    name: 'Universal Orlando',
    location: 'Orlando, Florida',
    logo: '/universal.png',
    desc: 'Harry Potter, Minions y el revolucionario Epic Universe. Adrenalina, tecnología y entretenimiento sin límites.',
    tags: ['Islands of Adventure', 'Universal Studios', 'Epic Universe'],
  },
  {
    emoji: '🚢', grad: 'lp-card-cruise',
    name: 'Disneyland & Cruceros',
    location: 'California · Alta Mar',
    logo: '/disneyland.png',
    desc: 'El parque original de Walt Disney en California y la experiencia única de navegar con la magia Disney.',
    tags: ['Disneyland', 'California Adventure', 'Disney Cruise Line'],
  },
]

const OTROS_DESTINOS = [
  { emoji: '🗽', name: 'Estados Unidos', location: 'Nueva York · Las Vegas · Los Ángeles · Miami', logo: null, desc: 'Más allá de los parques, organizamos viajes por todo Estados Unidos: ciudades icónicas, road trips y experiencias únicas a medida.' },
  { emoji: '🌍', name: 'Europa', location: 'París · Roma · Londres · Barcelona', logo: null, desc: 'Circuitos y viajes a medida por Europa. Combinamos Disneyland París con escapadas a las ciudades más fascinantes del continente.' },
  { emoji: '🗼', name: 'Disneyland París', location: 'Paris, Francia', logo: '/disneyland paris.png', desc: 'La magia Disney en el corazón de Europa. Perfecto para combinar con una escapada parisina.' },
  { emoji: '🌴', name: 'Miami & Caribe', location: 'Florida · Caribe', logo: null, desc: 'Playas increíbles, shopping y el punto de partida ideal para cruceros y extensiones de viaje.' },
  { emoji: '🌊', name: 'Cruceros Disney', location: 'Caribe · Europa · Alaska', logo: '/disney cruise line.png', desc: 'Navegá con Mickey y toda la familia. Shows en vivo, personajes, restaurantes temáticos y puertos únicos.' },
  { emoji: '🚢', name: 'Cruceros MSC', location: 'Mediterráneo · Caribe · Alaska · Sudamérica', logo: '/msc.png', desc: 'Los cruceros más modernos del mundo con itinerarios únicos incluyendo Sudamérica. Una opción premium para familias y parejas.' },
  { emoji: '🚢', name: 'Royal Caribbean', location: 'Caribe · Europa · Alaska · Asia', logo: '/roayal cariebean.png', desc: 'La flota de cruceros más grande del mundo. Barcos innovadores, destinos únicos y entretenimiento sin igual.' },
  { emoji: '🦈', name: 'SeaWorld Orlando', location: 'Orlando, Florida', logo: '/sea world.png', desc: 'Aventuras acuáticas, shows de animales y atracciones increíbles. El complemento perfecto para tu viaje a Orlando.' },
]

const GUIAS = [
  { emoji: '🗺️', titulo: 'Cuándo ir a Disney', subtitulo: 'Temporadas · Precios · Afluencia', desc: 'Las fechas que hacen la diferencia: temporadas bajas, precios especiales, parques sin multitudes y eventos únicos del año.', tag: 'Planificación' },
  { emoji: '⚡', titulo: 'Lightning Lane & Filas', subtitulo: 'Genie+ · LL Individual · Estrategia', desc: 'La guía definitiva para no hacer colas: qué comprar, cuándo activarlo y cuál es la estrategia que usan los expertos.', tag: 'Pro Tips' },
  { emoji: '🍽️', titulo: 'Dónde comer en Disney', subtitulo: 'Character Dining · Restaurantes · Snacks', desc: 'Los mejores restaurantes, cuándo reservar, el Character Dining que vale la pena y los snacks icónicos que no podés perderte.', tag: 'Gastronomía' },
  { emoji: '🏨', titulo: 'Hoteles Disney vs. Off-site', subtitulo: 'Ventajas · Precios · Experiencia', desc: 'Qué beneficios te da quedarte dentro de Disney, cuándo conviene elegir hotel externo y cómo elegir el que mejor se adapta a tu familia.', tag: 'Alojamiento' },
  { emoji: '💰', titulo: 'Presupuesto Real para Disney', subtitulo: 'Costos · Consejos · Ahorro', desc: 'Cuánto cuesta realmente un viaje a Disney: tickets, hotel, comida, transporte y cómo optimizar cada peso.', tag: 'Presupuesto' },
  { emoji: '👶', titulo: 'Disney con Bebés y Niños', subtitulo: 'Edades · Atracciones · Logística', desc: 'Qué puede disfrutar cada edad, las atracciones aptas para los más pequeños y los trucos para que todos lleguen al final del día con energía.', tag: 'Familias' },
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

const NOVEDADES = [
  {
    emoji: '', tag: 'Universal Orlando', fecha: 'Mayo 2026',
    titulo: 'Epic Universe ya abrió sus puertas',
    desc: 'El nuevo parque de Universal Orlando es una realidad: mundos de Harry Potter, Nintendo, Monster-verse y más. Mama Mouse ya tiene paquetes con acceso desde el día 1.',
    destacado: true,
  },
  {
    emoji: '🎉', tag: 'Disney World', fecha: 'Abr 2026',
    titulo: 'Disney lanza promo 50% off en hoteles de verano',
    desc: 'Disney activó una promoción de descuento en resorts seleccionados para viajes entre junio y agosto 2026. Si ya tenés reserva, revisamos si aplica automáticamente.',
    destacado: false,
  },
  {
    emoji: '🎸', tag: 'Hollywood Studios', fecha: '26 May 2026',
    titulo: 'Rock\'n\'Roller Coaster starring The Muppets abre el 26 de mayo',
    desc: 'La renovación del clásico de Hollywood Studios ya tiene fecha: el 26 de mayo abre sus puertas con los Muppets como protagonistas. Una atracción completamente reimaginada que promete ser un hit absoluto.',
    destacado: false,
  },
  {
    emoji: '⚡', tag: 'Tips Disney', fecha: 'Mar 2026',
    titulo: 'Lightning Lane Multi Pass: cómo aprovecharlo al máximo',
    desc: 'Disney cambió el sistema de filas rápidas. Te explicamos cómo funciona el nuevo Lightning Lane y cuál es la estrategia ganadora para cada parque.',
    destacado: false,
  },
  {
    emoji: '⚓', tag: 'Disney Cruise Line', fecha: 'Nov 2025',
    titulo: 'Disney Destiny: el barco más nuevo de la flota ya navega',
    desc: 'El Disney Destiny inauguró en noviembre de 2025 con una temática única centrada en la dualidad entre héroes y villanos de Disney, Pixar y Marvel. Shows exclusivos, cabinas innovadoras e itinerarios por el Caribe. Consultá disponibilidad con Mama Mouse.',
    destacado: false,
  },
  {
    emoji: '🌍', tag: 'Disneyland París', fecha: 'Ene 2026',
    titulo: 'Temporada de Festival Disney con shows exclusivos',
    desc: 'Disneyland París celebra su temporada especial con shows únicos, decoraciones increíbles y paquetes combinados con estadía en París.',
    destacado: false,
  },
]

const HISTORIAS = [
  {
    avatar: '👨‍👩‍👧‍👦', nombre: 'Familia Pereyra', origen: 'Rosario, Santa Fe',
    destino: 'Walt Disney World · Julio 2025', emoji: '🏰',
    titulo: 'El viaje que pensamos que nunca íbamos a poder hacer',
    historia: 'Llevábamos 5 años soñando con llevar a nuestros hijos a Disney. Siempre nos parecía imposible, demasiado caro, demasiado complicado. Cuando hablamos con Mama Mouse, todo cambió. Nos explicó exactamente qué podíamos pagar, cómo distribuir los pagos y qué estrategias usar para que no nos faltara nada. Viajamos 5: mis dos nenes de 6 y 9, mi marido y yo, y la abuela. La cara de mis hijos cuando vieron a Mickey por primera vez... eso no tiene precio.',
    highlights: ['Magic Kingdom en 1 día completo', 'Character Dining con Minnie', 'Blizzard Beach de bonus'],
  },
  {
    avatar: '👩‍👦', nombre: 'Rocío y Valentín', origen: 'Buenos Aires, CABA',
    destino: 'Universal Orlando · Epic Universe · Junio 2025', emoji: '🎢',
    titulo: 'Mamá e hijo, primera vez solos, aventura total',
    historia: 'Mi hijo tiene 14 años y desde que abrió Epic Universe no hablaba de otra cosa. Le prometí que íbamos a ir, aunque no tenía idea de cómo organizarlo. Mama Mouse armó todo: el hotel Hard Rock con Express Pass incluido, los días en cada parque, los restaurantes. Val se volvió experto en Harry Potter y me hizo recorrer cada rincón de Hogsmeade. Fueron los 8 días más épicos de nuestras vidas.',
    highlights: ['3 días en Epic Universe', 'Express Pass incluido', 'Tour nocturno por Hogsmeade'],
  },
  {
    avatar: '👴👵', nombre: 'Norma & Roberto', origen: 'Mendoza',
    destino: 'Disney Cruise Line · Caribe · Marzo 2025', emoji: '🚢',
    titulo: 'Nunca fuimos de crucero... y resultó ser lo mejor del mundo',
    historia: 'Mis nietos llevan años diciéndonos que vayamos a Disney. Este año cumplí 70 y Roberto 72, y decidimos que era el momento. Mama Mouse nos recomendó el crucero Disney como alternativa más tranquila que los parques. Fue una revelación: shows increíbles cada noche, la comida excelente, y ver el Caribe desde la cubierta con nuestros nietos. Una semana que vamos a contar por el resto de nuestras vidas.',
    highlights: ['7 noches Caribe con Disney', 'Cena con personajes todos los días', 'Parada en Castaway Cay'],
  },
]

const DESTINOS_OPT = ['Walt Disney World', 'Universal Orlando', 'Disneyland', 'Disney Cruise Line', 'Disney + Universal', 'Disneyland París', 'Miami & Extensión', 'Crucero Disney', 'Caribe', 'Otros']

/* ─── NAVBAR ────────────────────────────────────────────────────────────── */
function Navbar({ onLoginClick }) {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    // El scroll ocurre dentro de .lp-root (overflow-y:auto), no en window
    const root = document.querySelector('.lp-root')
    if (!root) return
    const onScroll = () => setScrolled(root.scrollTop > 40)
    root.addEventListener('scroll', onScroll, { passive: true })
    return () => root.removeEventListener('scroll', onScroll)
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
          <div className="lp-nav-brand-texts">
            <span className="lp-nav-brand-text">MAMA MOUSE</span>
            <div className="lp-nav-fasttravel">
              <span className="lp-nav-ft-label">respaldada por</span>
              <img src="/fasttravel-logo.png" alt="Fast Travel Vacation" className="lp-nav-ft-logo" />
            </div>
          </div>
        </div>

        <div className={`lp-nav-links ${menuOpen ? 'lp-nav-open' : ''}`}>
          {menuOpen && (
            <button className="lp-nav-close" onClick={() => setMenuOpen(false)}>✕</button>
          )}
          <button onClick={() => scroll('destinos')}>Destinos</button>
          <button onClick={() => scroll('otros-destinos')}>Otros destinos</button>
          <button onClick={() => scroll('agente-oficial')}>Agente oficial</button>
          <button onClick={() => scroll('sobre-nosotros')}>Mama Mouse</button>
          <button onClick={() => scroll('guias')}>Guías</button>
          <button onClick={() => scroll('novedades')}>Novedades</button>
          <button onClick={() => scroll('historias')}>Historias</button>
          <button onClick={() => scroll('resena')}>Reseñas</button>
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
          <div className="lp-hero-stat"><strong>30 años</strong><span>de experiencia</span></div>
        </div>
      </div>
      <div className="lp-hero-scroll"><span>↓</span></div>
    </section>
  )
}

/* ─── LOGOS STRIP ────────────────────────────────────────────────────────── */
function LogosStrip() {
  return (
    <div className="lp-logos-strip">
      <div className="lp-container">
        <p className="lp-logos-label">Certificaciones y destinos oficiales</p>
        <div className="lp-logos-row">
          <img src="/authorized vacation planner.png" alt="Authorized Disney Vacation Planner" className="lp-logos-img lp-logos-avp" />
          <div className="lp-logos-divider" />
          <img src="/walt disney world.png"   alt="Walt Disney World"           className="lp-logos-img" />
          <img src="/universal.png"           alt="Universal Parks & Resorts"   className="lp-logos-img" />
          <img src="/disney cruise line.png"  alt="Disney Cruise Line"          className="lp-logos-img" />
          <img src="/disneyland paris.png"    alt="Disneyland París"            className="lp-logos-img" />
          <img src="/disneyland.png"          alt="Disneyland Resort"           className="lp-logos-img" />
          <img src="/msc.png"                 alt="MSC Cruises"                 className="lp-logos-img" />
          <img src="/roayal cariebean.png"    alt="Royal Caribbean"             className="lp-logos-img" />
          <img src="/sea world.png"           alt="SeaWorld"                    className="lp-logos-img" />
        </div>
      </div>
    </div>
  )
}

/* ─── SOBRE MAMA MOUSE ──────────────────────────────────────────────────── */
function SobreMamaMouse({ onCotizarClick }) {
  return (
    <section id="sobre-nosotros" className="lp-section">
      <div className="lp-container">
        <div className="lp-sobre-card">
          <div className="lp-sobre-photo">
            <div className="lp-sobre-photo-frame">
              <img src="/logo2.jpeg" alt="Mama Mouse" className="lp-sobre-img" />
              <div className="lp-sobre-badge-float">🌟 Agente Oficial</div>
            </div>
          </div>
          <div className="lp-sobre-content">
            <div className="lp-section-badge">Quién soy</div>
            <h2 className="lp-section-title lp-sobre-title">Soy Carolina Pozzi<br />(Mama Mouse)</h2>
            <p className="lp-sobre-desc">
              Con más de <strong>30 años de experiencia</strong> viajando y organizando viajes a Disney y Universal, me convertí en la agente de confianza de cientos de familias argentinas que querían vivir la magia sin el estrés de planificarlo todo solas.
            </p>
            <p className="lp-sobre-desc">
              Empecé como viajera apasionada, aprendí cada rincón de los parques, y hoy pongo ese conocimiento al servicio de tu familia. Mi trabajo es que <em>cada peso que invertís valga el doble</em> en sonrisas, momentos y recuerdos.
            </p>
            <div className="lp-sobre-stats">
              <div className="lp-sobre-stat">
                <strong>+500</strong>
                <span>familias viajaron</span>
              </div>
              <div className="lp-sobre-stat">
                <strong>30 años</strong>
                <span>de experiencia</span>
              </div>
              <div className="lp-sobre-stat">
                <strong>100%</strong>
                <span>asesoría gratuita</span>
              </div>
            </div>
            <div className="lp-sobre-certs">
              <span className="lp-cert-badge">🏆 Disney Authorized Retailer</span>
              <span className="lp-cert-badge">🌟 Universal Travel Partner</span>
              <span className="lp-cert-badge">✈️ IATA Certified</span>
            </div>
            <div className="lp-sobre-respaldo">
              <span className="lp-sobre-respaldo-label">Respaldada por</span>
              <img src="/fasttravel-logo.png" alt="Fast Travel Vacation" className="lp-sobre-ft-logo" />
            </div>
            <blockquote className="lp-sobre-quote">
              "No vendo viajes... <em>hago que el tuyo sea la mejor experiencia de tu vida.</em>"
            </blockquote>
            <button className="lp-btn-primary" onClick={onCotizarClick}>
              Cotizar con Mama Mouse →
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ─── POR QUÉ UN AGENTE OFICIAL ─────────────────────────────────────────── */
function AgenteOficial() {
  return (
    <section id="agente-oficial" className="lp-section lp-section-light">
      <div className="lp-container">
        <div className="lp-section-header">
          <div className="lp-section-badge">¿Por qué un Agente Oficial?</div>
          <h2 className="lp-section-title">No es lo mismo reservar solo<br />que hacerlo con un Agente Oficial</h2>
          <p className="lp-section-sub">Un Agente Oficial tiene acceso a herramientas, tarifas y beneficios que no están disponibles para el público general. Y no te cobra más por eso.</p>
        </div>

        <div className="lp-agente-vs">
          <div className="lp-vs-col lp-vs-solo">
            <div className="lp-vs-header">
              <span className="lp-vs-icon">😰</span>
              <h3>Reservando solo</h3>
            </div>
            <ul className="lp-vs-list lp-vs-list-no">
              <li>❌ Precio de lista, sin descuentos aplicados</li>
              <li>❌ Sin saber si hay promos activas</li>
              <li>❌ Ninguna estrategia de filas ni Lightning Lane</li>
              <li>❌ Restaurantes ya sin lugar cuando querés reservar</li>
              <li>❌ Sin saber qué conviene según tu familia</li>
              <li>❌ Sin soporte si algo sale mal en el viaje</li>
              <li>❌ Miles de horas investigando grupos de Facebook</li>
            </ul>
          </div>
          <div className="lp-vs-divider">VS</div>
          <div className="lp-vs-col lp-vs-agente">
            <div className="lp-vs-header">
              <span className="lp-vs-icon">🌟</span>
              <h3>Con Mama Mouse</h3>
            </div>
            <ul className="lp-vs-list lp-vs-list-yes">
              <li>✅ Promos aplicadas automáticamente</li>
              <li>✅ Monitoreo continuo de precios y ofertas</li>
              <li>✅ Estrategia de filas personalizada para tu familia</li>
              <li>✅ Restaurantes reservados con la anticipación exacta</li>
              <li>✅ Plan 100% adaptado a tus necesidades y presupuesto</li>
              <li>✅ Soporte antes, durante y después del viaje</li>
              <li>✅ Sin costo adicional por la asesoría</li>
            </ul>
          </div>
        </div>

        <div className="lp-avp-row">
          <div className="lp-avp-badge">
            <img src="/authorized vacation planner.png" alt="Authorized Disney Vacation Planner" className="lp-avp-img" />
            <p className="lp-avp-caption">
              Mama Mouse es <strong>Agente Oficial Autorizada por Disney</strong> — una distinción exclusiva que solo tienen agencias seleccionadas, que garantiza acceso a tarifas, herramientas y soporte directo con Disney.
            </p>
          </div>
        </div>

        <div className="lp-benefits-grid" style={{ marginTop: 48 }}>
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

/* ─── DESTINOS PRINCIPALES ──────────────────────────────────────────────── */
function Destinos({ onCotizarClick }) {
  return (
    <section id="destinos" className="lp-section">
      <div className="lp-container">
        <div className="lp-section-header">
          <div className="lp-section-badge">Destinos principales</div>
          <h2 className="lp-section-title">Disney y Universal,<br />la especialidad de Mama Mouse</h2>
          <p className="lp-section-sub">Más de 30 años visitando y planificando estos destinos. Cada rincón, cada promo, cada estrategia: los conocemos como nadie.</p>
        </div>
        <div className="lp-destinos-grid">
          {DESTINOS_PRINCIPALES.map((d, i) => (
            <div key={i} className={`lp-destino-card ${d.grad}`}>
              {d.logo && <img src={d.logo} alt={d.name} className="lp-destino-logo" />}
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

/* ─── OTROS DESTINOS ────────────────────────────────────────────────────── */
function OtrosDestinos({ onCotizarClick }) {
  return (
    <section id="otros-destinos" className="lp-section lp-section-light">
      <div className="lp-container">
        <div className="lp-section-header">
          <div className="lp-section-badge">Otros destinos</div>
          <h2 className="lp-section-title">La magia no termina<br />en Orlando</h2>
          <p className="lp-section-sub">Más allá de Walt Disney World y Universal, Mama Mouse organiza experiencias únicas en estos destinos que también enamorarán a tu familia.</p>
        </div>
        <div className="lp-otros-grid">
          {OTROS_DESTINOS.map((d, i) => (
            <div key={i} className="lp-otro-card">
              <div className="lp-otro-left">
                {d.logo
                  ? <img src={d.logo} alt={d.name} className="lp-otro-logo" />
                  : <div className="lp-otro-emoji">{d.emoji}</div>
                }
              </div>
              <div className="lp-otro-info">
                <div className="lp-otro-location">{d.location}</div>
                <h3 className="lp-otro-name">{d.name}</h3>
                <p className="lp-otro-desc">{d.desc}</p>
              </div>
              <button className="lp-otro-cta" onClick={onCotizarClick}>Consultar →</button>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── GUÍAS ─────────────────────────────────────────────────────────────── */
function Guias({ onCotizarClick }) {
  return (
    <section id="guias" className="lp-section lp-section-gradient">
      <div className="lp-container">
        <div className="lp-section-header lp-section-header-light">
          <div className="lp-section-badge lp-badge-light">Guías de viaje</div>
          <h2 className="lp-section-title lp-title-light">Todo lo que necesitás saber<br />antes de viajar</h2>
          <p className="lp-section-sub lp-sub-light">Guías pensadas para familias argentinas que viajan por primera (o décima) vez a Disney y Universal.</p>
        </div>
        <div className="lp-guias-grid">
          {GUIAS.map((g, i) => (
            <div key={i} className="lp-guia-card">
              <div className="lp-guia-top">
                <span className="lp-guia-tag">{g.tag}</span>
                <div className="lp-guia-emoji">{g.emoji}</div>
              </div>
              <h3 className="lp-guia-titulo">{g.titulo}</h3>
              <div className="lp-guia-subtitulo">{g.subtitulo}</div>
              <p className="lp-guia-desc">{g.desc}</p>
              <button className="lp-guia-cta" onClick={onCotizarClick}>
                Consultame sobre esto →
              </button>
            </div>
          ))}
        </div>
        <div className="lp-guias-cta">
          <p>¿Querés una guía personalizada para tu viaje?</p>
          <button className="lp-btn-primary lp-btn-white" onClick={onCotizarClick}>
            ✨ Pedí tu guía personalizada gratis
          </button>
        </div>
      </div>
    </section>
  )
}

/* ─── NOVEDADES ─────────────────────────────────────────────────────────── */
function Novedades({ onCotizarClick }) {
  return (
    <section id="novedades" className="lp-section lp-section-light">
      <div className="lp-container">
        <div className="lp-section-header">
          <div className="lp-section-badge">Novedades</div>
          <h2 className="lp-section-title">Lo último de Disney y Universal</h2>
          <p className="lp-section-sub">Mama Mouse sigue de cerca cada novedad para que tu viaje incluya lo mejor de cada momento.</p>
        </div>
        <div className="lp-novedades-grid">
          {NOVEDADES.map((n, i) => (
            <div key={i} className={`lp-novedad-card ${n.destacado ? 'lp-novedad-destacada' : ''}`}>
              <div className="lp-novedad-top">
                <span className="lp-novedad-tag">{n.tag}</span>
                <span className="lp-novedad-fecha">{n.fecha}</span>
              </div>
              <div className="lp-novedad-emoji">{n.emoji}</div>
              <h3 className="lp-novedad-titulo">{n.titulo}</h3>
              <p className="lp-novedad-desc">{n.desc}</p>
              <button className="lp-otro-cta" onClick={onCotizarClick}>Consultame sobre esto →</button>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── HISTORIAS ──────────────────────────────────────────────────────────── */
function Historias({ onCotizarClick }) {
  const [resenas, setResenas] = useState([])

  useEffect(() => {
    fetch('/api/resenas')
      .then(r => r.json())
      .then(data => { if (data.ok) setResenas(data.resenas) })
      .catch(() => {})
  }, [])

  const todas = [
    ...HISTORIAS,
    ...resenas.map(r => ({
      avatar: r.avatar, nombre: r.nombre, origen: r.origen,
      destino: r.destino, emoji: r.emoji || '⭐',
      titulo: r.titulo, historia: r.historia,
      highlights: r.highlights || [],
      esResena: true,
    })),
  ]

  const scrollToResena = () => document.getElementById('resena')?.scrollIntoView({ behavior: 'smooth' })

  return (
    <section id="historias" className="lp-section">
      <div className="lp-container">
        <div className="lp-section-header">
          <div className="lp-section-badge">Historias reales</div>
          <h2 className="lp-section-title">Familias que ya vivieron<br />su viaje mágico</h2>
          <p className="lp-section-sub">Cada historia es única. Estas son las de algunas de las familias que confiaron en Mama Mouse para el viaje de su vida.</p>
        </div>
        <div className="lp-historias-list">
          {todas.map((h, i) => (
            <div key={i} className={`lp-historia-card ${i % 2 === 1 ? 'lp-historia-alt' : ''} ${h.esResena ? 'lp-historia-resena' : ''}`}>
              <div className="lp-historia-avatar-col">
                <div className="lp-historia-avatar">{h.avatar}</div>
                <div className="lp-historia-destino-badge">{h.emoji} {h.destino}</div>
                {h.esResena && <span className="lp-resena-badge">⭐ Reseña verificada</span>}
              </div>
              <div className="lp-historia-content">
                <div className="lp-historia-meta">
                  <strong>{h.nombre}</strong>
                  {h.origen && <span>· {h.origen}</span>}
                </div>
                <h3 className="lp-historia-titulo">"{h.titulo}"</h3>
                <p className="lp-historia-texto">{h.historia}</p>
                {h.highlights?.length > 0 && (
                  <div className="lp-historia-highlights">
                    {h.highlights.map((hl, j) => (
                      <span key={j} className="lp-historia-highlight">✨ {hl}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="lp-historias-cta-row">
          <button className="lp-btn-primary" onClick={onCotizarClick}>
            Quiero escribir mi propia historia →
          </button>
          <button className="lp-btn-secondary" onClick={scrollToResena}>
            ⭐ Dejar mi reseña
          </button>
        </div>
      </div>
    </section>
  )
}

/* ─── DEJAR RESEÑA ───────────────────────────────────────────────────────── */
const AVATARES_OPT = [
  { emoji: '👨‍👩‍👧', label: 'Familia con 1 hijo' },
  { emoji: '👨‍👩‍👦‍👦', label: 'Familia con 2 hijos' },
  { emoji: '👨‍👩‍👧‍👦', label: 'Familia con hijos' },
  { emoji: '👫', label: 'Pareja' },
  { emoji: '👩‍👦', label: 'Mamá e hijo' },
  { emoji: '👴👵', label: 'Abuelos' },
  { emoji: '🧑‍🤝‍🧑', label: 'Amigos' },
  { emoji: '🙋', label: 'Solo/a' },
]

function DejarResena() {
  const [form, setForm] = useState({ nombre: '', origen: '', destino: '', anio: '', titulo: '', historia: '', avatar: '👨‍👩‍👧' })
  const [status, setStatus] = useState('idle')
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setStatus('sending')
    try {
      const r = await fetch('/api/resena', {
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
    <section id="resena" className="lp-section lp-section-gradient">
      <div className="lp-container">
        <div className="lp-cotizar-success lp-resena-success">
          <div className="lp-success-icon">🌟</div>
          <h2 style={{ color: 'white' }}>¡Gracias por compartir tu historia!</h2>
          <p style={{ color: 'rgba(255,255,255,0.85)' }}>
            Tu reseña ya está publicada en <strong>Historias Reales</strong>.<br />
            ¡Inspirás a otras familias a animarse a vivir su viaje soñado!
          </p>
        </div>
      </div>
    </section>
  )

  return (
    <section id="resena" className="lp-section lp-section-gradient">
      <div className="lp-container">
        <div className="lp-section-header lp-section-header-light">
          <div className="lp-section-badge lp-badge-light">Dejá tu reseña</div>
          <h2 className="lp-section-title lp-title-light">¿Ya viajaste con Mama Mouse?<br />¡Contanos tu historia!</h2>
          <p className="lp-section-sub lp-sub-light">Tu experiencia puede inspirar a cientos de familias a animarse a vivir su propio viaje mágico. Se publica de forma inmediata en Historias Reales.</p>
        </div>

        <form className="lp-form lp-resena-form" onSubmit={handleSubmit}>

          {/* Selección de avatar */}
          <div className="lp-resena-avatar-section">
            <p className="lp-resena-avatar-label">¿Cómo viajaste?</p>
            <div className="lp-resena-avatares">
              {AVATARES_OPT.map(a => (
                <button
                  key={a.emoji} type="button"
                  className={`lp-resena-avatar-btn ${form.avatar === a.emoji ? 'lp-resena-avatar-active' : ''}`}
                  onClick={() => set('avatar', a.emoji)}
                  title={a.label}
                >
                  <span>{a.emoji}</span>
                  <span>{a.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="lp-form-grid">
            <div className="lp-form-field">
              <label>Tu nombre *</label>
              <input required value={form.nombre} onChange={e => set('nombre', e.target.value)} placeholder="Ej: Familia García" />
            </div>
            <div className="lp-form-field">
              <label>Ciudad de origen</label>
              <input value={form.origen} onChange={e => set('origen', e.target.value)} placeholder="Ej: Rosario, Santa Fe" />
            </div>
            <div className="lp-form-field">
              <label>Destino visitado *</label>
              <select required value={form.destino} onChange={e => set('destino', e.target.value)}>
                <option value="">— Seleccioná —</option>
                {DESTINOS_OPT.filter(d => d !== 'Otros').map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div className="lp-form-field">
              <label>Año del viaje</label>
              <input value={form.anio} onChange={e => set('anio', e.target.value)} placeholder="Ej: Diciembre 2025" />
            </div>
            <div className="lp-form-field lp-form-full">
              <label>Título de tu historia *</label>
              <input required value={form.titulo} onChange={e => set('titulo', e.target.value)} placeholder="Ej: El viaje que siempre soñamos" />
            </div>
            <div className="lp-form-field lp-form-full">
              <label>Contanos tu experiencia *</label>
              <textarea
                required
                value={form.historia}
                onChange={e => set('historia', e.target.value)}
                placeholder="Contanos cómo fue tu viaje, qué fue lo que más disfrutaron, cómo los ayudó Mama Mouse..."
                style={{ minHeight: 140 }}
              />
            </div>
          </div>

          {status === 'error' && <div className="lp-form-error">❌ Hubo un error al enviar. Intentá de nuevo o escribinos por WhatsApp.</div>}

          <div className="lp-form-footer">
            <button type="submit" className="lp-btn-primary lp-btn-white lp-btn-submit" disabled={status === 'sending'}>
              {status === 'sending' ? '⏳ Publicando…' : '🌟 Publicar mi reseña'}
            </button>
          </div>
        </form>
      </div>
    </section>
  )
}

/* ─── PROCESO ───────────────────────────────────────────────────────────── */
function Proceso({ onCotizarClick }) {
  return (
    <section id="proceso" className="lp-section">
      <div className="lp-container">
        <div className="lp-section-header">
          <div className="lp-section-badge">Proceso</div>
          <h2 className="lp-section-title">¿Cómo planeamos tu viaje?</h2>
          <p className="lp-section-sub">Simple, transparente y sin sorpresas.</p>
        </div>
        <div className="lp-pasos-grid">
          {PASOS.map((p, i) => (
            <div key={i} className="lp-paso-card lp-paso-card-light">
              <div className="lp-paso-num">{p.num}</div>
              <div className="lp-paso-icon">{p.icon}</div>
              <h3 className="lp-paso-title lp-paso-title-dark">{p.title}</h3>
              <p className="lp-paso-desc lp-paso-desc-dark">{p.desc}</p>
            </div>
          ))}
        </div>
        <div className="lp-proceso-cta">
          <button className="lp-btn-primary" onClick={onCotizarClick}>
            Empezar ahora — es gratis ✨
          </button>
        </div>
      </div>
    </section>
  )
}

/* ─── FORMULARIO DE COTIZACIÓN ──────────────────────────────────────────── */
function Cotizar() {
  const [form, setForm]     = useState({ nombre: '', email: '', telefono: '', destino: '', fechas: '', adultos: '2', ninos: '0', edadesNinos: [], mensaje: '' })
  const [status, setStatus] = useState('idle')

  const set = (k, v) => {
    if (k === 'ninos') {
      const n = Math.min(parseInt(v) || 0, 20)
      setForm(f => ({
        ...f,
        ninos: String(n),
        edadesNinos: Array.from({ length: n }, (_, i) => f.edadesNinos[i] ?? ''),
      }))
    } else {
      setForm(f => ({ ...f, [k]: v }))
    }
  }
  const setEdad = (i, v) => setForm(f => {
    const arr = [...f.edadesNinos]; arr[i] = v; return { ...f, edadesNinos: arr }
  })

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

            {parseInt(form.ninos) > 0 && (
              <div className="lp-form-field lp-form-full">
                <label>Edades de los niños</label>
                <div className="lp-form-edades-row">
                  {form.edadesNinos.map((edad, i) => (
                    <div key={i} className="lp-form-edad-item">
                      <span>Niño {i + 1}</span>
                      <input
                        type="number" min="0" max="17"
                        placeholder="años"
                        value={edad}
                        onChange={e => setEdad(i, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

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
              <li>📄 Documentos y bauchers</li>
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
            <div className="lp-footer-respaldo">
              <span className="lp-footer-respaldo-label">Respaldada por</span>
              <img src="/fasttravel-logo.png" alt="Fast Travel Vacation" className="lp-footer-ft-logo" />
            </div>
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
              <a href="#otros-destinos">Disneyland París</a>
              <a href="#otros-destinos">Cruceros Disney</a>
              <a href="#otros-destinos">Cancún & Caribe</a>
            </div>
            <div className="lp-footer-col">
              <h4>Nosotros</h4>
              <a href="#sobre-nosotros">Sobre Mama Mouse</a>
              <a href="#agente-oficial">Por qué un agente oficial</a>
              <a href="#guias">Guías de viaje</a>
              <a href="#novedades">Novedades</a>
              <a href="#historias">Historias reales</a>
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
  const scrollToCotizar = () => document.getElementById('cotizar')?.scrollIntoView({ behavior: 'smooth' })

  return (
    <div className="lp-root">
      <Navbar onLoginClick={onLoginClick} />
      <Hero onCotizarClick={scrollToCotizar} onLoginClick={onLoginClick} />
      <LogosStrip />
      <SobreMamaMouse onCotizarClick={scrollToCotizar} />
      <AgenteOficial />
      <Destinos onCotizarClick={scrollToCotizar} />
      <OtrosDestinos onCotizarClick={scrollToCotizar} />
      <Guias onCotizarClick={scrollToCotizar} />
      <Novedades onCotizarClick={scrollToCotizar} />
      <Historias onCotizarClick={scrollToCotizar} />
      <DejarResena />
      <Proceso onCotizarClick={scrollToCotizar} />
      <Cotizar />
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
