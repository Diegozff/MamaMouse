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

// ── Email vía Brevo API (HTTPS – funciona en Railway sin puertos SMTP) ────────
async function sendEmail({ to, subject, html, text }) {
  const apiKey = process.env.BREVO_API_KEY
  if (!apiKey) throw new Error('BREVO_API_KEY no configurado en Railway Variables')

  const senderEmail = process.env.SMTP_USER || 'dm.zumoffen@gmail.com'

  const r = await fetch('https://api.brevo.com/v3/smtp/email', {
    method:  'POST',
    headers: { 'api-key': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sender:      { name: 'Mama Mouse', email: senderEmail },
      to:          [{ email: to }],
      subject,
      htmlContent: html,
      textContent: text || subject,
    }),
  })
  const data = await r.json()
  if (!r.ok) throw new Error(JSON.stringify(data))
  return data
}

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
        if (data.usuario?.toLowerCase() === usuario.trim().toLowerCase() && data.password === password) {
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

    sendEmail({
      to:      'dm.zumoffen@gmail.com',
      subject: `🐭 Nueva consulta: ${nombre} → ${destino || 'sin destino'}`,
      html:    htmlBody,
    }).then(() => console.log(`[API] Email cotización enviado a dm.zumoffen@gmail.com`))
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

// ── API: Importar reserva desde email (Claude AI) ────────────────────────────
app.post('/api/import-booking', async (req, res) => {
  try {
    const { emailText } = req.body
    if (!emailText?.trim()) return res.status(400).json({ ok: false, error: 'Falta el texto del email' })

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) return res.status(500).json({ ok: false, error: 'ANTHROPIC_API_KEY no configurado en Railway Variables' })

    const systemPrompt = `Sos un asistente especializado en parsear emails de reservas de viajes para la agencia Mama Mouse (agencia argentina especializada en Disney y Universal).

Extraé la información del email y devolvé un JSON válido con esta estructura exacta:
{
  "titular": "Nombre completo del titular",
  "id": "apellido-en-minusculas",
  "usuario": "Apellido",
  "password": "Apellido2026",
  "email": "",
  "telefono": "",
  "destinos": [],
  "items": [
    {
      "id": "id-corto-unico",
      "tipo": "Tipo de servicio",
      "icono": "emoji",
      "descripcion": "Descripción detallada. Incluí número de reserva si existe.",
      "moneda": "USD",
      "total": 0,
      "fechaInicio": "YYYY-MM-DD",
      "fechaFin": "YYYY-MM-DD",
      "fechaLimite": "",
      "pagos": [
        { "fecha": "YYYY-MM-DD", "monto": 0, "concepto": "descripción" }
      ]
    }
  ],
  "promos": [],
  "regalos": [],
  "vouchers": [],
  "itinerario": [],
  "tips": []
}

TIPOS DE SERVICIO Y SUS ICONOS:
- Aéreos → ✈️
- Hoteles → 🏨
- Hotel Disney → 🏰
- Tickets Disney → 🎟️
- Tickets Universal → 🎢
- Paquete Universal → 🎢
- Paquete Disney → ✨
- Asistencia al Viajero → 🛡️
- Renta de Auto → 🚗

REGLAS DE ORO:
1. id = apellido del titular en minúsculas, sin espacios ni tildes (ej: "garcia", "beltrando")
2. usuario = Apellido con mayúscula inicial (ej: "Garcia")
3. password = Apellido2026 (ej: "Garcia2026")
4. Si dice "ABONADO COMPLETO" y hay un saldo en destino, el saldo va como pago con concepto "Saldo a abonar en destino al check-in"
5. Si dice "ABONADO COMPLETO" sin saldo, los pagos deben sumar el total exacto
6. Fechas siempre en YYYY-MM-DD. Si no tiene año, usá 2026
7. Los destinos son los parques/lugares visitados (ej: "Walt Disney World", "Universal Orlando")
8. Incluí toda la info relevante en la descripción del item (número de reserva, habitación, extras, etc.)
9. Devolvé SOLO el JSON puro, sin explicaciones ni markdown`

    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 4096,
        system: systemPrompt,
        messages: [{ role: 'user', content: emailText.trim() }],
      }),
    })

    const aiData = await r.json()
    if (!r.ok) {
      const msg = aiData.error?.message || aiData.message || JSON.stringify(aiData)
      if (msg.includes('credit') || msg.includes('billing') || r.status === 529 || r.status === 402)
        throw new Error('Sin créditos en Anthropic. Cargá fondos en platform.claude.com → Planes y Facturación.')
      throw new Error(`Anthropic API: ${msg}`)
    }

    const rawText = aiData.content?.[0]?.text || ''
    // Extraer JSON del texto (por si el modelo agrega algún texto extra)
    const jsonMatch = rawText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('El modelo no devolvió un JSON válido')

    const booking = JSON.parse(jsonMatch[0])
    console.log(`[API] Reserva parseada: ${booking.titular} → id: ${booking.id}`)
    res.json({ ok: true, booking })

  } catch (e) {
    console.error('[API] Error import-booking:', e.message)
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
  res.setHeader('Content-Type', 'application/json')
  const cfg = { resendKeySet: !!process.env.RESEND_API_KEY }
  console.log('[API] Test email – config:', cfg)
  try {
    const info = await sendEmail({
      to:      'dm.zumoffen@gmail.com',
      subject: '🐭 Test email – Mama Mouse',
      text:    'Este es un email de prueba enviado desde el servidor de Mama Mouse.',
      html:    '<h2>🐭 Test Mama Mouse</h2><p>Email de prueba enviado correctamente.</p>',
    })
    console.log('[API] Test email OK:', JSON.stringify(info))
    return res.json({ ok: true, msg: 'Email enviado a dm.zumoffen@gmail.com', info, cfg })
  } catch (e) {
    console.error('[API] Test email ERROR:', e.message)
    return res.status(500).json({ ok: false, error: e.message, cfg })
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
  console.log(`   Email cotizaciones → dm.zumoffen@gmail.com\n`)
})
