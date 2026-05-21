/**
 * Mama Mouse – Daily Reminders Script
 * Ejecutar diariamente: node scripts/daily-reminders.mjs
 * O programar con el Programador de Tareas de Windows.
 *
 * Revisa todas las reservas y envía recordatorios cuando el vencimiento
 * de un ítem está a 7, 4 o 2 días de distancia.
 */

import { readdir, readFile } from 'node:fs/promises'
import { resolve, dirname }  from 'node:path'
import { fileURLToPath }     from 'node:url'
import dotenv               from 'dotenv'

// Cargar variables de entorno desde .env
const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: resolve(__dirname, '../.env') })

// Importar el servicio de notificaciones (después de cargar dotenv)
const { notifyPaymentReminder, daysUntil } = await import('../server/notifier.mjs')

// ─── Configuración ────────────────────────────────────────────────────────────

const REMINDER_DAYS  = [7, 4, 2]          // días antes del vencimiento para avisar
const BOOKINGS_DIR   = resolve(__dirname, '../public/bookings')

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n🐭 Mama Mouse – Daily Reminders`)
  console.log(`📅 Fecha: ${new Date().toLocaleDateString('es-AR', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}`)
  console.log('─'.repeat(60))

  let files
  try {
    files = (await readdir(BOOKINGS_DIR)).filter(f => f.endsWith('.json'))
  } catch (e) {
    console.error('❌ No se pudo leer el directorio de reservas:', e.message)
    process.exit(1)
  }

  console.log(`📂 Reservas encontradas: ${files.length}`)

  let totalSent = 0
  let totalSkipped = 0

  for (const file of files) {
    let booking
    try {
      booking = JSON.parse(await readFile(resolve(BOOKINGS_DIR, file), 'utf-8'))
    } catch {
      console.warn(`⚠️  No se pudo leer ${file}`)
      continue
    }

    // Saltar reservas sin contacto
    if (!booking.email && !booking.telefono) {
      console.log(`⏭️  ${booking.id || file} – sin email ni teléfono, omitida`)
      totalSkipped++
      continue
    }

    const contactInfo = [booking.email, booking.telefono].filter(Boolean).join(' / ')
    console.log(`\n📋 ${booking.id || file} – ${booking.titular} (${contactInfo})`)

    for (const item of (booking.items || [])) {
      if (!item.fechaLimite) continue

      const paid  = (item.pagos || []).reduce((s, p) => s + Number(p.monto), 0)
      const saldo = item.total - paid
      if (saldo <= 0) {
        console.log(`   ✅ ${item.icono} ${item.tipo} – ya pagado, omitido`)
        continue
      }

      const days = daysUntil(item.fechaLimite)

      if (REMINDER_DAYS.includes(days)) {
        console.log(`   🔔 ${item.icono} ${item.tipo} – vence en ${days} día(s) → enviando recordatorio`)
        try {
          const results = await notifyPaymentReminder(booking, item, days)
          if (results.email?.ok)    console.log(`      📧 Email enviado`)
          if (results.whatsapp?.ok) console.log(`      💬 WhatsApp enviado`)
          if (results.email?.reason === 'not_configured')    console.log(`      📧 Email no configurado`)
          if (results.whatsapp?.reason === 'not_configured') console.log(`      💬 WhatsApp no configurado`)
          totalSent++
        } catch (e) {
          console.error(`      ❌ Error: ${e.message}`)
        }
      } else if (days >= 0 && days <= 30) {
        console.log(`   ℹ️  ${item.icono} ${item.tipo} – vence en ${days} día(s), sin recordatorio hoy`)
      } else if (days < 0) {
        console.log(`   🔴 ${item.icono} ${item.tipo} – VENCIDO hace ${Math.abs(days)} día(s)`)
      }
    }
  }

  console.log('\n' + '─'.repeat(60))
  console.log(`✅ Proceso completado`)
  console.log(`   Recordatorios enviados: ${totalSent}`)
  console.log(`   Reservas omitidas (sin contacto): ${totalSkipped}`)
  console.log('─'.repeat(60) + '\n')
}

main().catch(e => {
  console.error('❌ Error fatal:', e)
  process.exit(1)
})
