import { useState } from 'react'

export default function LoginForm({ onLogin, onBack }) {
  const [usuario,  setUsuario]  = useState('')
  const [password, setPassword] = useState('')
  const [status,   setStatus]   = useState('idle') // idle | loading | error

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!usuario.trim() || !password) return
    setStatus('loading')
    try {
      const r = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario: usuario.trim(), password }),
      })
      const data = await r.json()
      if (data.ok) {
        onLogin(data.id)
      } else {
        setStatus('error')
        setTimeout(() => setStatus('idle'), 3000)
      }
    } catch {
      setStatus('error')
      setTimeout(() => setStatus('idle'), 3000)
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        {onBack && (
          <button className="login-back-btn" onClick={onBack}>← Volver</button>
        )}
        <img src="/logo2.jpeg" alt="Mama Mouse" className="login-logo" />

        <h2 className="login-title">Accedé a tu reserva</h2>
        <p className="login-sub">Ingresá con los datos que te dio tu agente</p>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="login-field">
            <label className="login-label">Usuario</label>
            <input
              className={`login-input ${status === 'error' ? 'login-input-error' : ''}`}
              type="text"
              placeholder="tu-usuario"
              value={usuario}
              onChange={e => setUsuario(e.target.value)}
              autoCapitalize="none"
              autoCorrect="off"
              disabled={status === 'loading'}
            />
          </div>
          <div className="login-field">
            <label className="login-label">Contraseña</label>
            <input
              className={`login-input ${status === 'error' ? 'login-input-error' : ''}`}
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              disabled={status === 'loading'}
            />
          </div>

          {status === 'error' && (
            <div className="login-error">❌ Usuario o contraseña incorrectos</div>
          )}

          <button
            className="login-btn"
            type="submit"
            disabled={status === 'loading' || !usuario || !password}
          >
            {status === 'loading' ? '⏳ Ingresando…' : '✈️ Ver mi reserva'}
          </button>
        </form>

        <div className="login-divider" />

        <p className="login-contact-label">¿No tenés tus datos de acceso?</p>
        <div className="login-contact-btns">
          <a
            href="https://wa.me/5493412143631"
            target="_blank"
            rel="noreferrer"
            className="login-contact-btn login-wa"
          >
            💬 WhatsApp
          </a>
          <a
            href="https://instagram.com/mamamouse12"
            target="_blank"
            rel="noreferrer"
            className="login-contact-btn login-ig"
          >
            📸 Instagram
          </a>
        </div>
      </div>
    </div>
  )
}
