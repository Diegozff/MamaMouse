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
import nodemailer     from 'nodemailer'

// Cargar variables de entorno
dotenv.config()

// ── Transporter de email ──────────────────────────────────────────────────────
const mailer = nodemailer.createTransport({
  host:   process.env.SMTP_HOST   || 'smtp.gmail.com',
  port:   Number(process.env.SMTP_PORT || 587),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

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
    const { nombre, email, telefono, destino, fechas, adultos, ninos, edadesNinos, mensaje } = req.body
    console.log(`[API] Cotización de ${nombre} (${email} / ${telefono}) → ${destino}`)

    // Guardar en archivo de leads (opcional, no crítico)
    try {
      const leadsPath = path.join(__dirname, 'public', 'leads.json')
      let leads = []
      try { leads = JSON.parse(await readFile(leadsPath, 'utf-8')) } catch {}
      leads.push({ nombre, email, telefono, destino, fechas, adultos, ninos, edadesNinos, mensaje, fecha: new Date().toISOString() })
      await writeFile(leadsPath, JSON.stringify(leads, null, 2), 'utf-8')
    } catch (e) { console.warn('[API] No se pudo guardar lead:', e.message) }

    // ── Enviar email a Carolina ──────────────────────────────────────────────
    const edadesStr = edadesNinos?.length
      ? `\nEdades de los niños: ${edadesNinos.join(', ')} años`
      : ''

    const htmlBody = `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#fafafa;border-radius:12px;">
  <h2 style="color:#9B7EC8;margin-bottom:4px;">🐭 Nueva consulta de cotización</h2>
  <p style="color:#888;margin-top:0;font-size:13px;">Mama Mouse – ${new Date().toLocaleString('es-AR')}</p>
  <hr style="border:none;border-top:1px solid #eee;margin:16px 0"/>
  <table style="width:100%;border-collapse:collapse;font-size:15px;">
    <tr><td style="padding:8px 0;color:#666;width:140px;"><strong>Nombre</strong></td><td>${nombre || '—'}</td></tr>
    <tr><td style="padding:8px 0;color:#666;"><strong>Email</strong></td><td>${email || '—'}</td></tr>
    <tr><td style="padding:8px 0;color:#666;"><strong>WhatsApp</strong></td><td>${telefono || '—'}</td></tr>
    <tr><td style="padding:8px 0;color:#666;"><strong>Destino</strong></td><td>${destino || '—'}</td></tr>
    <tr><td style="padding:8px 0;color:#666;"><strong>Fechas</strong></td><td>${fechas || '—'}</td></tr>
    <tr><td style="padding:8px 0;color:#666;"><strong>Adultos</strong></td><td>${adultos || '—'}</td></tr>
    <tr><td style="padding:8px 0;color:#666;"><strong>Niños</strong></td><td>${ninos || '0'}${edadesStr ? ' — Edades: ' + edadesNinos.join(', ') + ' años' : ''}</td></tr>
    ${mensaje ? `<tr><td style="padding:8px 0;color:#666;vertical-align:top;"><strong>Mensaje</strong></td><td>${mensaje}</td></tr>` : ''}
  </table>
  <hr style="border:none;border-top:1px solid #eee;margin:16px 0"/>
  <p style="font-size:12px;color:#aaa;">Enviado desde el formulario de cotización de mamamouse.com.ar</p>
</div>`

    mailer.sendMail({
      from:    process.env.EMAIL_FROM || 'Mama Mouse <noreply@mamamouse.com.ar>',
      to:      'carolina@fasttravelvacation.com',
      subject: `🐭 Nueva consulta: ${nombre} → ${destino || 'sin destino'}`,
      html:    htmlBody,
    }).then(() => console.log(`[API] Email cotización enviado a carolina@fasttravelvacation.com`))
      .catch(e => console.warn('[API] Error enviando email cotización:', e.message))

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

// ── API: Reseñas de viajeros ──────────────────────────────────────────────────
const RESENAS_FILE = path.join(PUBLIC_DIR, 'resenas.json')

app.get('/api/resenas', async (req, res) => {
  try {
    let resenas = []
    try { resenas = JSON.parse(await readFile(RESENAS_FILE, 'utf-8')) } catch {}
    res.json({ ok: true, resenas: resenas.filter(r => r.publicada !== false) })
  } catch (e) {
    console.error('[API] Error leyendo reseñas:', e.message)
    res.status(500).json({ ok: false, error: e.message })
  }
})

app.post('/api/resena', async (req, res) => {
  try {
    const { nombre, origen, destino, anio, titulo, historia, avatar } = req.body
    if (!nombre?.trim() || !titulo?.trim() || !historia?.trim()) {
      return res.status(400).json({ ok: false, error: 'Faltan campos obligatorios' })
    }
    let resenas = []
    try { resenas = JSON.parse(await readFile(RESENAS_FILE, 'utf-8')) } catch {}
    const nueva = {
      id: Date.now().toString(),
      nombre: nombre.trim(),
      origen: origen?.trim() || '',
      destino: [destino?.trim(), anio?.trim()].filter(Boolean).join(' · '),
      titulo: titulo.trim(),
      historia: historia.trim(),
      avatar: avatar || '⭐',
      emoji: '⭐',
      highlights: [],
      fecha: new Date().toISOString(),
      publicada: true,
    }
    resenas.push(nueva)
    await writeFile(RESENAS_FILE, JSON.stringify(resenas, null, 2), 'utf-8')
    console.log(`[API] Nueva reseña de ${nombre}`)
    res.json({ ok: true })
  } catch (e) {
    console.error('[API] Error guardando reseña:', e.message)
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

// ── API: Test de email ────────────────────────────────────────────────────────
app.get('/api/test-email', async (req, res) => {
  const cfg = {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    user: process.env.SMTP_USER,
    passSet: !!process.env.SMTP_PASS,
  }
  console.log('[API] Test email – config:', cfg)
  try {
    await mailer.sendMail({
      from:    process.env.EMAIL_FROM || 'Mama Mouse <noreply@mamamouse.com.ar>',
      to:      'carolina@fasttravelvacation.com',
      subject: '🐭 Test email – Mama Mouse',
      text:    'Este es un email de prueba enviado desde el servidor de Mama Mouse.',
    })
    res.json({ ok: true, msg: 'Email enviado correctamente', cfg })
  } catch (e) {
    console.error('[API] Test email error:', e.message)
    res.status(500).json({ ok: false, error: e.message, cfg })
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
  console.log(`   Env:      ${process.env.NODE_ENV || 'development'}`)
  console.log(`   SMTP:     ${process.env.SMTP_USER || '⚠️  NO CONFIGURADO'} → ${process.env.SMTP_HOST || '?'}:${process.env.SMTP_PORT || '?'}`)
  console.log(`   Email cotizaciones → carolina@fasttravelvacation.com\n`)
})
