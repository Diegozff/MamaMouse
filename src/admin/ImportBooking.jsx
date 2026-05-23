import { useState } from 'react'

const ESTADOS_PAGO = {
  ok:    { icon: '✅', cls: 'saldo-ok',  label: 'Abonado' },
  parcial: { icon: '🔄', cls: 'saldo-warn', label: 'Parcial'  },
  pendiente: { icon: '⏳', cls: 'saldo-due', label: 'Pendiente' },
}

function estadoPago(item) {
  const paid = item.pagos?.reduce((s, p) => s + Number(p.monto), 0) || 0
  if (paid >= item.total) return ESTADOS_PAGO.ok
  if (paid > 0) return ESTADOS_PAGO.parcial
  return ESTADOS_PAGO.pendiente
}

function BookingPreview({ booking }) {
  const totalUSD = booking.items?.reduce((s, i) => s + (i.moneda === 'USD' ? Number(i.total) : 0), 0) || 0
  const paidUSD  = booking.items?.reduce((s, i) => s + (i.moneda === 'USD' ? i.pagos?.reduce((a, p) => a + Number(p.monto), 0) : 0), 0) || 0

  return (
    <div className="ib-preview">
      {/* Header */}
      <div className="ib-preview-header">
        <div className="ib-preview-avatar">
          {booking.titular?.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}
        </div>
        <div>
          <div className="ib-preview-titular">{booking.titular}</div>
          <div className="ib-preview-destinos">
            {booking.destinos?.map(d => (
              <span key={d} className="ib-preview-chip">{d}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Credenciales */}
      <div className="ib-creds">
        <div className="ib-creds-title">🔐 Acceso del viajero</div>
        <div className="ib-creds-row">
          <span className="ib-creds-label">Usuario</span>
          <code className="ib-creds-val">{booking.usuario}</code>
        </div>
        <div className="ib-creds-row">
          <span className="ib-creds-label">Contraseña</span>
          <code className="ib-creds-val">{booking.password}</code>
        </div>
        <div className="ib-creds-row">
          <span className="ib-creds-label">ID reserva</span>
          <code className="ib-creds-val">{booking.id}</code>
        </div>
      </div>

      {/* Items */}
      {booking.items?.length > 0 && (
        <div className="ib-items">
          <div className="ib-section-title">📋 Ítems detectados</div>
          {booking.items.map((item, i) => {
            const ep = estadoPago(item)
            const paid = item.pagos?.reduce((s, p) => s + Number(p.monto), 0) || 0
            return (
              <div key={i} className="ib-item-row">
                <span className="ib-item-icon">{item.icono}</span>
                <div className="ib-item-info">
                  <span className="ib-item-tipo">{item.tipo}</span>
                  <span className="ib-item-desc">{item.descripcion?.slice(0, 80)}{item.descripcion?.length > 80 ? '…' : ''}</span>
                </div>
                <div className="ib-item-amounts">
                  <span className="ib-item-total">${Number(item.total).toLocaleString('es-AR')} {item.moneda}</span>
                  <span className={`ib-item-estado ${ep.cls}`}>{ep.icon} {ep.label}</span>
                </div>
              </div>
            )
          })}
          <div className="ib-total-row">
            <span>Total USD</span>
            <strong>${totalUSD.toLocaleString('es-AR')}</strong>
            <span className="ib-paid-label">Abonado ${paidUSD.toLocaleString('es-AR')}</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default function ImportBooking({ onImported, onCancel }) {
  const [step,    setStep]    = useState('paste')   // paste | parsing | review | saving | done | error
  const [text,    setText]    = useState('')
  const [booking, setBooking] = useState(null)
  const [editId,  setEditId]  = useState('')
  const [error,   setError]   = useState('')

  const handleParse = async () => {
    if (!text.trim()) return
    setStep('parsing')
    setError('')
    try {
      const r = await fetch('/api/import-booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailText: text }),
      })
      const data = await r.json()
      if (!data.ok) throw new Error(data.error)
      setBooking(data.booking)
      setEditId(data.booking.id)
      setStep('review')
    } catch (e) {
      setError(e.message)
      setStep('error')
    }
  }

  const handleSave = async () => {
    setStep('saving')
    const finalId = editId.trim().toLowerCase().replace(/\s+/g, '-') || booking.id
    const finalBooking = { ...booking, id: finalId }
    try {
      const r = await fetch('/api/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: finalId, data: finalBooking }),
      })
      const data = await r.json()
      if (!data.ok) throw new Error(data.error)
      setStep('done')
      setTimeout(() => onImported(finalId, finalBooking), 1200)
    } catch (e) {
      setError(e.message)
      setStep('error')
    }
  }

  return (
    <div className="ib-overlay" onClick={e => e.target === e.currentTarget && onCancel()}>
      <div className="ib-modal">

        {/* Header */}
        <div className="ib-modal-header">
          <div className="ib-modal-title">
            <span>📧</span>
            <span>Importar Reserva por Email</span>
          </div>
          <button className="ib-close-btn" onClick={onCancel}>✕</button>
        </div>

        {/* PASO 1: Pegar email */}
        {(step === 'paste' || step === 'error') && (
          <div className="ib-modal-body">
            <p className="ib-hint">
              Pegá el texto completo del email con los datos de la reserva.
              El agente va a extraer toda la información automáticamente.
            </p>
            <textarea
              className="ib-textarea"
              placeholder="Pegá aquí el email de la reserva...&#10;&#10;Ej:&#10;1. AÉREOS BS AS-ORLANDO&#10;2 adultos y 2 menores...&#10;ABONADO COMPLETO&#10;&#10;2. HOTEL DISNEY - Reserva 618965606190&#10;..."
              value={text}
              onChange={e => setText(e.target.value)}
              rows={14}
            />
            {step === 'error' && (
              <div className="ib-error">❌ {error}</div>
            )}
            <div className="ib-modal-actions">
              <button className="admin-btn admin-btn-ghost" onClick={onCancel}>Cancelar</button>
              <button
                className="admin-btn admin-btn-primary"
                onClick={handleParse}
                disabled={!text.trim()}
              >
                🤖 Analizar Email
              </button>
            </div>
          </div>
        )}

        {/* PASO 2: Parseando */}
        {step === 'parsing' && (
          <div className="ib-modal-body ib-parsing">
            <div className="ib-parsing-anim">🤖</div>
            <div className="ib-parsing-text">Analizando el email…</div>
            <div className="ib-parsing-sub">El agente está extrayendo los datos de la reserva</div>
          </div>
        )}

        {/* PASO 3: Revisión */}
        {step === 'review' && booking && (
          <div className="ib-modal-body">
            <div className="ib-review-banner">
              ✅ Reserva detectada — Revisá los datos antes de guardar
            </div>

            <BookingPreview booking={booking} />

            <div className="ib-id-edit">
              <label className="ib-id-label">ID de la reserva (ajustar si es necesario)</label>
              <div className="ib-id-row">
                <span className="ib-id-prefix">mamamouse.com.ar/?id=</span>
                <input
                  className="admin-input ib-id-input"
                  value={editId}
                  onChange={e => setEditId(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                />
              </div>
            </div>

            <div className="ib-modal-actions">
              <button className="admin-btn admin-btn-ghost"
                onClick={() => setStep('paste')}>
                ← Volver a editar
              </button>
              <button className="admin-btn admin-btn-primary" onClick={handleSave}>
                💾 Crear Reserva
              </button>
            </div>
          </div>
        )}

        {/* PASO 4: Guardando */}
        {step === 'saving' && (
          <div className="ib-modal-body ib-parsing">
            <div className="ib-parsing-anim">💾</div>
            <div className="ib-parsing-text">Creando la reserva…</div>
          </div>
        )}

        {/* PASO 5: Éxito */}
        {step === 'done' && (
          <div className="ib-modal-body ib-parsing">
            <div className="ib-parsing-anim">🎉</div>
            <div className="ib-parsing-text">¡Reserva creada!</div>
            <div className="ib-parsing-sub">Cargando el editor…</div>
          </div>
        )}

      </div>
    </div>
  )
}
