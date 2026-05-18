function fmt(dateStr) {
  const [, month, day] = dateStr.split('-')
  const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
  return `${parseInt(day)} ${months[parseInt(month)-1]}`
}
function fmtFull(dateStr) {
  const [year, month, day] = dateStr.split('-')
  const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
  return `${parseInt(day)} ${months[parseInt(month)-1]} ${year}`
}
function money(n, cur) { return `$${n.toLocaleString('es-AR')} ${cur}` }

export default function PaymentStatus({ financiero }) {
  const { total, moneda, fechaLimite, pagos } = financiero
  const totalPaid = pagos.reduce((s, p) => s + p.monto, 0)
  const saldo = total - totalPaid
  const pct = Math.min(100, Math.round((totalPaid / total) * 100))

  return (
    <div className="fade-in">
      <div className="content-header">
        <div className="content-title">Estado de Pagos 💳</div>
        <div className="content-subtitle">Seguí el progreso financiero de tu viaje</div>
      </div>

      {/* total hero */}
      <div className="payment-total-card">
        <div className="payment-total-left">
          <div className="payment-total-label">Total del paquete</div>
          <div className="payment-total-amount">{money(total, moneda)}</div>
          <div className="payment-total-sub">Fecha límite: {fmtFull(fechaLimite)}</div>
        </div>
        <div style={{ textAlign:'right' }}>
          <div style={{ fontSize:40, fontWeight:900, color:'white', lineHeight:1 }}>{pct}%</div>
          <div style={{ fontSize:12, color:'rgba(255,255,255,0.7)', fontWeight:700 }}>abonado</div>
        </div>
      </div>

      {/* progress */}
      <div className="card grid-1">
        <div className="card-header">
          <div className="card-header-icon">📈</div>
          <span className="card-header-title">Progreso de pago</span>
        </div>
        <div className="card-body">
          <div className="progress-bar-wrap" style={{ height:16 }}>
            <div className="progress-bar-fill" style={{ width:`${pct}%` }} />
          </div>
          <div className="progress-labels" style={{ marginTop:8 }}>
            <span className="progress-paid">Abonado: {money(totalPaid, moneda)}</span>
            <span className="progress-pct">{pct}% completado</span>
          </div>

          {saldo > 0 && (
            <div className="saldo-box" style={{ marginTop:16 }}>
              <div>
                <div className="saldo-label">Saldo pendiente</div>
                <div className="saldo-deadline">Vence: {fmtFull(fechaLimite)}</div>
              </div>
              <div className="saldo-amount">{money(saldo, moneda)}</div>
            </div>
          )}
        </div>
      </div>

      {/* history */}
      <div className="card grid-1">
        <div className="card-header">
          <div className="card-header-icon">🧾</div>
          <span className="card-header-title">Historial de pagos</span>
        </div>
        <div className="card-body">
          {pagos.length === 0 && (
            <div style={{ textAlign:'center', color:'var(--text-light)', fontSize:13, fontWeight:600, padding:16 }}>
              Aún no hay pagos registrados
            </div>
          )}
          {pagos.map((p, i) => (
            <div key={i} className="payment-row">
              <div className="payment-row-left">
                <span className="payment-row-concepto">{p.concepto}</span>
                <span className="payment-row-fecha">{fmtFull(p.fecha)}</span>
              </div>
              <span className="payment-row-amount">+{money(p.monto, moneda)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
