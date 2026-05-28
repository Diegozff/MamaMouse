function fmtFull(dateStr) {
  const [year, month, day] = dateStr.split('-')
  const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
  return `${parseInt(day)} ${months[parseInt(month)-1]} ${year}`
}
function money(n, cur) { return `$${Number(n).toLocaleString('es-AR')} ${cur}` }

function daysUntil(dateStr) {
  return Math.ceil((new Date(dateStr + 'T00:00:00') - new Date()) / (1000*60*60*24))
}

function DeadlineBadge({ fechaLimite, saldo }) {
  if (saldo <= 0) return <span className="deadline-badge deadline-badge-done">✅ Pagado</span>
  if (!fechaLimite)   return null
  const days = daysUntil(fechaLimite)
  if (isNaN(days))    return null
  let cls = 'deadline-badge-ok'
  let label = `📅 Vence ${fmtFull(fechaLimite)}`
  if (days < 0)        { cls = 'deadline-badge-expired'; label = `❌ Venció el ${fmtFull(fechaLimite)}` }
  else if (days === 0) { cls = 'deadline-badge-urgent';  label = `🚨 Vence HOY — ${fmtFull(fechaLimite)}` }
  else if (days <= 7)  { cls = 'deadline-badge-urgent';  label = `🚨 Vence en ${days} días — ${fmtFull(fechaLimite)}` }
  else if (days <= 30) { cls = 'deadline-badge-warn';    label = `⚠️ Vence en ${days} días — ${fmtFull(fechaLimite)}` }
  return <span className={`deadline-badge ${cls}`}>{label}</span>
}

function DeadlineBox({ fechaLimite, saldo, moneda }) {
  if (saldo <= 0 || !fechaLimite) return null
  const days = daysUntil(fechaLimite)
  if (isNaN(days)) return null
  let bg = '#FFF3E0', border = '#FF9800', color = '#E65100', icon = '⚠️'
  if (days < 0)       { bg = '#FFEBEE'; border = '#EF5350'; color = '#C62828'; icon = '❌' }
  else if (days <= 7) { bg = '#FFEBEE'; border = '#EF5350'; color = '#C62828'; icon = '🚨' }
  else if (days <= 30){ bg = '#FFF3E0'; border = '#FF9800'; color = '#E65100'; icon = '⚠️' }
  else                { bg = '#E8F5E9'; border = '#66BB6A'; color = '#2E7D32'; icon = '📅' }
  return (
    <div className="deadline-box" style={{ background: bg, borderColor: border, color }}>
      <span className="deadline-box-icon">{icon}</span>
      <div>
        <div className="deadline-box-title">Fecha límite de pago</div>
        <div className="deadline-box-date">{fmtFull(fechaLimite)}
          {days >= 0 ? ` — ${days === 0 ? 'HOY' : `en ${days} día${days !== 1 ? 's' : ''}`}` : ` — vencida`}
        </div>
        {saldo > 0 && <div className="deadline-box-saldo">Saldo pendiente: <strong>${Number(saldo).toLocaleString('es-AR')} {moneda}</strong></div>}
      </div>
    </div>
  )
}

const HOTEL_TIPOS   = ['Hoteles']
const TICKET_TIPOS  = ['Tickets Disney', 'Tickets Universal', 'Otros Tickets']
const PAQUETE_TIPOS = ['Paquete Disney', 'Paquete Universal']
const isHotel   = tipo => HOTEL_TIPOS.includes(tipo)
const isTicket  = tipo => TICKET_TIPOS.includes(tipo)
const isPaquete = tipo => PAQUETE_TIPOS.includes(tipo)

function HotelDetails({ item }) {
  const hasList = (arr) => arr && arr.length > 0
  return (
    <div className="hotel-details">
      {/* Info principal */}
      {(item.hotel || item.nroReserva || item.direccion || item.huespedes) && (
        <div className="hotel-info-grid">
          {item.hotel      && <div className="hotel-info-row"><span className="hotel-info-label">🏨 Hotel</span><span className="hotel-info-val">{item.hotel}</span></div>}
          {item.nroReserva && <div className="hotel-info-row"><span className="hotel-info-label">🔖 N° Reserva</span><span className="hotel-info-val">{item.nroReserva}</span></div>}
          {item.direccion  && <div className="hotel-info-row"><span className="hotel-info-label">📍 Dirección</span><span className="hotel-info-val">{item.direccion}</span></div>}
          {item.huespedes  && <div className="hotel-info-row"><span className="hotel-info-label">👥 Huéspedes</span><span className="hotel-info-val">{item.huespedes} personas</span></div>}
        </div>
      )}
      {/* Servicios */}
      {hasList(item.promos) && (
        <div className="hotel-service-block">
          <div className="hotel-service-title">🎟️ Promos</div>
          {item.promos.map((p, i) => <div key={i} className="hotel-service-item">• {p}</div>)}
        </div>
      )}
      {hasList(item.extras) && (
        <div className="hotel-service-block">
          <div className="hotel-service-title">✨ Extras</div>
          {item.extras.map((e, i) => <div key={i} className="hotel-service-item">• {e}</div>)}
        </div>
      )}
      {hasList(item.gratis) && (
        <div className="hotel-service-block hotel-service-block-free">
          <div className="hotel-service-title">🎁 Gratis / Cortesía</div>
          {item.gratis.map((g, i) => <div key={i} className="hotel-service-item">• {g}</div>)}
        </div>
      )}
      {/* Saldo en hotel */}
      {item.pagadoTotal ? (
        <div className="hotel-pago-badge hotel-pago-total">✅ Pago total — sin saldo en destino</div>
      ) : item.saldoEnHotel > 0 ? (
        <div className="hotel-pago-badge hotel-pago-saldo">
          🏨 Saldo a pagar en el hotel: <strong>{money(item.saldoEnHotel, item.moneda)}</strong>
        </div>
      ) : null}
      {/* PDF */}
      {item.pdfUrl && (
        <a href={item.pdfUrl} target="_blank" rel="noreferrer" className="hotel-pdf-btn">
          📄 Descargar voucher PDF
        </a>
      )}
    </div>
  )
}

function TicketDetails({ item }) {
  return (
    <div className="hotel-details">
      {item.nroReserva && (
        <div className="hotel-info-row">
          <span className="hotel-info-label">🔖 N° Reserva</span>
          <span className="hotel-info-val">{item.nroReserva}</span>
        </div>
      )}
      {(item.validezDesde || item.validezHasta) && (
        <div className="hotel-info-row">
          <span className="hotel-info-label">📅 Validez</span>
          <span className="hotel-info-val">
            {item.validezDesde ? fmtFull(item.validezDesde) : '—'}
            {' al '}
            {item.validezHasta ? fmtFull(item.validezHasta) : '—'}
          </span>
        </div>
      )}
      {item.pagadoTotal && (
        <div className="hotel-pago-badge hotel-pago-total">✅ Abonado por completo</div>
      )}
    </div>
  )
}

function PaqueteDetails({ item }) {
  return (
    <div className="hotel-details">
      {item.nroReserva && <div className="hotel-info-row"><span className="hotel-info-label">🔖 N° Reserva</span><span className="hotel-info-val">{item.nroReserva}</span></div>}
      {item.huespedes  && <div className="hotel-info-row"><span className="hotel-info-label">👥 Huéspedes</span><span className="hotel-info-val">{item.huespedes} personas</span></div>}
      {item.hotel      && <div className="hotel-info-row"><span className="hotel-info-label">🏨 Hotel</span><span className="hotel-info-val">{item.hotel}</span></div>}
      {(item.checkIn || item.fechaInicio) && (
        <div className="hotel-info-row">
          <span className="hotel-info-label">📅 Check-in</span>
          <span className="hotel-info-val">{fmtFull(item.checkIn || item.fechaInicio)}</span>
        </div>
      )}
      {(item.checkOut || item.fechaFin) && (
        <div className="hotel-info-row">
          <span className="hotel-info-label">📅 Check-out</span>
          <span className="hotel-info-val">{fmtFull(item.checkOut || item.fechaFin)}</span>
        </div>
      )}
      {item.ticketsDesc && (
        <div className="hotel-service-block">
          <div className="hotel-service-title">🎢 Tickets incluidos</div>
          <div className="hotel-service-item" style={{ whiteSpace: 'pre-line' }}>{item.ticketsDesc}</div>
        </div>
      )}
      {item.extras?.length > 0 && (
        <div className="hotel-service-block">
          <div className="hotel-service-title">✨ Extras</div>
          {item.extras.map((e, i) => <div key={i} className="hotel-service-item">• {e}</div>)}
        </div>
      )}
      {item.gratis?.length > 0 && (
        <div className="hotel-service-block hotel-service-block-free">
          <div className="hotel-service-title">🎁 Gratis / Cortesía</div>
          {item.gratis.map((g, i) => <div key={i} className="hotel-service-item">• {g}</div>)}
        </div>
      )}
      {item.pagadoTotal && (
        <div className="hotel-pago-badge hotel-pago-total">✅ Paquete abonado por completo</div>
      )}
    </div>
  )
}

function ItemCard({ item }) {
  const totalPaid = item.pagos.reduce((s, p) => s + Number(p.monto), 0)
  const saldo     = item.total - totalPaid
  const pct       = item.total > 0 ? Math.min(100, Math.round((totalPaid / item.total) * 100)) : 0

  const estado = saldo <= 0
    ? { label: '✅ Pagado',   cls: 'item-estado-ok'      }
    : totalPaid > 0
    ? { label: '🔄 Parcial',  cls: 'item-estado-parcial' }
    : { label: '⏳ Pendiente',cls: 'item-estado-pending'  }

  return (
    <div className="item-payment-card">
      {/* header */}
      <div className="item-payment-header">
        <div className="item-payment-icon">{item.icono}</div>
        <div className="item-payment-info">
          <div className="item-payment-tipo">{item.tipo}</div>
          <div className="item-payment-desc">{item.descripcion}</div>
        </div>
        <span className={`item-estado-badge ${estado.cls}`}>{estado.label}</span>
      </div>

      {/* paquete details */}
      {isPaquete(item.tipo) && <PaqueteDetails item={item} />}

      {/* ticket details */}
      {isTicket(item.tipo) && <TicketDetails item={item} />}

      {/* hotel details */}
      {isHotel(item.tipo) && <HotelDetails item={item} />}

      {/* progress bar */}
      <div className="item-progress-wrap">
        <div className="item-progress-track">
          <div className="item-progress-fill" style={{ width: `${pct}%` }} />
        </div>
        <div className="item-progress-labels">
          <span>{money(totalPaid, item.moneda)} abonados</span>
          <span className="item-progress-pct">{pct}%</span>
        </div>
      </div>

      {/* Deadline box — destacado cuando hay saldo pendiente */}
      <DeadlineBox fechaLimite={item.fechaLimite} saldo={saldo} moneda={item.moneda} />

      {/* totals + deadline badge */}
      <div className="item-payment-footer">
        <div className="item-totals">
          <div className="item-total-row">
            <span className="item-total-label">Total</span>
            <span className="item-total-val">{money(item.total, item.moneda)}</span>
          </div>
          {saldo > 0 && (
            <div className="item-total-row item-saldo-row">
              <span className="item-total-label">Saldo</span>
              <span className="item-saldo-val">{money(saldo, item.moneda)}</span>
            </div>
          )}
        </div>
        <DeadlineBadge fechaLimite={item.fechaLimite} saldo={saldo} />
      </div>

      {/* payment history */}
      {item.pagos.length > 0 && (
        <div className="item-pagos-history">
          <div className="item-pagos-label">Historial de pagos</div>
          {item.pagos.map((p, i) => (
            <div key={i} className="payment-row">
              <div className="payment-row-left">
                <span className="payment-row-concepto">{p.concepto}</span>
                <span className="payment-row-fecha">{fmtFull(p.fecha)}</span>
              </div>
              <span className="payment-row-amount">+{money(p.monto, item.moneda)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function PaymentStatus({ items = [] }) {
  // Group totals by currency for the summary hero
  const byCur = {}
  for (const it of items) {
    if (!byCur[it.moneda]) byCur[it.moneda] = { total: 0, paid: 0 }
    byCur[it.moneda].total += it.total
    byCur[it.moneda].paid  += it.pagos.reduce((s, p) => s + Number(p.monto), 0)
  }

  return (
    <div className="fade-in">
      <div className="content-header">
        <div className="content-title">Estado de Pagos 💳</div>
        <div className="content-subtitle">Progreso financiero de cada ítem contratado</div>
      </div>

      {/* Global hero card per currency */}
      {Object.entries(byCur).map(([cur, { total, paid }]) => {
        const saldo = total - paid
        const pct   = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 0
        return (
          <div key={cur} className="payment-total-card">
            <div className="payment-total-left">
              <div className="payment-total-label">Total del viaje ({cur})</div>
              <div className="payment-total-amount">${total.toLocaleString('es-AR')} {cur}</div>
              <div className="payment-total-sub">
                {saldo > 0
                  ? `Saldo pendiente: $${saldo.toLocaleString('es-AR')} ${cur}`
                  : '✅ ¡Todo pagado!'}
              </div>
            </div>
            <div className="payment-total-right">
              <div className="payment-total-pct">{pct}%</div>
              <div className="payment-total-pct-label">abonado</div>
            </div>
          </div>
        )
      })}

      {/* One card per item */}
      <div className="items-payment-list">
        {items.map(item => <ItemCard key={item.id} item={item} />)}
        {items.length === 0 && (
          <div style={{ textAlign:'center', color:'var(--text-light)', padding:40, fontWeight:600 }}>
            No hay ítems registrados
          </div>
        )}
      </div>
    </div>
  )
}
