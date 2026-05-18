import { useState } from 'react'

const PASS = import.meta.env.VITE_ADMIN_PASS || 'mamamouse'

export default function AdminLogin({ onLogin }) {
  const [pass, setPass] = useState('')
  const [error, setError] = useState(false)

  const handleSubmit = () => {
    if (pass === PASS) { onLogin() }
    else { setError(true); setTimeout(() => setError(false), 2000) }
  }

  return (
    <div className="admin-login">
      <div className="admin-login-card">
        <img src="/logo.png" alt="Mama Mouse" className="admin-login-logo" />
        <h2 className="admin-login-title">Panel de Administración</h2>
        <p className="admin-login-sub">Mama Mouse · Agente Oficial</p>
        <input
          className={`admin-input ${error ? 'admin-input-error' : ''}`}
          type="password"
          placeholder="Contraseña"
          value={pass}
          onChange={e => setPass(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          autoFocus
        />
        {error && <p className="admin-login-error">Contraseña incorrecta</p>}
        <button className="admin-btn admin-btn-primary" onClick={handleSubmit}>
          Ingresar ✨
        </button>
      </div>
    </div>
  )
}
