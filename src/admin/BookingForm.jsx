import { useState, useEffect } from 'react'

const DESTINOS_OPT = ['Disney World', 'Universal Studios', 'SeaWorld', 'Hoteles']
const MONEDAS      = ['USD', 'ARS', 'EUR']

function Field({ label, children }) {
  return (
    <div className="af-field">
      <label className="af-label">{label}</label>
      {children}
    </div>
  )
}

function Section({ icon, title, children }) {
  return (
    <div className="af-section">
      <div className="af-section-header">
        <span>{icon}</span>
        <span className="af-section-title">{title}</span>
      </div>
      <div className="af-section-body">{children}</div>
    </div>
  )
}

function DynamicList({ label, items, onChange, placeholder = 'Agregar ítem...' }) {
  const add    = () => onChange([...items, ''])
  const remove = i  => onChange(items.filter((_, idx) => idx !== i))
  const update = (i, v) => { const n = [...items]; n[i] = v; onChange(n) }

  return (
    <div className="af-dynamic">
      <label className="af-label">{label}</label>
      {items.map((item, i) => (
        <div key={i} className="af-dynamic-row">
          <input
            className="admin-input"
            value={item}
            placeholder={placeholder}
            onChange={e => update(i, e.target.value)}
          />
          <button className="af-remove-btn" onClick={() => remove(i)}>✕</button>
        </div>
      ))}
      <button className="admin-btn admin-btn-ghost af-add-btn" onClick={add}>
        + Agregar
      </button>
    </div>
  )
}

function PaymentRow({ pago, onChange, onRemove }) {
  return (
    <div className="af-pago-row">
      <input className="admin-input" type="date" value={pago.fecha}
        onChange={e => onChange({ ...pago, fecha: e.target.value })} />
      <input className="admin-input" type="number" placeholder="Monto" value={pago.monto}
        onChange={e => onChange({ ...pago, monto: Number(e.target.value) })} />
      <input className="admin-input" placeholder="Concepto" value={pago.concepto}
        onChange={e => onChange({ ...pago, concepto: e.target.value })} />
      <button className="af-remove-btn" onClick={onRemove}>✕</button>
    </div>
  )
}

function ItineraryRow({ item, onChange, onRemove }) {
  return (
    <div className="af-itinerary-row">
      <input className="admin-input af-day-num" type="number" placeholder="Día" value={item.dia}
        onChange={e => onChange({ ...item, dia: Number(e.target.value) })} />
      <input className="admin-input" type="date" value={item.fecha}
        onChange={e => onChange({ ...item, fecha: e.target.value })} />
      <input className="admin-input af-plan" placeholder="Plan del día" value={item.plan}
        onChange={e => onChange({ ...item, plan: e.target.value })} />
      <button className="af-remove-btn" onClick={onRemove}>✕</button>
    </div>
  )
}

export default function BookingForm({ initialData, onSave, saving }) {
  const [d, setD] = useState(initialData)

  useEffect(() => { setD(initialData) }, [initialData])

  const set  = (path, val) => setD(prev => setNested({ ...prev }, path, val))
  const setA = (key, val)  => setD(prev => ({ ...prev, [key]: val }))

  // paid total
  const totalPaid = d.financiero.pagos.reduce((s, p) => s + (Number(p.monto) || 0), 0)
  const saldo     = (Number(d.financiero.total) || 0) - totalPaid

  const addPago = () => setA('financiero', {
    ...d.financiero,
    pagos: [...d.financiero.pagos, { fecha: '', monto: 0, concepto: '' }]
  })
  const updatePago = (i, p) => {
    const pagos = [...d.financiero.pagos]; pagos[i] = p
    setA('financiero', { ...d.financiero, pagos })
  }
  const removePago = i => {
    setA('financiero', { ...d.financiero, pagos: d.financiero.pagos.filter((_, idx) => idx !== i) })
  }

  const addDia = () => setA('itinerario', [
    ...d.itinerario,
    { dia: d.itinerario.length + 1, fecha: '', plan: '' }
  ])
  const updateDia = (i, item) => {
    const it = [...d.itinerario]; it[i] = item; setA('itinerario', it)
  }
  const removeDia = i => setA('itinerario', d.itinerario.filter((_, idx) => idx !== i))

  const toggleDestino = (dest) => {
    const cur = d.destinos || []
    setA('destinos', cur.includes(dest) ? cur.filter(x => x !== dest) : [...cur, dest])
  }

  return (
    <div className="af-form">

      {/* ── GENERAL ── */}
      <Section icon="👤" title="Información General">
        <div className="af-grid-2">
          <Field label="Nombre del Titular">
            <input className="admin-input" value={d.titular}
              onChange={e => setA('titular', e.target.value)} placeholder="Ej: Familia García" />
          </Field>
        </div>
        <Field label="Destinos">
          <div className="af-chips-opt">
            {DESTINOS_OPT.map(dest => (
              <button
                key={dest}
                className={`af-chip-opt ${(d.destinos||[]).includes(dest) ? 'active' : ''}`}
                onClick={() => toggleDestino(dest)}
              >{dest}</button>
            ))}
          </div>
        </Field>
      </Section>

      {/* ── HOSPEDAJE ── */}
      <Section icon="🏨" title="Hospedaje y Estadía">
        <div className="af-grid-2">
          <Field label="Hotel">
            <input className="admin-input" value={d.hotel.nombre}
              onChange={e => set('hotel.nombre', e.target.value)} placeholder="Nombre del hotel" />
          </Field>
          <Field label="Categoría">
            <input className="admin-input" value={d.hotel.categoria}
              onChange={e => set('hotel.categoria', e.target.value)} placeholder="Ej: Moderado, Deluxe..." />
          </Field>
          <Field label="Check-In">
            <input className="admin-input" type="date" value={d.hotel.checkIn}
              onChange={e => set('hotel.checkIn', e.target.value)} />
          </Field>
          <Field label="Check-Out">
            <input className="admin-input" type="date" value={d.hotel.checkOut}
              onChange={e => set('hotel.checkOut', e.target.value)} />
          </Field>
          <Field label="Tipo de Habitación">
            <input className="admin-input" value={d.hotel.habitacion}
              onChange={e => set('hotel.habitacion', e.target.value)} placeholder="Ej: Suite Familiar" style={{ gridColumn: '1/-1' }} />
          </Field>
        </div>
      </Section>

      {/* ── TICKETS ── */}
      <Section icon="🎟️" title="Tickets y Experiencias">
        <div className="af-grid-2">
          <Field label="Disney">
            <input className="admin-input" value={d.tickets.disney}
              onChange={e => set('tickets.disney', e.target.value)} placeholder="Ej: 7 días – Park Hopper Plus" />
          </Field>
          <Field label="Universal">
            <input className="admin-input" value={d.tickets.universal}
              onChange={e => set('tickets.universal', e.target.value)} placeholder="Ej: 3 días – Park-to-Park" />
          </Field>
        </div>
        <DynamicList label="Extras / Adicionales" items={d.extras}
          onChange={v => setA('extras', v)} placeholder="Ej: Disney Dining Plan, Halloween Party..." />
      </Section>

      {/* ── LOGÍSTICA ── */}
      <Section icon="🚗" title="Logística y Protección">
        <div className="af-grid-2">
          <Field label="Empresa de Autos">
            <input className="admin-input" value={d.auto.empresa}
              onChange={e => set('auto.empresa', e.target.value)} placeholder="Ej: Alamo" />
          </Field>
          <Field label="Categoría">
            <input className="admin-input" value={d.auto.categoria}
              onChange={e => set('auto.categoria', e.target.value)} placeholder="Ej: SUV Intermedia" />
          </Field>
          <Field label="Fecha de Retiro">
            <input className="admin-input" type="date" value={d.auto.retiro}
              onChange={e => set('auto.retiro', e.target.value)} />
          </Field>
          <Field label="Fecha de Devolución">
            <input className="admin-input" type="date" value={d.auto.devolucion}
              onChange={e => set('auto.devolucion', e.target.value)} />
          </Field>
          <Field label="Plan de Asistencia">
            <input className="admin-input" value={d.asistencia.plan}
              onChange={e => set('asistencia.plan', e.target.value)} placeholder="Ej: Assist Card Total" />
          </Field>
          <Field label="Cobertura">
            <input className="admin-input" value={d.asistencia.cobertura}
              onChange={e => set('asistencia.cobertura', e.target.value)} placeholder="Ej: Médica, equipaje..." />
          </Field>
        </div>
      </Section>

      {/* ── BENEFICIOS ── */}
      <Section icon="🎁" title="Beneficios Mama Mouse">
        <DynamicList label="Promociones Aplicadas" items={d.promos}
          onChange={v => setA('promos', v)} placeholder="Ej: Early Bird 10% de descuento..." />
        <DynamicList label="Regalos y Sorpresas" items={d.regalos}
          onChange={v => setA('regalos', v)} placeholder="Ej: Kit de bienvenida Mama Mouse..." />
      </Section>

      {/* ── FINANCIERO ── */}
      <Section icon="💳" title="Estado Financiero">
        <div className="af-grid-3">
          <Field label="Total del Paquete">
            <input className="admin-input" type="number" value={d.financiero.total}
              onChange={e => setA('financiero', { ...d.financiero, total: Number(e.target.value) })} />
          </Field>
          <Field label="Moneda">
            <select className="admin-input" value={d.financiero.moneda}
              onChange={e => setA('financiero', { ...d.financiero, moneda: e.target.value })}>
              {MONEDAS.map(m => <option key={m}>{m}</option>)}
            </select>
          </Field>
          <Field label="Fecha Límite de Pago">
            <input className="admin-input" type="date" value={d.financiero.fechaLimite}
              onChange={e => setA('financiero', { ...d.financiero, fechaLimite: e.target.value })} />
          </Field>
        </div>

        <div className="af-payment-summary">
          <span>Total abonado: <strong>${totalPaid.toLocaleString('es-AR')} {d.financiero.moneda}</strong></span>
          <span className={saldo > 0 ? 'af-saldo-due' : 'af-saldo-ok'}>
            Saldo pendiente: <strong>${saldo.toLocaleString('es-AR')} {d.financiero.moneda}</strong>
          </span>
        </div>

        <div className="af-dynamic">
          <label className="af-label">Historial de Pagos</label>
          <div className="af-pago-header">
            <span>Fecha</span><span>Monto</span><span>Concepto</span><span></span>
          </div>
          {d.financiero.pagos.map((p, i) => (
            <PaymentRow key={i} pago={p}
              onChange={p => updatePago(i, p)}
              onRemove={() => removePago(i)} />
          ))}
          <button className="admin-btn admin-btn-ghost af-add-btn" onClick={addPago}>
            + Agregar pago
          </button>
        </div>
      </Section>

      {/* ── ITINERARIO ── */}
      <Section icon="🗺️" title="Itinerario Día a Día">
        <div className="af-dynamic">
          {d.itinerario.map((item, i) => (
            <ItineraryRow key={i} item={item}
              onChange={v => updateDia(i, v)}
              onRemove={() => removeDia(i)} />
          ))}
          <button className="admin-btn admin-btn-ghost af-add-btn" onClick={addDia}>
            + Agregar día
          </button>
        </div>
      </Section>

      {/* ── SAVE BAR ── */}
      <div className="af-save-bar">
        <button
          className="admin-btn admin-btn-primary af-save-btn"
          onClick={() => onSave(d)}
          disabled={saving}
        >
          {saving ? '⏳ Guardando...' : '💾 Guardar Reserva'}
        </button>
      </div>

    </div>
  )
}

// Helper: set nested property by dot path
function setNested(obj, path, val) {
  const keys = path.split('.')
  let cur = obj
  for (let i = 0; i < keys.length - 1; i++) {
    cur[keys[i]] = { ...cur[keys[i]] }
    cur = cur[keys[i]]
  }
  cur[keys[keys.length - 1]] = val
  return obj
}
