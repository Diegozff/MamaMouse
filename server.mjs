/**
 * Mama Mouse – Production Server
 * Sirve la app React + API endpoints en un solo proceso Node.js
 * Uso: npm start  (después de npm run build)
 */

import express        from 'express'
import { writeFile, readFile, readdir, access, mkdir, unlink } from 'node:fs/promises'
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

// DATA_DIR: directorio persistente. En Railway se monta un volumen en /app/data.
// En desarrollo local usa ./data (o ./public como fallback si DATA_PATH no está seteado).
const DATA_DIR    = process.env.DATA_PATH || path.join(__dirname, 'data')
const BOOKINGS_DIR = path.join(DATA_DIR, 'bookings')
const PDFS_DIR     = path.join(DATA_DIR, 'bookings', 'pdfs')
const RESENAS_FILE_DATA = path.join(DATA_DIR, 'resenas.json')

// Crear directorios necesarios
await mkdir(BOOKINGS_DIR, { recursive: true })
await mkdir(PDFS_DIR,     { recursive: true })

// Inicializar: copiar reservas de public/bookings → DATA_DIR/bookings si están vacías
// (solo la primera vez que se monta el volumen en Railway)
async function initDataDir() {
  try {
    const srcDir = path.join(__dirname, 'public', 'bookings')
    const existing = await readdir(BOOKINGS_DIR).catch(() => [])
    const jsonExisting = existing.filter(f => f.endsWith('.json'))
    if (jsonExisting.length === 0) {
      // Volumen nuevo / vacío: copiar archivos semilla desde public/bookings
      const { copyFile } = await import('node:fs/promises')
      const seeds = (await readdir(srcDir).catch(() => [])).filter(f => f.endsWith('.json'))
      for (const f of seeds) {
        await copyFile(path.join(srcDir, f), path.join(BOOKINGS_DIR, f)).catch(() => {})
      }
      if (seeds.length) console.log(`[Init] Copiados ${seeds.length} archivos semilla a DATA_DIR`)
    }
  } catch (e) { console.warn('[Init] Error inicializando DATA_DIR:', e.message) }
}
await initDataDir()

// ── Notificaciones ────────────────────────────────────────────────────────────
const {
  notifyBookingCreated,
  notifyBookingUpdated,
  notifyPaymentReceived,
  notifyPaymentReminder,
  notifyBookingSummary,
  daysUntil,
} = await import('./server/notifier.mjs')

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
const RESENAS_FILE = RESENAS_FILE_DATA

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

// ── API: Listar todas las reservas ───────────────────────────────────────────
app.get('/api/bookings', async (req, res) => {
  try {
    const files = await readdir(BOOKINGS_DIR)
    const bookings = []
    for (const file of files) {
      if (!file.endsWith('.json')) continue
      try {
        const raw  = await readFile(path.join(BOOKINGS_DIR, file), 'utf-8')
        const data = JSON.parse(raw)
        const id   = file.replace('.json', '')
        let total = 0, paid = 0
        for (const it of (data.items || [])) {
          total += Number(it.total) || 0
          paid  += (it.pagos || []).reduce((s, p) => s + Number(p.monto), 0)
        }
        const saldo  = total - paid
        const estado = saldo <= 0 ? 'pagado' : paid === 0 ? 'pendiente' : 'parcial'
        const fechas = (data.items || []).map(i => i.fechaInicio).filter(Boolean).sort()
        bookings.push({ id, titular: data.titular || id, destinos: data.destinos || [],
          total, paid, saldo, estado, fechaViaje: fechas[0] || '' })
      } catch { /* skip corrupt */ }
    }
    bookings.sort((a, b) => (a.fechaViaje || 'z') < (b.fechaViaje || 'z') ? -1 : 1)
    res.json({ ok: true, bookings })
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message })
  }
})

// ── Helper: resolver credenciales únicas ─────────────────────────────────────
async function resolveUniqueCredentials(apellido) {
  // Leer todos los usuarios y archivos existentes
  const existingUsuarios = new Set()
  try {
    const files = await readdir(BOOKINGS_DIR)
    for (const file of files) {
      if (!file.endsWith('.json')) continue
      try {
        const raw  = await readFile(path.join(BOOKINGS_DIR, file), 'utf-8')
        const data = JSON.parse(raw)
        if (data.usuario) existingUsuarios.add(data.usuario.toLowerCase())
      } catch { /* skip */ }
    }
  } catch { /* directorio vacío */ }

  // Si el apellido base no está tomado, usar directo
  if (!existingUsuarios.has(apellido.toLowerCase())) {
    return { usuario: apellido, password: `${apellido}2026` }
  }

  // Probar con un dígito aleatorio al final hasta encontrar uno libre
  const digits = [1,2,3,4,5,6,7,8,9].sort(() => Math.random() - 0.5)
  for (const d of digits) {
    const candidato = `${apellido}${d}`
    if (!existingUsuarios.has(candidato.toLowerCase())) {
      return { usuario: candidato, password: `${candidato}2026` }
    }
  }

  // Fallback: dos dígitos aleatorios
  const fallback = `${apellido}${Math.floor(Math.random() * 90 + 10)}`
  return { usuario: fallback, password: `${fallback}2026` }
}

// ── Helper: resolver id único (nombre de archivo) ────────────────────────────
async function resolveUniqueId(baseId) {
  // Si el archivo no existe, usar el id tal cual
  const filePath = path.join(BOOKINGS_DIR, `${baseId}.json`)
  if (!(await fileExists(filePath))) return baseId

  // Si existe, agregar sufijo numérico hasta encontrar uno libre
  for (let i = 2; i <= 20; i++) {
    const candidate = `${baseId}-${i}`
    if (!(await fileExists(path.join(BOOKINGS_DIR, `${candidate}.json`)))) {
      return candidate
    }
  }
  return `${baseId}-${Date.now()}`
}

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
  "viajeros": [
    {
      "id": "v1",
      "nombre": "Nombre",
      "apellido": "Apellido",
      "fechaNac": "YYYY-MM-DD",
      "tipoDoc": "DNI o Pasaporte",
      "nroDoc": "número"
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
- Hotel / Hospedaje → 🏨
- Hotel Disney → 🏰
- Tickets Disney → 🎟️
- Tickets Universal → 🎢
- Paquete Universal → 🎢
- Paquete Disney → ✨
- Asistencia al Viajero → 🛡️
- Renta de Auto → 🚗
- Tickets After Hours → 🌙
- Tickets Parques Acuáticos → 🌊

REGLAS DE ORO — CREDENCIALES:
1. id = apellido + guion + primer nombre, todo en minúsculas, sin tildes, sin espacios (ej: "ramirez-maricel", "garcia-pablo", "beltrando-matias"). SIEMPRE incluí el nombre para evitar conflictos entre personas del mismo apellido.
2. usuario = Apellido con mayúscula inicial (ej: "Garcia", "Ramirez")
3. password = Apellido2026 (ej: "Garcia2026", "Ramirez2026")

REGLAS DE ORO — PAGOS (leer con atención):
4. En "pagos[]" van ÚNICAMENTE los pagos que YA FUERON REALIZADOS y acreditados. Nunca montos futuros.

5. CASO — Solo hay Fecha Límite, sin pagos listados:
   El item aún no tiene ningún pago. "pagos" debe ser un array VACÍO [].
   Guardá la fecha límite en "fechaLimite". Ejemplo: Renta de auto con "Fecha Límite de Pago total: 28 de junio 2026" y sin cuotas listadas → pagos: [], fechaLimite: "2026-06-28".

6. CASO — SALDO PENDIENTE con Fecha Límite:
   Si dice "SALDO PENDIENTE: USD X" con "Fecha Límite: DD/MM/YYYY", ese saldo NO va en pagos. Solo registrá los pagos ya realizados. Guardá la fecha límite en "fechaLimite".

7. CASO — ABONADO COMPLETO sin detalle de cuotas:
   Si dice "ABONADO COMPLETO" y no lista cuotas individuales, creá UN SOLO pago por el monto total con fecha aproximada y concepto "Pago total". Ejemplo: total USD 1,056.37 → pagos: [{ fecha: "2026-01-01", monto: 1056.37, concepto: "Pago total" }].

8. CASO — ABONADO COMPLETO con cuotas listadas:
   Registrá cada cuota individualmente. La suma debe ser igual al total.

9. CASO — Impuestos/tasas a pagar en destino:
   Frases como "Impuestos y tasas a pagar en destino: USD X" o "taxes payable at check-in" NO son pagos a la agencia. Mencionálos solo en la descripción del item, NO los incluyas en "total" ni en "pagos".

10. CASO — Saldo a abonar en destino al check-in:
    Si dice explícitamente que hay un monto a pagar EN EL HOTEL (no a la agencia) al hacer check-in, ese monto SÍ va como pago con concepto "Saldo a abonar en destino al check-in".

REGLAS DE ORO — OTROS:
11. Fechas siempre en formato YYYY-MM-DD. Si no tiene año explícito, usá 2026.
12. Los destinos son los parques/lugares visitados (ej: "Walt Disney World", "Universal Orlando", "Miami").
13. Incluí en la descripción: número de reserva, tipo de habitación, huéspedes, extras, promociones, regalos.
14. Cada ítem del email es un item separado en el JSON, aunque tengan el mismo número de lista.
15. Para viajeros: extraé cada pasajero con nombre, apellido, fechaNac y documento si aparecen. Si dice "2 adultos + 1 menor de 8 años" creá 3 entradas vacías con los roles que correspondan.
16. Devolvé SOLO el JSON puro, sin explicaciones ni markdown.`

    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 4096,
        system: systemPrompt,
        messages: [{ role: 'user', content: emailText.trim() }],
      }),
    })

    const aiData = await r.json()
    if (!r.ok) {
      console.error('[API] Anthropic error completo:', JSON.stringify(aiData))
      const msg = aiData.error?.message || aiData.message || JSON.stringify(aiData)
      if (msg.includes('credit') || msg.includes('billing') || r.status === 529 || r.status === 402)
        throw new Error('Sin créditos en Anthropic. Cargá fondos en platform.claude.com → Planes y Facturación.')
      throw new Error(`Anthropic API (${r.status}): ${msg}`)
    }

    const rawText = aiData.content?.[0]?.text || ''
    // Extraer JSON del texto (por si el modelo agrega algún texto extra)
    const jsonMatch = rawText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('El modelo no devolvió un JSON válido')

    const booking = JSON.parse(jsonMatch[0])

    // Resolver id único (apellido-nombre): evitar que dos personas del mismo apellido
    // se pisen el archivo JSON
    booking.id = await resolveUniqueId(booking.id || 'viajero')

    // Resolver credenciales únicas: si el usuario ya está tomado, agregar dígito aleatorio
    const baseApellido = booking.usuario || booking.id.split('-')[0] || 'viajero'
    const { usuario, password } = await resolveUniqueCredentials(
      baseApellido.charAt(0).toUpperCase() + baseApellido.slice(1).toLowerCase()
    )
    booking.usuario  = usuario
    booking.password = password

    console.log(`[API] Reserva parseada: ${booking.titular} → id: ${booking.id} | usuario: ${usuario}`)
    res.json({ ok: true, booking })

  } catch (e) {
    console.error('[API] Error import-booking:', e.message)
    res.status(500).json({ ok: false, error: e.message })
  }
})

// ── API: Guardar reserva ──────────────────────────────────────────────────────
app.post('/api/booking', async (req, res) => {
  try {
    const { id, data, notify } = req.body
    if (!id || !data) return res.status(400).json({ ok: false, error: 'Faltan id o data' })

    const filePath = path.join(BOOKINGS_DIR, `${id}.json`)
    const isNew    = !(await fileExists(filePath))

    // Leer reserva anterior para detectar cambios (solo si existe)
    let oldData = null
    if (!isNew) {
      try { oldData = JSON.parse(await readFile(filePath, 'utf-8')) } catch {}
    }

    await writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8')
    console.log(`[API] Reserva guardada: ${id}`)

    let notifResult = null
    const contact = data.email || data.telefono

    if (contact) {
      if (isNew) {
        // ── Nueva reserva: enviar bienvenida ──────────────────────────────
        console.log(`[API] Nueva reserva – enviando bienvenida a ${contact}`)
        notifResult = await notifyBookingCreated(data).catch(e => ({ error: e.message }))

      } else {
        // ── Reserva existente: detectar nuevos pagos ──────────────────────
        const newPayments = []
        for (const item of (data.items || [])) {
          const oldItem = (oldData?.items || []).find(i => i.id === item.id)
          const oldPaidCount = oldItem?.pagos?.length || 0
          const newPagos     = item.pagos || []
          // Pagos que no existían antes
          if (newPagos.length > oldPaidCount) {
            const added = newPagos.slice(oldPaidCount)
            for (const p of added) {
              newPayments.push({
                ...p,
                itemTipo:  item.tipo,
                itemIcono: item.icono,
                moneda:    item.moneda,
              })
            }
          }
        }

        if (newPayments.length > 0) {
          // Hay pagos nuevos → notificar pago recibido
          console.log(`[API] ${newPayments.length} pago(s) nuevo(s) en ${id} – notificando`)
          notifResult = await notifyPaymentReceived(data, newPayments).catch(e => ({ error: e.message }))
        } else if (notify === 'update') {
          // El admin pidió explícitamente notificar actualización
          console.log(`[API] Notificando actualización de reserva: ${id}`)
          notifResult = await notifyBookingUpdated(data).catch(e => ({ error: e.message }))
        }
      }
    }

    res.json({ ok: true, isNew, notifResult })
  } catch (e) {
    console.error('[API] Error saving booking:', e.message)
    res.status(500).json({ ok: false, error: e.message })
  }
})

// ── API: Eliminar reserva ─────────────────────────────────────────────────────
app.delete('/api/booking/:id', async (req, res) => {
  try {
    const { id } = req.params
    const filePath = path.join(BOOKINGS_DIR, `${id}.json`)
    if (!(await fileExists(filePath)))
      return res.status(404).json({ ok: false, error: 'Reserva no encontrada' })
    await unlink(filePath)
    console.log(`[API] Reserva eliminada: ${id}`)
    res.json({ ok: true })
  } catch (e) {
    console.error('[API] Error eliminando reserva:', e.message)
    res.status(500).json({ ok: false, error: e.message })
  }
})

// ── API: Notificaciones manuales ─────────────────────────────────────────────
app.post('/api/notify/summary', async (req, res) => {
  try {
    const { booking } = req.body
    if (!booking) return res.status(400).json({ ok: false, error: 'Falta booking' })
    if (!booking.email && !booking.telefono)
      return res.status(400).json({ ok: false, error: 'Sin email ni teléfono' })
    const results = await notifyBookingSummary(booking)
    console.log(`[API] Bienvenida enviada: ${booking.id}`)
    res.json({ ok: true, results })
  } catch (e) {
    console.error('[API] Error notify/summary:', e.message)
    res.status(500).json({ ok: false, error: e.message })
  }
})

app.post('/api/notify/update', async (req, res) => {
  try {
    const { booking } = req.body
    if (!booking) return res.status(400).json({ ok: false, error: 'Falta booking' })
    if (!booking.email && !booking.telefono)
      return res.status(400).json({ ok: false, error: 'Sin email ni teléfono' })
    const results = await notifyBookingUpdated(booking)
    console.log(`[API] Actualización notificada: ${booking.id}`)
    res.json({ ok: true, results })
  } catch (e) {
    console.error('[API] Error notify/update:', e.message)
    res.status(500).json({ ok: false, error: e.message })
  }
})

// ── API: Test Anthropic ───────────────────────────────────────────────────────
app.get('/api/test-anthropic', async (req, res) => {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return res.json({ ok: false, error: 'ANTHROPIC_API_KEY no configurado' })
  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Di hola' }],
      }),
    })
    const data = await r.json()
    console.log('[API] Test Anthropic:', JSON.stringify(data))
    res.json({ ok: r.ok, status: r.status, data })
  } catch (e) {
    res.json({ ok: false, error: e.message })
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
// Archivos dinámicos persistentes (bookings, PDFs, reseñas) desde DATA_DIR
app.use('/bookings', express.static(BOOKINGS_DIR))
// Archivos públicos estáticos (imágenes, logos, guías)
app.use(express.static(PUBLIC_DIR))

// ── SPA Fallback: todas las rutas sirven index.html ───────────────────────────
app.get('/{*path}', (req, res) => {
  res.sendFile(path.join(DIST_DIR, 'index.html'))
})

// ── Cron: recordatorios de fechas límite de pago ─────────────────────────────
const REMINDERS_FILE = path.join(__dirname, 'public', 'reminders-sent.json')
const REMINDER_DAYS  = [7, 3, 1, 0] // días antes del vencimiento para avisar

async function loadRemindersSent() {
  try { return JSON.parse(await readFile(REMINDERS_FILE, 'utf-8')) } catch { return {} }
}
async function saveRemindersSent(data) {
  await writeFile(REMINDERS_FILE, JSON.stringify(data, null, 2), 'utf-8').catch(() => {})
}

async function runPaymentReminders() {
  console.log('[Cron] Verificando fechas límite de pago…')
  const sent = await loadRemindersSent()
  const today = new Date().toISOString().slice(0, 10)
  let count = 0

  try {
    const files = await readdir(BOOKINGS_DIR)
    for (const file of files) {
      if (!file.endsWith('.json')) continue
      try {
        const raw     = await readFile(path.join(BOOKINGS_DIR, file), 'utf-8')
        const booking = JSON.parse(raw)
        if (!booking.email && !booking.telefono) continue // sin contacto, skip

        for (const item of (booking.items || [])) {
          if (!item.fechaLimite) continue
          const paid  = (item.pagos || []).reduce((s, p) => s + Number(p.monto), 0)
          const saldo = item.total - paid
          if (saldo <= 0) continue // ya pagado, skip

          const days = daysUntil(item.fechaLimite)
          // Enviar solo para los días configurados
          if (!REMINDER_DAYS.includes(days)) continue

          const key = `${booking.id}-${item.id}-${days}d-${today}`
          if (sent[key]) continue // ya enviado hoy

          console.log(`[Cron] Recordatorio: ${booking.titular} | ${item.tipo} | ${days}d`)
          await notifyPaymentReminder(booking, item, days).catch(e => console.warn('[Cron] Error notif:', e.message))
          sent[key] = today
          count++
        }
      } catch { /* skip archivo corrupto */ }
    }
  } catch (e) { console.error('[Cron] Error:', e.message) }

  await saveRemindersSent(sent)
  console.log(`[Cron] Recordatorios enviados: ${count}`)
}

// ── API: Disparar recordatorios manualmente (para cron externo o testing) ─────
app.get('/api/run-reminders', async (req, res) => {
  // Protección mínima con token secreto
  const token = process.env.CRON_SECRET || 'mamamouse-cron'
  if (req.query.token !== token) {
    return res.status(401).json({ ok: false, error: 'Token inválido' })
  }
  try {
    await runPaymentReminders()
    res.json({ ok: true, message: 'Recordatorios procesados', timestamp: new Date().toISOString() })
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message })
  }
})

// ── Arrancar servidor ─────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🐭 Mama Mouse Server corriendo`)
  console.log(`   Local:    http://localhost:${PORT}`)
  console.log(`   Dominio:  ${process.env.APP_URL || 'https://www.mamamouse.com.ar'}`)
  console.log(`   Admin:    ${process.env.APP_URL || 'http://localhost:' + PORT}/?admin`)
  console.log(`   Env:      ${process.env.NODE_ENV || 'development'}`)
  console.log(`   Brevo:    ${process.env.BREVO_API_KEY ? '✅ configurado' : '⚠️  NO CONFIGURADO'}`)
  console.log(`   Email cotizaciones → dm.zumoffen@gmail.com\n`)

  // Ejecutar cron de recordatorios: al iniciar y luego cada 24hs
  runPaymentReminders()
  setInterval(runPaymentReminders, 24 * 60 * 60 * 1000)
})
