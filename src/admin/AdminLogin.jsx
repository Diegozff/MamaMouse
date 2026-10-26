import { useState } from 'react'
import { adminLogin } from './adminAuth'

export default function AdminLogin({ onLogin, expired = false }) {
  const [pass, setPass] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const handleSubmit = async () => {
    if (busy || !pass) return
    setBusy(true)
    try {
      await adminLogin(pass)
      onLogin()
    } catch (e) {
      setError(e.message || 'Contraseña incorrecta')
      setTimeout(() => setError(''), 3000)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="admin-login">
      <div className="admin-login-card">
        <img src="/logo.webp" alt="Mama Mouse" className="admin-login-logo" />
        <h2 className="admin-login-title">Panel de Administración</h2>
        <p className="admin-login-sub">
          {expired ? 'Tu sesión venció. Ingresá de nuevo: no se pierde lo que tenés en pantalla.' : 'Mama Mouse · Agente Oficial'}
        </p>
        <input
          className={`admin-input ${error ? 'admin-input-error' : ''}`}
          type="password"
          placeholder="Contraseña"
          value={pass}
          onChange={e => setPass(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          autoFocus
        />
        {error && <p className="admin-login-error">{error}</p>}
        <button className="admin-btn admin-btn-primary" onClick={handleSubmit} disabled={busy}>
          {busy ? 'Ingresando…' : 'Ingresar ✨'}
        </button>
      </div>
    </div>
  )
}
