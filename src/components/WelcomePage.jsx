export default function WelcomePage() {
  return (
    <div className="welcome-page">
      <div className="welcome-card">
        <img src="/logo.png" alt="Mama Mouse" className="welcome-logo" />
        <h1 className="welcome-title">Mama Mouse Viajes</h1>
        <p className="welcome-sub">Tu agencia especialista en Disney &amp; Universal</p>

        <div className="welcome-divider" />

        <div className="welcome-icon">🏰</div>
        <h2 className="welcome-heading">¡Tu aventura te espera!</h2>
        <p className="welcome-text">
          Para ver tu reserva, usá el link personalizado<br />
          que te envió tu agente de viajes.
        </p>

        <div className="welcome-example">
          <span className="welcome-example-label">Tu link es algo como:</span>
          <code className="welcome-example-code">mamamouse.com.ar/?id=tu-nombre</code>
        </div>

        <div className="welcome-divider" />

        <p className="welcome-contact-label">¿No tenés tu link? Contactanos:</p>
        <div className="welcome-contact-btns">
          <a
            href="https://wa.me/5491112345678?text=Hola!%20Quisiera%20obtener%20el%20link%20de%20mi%20reserva"
            target="_blank"
            rel="noreferrer"
            className="welcome-btn welcome-btn-wa"
          >
            💬 WhatsApp
          </a>
          <a
            href="mailto:dm.zumoffen@gmail.com?subject=Link%20de%20mi%20reserva"
            className="welcome-btn welcome-btn-mail"
          >
            ✉️ Email
          </a>
        </div>
      </div>
    </div>
  )
}
