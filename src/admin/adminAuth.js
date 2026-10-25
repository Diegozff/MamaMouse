// Sesión del panel admin: la contraseña se valida en el servidor (/api/admin/login)
// y el navegador solo guarda un token firmado con vencimiento.
const KEY = 'mm_admin_token'

export function getToken() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const { t, exp } = JSON.parse(raw)
    if (!t || exp < Date.now()) { localStorage.removeItem(KEY); return null }
    return t
  } catch { return null }
}

function setToken(t, ttlMs) {
  try { localStorage.setItem(KEY, JSON.stringify({ t, exp: Date.now() + ttlMs - 60_000 })) } catch {}
}

export function clearToken() {
  try { localStorage.removeItem(KEY) } catch {}
}

export async function adminLogin(password) {
  const r = await fetch('/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  })
  const d = await r.json().catch(() => ({}))
  if (!r.ok || !d.ok) throw new Error(d.error || 'Contraseña incorrecta')
  setToken(d.token, d.expiresInMs)
}

// Agrega "Authorization: Bearer <token>" a los pedidos a /api/ y /bookings/ cuando
// hay sesión de admin, así no hay que tocar cada fetch del panel. Si el servidor
// responde 401 avisa con un evento para pedir la contraseña SIN desmontar el panel
// (lo que el usuario tenía cargado en pantalla no se pierde).
let installed = false
export function installAdminFetch() {
  if (installed || typeof window === 'undefined') return
  installed = true
  const orig = window.fetch.bind(window)
  window.fetch = (input, init = {}) => {
    const url   = typeof input === 'string' ? input : (input?.url || '')
    const local = url.startsWith('/api/') || url.startsWith('/bookings/')
    const tok   = local ? getToken() : null
    if (tok) {
      const headers = new Headers(init.headers || (typeof input !== 'string' ? input.headers : undefined))
      headers.set('Authorization', `Bearer ${tok}`)
      init = { ...init, headers }
    }
    return orig(input, init).then(res => {
      if (res.status === 401 && url.startsWith('/api/') && url !== '/api/login' && url !== '/api/admin/login') {
        window.dispatchEvent(new Event('mm-admin-unauth'))
      }
      return res
    })
  }
}
