import { defineConfig } from 'vite'
import react            from '@vitejs/plugin-react'
import { writeFile, access } from 'node:fs/promises'
import path             from 'node:path'
import dotenv           from 'dotenv'

// Carga variables de entorno para el middleware del servidor
dotenv.config()

// Helper: leer body completo de la request
function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', c => chunks.push(c))
    req.on('end', () => resolve(Buffer.concat(chunks).toString()))
    req.on('error', reject)
  })
}

// Helper: respuesta JSON
function jsonRes(res, status, data) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.end(JSON.stringify(data))
}

// Detectar si un archivo existe
async function fileExists(p) {
  try { await access(p); return true } catch { return false }
}

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'mama-mouse-api',
      async configureServer(server) {
        // Importamos el notificador dinámicamente (necesita el servidor ya levantado)
        const { notifyBookingCreated, notifyBookingSummary } = await import('./server/notifier.mjs')

        server.middlewares.use(async (req, res, next) => {
          const url = req.url.split('?')[0]

          // ── POST /api/booking – Guardar reserva ────────────────────────────
          if (url === '/api/booking' && req.method === 'POST') {
            try {
              const { id, data, notifyOnCreate } = JSON.parse(await readBody(req))
              const filePath = path.resolve('public/bookings', `${id}.json`)
              const isNew    = !(await fileExists(filePath))

              await writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8')
              console.log(`[API] Reserva guardada: ${id}`)

              // Enviar notificación de bienvenida si es nueva reserva
              let notifResult = null
              if ((isNew || notifyOnCreate) && (data.email || data.telefono)) {
                console.log(`[API] Nueva reserva detectada, enviando notificación de bienvenida...`)
                notifResult = await notifyBookingCreated(data).catch(e => ({ error: e.message }))
              }

              jsonRes(res, 200, { ok: true, isNew, notifResult })
            } catch (e) {
              console.error('[API] Error saving booking:', e.message)
              jsonRes(res, 500, { ok: false, error: e.message })
            }
            return
          }

          // ── POST /api/notify/summary – Enviar resumen al viajero ──────────
          if (url === '/api/notify/summary' && req.method === 'POST') {
            try {
              const { booking } = JSON.parse(await readBody(req))
              if (!booking.email && !booking.telefono) {
                return jsonRes(res, 400, { ok: false, error: 'La reserva no tiene email ni teléfono' })
              }
              const results = await notifyBookingSummary(booking)
              console.log(`[API] Notificación de resumen enviada para: ${booking.id}`)
              jsonRes(res, 200, { ok: true, results })
            } catch (e) {
              console.error('[API] Error enviando notificación:', e.message)
              jsonRes(res, 500, { ok: false, error: e.message })
            }
            return
          }

          next()
        })
      }
    }
  ]
})
