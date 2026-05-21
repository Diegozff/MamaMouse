/**
 * Mama Mouse – Notification Service
 * Envía alertas por email (Nodemailer/SMTP) y WhatsApp (Twilio REST API)
 */

import nodemailer from 'nodemailer'

// ── Helpers ──────────────────────────────────────────────────────────────────

function money(n, cur) {
  return `$${Number(n).toLocaleString('es-AR')} ${cur}`
}

function fmtDate(dateStr) {
  if (!dateStr) return ''
  const [year, month, day] = dateStr.split('-')
  const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
  return `${parseInt(day)} ${months[parseInt(month)-1]} ${year}`
}

export function daysUntil(dateStr) {
  if (!dateStr) return Infinity
  return Math.ceil((new Date(dateStr + 'T00:00:00') - new Date()) / (1000 * 60 * 60 * 24))
}

function bookingUrl(id) {
  return `${process.env.APP_URL || 'http://localhost:5173'}/?id=${id}`
}

// ── Email Transporter ─────────────────────────────────────────────────────────

function createTransporter() {
  return nodemailer.createTransport({
    host:   process.env.SMTP_HOST || 'smtp.gmail.com',
    port:   Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })
}

// ── Email Templates ───────────────────────────────────────────────────────────

function emailBase(body) {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:20px;background:#F8F0FF;font-family:Arial,Helvetica,sans-serif">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(155,126,200,0.15)">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#FF69B4 0%,#9B7EC8 100%);padding:32px;text-align:center">
      <div style="font-size:36px;margin-bottom:8px">🐭</div>
      <div style="color:white;font-size:22px;font-weight:900;letter-spacing:1px">MAMA MOUSE</div>
      <div style="color:rgba(255,255,255,0.8);font-size:13px;margin-top:4px">Tu agencia de viajes mágicos</div>
    </div>
    <!-- Body -->
    ${body}
    <!-- Footer -->
    <div style="background:#F8F0FF;padding:20px;text-align:center;border-top:1px solid #EDD9FF">
      <p style="color:#9B7EC8;font-weight:700;font-size:13px;margin:0">🐭 Mama Mouse</p>
      <p style="color:#aaa;font-size:12px;margin:4px 0 0">¿Tenés dudas? Respondé este mail o escribinos por WhatsApp</p>
    </div>
  </div>
</body>
</html>`
}

function emailWelcome(booking) {
  const url = bookingUrl(booking.id)
  const itemRows = (booking.items || []).map(it => {
    const paid  = it.pagos.reduce((s, p) => s + Number(p.monto), 0)
    const saldo = it.total - paid
    const estado = saldo <= 0
      ? '<span style="color:#2E7D32;font-weight:700">✅ Pagado</span>'
      : `<span style="color:#C62828;font-weight:700">Saldo ${money(saldo, it.moneda)}</span>`
    return `<tr>
      <td style="padding:10px 14px;border-bottom:1px solid #F0E6FF">${it.icono} <strong>${it.tipo}</strong><br><span style="font-size:12px;color:#777">${it.descripcion}</span></td>
      <td style="padding:10px 14px;border-bottom:1px solid #F0E6FF;text-align:right;font-weight:700">${money(it.total, it.moneda)}</td>
      <td style="padding:10px 14px;border-bottom:1px solid #F0E6FF;text-align:right">${estado}</td>
      <td style="padding:10px 14px;border-bottom:1px solid #F0E6FF;text-align:right;color:#999;font-size:12px">${fmtDate(it.fechaLimite)}</td>
    </tr>`
  }).join('')

  const body = `
  <div style="padding:28px 32px">
    <h2 style="color:#333;font-size:20px;margin:0 0 8px">¡Bienvenidos, ${booking.titular}! 🎉</h2>
    <p style="color:#555;line-height:1.7;margin:0 0 20px">
      Tu reserva con Mama Mouse está confirmada. Hacé click en el botón para ver todos los detalles,
      el estado de tus pagos y el itinerario personalizado de tu viaje.
    </p>
    <div style="text-align:center;margin:24px 0">
      <a href="${url}" style="display:inline-block;background:linear-gradient(135deg,#FF69B4,#9B7EC8);color:white;padding:14px 36px;border-radius:50px;text-decoration:none;font-weight:700;font-size:15px;box-shadow:0 4px 16px rgba(155,126,200,0.4)">
        ✨ Ver mi reserva completa
      </a>
    </div>
    <h3 style="color:#9B7EC8;font-size:14px;text-transform:uppercase;letter-spacing:1px;margin:24px 0 12px">Ítems contratados</h3>
    <table style="width:100%;border-collapse:collapse;font-size:13px;background:#FDFAFF;border-radius:10px;overflow:hidden">
      <thead>
        <tr style="background:#F0E6FF">
          <th style="padding:10px 14px;text-align:left;color:#9B7EC8;font-size:11px;text-transform:uppercase;letter-spacing:0.5px">Servicio</th>
          <th style="padding:10px 14px;text-align:right;color:#9B7EC8;font-size:11px;text-transform:uppercase;letter-spacing:0.5px">Total</th>
          <th style="padding:10px 14px;text-align:right;color:#9B7EC8;font-size:11px;text-transform:uppercase;letter-spacing:0.5px">Estado</th>
          <th style="padding:10px 14px;text-align:right;color:#9B7EC8;font-size:11px;text-transform:uppercase;letter-spacing:0.5px">Vence</th>
        </tr>
      </thead>
      <tbody>${itemRows}</tbody>
    </table>
    ${(booking.destinos||[]).length ? `<p style="color:#777;font-size:13px;margin-top:16px">🌍 <strong>Destinos:</strong> ${booking.destinos.join(' · ')}</p>` : ''}
  </div>`

  return {
    subject: `🐭 ¡Tu reserva con Mama Mouse está confirmada! – ${booking.titular}`,
    html: emailBase(body),
  }
}

function emailReminder(booking, item, daysLeft) {
  const url   = bookingUrl(booking.id)
  const paid  = item.pagos.reduce((s, p) => s + Number(p.monto), 0)
  const saldo = item.total - paid
  const urgColor = daysLeft <= 2 ? '#C62828' : daysLeft <= 4 ? '#E65100' : '#F57F17'
  const urgText  = daysLeft <= 0
    ? '🔴 ¡El plazo ya venció!'
    : daysLeft === 1 ? '🔴 ¡Vence mañana!'
    : `⏰ Faltan <strong>${daysLeft} días</strong> para el vencimiento`

  const body = `
  <div style="padding:28px 32px">
    <h2 style="color:#333;font-size:20px;margin:0 0 16px">Recordatorio de Pago, ${booking.titular} 👋</h2>
    <!-- Alert box -->
    <div style="background:#FFF8F0;border-left:5px solid ${urgColor};border-radius:8px;padding:16px 20px;margin-bottom:20px">
      <p style="margin:0;color:${urgColor};font-size:15px;font-weight:700">${urgText}</p>
      <p style="margin:6px 0 0;color:#666;font-size:13px">Fecha límite: <strong>${fmtDate(item.fechaLimite)}</strong></p>
    </div>
    <!-- Item card -->
    <div style="background:#FDFAFF;border:1.5px solid #EDD9FF;border-radius:12px;padding:20px;margin-bottom:20px">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px">
        <span style="font-size:32px">${item.icono}</span>
        <div>
          <div style="font-size:17px;font-weight:900;color:#333">${item.tipo}</div>
          <div style="font-size:12px;color:#888;margin-top:2px">${item.descripcion}</div>
        </div>
      </div>
      <table style="width:100%;font-size:14px">
        <tr><td style="color:#777;padding:4px 0">Total del ítem</td><td style="text-align:right;font-weight:700">${money(item.total, item.moneda)}</td></tr>
        <tr><td style="color:#2E7D32;padding:4px 0">Ya abonado</td><td style="text-align:right;font-weight:700;color:#2E7D32">${money(paid, item.moneda)}</td></tr>
        <tr style="border-top:2px solid #EDD9FF">
          <td style="color:${urgColor};padding:8px 0 0;font-weight:900;font-size:15px">❗ Saldo pendiente</td>
          <td style="text-align:right;font-weight:900;font-size:18px;color:${urgColor};padding-top:8px">${money(saldo, item.moneda)}</td>
        </tr>
      </table>
    </div>
    <div style="text-align:center;margin:24px 0">
      <a href="${url}#pagos" style="display:inline-block;background:linear-gradient(135deg,#FF69B4,#9B7EC8);color:white;padding:14px 36px;border-radius:50px;text-decoration:none;font-weight:700;font-size:15px;box-shadow:0 4px 16px rgba(155,126,200,0.4)">
        💳 Ver estado de pagos
      </a>
    </div>
    <p style="color:#aaa;font-size:12px;text-align:center">¿Ya realizaste el pago? Avisanos y actualizamos tu reserva al instante.</p>
  </div>`

  return {
    subject: `⏰ Recordatorio de pago – ${item.tipo} – ${daysLeft > 0 ? `${daysLeft} días` : 'VENCIDO'} – ${booking.titular}`,
    html: emailBase(body),
  }
}

// ── WhatsApp Templates ────────────────────────────────────────────────────────

function waWelcome(booking) {
  const url = bookingUrl(booking.id)
  const itemsList = (booking.items || []).map(it => {
    const paid  = it.pagos.reduce((s, p) => s + Number(p.monto), 0)
    const saldo = it.total - paid
    return `${it.icono} *${it.tipo}*: ${money(it.total, it.moneda)}${saldo > 0 ? ` _(saldo: ${money(saldo, it.moneda)})_` : ' ✅'}`
  }).join('\n')

  return `🐭 *¡Bienvenidos a Mama Mouse!*
Hola *${booking.titular}* 🎉

Tu reserva de viaje está confirmada. ¡Prepárate para la aventura!

🌍 *Destinos:* ${(booking.destinos || []).join(', ')}

📋 *Tus ítems contratados:*
${itemsList}

👉 *Ver todos los detalles de tu viaje:*
${url}

¿Tenés alguna consulta? Escribinos aquí mismo y te ayudamos enseguida 💛`
}

function waReminder(booking, item, daysLeft) {
  const url   = bookingUrl(booking.id)
  const paid  = item.pagos.reduce((s, p) => s + Number(p.monto), 0)
  const saldo = item.total - paid
  const urgencia = daysLeft <= 0 ? '🔴 *¡VENCIDO!*' : daysLeft <= 2 ? '🔴 *¡URGENTE!*' : daysLeft <= 4 ? '🟠 *Importante*' : '🟡 *Recordatorio*'
  const diasMsg  = daysLeft <= 0 ? 'El plazo ya venció ⚠️' : daysLeft === 1 ? '¡Vence *mañana*! ⚠️' : `Faltan *${daysLeft} días* para el vencimiento`

  return `${urgencia} – Recordatorio de Pago
🐭 *Mama Mouse*

Hola *${booking.titular}* 👋

⏰ ${diasMsg}

${item.icono} *${item.tipo}*
_${item.descripcion}_

💰 Total: ${money(item.total, item.moneda)}
✅ Abonado: ${money(paid, item.moneda)}
❗ *Saldo pendiente: ${money(saldo, item.moneda)}*
📅 Fecha límite: *${fmtDate(item.fechaLimite)}*

👉 Ver tu reserva: ${url}

¿Ya realizaste el pago? Avisanos para actualizarlo al instante 💛`
}

// ── Transport Senders ─────────────────────────────────────────────────────────

export async function sendEmail(to, template) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('[Notifier] Email no enviado: SMTP_USER/SMTP_PASS no configurados en .env')
    return { ok: false, reason: 'not_configured' }
  }
  try {
    const transporter = createTransporter()
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || `Mama Mouse <${process.env.SMTP_USER}>`,
      to,
      subject: template.subject,
      html:    template.html,
    })
    console.log(`[Notifier] ✅ Email → ${to} | ${template.subject}`)
    return { ok: true }
  } catch (e) {
    console.error(`[Notifier] ❌ Email error: ${e.message}`)
    return { ok: false, error: e.message }
  }
}

export async function sendWhatsApp(to, message) {
  const sid   = process.env.TWILIO_ACCOUNT_SID
  const token = process.env.TWILIO_AUTH_TOKEN
  const from  = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886'

  if (!sid || !token) {
    console.warn('[Notifier] WhatsApp no enviado: TWILIO_ACCOUNT_SID/TWILIO_AUTH_TOKEN no configurados en .env')
    return { ok: false, reason: 'not_configured' }
  }
  try {
    const toWa  = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`
    const apiUrl = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`
    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${sid}:${token}`).toString('base64'),
        'Content-Type':  'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ From: from, To: toWa, Body: message }).toString(),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.message || `Twilio HTTP ${res.status}`)
    console.log(`[Notifier] ✅ WhatsApp → ${to} | sid: ${data.sid}`)
    return { ok: true, sid: data.sid }
  } catch (e) {
    console.error(`[Notifier] ❌ WhatsApp error: ${e.message}`)
    return { ok: false, error: e.message }
  }
}

// ── High-level Actions ────────────────────────────────────────────────────────

export async function notifyBookingCreated(booking) {
  const results = { email: null, whatsapp: null }
  if (booking.email)    results.email    = await sendEmail(booking.email, emailWelcome(booking))
  if (booking.telefono) results.whatsapp = await sendWhatsApp(booking.telefono, waWelcome(booking))
  return results
}

export async function notifyPaymentReminder(booking, item, daysLeft) {
  const results = { email: null, whatsapp: null }
  if (booking.email)    results.email    = await sendEmail(booking.email, emailReminder(booking, item, daysLeft))
  if (booking.telefono) results.whatsapp = await sendWhatsApp(booking.telefono, waReminder(booking, item, daysLeft))
  return results
}

export async function notifyBookingSummary(booking) {
  // Resumen general (lo mismo que welcome pero para envío manual)
  return notifyBookingCreated(booking)
}
