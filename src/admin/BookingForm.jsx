import { useState, useEffect } from 'react'

const DESTINOS_OPT = ['Disney World', 'Universal Studios', 'SeaWorld', 'Busch Gardens']
const MONEDAS      = ['USD', 'ARS', 'EUR']

const ITEM_TIPOS = [
  { tipo: 'Aéreos',                icono: '✈️' },
  { tipo: 'Hoteles',               icono: '🏨' },
  { tipo: 'Tickets Disney',        icono: '🏰' },
  { tipo: 'Tickets Universal',     icono: '🎢' },
  { tipo: 'Otros Tickets',         icono: '🎟️' },
  { tipo: 'Paquete Universal',     icono: '🌟' },
  { tipo: 'Paquete Disney',        icono: '✨' },
  { tipo: 'Renta de Auto',         icono: '🚗' },
  { tipo: 'Asistencia al Viajero', icono: '🛡️' },
]

function iconoFor(tipo) {
  return ITEM_TIPOS.find(t => t.tipo === tipo)?.icono || '📦'
}
function uid() { return Math.random().toString(36).slice(2, 9) }

/* ── Generic helpers ── */
function Field({ label, children }) {
  return (
    <div className="af-field">
      <label className="af-label">{label}</label>
      {children}
    </div>
  )
}

function Section({ id, icon, title, children }) {
  return (
    <div id={id} className="af-section">
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
          <input className="admin-input" value={item} placeholder={placeholder}
            onChange={e => update(i, e.target.value)} />
          <button className="af-remove-btn" onClick={() => remove(i)}>✕</button>
        </div>
      ))}
      <button className="admin-btn admin-btn-ghost af-add-btn" onClick={add}>+ Agregar</button>
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

/* ── Destinos con opción libre ── */
function DestinosField({ destinos, onChange }) {
  const [customInput, setCustomInput] = useState('')
  const [showCustom,  setShowCustom]  = useState(false)

  const toggle = (dest) =>
    onChange(destinos.includes(dest)
      ? destinos.filter(x => x !== dest)
      : [...destinos, dest])

  const addCustom = () => {
    const val = customInput.trim()
    if (val && !destinos.includes(val)) onChange([...destinos, val])
    setCustomInput(''); setShowCustom(false)
  }

  const removeCustom = (dest) => onChange(destinos.filter(x => x !== dest))
  const customDestinos = destinos.filter(d => !DESTINOS_OPT.includes(d))

  return (
    <div className="af-destinos-wrap">
      <div className="af-chips-opt">
        {DESTINOS_OPT.map(dest => (
          <button key={dest}
            className={`af-chip-opt ${destinos.includes(dest) ? 'active' : ''}`}
            onClick={() => toggle(dest)}>{dest}</button>
        ))}
        {customDestinos.map(dest => (
          <div key={dest} className="af-chip-custom">
            <span>{dest}</span>
            <button onClick={() => removeCustom(dest)}>✕</button>
          </div>
        ))}
        {!showCustom && (
          <button className="af-chip-add" onClick={() => setShowCustom(true)}>
            + Otro destino
          </button>
        )}
      </div>
      {showCustom && (
        <div className="af-custom-dest-row">
          <input className="admin-input"
            placeholder="Ej: Cruise Disney, Washington DC..."
            value={customInput}
            onChange={e => setCustomInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') addCustom(); if (e.key === 'Escape') setShowCustom(false) }}
            autoFocus />
          <button className="admin-btn admin-btn-primary" onClick={addCustom}>Agregar</button>
          <button className="admin-btn admin-btn-ghost" onClick={() => { setShowCustom(false); setCustomInput('') }}>✕</button>
        </div>
      )}
    </div>
  )
}

/* ── Item Editor ── */
function ItemEditor({ item, onChange, onRemove }) {
  const [open, setOpen] = useState(true)
  const setField = (key, val) => onChange({ ...item, [key]: val })

  const addPago    = () => setField('pagos', [...item.pagos, { fecha: '', monto: 0, concepto: '' }])
  const updatePago = (i, p) => { const pagos = [...item.pagos]; pagos[i] = p; setField('pagos', pagos) }
  const removePago = i => setField('pagos', item.pagos.filter((_, idx) => idx !== i))

  const totalPaid = item.pagos.reduce((s, p) => s + (Number(p.monto) || 0), 0)
  const saldo     = (Number(item.total) || 0) - totalPaid

  return (
    <div className="af-item-editor">
      <div className="af-item-header" onClick={() => setOpen(o => !o)}>
        <span className="af-item-icono">{iconoFor(item.tipo)}</span>
        <div className="af-item-header-info">
          <span className="af-item-tipo">{item.tipo || 'Nuevo ítem'}</span>
          <span className="af-item-summary">
            ${(Number(item.total)||0).toLocaleString('es-AR')} {item.moneda}
            {saldo > 0 && ` · Saldo $${saldo.toLocaleString('es-AR')}`}
          </span>
        </div>
        <div className="af-item-header-actions" onClick={e => e.stopPropagation()}>
          <button className="af-remove-btn" onClick={onRemove}>✕</button>
        </div>
        <span className="af-item-toggle">{open ? '▲' : '▼'}</span>
      </div>

      {open && (
        <div className="af-item-body">
          <div className="af-grid-2">
            <Field label="Tipo de servicio">
              <select className="admin-input" value={item.tipo}
                onChange={e => onChange({ ...item, tipo: e.target.value, icono: iconoFor(e.target.value) })}>
                <option value="">— Seleccioná —</option>
                {ITEM_TIPOS.map(t => (
                  <option key={t.tipo} value={t.tipo}>{t.icono} {t.tipo}</option>
                ))}
              </select>
            </Field>
            <Field label="Moneda">
              <select className="admin-input" value={item.moneda}
                onChange={e => setField('moneda', e.target.value)}>
                {MONEDAS.map(m => <option key={m}>{m}</option>)}
              </select>
            </Field>
          </div>

          <Field label="Descripción">
            <input className="admin-input" value={item.descripcion} placeholder="Detalle del servicio..."
              onChange={e => setField('descripcion', e.target.value)} />
          </Field>

          <div className="af-grid-2">
            <Field label="Fecha de inicio">
              <input className="admin-input" type="date" value={item.fechaInicio || ''}
                onChange={e => setField('fechaInicio', e.target.value)} />
            </Field>
            <Field label="Fecha de fin">
              <input className="admin-input" type="date" value={item.fechaFin || ''}
                onChange={e => setField('fechaFin', e.target.value)} />
            </Field>
            <Field label="Total del ítem">
              <input className="admin-input" type="number" value={item.total}
                onChange={e => setField('total', Number(e.target.value))} />
            </Field>
            <Field label="Fecha límite de pago">
              <input className="admin-input" type="date" value={item.fechaLimite}
                onChange={e => setField('fechaLimite', e.target.value)} />
            </Field>
          </div>

          <div className="af-payment-summary">
            <span>Abonado: <strong>${totalPaid.toLocaleString('es-AR')} {item.moneda}</strong></span>
            <span className={saldo > 0 ? 'af-saldo-due' : 'af-saldo-ok'}>
              Saldo: <strong>${saldo.toLocaleString('es-AR')} {item.moneda}</strong>
            </span>
          </div>

          <div className="af-dynamic">
            <label className="af-label">Historial de Pagos</label>
            {item.pagos.length > 0 && (
              <div className="af-pago-header">
                <span>Fecha</span><span>Monto</span><span>Concepto</span><span></span>
              </div>
            )}
            {item.pagos.map((p, i) => (
              <div key={i} className="af-pago-row">
                <input className="admin-input" type="date" value={p.fecha}
                  onChange={e => updatePago(i, { ...p, fecha: e.target.value })} />
                <input className="admin-input" type="number" placeholder="Monto" value={p.monto}
                  onChange={e => updatePago(i, { ...p, monto: Number(e.target.value) })} />
                <input className="admin-input" placeholder="Concepto" value={p.concepto}
                  onChange={e => updatePago(i, { ...p, concepto: e.target.value })} />
                <button className="af-remove-btn" onClick={() => removePago(i)}>✕</button>
              </div>
            ))}
            <button className="admin-btn admin-btn-ghost af-add-btn" onClick={addPago}>
              + Registrar pago
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Main Form ── */
export default function BookingForm({ initialData, onSave, saving }) {
  const [d, setD] = useState(initialData)
  useEffect(() => { setD(initialData) }, [initialData])

  const setA = (key, val) => setD(prev => ({ ...prev, [key]: val }))

  const addItem = () => setA('items', [
    ...(d.items || []),
    { id: uid(), tipo: '', icono: '📦', descripcion: '',
      moneda: 'USD', total: 0,
      fechaInicio: '', fechaFin: '', fechaLimite: '',
      pagos: [] }
  ])
  const updateItem = (i, item) => {
    const items = [...(d.items || [])]; items[i] = item; setA('items', items)
  }
  const removeItem = i => setA('items', (d.items || []).filter((_, idx) => idx !== i))

  const addDia    = () => setA('itinerario', [...d.itinerario, { dia: d.itinerario.length + 1, fecha: '', plan: '' }])
  const updateDia = (i, item) => { const it = [...d.itinerario]; it[i] = item; setA('itinerario', it) }
  const removeDia = i => setA('itinerario', d.itinerario.filter((_, idx) => idx !== i))

  const items = d.items || []
  const byCur = {}
  for (const it of items) {
    if (!byCur[it.moneda]) byCur[it.moneda] = { total: 0, paid: 0 }
    byCur[it.moneda].total += Number(it.total) || 0
    byCur[it.moneda].paid  += it.pagos.reduce((s, p) => s + (Number(p.monto)||0), 0)
  }

  return (
    <div className="af-form">

      {/* ── GENERAL ── */}
      <Section id="sec-general" icon="👤" title="Información General">
        <div className="af-grid-2">
          <Field label="Nombre del Titular">
            <input className="admin-input" value={d.titular}
              onChange={e => setA('titular', e.target.value)} placeholder="Ej: Familia García" />
          </Field>
          <Field label="Email del titular">
            <input className="admin-input" type="email" value={d.email || ''}
              onChange={e => setA('email', e.target.value)} placeholder="reservas@email.com" />
          </Field>
          <Field label="WhatsApp / Teléfono">
            <input className="admin-input" value={d.telefono || ''}
              onChange={e => setA('telefono', e.target.value)} placeholder="+5491112345678" />
          </Field>
        </div>
        <Field label="Destinos">
          <DestinosField destinos={d.destinos || []} onChange={v => setA('destinos', v)} />
        </Field>
      </Section>

      {/* ── ITEMS ── */}
      <Section id="sec-items" icon="💳" title="Ítems Contratados y Pagos">
        {Object.entries(byCur).map(([cur, { total, paid }]) => (
          <div key={cur} className="af-payment-summary af-global-summary">
            <span>Total {cur}: <strong>${total.toLocaleString('es-AR')}</strong></span>
            <span>Abonado: <strong>${paid.toLocaleString('es-AR')}</strong></span>
            <span className={(total - paid) > 0 ? 'af-saldo-due' : 'af-saldo-ok'}>
              Saldo: <strong>${(total - paid).toLocaleString('es-AR')}</strong>
            </span>
          </div>
        ))}
        {items.map((item, i) => (
          <ItemEditor key={item.id || i} item={item}
            onChange={updated => updateItem(i, updated)}
            onRemove={() => removeItem(i)} />
        ))}
        <button className="admin-btn admin-btn-ghost af-add-item-btn" onClick={addItem}>
          + Agregar ítem contratado
        </button>
      </Section>

      {/* ── BENEFICIOS ── */}
      <Section id="sec-beneficios" icon="🎁" title="Beneficios Mama Mouse">
        <DynamicList label="Promociones Aplicadas" items={d.promos || []}
          onChange={v => setA('promos', v)} placeholder="Ej: Early Bird 10% de descuento..." />
        <DynamicList label="Regalos y Sorpresas" items={d.regalos || []}
          onChange={v => setA('regalos', v)} placeholder="Ej: Kit de bienvenida Mama Mouse..." />
      </Section>

      {/* ── ITINERARIO ── */}
      <Section id="sec-itinerario" icon="🗺️" title="Itinerario Día a Día">
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
        <button className="admin-btn admin-btn-primary af-save-btn"
          onClick={() => onSave(d)} disabled={saving}>
          {saving ? '⏳ Guardando...' : '💾 Guardar Reserva'}
        </button>
      </div>

    </div>
  )
}
