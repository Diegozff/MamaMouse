import { useState, useEffect } from 'react'
import { normalizeBooking, localYMD } from '../booking'

const paidOf  = it => (it.pagos || []).reduce((s, p) => s + (Number(p.monto) || 0), 0)
const saldoOf = it => (Number(it.total) || 0) - paidOf(it)

// Registrar un pago sin abrir toda la reserva. Guarda con el mismo endpoint que el
// editor, así que el servidor también avisa al viajero (salvo que se desmarque).
export default function QuickPayment({ id, titular, onClose, onSaved }) {
  const [booking, setBooking] = useState(null)
  const [error,   setError]   = useState('')
  const [itemId,  setItemId]  = useState('')
  const [monto,   setMonto]   = useState('')
  const [fecha,   setFecha]   = useState(localYMD())
  const [concepto, setConcepto] = useState('')
  const [avisar,  setAvisar]  = useState(true)
  const [saving,  setSaving]  = useState(false)

  useEffect(() => {
    fetch(`/api/admin/booking/${encodeURIComponent(id)}?t=${Date.now()}`)
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(d => {
        const b = normalizeBooking(d)
        setBooking(b)
        const first = b.items.find(it => saldoOf(it) > 0)
        if (first) { setItemId(first.id); setMonto(String(saldoOf(first))) }
      })
      .catch(s => { if (s !== 401) setError('No se pudo abrir la reserva.') })
  }, [id])

  const item = booking?.items.find(it => it.id === itemId)
  const contacto = !!(booking?.email || booking?.telefono)

  const pickItem = (newId) => {
    setItemId(newId)
    const it = booking.items.find(x => x.id === newId)
    if (it) setMonto(String(Math.max(0, saldoOf(it))))
  }

  const guardar = async () => {
    const m = Number(String(monto).replace(',', '.'))
    if (!item)                       return setError('Elegí un ítem.')
    if (!(m > 0))                    return setError('Ingresá un monto mayor a 0.')
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return setError('Ingresá la fecha del pago.')
    setError(''); setSaving(true)
    const data = {
      ...booking,
      items: booking.items.map(it => it.id !== itemId ? it : {
        ...it,
        pagos: [...it.pagos, { fecha, monto: m, concepto: concepto.trim() }],
      }),
    }
    try {
      const r = await fetch('/api/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, data, ...(avisar ? {} : { notify: 'none' }) }),
      })
      if (r.status === 401) { setSaving(false); return }   // se pide la contraseña; reintentá
      const d = await r.json().catch(() => ({}))
      if (!r.ok || !d.ok) throw new Error(d.error || `Error ${r.status}`)
      onSaved()
    } catch (e) {
      setError(`No se pudo guardar: ${e.message}`)
      setSaving(false)
    }
  }

  const pendientes = booking ? booking.items.filter(it => saldoOf(it) > 0) : []

  return (
    <div className="ib-overlay" onClick={e => e.target === e.currentTarget && !saving && onClose()}>
      <div className="ib-modal" style={{ maxWidth: 440 }}>
        <div className="ib-modal-header">
          <div className="ib-modal-title"><span>💲</span><span>Registrar pago</span></div>
          <button className="ib-close-btn" onClick={onClose} disabled={saving}>✕</button>
        </div>
        <div className="ib-modal-body">
          <p className="ib-hint"><strong>{titular}</strong></p>

          {!booking && !error && <p className="ib-hint">Cargando…</p>}

          {booking && pendientes.length === 0 && (
            <p className="ib-hint">Esta reserva no tiene saldo pendiente. 🎉</p>
          )}

          {booking && pendientes.length > 0 && (
            <>
              <label className="ib-hint" style={{ display: 'block', marginTop: 8 }}>Ítem</label>
              <select className="admin-input" value={itemId} onChange={e => pickItem(e.target.value)}>
                {pendientes.map(it => (
                  <option key={it.id} value={it.id}>
                    {it.icono} {it.tipo} — saldo {saldoOf(it).toLocaleString('es-AR')} {it.moneda}
                  </option>
                ))}
              </select>

              <label className="ib-hint" style={{ display: 'block', marginTop: 10 }}>Monto ({item?.moneda})</label>
              <input className="admin-input" inputMode="decimal" value={monto}
                onChange={e => setMonto(e.target.value)} />

              <label className="ib-hint" style={{ display: 'block', marginTop: 10 }}>Fecha del pago</label>
              <input className="admin-input" type="date" value={fecha} onChange={e => setFecha(e.target.value)} />

              <label className="ib-hint" style={{ display: 'block', marginTop: 10 }}>Concepto (opcional)</label>
              <input className="admin-input" value={concepto} placeholder="Ej: Cuota 2"
                onChange={e => setConcepto(e.target.value)} />

              <label style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 12, fontSize: 14 }}>
                <input type="checkbox" checked={avisar} onChange={e => setAvisar(e.target.checked)} disabled={!contacto} />
                {contacto
                  ? 'Avisar al viajero por email / WhatsApp'
                  : 'El viajero no tiene email ni teléfono: no se envía aviso'}
              </label>
            </>
          )}

          {error && <p className="ib-hint" style={{ color: '#C62828', marginTop: 10 }}>{error}</p>}

          <div className="ib-modal-actions" style={{ marginTop: 14 }}>
            <button className="admin-btn admin-btn-ghost" onClick={onClose} disabled={saving}>Cancelar</button>
            {pendientes.length > 0 && (
              <button className="admin-btn admin-btn-primary" onClick={guardar} disabled={saving || !booking}>
                {saving ? 'Guardando…' : '💾 Registrar pago'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
