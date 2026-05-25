/**
 * Mama Mouse – Notification Service
 * Email via Brevo API  |  WhatsApp via Twilio REST
 *
 * Notificaciones disponibles:
 *  1. notifyBookingCreated    → nueva reserva confirmada
 *  2. notifyBookingUpdated    → reserva actualizada
 *  3. notifyPaymentReceived   → nuevo pago registrado
 *  4. notifyPaymentReminder   → recordatorio fecha límite (cron)
 *  5. notifyBookingSummary    → resumen manual (botón admin)
 */

// ── Helpers ───────────────────────────────────────────────────────────────────

function money(n, cur = 'USD') {
  return `$${Number(n).toLocaleString('es-AR')} ${cur}`
}

function fmtDate(dateStr) {
  if (!dateStr) return '—'
  const [year, month, day] = dateStr.split('-')
  const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
  return `${parseInt(day)} ${months[parseInt(month)-1]} ${year}`
}

export function daysUntil(dateStr) {
  if (!dateStr) return Infinity
  return Math.ceil((new Date(dateStr + 'T00:00:00') - new Date()) / (1000 * 60 * 60 * 24))
}

function bookingUrl(id) {
  return `${process.env.APP_URL || 'https://www.mamamouse.com.ar'}/?id=${id}`
}

function itemPaid(item) {
  return (item.pagos || []).reduce((s, p) => s + Number(p.monto), 0)
}

// ── Brevo Email API ───────────────────────────────────────────────────────────

export async function sendEmail(to, { subject, html }) {
  const apiKey = process.env.BREVO_API_KEY
  if (!apiKey) {
    console.warn('[Notifier] Email omitido: BREVO_API_KEY no configurado')
    return { ok: false, reason: 'not_configured' }
  }
  const senderEmail = process.env.SMTP_USER || 'dm.zumoffen@gmail.com'
  try {
    const r = await fetch('https://api.brevo.com/v3/smtp/email', {
      method:  'POST',
      headers: { 'api-key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sender:      { name: 'Mama Mouse', email: senderEmail },
        to:          [{ email: to }],
        subject,
        htmlContent: html,
      }),
    })
    const data = await r.json()
    if (!r.ok) throw new Error(JSON.stringify(data))
    console.log(`[Notifier] ✅ Email → ${to} | ${subject}`)
    return { ok: true }
  } catch (e) {
    console.error(`[Notifier] ❌ Email error: ${e.message}`)
    return { ok: false, error: e.message }
  }
}

// ── WhatsApp via Twilio ───────────────────────────────────────────────────────

export async function sendWhatsApp(to, message) {
  const sid   = process.env.TWILIO_ACCOUNT_SID
  const token = process.env.TWILIO_AUTH_TOKEN
  const from  = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886'
  if (!sid || !token) {
    console.warn('[Notifier] WhatsApp omitido: TWILIO no configurado')
    return { ok: false, reason: 'not_configured' }
  }
  try {
    const toWa = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`
    const r = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method:  'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${sid}:${token}`).toString('base64'),
        'Content-Type':  'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ From: from, To: toWa, Body: message }).toString(),
    })
    const data = await r.json()
    if (!r.ok) throw new Error(data.message || `Twilio ${r.status}`)
    console.log(`[Notifier] ✅ WhatsApp → ${to}`)
    return { ok: true, sid: data.sid }
  } catch (e) {
    console.error(`[Notifier] ❌ WhatsApp error: ${e.message}`)
    return { ok: false, error: e.message }
  }
}

// ── Base HTML ─────────────────────────────────────────────────────────────────

function emailBase(body) {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:20px;background:#F8F0FF;font-family:Arial,Helvetica,sans-serif">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(155,126,200,0.15)">
    <div style="background:linear-gradient(135deg,#FF69B4 0%,#9B7EC8 100%);padding:28px 32px;text-align:center">
      <div style="font-size:40px;margin-bottom:6px">🐭</div>
      <div style="color:white;font-size:22px;font-weight:900;letter-spacing:1px">MAMA MOUSE</div>
      <div style="color:rgba(255,255,255,0.8);font-size:12px;margin-top:3px">Tu agencia de viajes mágicos</div>
    </div>
    ${body}
    <div style="background:#F8F0FF;padding:20px;text-align:center;border-top:1px solid #EDD9FF">
      <p style="color:#9B7EC8;font-weight:700;font-size:13px;margin:0">🐭 Mama Mouse</p>
      <p style="color:#aaa;font-size:12px;margin:4px 0 0">¿Tenés dudas? Respondé este mail o escribinos por WhatsApp</p>
    </div>
  </div>
</body>
</html>`
}

function btnPrimary(url, label) {
  return `<div style="text-align:center;margin:24px 0">
    <a href="${url}" style="display:inline-block;background:linear-gradient(135deg,#FF69B4,#9B7EC8);color:white;padding:14px 36px;border-radius:50px;text-decoration:none;font-weight:700;font-size:15px;box-shadow:0 4px 16px rgba(155,126,200,0.4)">${label}</a>
  </div>`
}

function itemsTable(items) {
  if (!items?.length) return ''
  const rows = items.map(it => {
    const paid  = itemPaid(it)
    const saldo = it.total - paid
    const estadoHtml = saldo <= 0
      ? '<span style="color:#2E7D32;font-weight:700">✅ Pagado</span>'
      : `<span style="color:#E65100;font-weight:700">Saldo ${money(saldo, it.moneda)}</span>`
    return `<tr>
      <td style="padding:10px 14px;border-bottom:1px solid #F0E6FF">${it.icono} <strong>${it.tipo}</strong><br><span style="font-size:11px;color:#888">${it.descripcion || ''}</span></td>
      <td style="padding:10px 14px;border-bottom:1px solid #F0E6FF;text-align:right;font-weight:700;white-space:nowrap">${money(it.total, it.moneda)}</td>
      <td style="padding:10px 14px;border-bottom:1px solid #F0E6FF;text-align:right">${estadoHtml}</td>
      <td style="padding:10px 14px;border-bottom:1px solid #F0E6FF;text-align:right;color:#999;font-size:12px;white-space:nowrap">${fmtDate(it.fechaLimite)}</td>
    </tr>`
  }).join('')
  return `<table style="width:100%;border-collapse:collapse;font-size:13px;background:#FDFAFF;border-radius:10px;overflow:hidden;margin-top:4px">
    <thead>
      <tr style="background:#F0E6FF">
        <th style="padding:10px 14px;text-align:left;color:#9B7EC8;font-size:11px;text-transform:uppercase;letter-spacing:.5px">Servicio</th>
        <th style="padding:10px 14px;text-align:right;color:#9B7EC8;font-size:11px;text-transform:uppercase">Total</th>
        <th style="padding:10px 14px;text-align:right;color:#9B7EC8;font-size:11px;text-transform:uppercase">Estado</th>
        <th style="padding:10px 14px;text-align:right;color:#9B7EC8;font-size:11px;text-transform:uppercase">Vence</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>`
}

// ── 1. NUEVA RESERVA ──────────────────────────────────────────────────────────

function emailWelcome(booking) {
  const url  = bookingUrl(booking.id)
  const body = `
  <div style="padding:28px 32px">
    <h2 style="color:#333;font-size:22px;margin:0 0 10px">¡Bienvenidos, ${booking.titular}! 🎉</h2>
    <p style="color:#555;line-height:1.7;margin:0 0 20px">
      Tu reserva con <strong>Mama Mouse</strong> está confirmada.
      Hacé click en el botón para ver todos los detalles, el estado de tus pagos y el itinerario personalizado.
    </p>
    ${btnPrimary(url, '✨ Ver mi reserva completa')}
    <h3 style="color:#9B7EC8;font-size:13px;text-transform:uppercase;letter-spacing:1px;margin:20px 0 10px">Ítems contratados</h3>
    ${itemsTable(booking.items)}
    ${booking.destinos?.length ? `<p style="color:#777;font-size:13px;margin-top:14px">🌍 <strong>Destinos:</strong> ${booking.destinos.join(' · ')}</p>` : ''}
  </div>`
  return { subject: `🐭 ¡Tu reserva con Mama Mouse está confirmada! – ${booking.titular}`, html: emailBase(body) }
}

function waWelcome(booking) {
  const url   = bookingUrl(booking.id)
  const items = (booking.items || []).map(it => {
    const saldo = it.total - itemPaid(it)
    return `${it.icono} *${it.tipo}*: ${money(it.total, it.moneda)}${saldo > 0 ? ` _(saldo: ${money(saldo, it.moneda)})_` : ' ✅'}`
  }).join('\n')
  return `🐭 *¡Bienvenidos a Mama Mouse!*
Hola *${booking.titular}* 🎉

Tu reserva está confirmada. ¡Prepárate para la aventura!

🌍 *Destinos:* ${(booking.destinos || []).join(', ')}

📋 *Ítems contratados:*
${items}

👉 Ver tu reserva completa:
${url}

¿Tenés alguna consulta? Escribinos aquí mismo 💛`
}

// ── 2. ACTUALIZACIÓN DE RESERVA ───────────────────────────────────────────────

function emailUpdate(booking) {
  const url  = bookingUrl(booking.id)
  const body = `
  <div style="padding:28px 32px">
    <div style="background:#F0E6FF;border-left:5px solid #9B7EC8;border-radius:8px;padding:14px 18px;margin-bottom:20px">
      <p style="margin:0;color:#9B7EC8;font-weight:700;font-size:15px">📝 Tu reserva fue actualizada</p>
      <p style="margin:6px 0 0;color:#666;font-size:13px">Carolina actualizó los datos de tu viaje. Revisá los detalles a continuación.</p>
    </div>
    <h2 style="color:#333;font-size:20px;margin:0 0 10px">Hola, ${booking.titular} 👋</h2>
    <p style="color:#555;line-height:1.7;margin:0 0 20px">
      Tu agente de viajes actualizó tu reserva. Hacé click en el botón para ver los últimos cambios.
    </p>
    ${btnPrimary(url, '📋 Ver mi reserva actualizada')}
    <h3 style="color:#9B7EC8;font-size:13px;text-transform:uppercase;letter-spacing:1px;margin:20px 0 10px">Estado actual</h3>
    ${itemsTable(booking.items)}
  </div>`
  return { subject: `📝 Tu reserva fue actualizada – ${booking.titular} | Mama Mouse`, html: emailBase(body) }
}

function waUpdate(booking) {
  const url = bookingUrl(booking.id)
  return `📝 *Reserva actualizada*
🐭 *Mama Mouse*

Hola *${booking.titular}* 👋

Carolina actualizó los datos de tu reserva.

👉 Revisá los cambios aquí:
${url}

¿Tenés alguna duda sobre los cambios? Escribinos 💛`
}

// ── 3. NUEVO PAGO REGISTRADO ──────────────────────────────────────────────────

function emailPaymentReceived(booking, newPayments) {
  const url = bookingUrl(booking.id)

  // Calcular totales globales
  let totalViaje = 0, totalPagado = 0
  for (const it of (booking.items || [])) {
    totalViaje  += Number(it.total) || 0
    totalPagado += itemPaid(it)
  }
  const saldoTotal = totalViaje - totalPagado
  const pct = totalViaje > 0 ? Math.round((totalPagado / totalViaje) * 100) : 0

  const paymentRows = newPayments.map(p => `
    <tr>
      <td style="padding:10px 14px;border-bottom:1px solid #F0E6FF">${p.itemIcono} <strong>${p.itemTipo}</strong></td>
      <td style="padding:10px 14px;border-bottom:1px solid #F0E6FF;text-align:right;color:#666;font-size:12px">${fmtDate(p.fecha)}</td>
      <td style="padding:10px 14px;border-bottom:1px solid #F0E6FF;text-align:right;font-weight:700;color:#2E7D32;white-space:nowrap">+${money(p.monto, p.moneda)}</td>
      <td style="padding:10px 14px;border-bottom:1px solid #F0E6FF;font-size:12px;color:#888">${p.concepto || ''}</td>
    </tr>`).join('')

  const body = `
  <div style="padding:28px 32px">
    <div style="background:#F0FFF4;border-left:5px solid #2E7D32;border-radius:8px;padding:14px 18px;margin-bottom:20px">
      <p style="margin:0;color:#2E7D32;font-weight:700;font-size:15px">✅ Pago registrado correctamente</p>
      <p style="margin:6px 0 0;color:#555;font-size:13px">Recibimos y registramos tu pago. ¡Gracias!</p>
    </div>
    <h2 style="color:#333;font-size:20px;margin:0 0 10px">Hola, ${booking.titular} 💚</h2>
    <p style="color:#555;line-height:1.7;margin:0 0 20px">
      Registramos un nuevo pago en tu reserva. A continuación el detalle:
    </p>
    <h3 style="color:#9B7EC8;font-size:13px;text-transform:uppercase;letter-spacing:1px;margin:0 0 10px">Pagos registrados</h3>
    <table style="width:100%;border-collapse:collapse;font-size:13px;background:#FDFAFF;border-radius:10px;overflow:hidden;margin-bottom:20px">
      <thead>
        <tr style="background:#F0E6FF">
          <th style="padding:10px 14px;text-align:left;color:#9B7EC8;font-size:11px;text-transform:uppercase">Servicio</th>
          <th style="padding:10px 14px;text-align:right;color:#9B7EC8;font-size:11px;text-transform:uppercase">Fecha</th>
          <th style="padding:10px 14px;text-align:right;color:#9B7EC8;font-size:11px;text-transform:uppercase">Monto</th>
          <th style="padding:10px 14px;text-align:left;color:#9B7EC8;font-size:11px;text-transform:uppercase">Concepto</th>
        </tr>
      </thead>
      <tbody>${paymentRows}</tbody>
    </table>
    <!-- Barra de progreso -->
    <div style="background:#F8F0FF;border-radius:12px;padding:16px 20px;margin-bottom:20px">
      <div style="display:flex;justify-content:space-between;margin-bottom:8px">
        <span style="color:#555;font-size:13px">Progreso total del viaje</span>
        <span style="color:#9B7EC8;font-weight:900;font-size:14px">${pct}%</span>
      </div>
      <div style="background:#EDD9FF;border-radius:99px;height:10px;overflow:hidden">
        <div style="background:linear-gradient(90deg,#FF69B4,#9B7EC8);height:10px;width:${pct}%;border-radius:99px"></div>
      </div>
      <div style="display:flex;justify-content:space-between;margin-top:8px;font-size:12px">
        <span style="color:#2E7D32;font-weight:700">Abonado: ${money(totalPagado, 'USD')}</span>
        ${saldoTotal > 0 ? `<span style="color:#E65100;font-weight:700">Saldo: ${money(saldoTotal, 'USD')}</span>` : '<span style="color:#2E7D32;font-weight:700">✅ Totalmente pagado</span>'}
      </div>
    </div>
    ${btnPrimary(url + '#pagos', '💳 Ver estado de pagos completo')}
  </div>`
  return { subject: `✅ Pago registrado – ${booking.titular} | Mama Mouse`, html: emailBase(body) }
}

function waPaymentReceived(booking, newPayments) {
  const url = bookingUrl(booking.id)
  let totalViaje = 0, totalPagado = 0
  for (const it of (booking.items || [])) {
    totalViaje  += Number(it.total) || 0
    totalPagado += itemPaid(it)
  }
  const saldo = totalViaje - totalPagado
  const pct   = totalViaje > 0 ? Math.round((totalPagado / totalViaje) * 100) : 0
  const pagosList = newPayments.map(p => `${p.itemIcono} *${p.itemTipo}*: +${money(p.monto, p.moneda)}${p.concepto ? ` _(${p.concepto})_` : ''}`).join('\n')

  return `✅ *Pago registrado*
🐭 *Mama Mouse*

Hola *${booking.titular}* 💚

Registramos tu pago correctamente:

${pagosList}

📊 *Progreso del viaje: ${pct}%*
✅ Abonado: ${money(totalPagado, 'USD')}
${saldo > 0 ? `💳 Saldo restante: ${money(saldo, 'USD')}` : '🎉 ¡Viaje totalmente pagado!'}

👉 Ver detalle de pagos:
${url}

¡Gracias por tu pago! 💛`
}

// ── 4. RECORDATORIO FECHA LÍMITE ──────────────────────────────────────────────

function emailReminder(booking, item, daysLeft) {
  const url    = bookingUrl(booking.id)
  const paid   = itemPaid(item)
  const saldo  = item.total - paid
  const urgColor = daysLeft <= 2 ? '#C62828' : daysLeft <= 4 ? '#E65100' : '#F57F17'
  const urgText  = daysLeft <= 0
    ? '🔴 ¡El plazo ya venció!'
    : daysLeft === 1 ? '🔴 ¡Vence mañana!'
    : `⏰ Faltan <strong>${daysLeft} días</strong> para el vencimiento`

  const body = `
  <div style="padding:28px 32px">
    <h2 style="color:#333;font-size:20px;margin:0 0 16px">Recordatorio de Pago, ${booking.titular} 👋</h2>
    <div style="background:#FFF8F0;border-left:5px solid ${urgColor};border-radius:8px;padding:16px 20px;margin-bottom:20px">
      <p style="margin:0;color:${urgColor};font-size:15px;font-weight:700">${urgText}</p>
      <p style="margin:6px 0 0;color:#666;font-size:13px">Fecha límite: <strong>${fmtDate(item.fechaLimite)}</strong></p>
    </div>
    <div style="background:#FDFAFF;border:1.5px solid #EDD9FF;border-radius:12px;padding:20px;margin-bottom:20px">
      <div style="font-size:32px;margin-bottom:8px">${item.icono}</div>
      <div style="font-size:17px;font-weight:900;color:#333;margin-bottom:4px">${item.tipo}</div>
      <div style="font-size:12px;color:#888;margin-bottom:16px">${item.descripcion || ''}</div>
      <table style="width:100%;font-size:14px">
        <tr><td style="color:#777;padding:4px 0">Total del ítem</td><td style="text-align:right;font-weight:700">${money(item.total, item.moneda)}</td></tr>
        <tr><td style="color:#2E7D32;padding:4px 0">Ya abonado</td><td style="text-align:right;font-weight:700;color:#2E7D32">${money(paid, item.moneda)}</td></tr>
        <tr style="border-top:2px solid #EDD9FF">
          <td style="color:${urgColor};padding:8px 0 0;font-weight:900">❗ Saldo pendiente</td>
          <td style="text-align:right;font-weight:900;font-size:18px;color:${urgColor};padding-top:8px">${money(saldo, item.moneda)}</td>
        </tr>
      </table>
    </div>
    ${btnPrimary(url, '💳 Ver estado de pagos')}
    <p style="color:#aaa;font-size:12px;text-align:center">¿Ya realizaste el pago? Avisanos y actualizamos tu reserva al instante.</p>
  </div>`
  return {
    subject: `⏰ Recordatorio de pago – ${item.tipo} – ${daysLeft > 0 ? `${daysLeft} días` : 'VENCIDO'} – ${booking.titular}`,
    html: emailBase(body),
  }
}

function waReminder(booking, item, daysLeft) {
  const url    = bookingUrl(booking.id)
  const paid   = itemPaid(item)
  const saldo  = item.total - paid
  const urg    = daysLeft <= 0 ? '🔴 *¡VENCIDO!*' : daysLeft <= 2 ? '🔴 *¡URGENTE!*' : daysLeft <= 4 ? '🟠 *Importante*' : '🟡 *Recordatorio*'
  const diasMsg = daysLeft <= 0 ? 'El plazo ya venció ⚠️' : daysLeft === 1 ? '¡Vence *mañana*!' : `Faltan *${daysLeft} días* para el vencimiento`

  return `${urg} – Recordatorio de Pago
🐭 *Mama Mouse*

Hola *${booking.titular}* 👋

⏰ ${diasMsg}

${item.icono} *${item.tipo}*
_${item.descripcion || ''}_

💰 Total: ${money(item.total, item.moneda)}
✅ Abonado: ${money(paid, item.moneda)}
❗ *Saldo: ${money(saldo, item.moneda)}*
📅 Fecha límite: *${fmtDate(item.fechaLimite)}*

👉 Ver tu reserva: ${url}

¿Ya pagaste? Avisanos para actualizarlo al instante 💛`
}

// ── High-level Actions ────────────────────────────────────────────────────────

export async function notifyBookingCreated(booking) {
  const results = { email: null, whatsapp: null }
  if (booking.email)    results.email    = await sendEmail(booking.email, emailWelcome(booking))
  if (booking.telefono) results.whatsapp = await sendWhatsApp(booking.telefono, waWelcome(booking))
  return results
}

export async function notifyBookingUpdated(booking) {
  const results = { email: null, whatsapp: null }
  if (booking.email)    results.email    = await sendEmail(booking.email, emailUpdate(booking))
  if (booking.telefono) results.whatsapp = await sendWhatsApp(booking.telefono, waUpdate(booking))
  return results
}

export async function notifyPaymentReceived(booking, newPayments) {
  const results = { email: null, whatsapp: null }
  if (booking.email)    results.email    = await sendEmail(booking.email, emailPaymentReceived(booking, newPayments))
  if (booking.telefono) results.whatsapp = await sendWhatsApp(booking.telefono, waPaymentReceived(booking, newPayments))
  return results
}

export async function notifyPaymentReminder(booking, item, daysLeft) {
  const results = { email: null, whatsapp: null }
  if (booking.email)    results.email    = await sendEmail(booking.email, emailReminder(booking, item, daysLeft))
  if (booking.telefono) results.whatsapp = await sendWhatsApp(booking.telefono, waReminder(booking, item, daysLeft))
  return results
}

export async function notifyBookingSummary(booking) {
  return notifyBookingCreated(booking)
}
