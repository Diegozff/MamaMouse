/**
 * Mama Mouse – Production Server
 * Sirve la app React + API endpoints en un solo proceso Node.js
 * Uso: npm start  (después de npm run build)
 */

import express        from 'express'
import { writeFile, readFile, readdir, access, mkdir } from 'node:fs/promises'
import path           from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv         from 'dotenv'

// Cargar variables de entorno
dotenv.config()

const __dirname   = path.dirname(fileURLToPath(import.meta.url))
const PORT        = process.env.PORT || 3000
const DIST_DIR    = path.join(__dirname, 'dist')
const PUBLIC_DIR  = path.join(__dirname, 'public')
const BOOKINGS_DIR = path.join(__dirname, 'public', 'bookings')
const PDFS_DIR     = path.join(__dirname, 'public', 'bookings', 'pdfs')

// Asegurar que exista el directorio de PDFs
await mkdir(PDFS_DIR, { recursive: true })

// ── Notificaciones ────────────────────────────────────────────────────────────
const { notifyBookingCreated, notifyBookingSummary } = await import('./server/notifier.mjs')

// ── App Express ───────────────────────────────────────────────────────────────
const app = express()
app.use(express.json())

// Helper: detectar si un archivo existe
async function fileExists(p) {
  try { await access(p); return true } catch { return false }
}

// ── API: Login viajero ────────────────────────────────────────────────────────
app.post('/api/login', async (req, res) => {
  try {
    const { usuario, password } = req.body
    if (!usuario || !password) return res.status(400).json({ ok: false, error: 'Faltan credenciales' })

    const files = await readdir(BOOKINGS_DIR)
    for (const file of files) {
      if (!file.endsWith('.json')) continue
      try {
        const raw  = await readFile(path.join(BOOKINGS_DIR, file), 'utf-8')
        const data = JSON.parse(raw)
        if (data.usuario === usuario.trim() && data.password === password) {
          const id = file.replace('.json', '')
          console.log(`[API] Login exitoso: ${usuario} → ${id}`)
          return res.json({ ok: true, id })
        }
      } catch { /* archivo corrupto, skip */ }
    }
    console.log(`[API] Login fallido: ${usuario}`)
    res.status(401).json({ ok: false, error: 'Usuario o contraseña incorrectos' })
  } catch (e) {
    console.error('[API] Error login:', e.message)
    res.status(500).json({ ok: false, error: e.message })
  }
})

// ── API: Upload PDF ───────────────────────────────────────────────────────────
app.post('/api/upload-pdf/:bookingId/:itemId',
  express.raw({ type: ['application/pdf', 'application/octet-stream'], limit: '20mb' }),
  async (req, res) => {
    try {
      const { bookingId, itemId } = req.params
      const filename = `${bookingId}-${itemId}.pdf`
      await writeFile(path.join(PDFS_DIR, filename), req.body)
      console.log(`[API] PDF guardado: ${filename}`)
      res.json({ ok: true, url: `/bookings/pdfs/${filename}` })
    } catch (e) {
      console.error('[API] Error PDF upload:', e.message)
      res.status(500).json({ ok: false, error: e.message })
    }
  }
)

// ── API: Formulario de cotización ────────────────────────────────────────────
app.post('/api/cotizar', async (req, res) => {
  try {
    const { nombre, email, telefono, destino, fechas, adultos, ninos, mensaje } = req.body
    console.log(`[API] Cotización de ${nombre} (${email} / ${telefono}) → ${destino}`)

    // Guardar en archivo de leads (opcional, no crítico)
    try {
      const leadsPath = path.join(__dirname, 'public', 'leads.json')
      let leads = []
      try { leads = JSON.parse(await readFile(leadsPath, 'utf-8')) } catch {}
      leads.push({ nombre, email, telefono, destino, fechas, adultos, ninos, mensaje, fecha: new Date().toISOString() })
      await writeFile(leadsPath, JSON.stringify(leads, null, 2), 'utf-8')
    } catch (e) { console.warn('[API] No se pudo guardar lead:', e.message) }

    // Notificar por WhatsApp si está configurado
    const WA_TOKEN = process.env.TWILIO_ACCOUNT_SID
    if (WA_TOKEN && notifyBookingCreated) {
      const leadFake = {
        titular: nombre, email, telefono,
        destinos: [destino || 'Disney / Universal'],
        usuario: '', password: '',
        items: []
      }
      notifyBookingCreated(leadFake).catch(e => console.warn('[API] Notif cotizar:', e.message))
    }

    res.json({ ok: true })
  } catch (e) {
    console.error('[API] Error cotizar:', e.message)
    res.status(500).json({ ok: false, error: e.message })
  }
})

// ── API: Guardar reserva ──────────────────────────────────────────────────────
app.post('/api/booking', async (req, res) => {
  try {
    const { id, data } = req.body
    if (!id || !data) return res.status(400).json({ ok: false, error: 'Faltan id o data' })

    const filePath = path.join(BOOKINGS_DIR, `${id}.json`)
    const isNew    = !(await fileExists(filePath))

    await writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8')
    console.log(`[API] Reserva guardada: ${id}`)

    // Notificación automática en nueva reserva
    let notifResult = null
    if (isNew && (data.email || data.telefono)) {
      console.log(`[API] Nueva reserva – enviando bienvenida a ${data.email || data.telefono}`)
      notifResult = await notifyBookingCreated(data).catch(e => ({ error: e.message }))
    }

    res.json({ ok: true, isNew, notifResult })
  } catch (e) {
    console.error('[API] Error saving booking:', e.message)
    res.status(500).json({ ok: false, error: e.message })
  }
})

// ── API: Enviar notificación manual ──────────────────────────────────────────
app.post('/api/notify/summary', async (req, res) => {
  try {
    const { booking } = req.body
    if (!booking) return res.status(400).json({ ok: false, error: 'Falta booking' })
    if (!booking.email && !booking.telefono) {
      return res.status(400).json({ ok: false, error: 'La reserva no tiene email ni teléfono' })
    }
    const results = await notifyBookingSummary(booking)
    console.log(`[API] Notificación manual enviada: ${booking.id}`)
    res.json({ ok: true, results })
  } catch (e) {
    console.error('[API] Error notificación:', e.message)
    res.status(500).json({ ok: false, error: e.message })
  }
})

// ── Archivos estáticos ────────────────────────────────────────────────────────
// La app buildeada de React
app.use(express.static(DIST_DIR))
// Archivos públicos (bookings JSON, guías PDF, logos, etc.)
app.use(express.static(PUBLIC_DIR))

// ── SPA Fallback: todas las rutas sirven index.html ───────────────────────────
app.get('/{*path}', (req, res) => {
  res.sendFile(path.join(DIST_DIR, 'index.html'))
})

// ── Arrancar servidor ─────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🐭 Mama Mouse Server corriendo`)
  console.log(`   Local:    http://localhost:${PORT}`)
  console.log(`   Dominio:  ${process.env.APP_URL || 'https://www.mamamouse.com.ar'}`)
  console.log(`   Admin:    ${process.env.APP_URL || 'http://localhost:' + PORT}/?admin`)
  console.log(`   Env:      ${process.env.NODE_ENV || 'development'}\n`)
})
