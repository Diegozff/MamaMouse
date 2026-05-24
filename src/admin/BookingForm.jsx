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

/* ── Viajero row ── */
function ViajerRow({ viajero, onChange, onRemove }) {
  function calcEdad(fechaNac) {
    if (!fechaNac) return null
    const hoy = new Date()
    const nac = new Date(fechaNac)
    let edad = hoy.getFullYear() - nac.getFullYear()
    if (hoy < new Date(hoy.getFullYear(), nac.getMonth(), nac.getDate())) edad--
    return edad
  }
  const edad = calcEdad(viajero.fechaNac)
  return (
    <div className="af-viajero-row">
      <input className="admin-input" placeholder="Nombre" value={viajero.nombre || ''}
        onChange={e => onChange({ ...viajero, nombre: e.target.value })} />
      <input className="admin-input" placeholder="Apellido" value={viajero.apellido || ''}
        onChange={e => onChange({ ...viajero, apellido: e.target.value })} />
      <div className="af-viajero-fecha-wrap">
        <input className="admin-input" type="date" value={viajero.fechaNac || ''}
          onChange={e => onChange({ ...viajero, fechaNac: e.target.value })} />
        {edad !== null && <span className="af-viajero-edad">{edad} años</span>}
      </div>
      <select className="admin-input af-viajero-tipo"
        value={viajero.tipoDoc || 'DNI'}
        onChange={e => onChange({ ...viajero, tipoDoc: e.target.value })}>
        <option value="DNI">DNI</option>
        <option value="Pasaporte">Pasaporte</option>
      </select>
      <input className="admin-input" placeholder="Nro. documento" value={viajero.nroDoc || ''}
        onChange={e => onChange({ ...viajero, nroDoc: e.target.value })} />
      <button className="af-remove-btn" onClick={onRemove}>✕</button>
    </div>
  )
}

/* ── Voucher row ── */
function VoucherRow({ voucher, onChange, onRemove, bookingId }) {
  const [uploading, setUploading] = useState(false)

  const handlePdf = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    try {
      const buf = await file.arrayBuffer()
      const r = await fetch(
        `/api/upload-pdf/${encodeURIComponent(bookingId)}/${encodeURIComponent(voucher.id)}`,
        { method: 'POST', headers: { 'Content-Type': 'application/pdf' }, body: buf }
      )
      const data = await r.json()
      if (data.ok) onChange({ ...voucher, url: data.url })
    } catch (err) { console.error(err) }
    setUploading(false)
  }

  return (
    <div className="af-voucher-row">
      <input
        className="admin-input af-voucher-nombre"
        value={voucher.nombre}
        placeholder="Ej: Baucher Hotel Disney, Recibo Aéreos…"
        onChange={e => onChange({ ...voucher, nombre: e.target.value })}
      />
      {voucher.url ? (
        <div className="af-pdf-row">
          <a href={voucher.url} target="_blank" rel="noreferrer" className="af-pdf-link">
            📄 Ver PDF
          </a>
          <button className="af-remove-btn" title="Quitar PDF"
            onClick={() => onChange({ ...voucher, url: '' })}>✕</button>
        </div>
      ) : (
        <label className={`af-pdf-upload-btn ${uploading ? 'uploading' : ''}`}>
          {uploading ? '⏳ Subiendo…' : '📎 Subir PDF'}
          <input type="file" accept="application/pdf" style={{ display: 'none' }}
            onChange={handlePdf} disabled={uploading} />
        </label>
      )}
      <button className="af-remove-btn af-voucher-remove" onClick={onRemove}>✕</button>
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

const HOTEL_TIPOS   = ['Hoteles']
const TICKET_TIPOS  = ['Tickets Disney', 'Tickets Universal', 'Otros Tickets']
const PAQUETE_TIPOS = ['Paquete Disney', 'Paquete Universal']
const isHotel   = tipo => HOTEL_TIPOS.includes(tipo)
const isTicket  = tipo => TICKET_TIPOS.includes(tipo)
const isPaquete = tipo => PAQUETE_TIPOS.includes(tipo)

/* ── Ticket-specific fields ── */
function TicketFields({ item, setField }) {
  return (
    <div className="af-hotel-block">
      <div className="af-hotel-block-title">🎟️ Datos de los Tickets</div>
      <div className="af-grid-2">
        <Field label="N° de Reserva">
          <input className="admin-input" value={item.nroReserva || ''}
            onChange={e => setField('nroReserva', e.target.value)}
            placeholder="Ej: TKT-987654" />
        </Field>
        <Field label="Validez — Desde">
          <input className="admin-input" type="date" value={item.validezDesde || ''}
            onChange={e => setField('validezDesde', e.target.value)} />
        </Field>
        <Field label="Validez — Hasta">
          <input className="admin-input" type="date" value={item.validezHasta || ''}
            onChange={e => setField('validezHasta', e.target.value)} />
        </Field>
      </div>
      <label className="af-hotel-toggle" style={{ marginTop: 10 }}>
        <input type="checkbox" checked={!!item.pagadoTotal}
          onChange={e => setField('pagadoTotal', e.target.checked)} />
        <span>Marcar como <strong>Abonado por completo</strong> ✅</span>
      </label>
    </div>
  )
}

/* ── Paquete-specific fields (Hotel + Tickets) ── */
function PaqueteFields({ item, setField }) {
  return (
    <>
      <div className="af-hotel-block">
        <div className="af-hotel-block-title">📦 Datos del Paquete</div>
        <div className="af-grid-2">
          <Field label="N° de Reserva">
            <input className="admin-input" value={item.nroReserva || ''}
              onChange={e => setField('nroReserva', e.target.value)}
              placeholder="Ej: PKG-123456" />
          </Field>
          <Field label="Huéspedes">
            <input className="admin-input" type="number" min="1"
              value={item.huespedes || ''}
              onChange={e => setField('huespedes', e.target.value)}
              placeholder="Cantidad de personas" />
          </Field>
        </div>
      </div>

      <div className="af-hotel-block">
        <div className="af-hotel-block-title">🏨 Hotel incluido</div>
        <div className="af-grid-2">
          <Field label="Nombre del Hotel">
            <input className="admin-input" value={item.hotel || ''}
              onChange={e => setField('hotel', e.target.value)}
              placeholder="Ej: Disney's All-Star Sports" />
          </Field>
          <Field label="Check-in">
            <input className="admin-input" type="date" value={item.checkIn || item.fechaInicio || ''}
              onChange={e => setField('checkIn', e.target.value)} />
          </Field>
          <Field label="Check-out">
            <input className="admin-input" type="date" value={item.checkOut || item.fechaFin || ''}
              onChange={e => setField('checkOut', e.target.value)} />
          </Field>
        </div>
      </div>

      <div className="af-hotel-block">
        <div className="af-hotel-block-title">🎢 Tickets de Parque incluidos</div>
        <Field label="Descripción de los tickets">
          <textarea className="admin-input af-textarea"
            value={item.ticketsDesc || ''}
            onChange={e => setField('ticketsDesc', e.target.value)}
            placeholder="Ej: 5 días Park Hopper — Magic Kingdom, EPCOT, Hollywood Studios, Animal Kingdom + Universal 2 días..." />
        </Field>
      </div>

      <div className="af-hotel-block">
        <div className="af-hotel-block-title">🎁 Servicios incluidos</div>
        <DynamicList label="Extras contratados" items={item.extras || []}
          onChange={v => setField('extras', v)} placeholder="Ej: Transporte gratuito a los parques..." />
        <DynamicList label="Gratis / Cortesía" items={item.gratis || []}
          onChange={v => setField('gratis', v)} placeholder="Ej: Express pass ilimitados..." />
      </div>

      <div className="af-hotel-block">
        <div className="af-hotel-block-title">💳 Estado de Pago</div>
        <label className="af-hotel-toggle">
          <input type="checkbox" checked={!!item.pagadoTotal}
            onChange={e => setField('pagadoTotal', e.target.checked)} />
          <span>Marcar paquete como <strong>Pago Total</strong> ✅</span>
        </label>
      </div>
    </>
  )
}

/* ── Hotel-specific fields ── */
function HotelFields({ item, setField, bookingId }) {
  const [uploading, setUploading] = useState(false)

  const handlePdf = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    try {
      const buf = await file.arrayBuffer()
      const r = await fetch(`/api/upload-pdf/${encodeURIComponent(bookingId)}/${encodeURIComponent(item.id)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/pdf' },
        body: buf,
      })
      const data = await r.json()
      if (data.ok) setField('pdfUrl', data.url)
    } catch (err) { console.error(err) }
    setUploading(false)
  }

  return (
    <>
      {/* Datos del hotel */}
      <div className="af-hotel-block">
        <div className="af-hotel-block-title">🏨 Datos del Hotel</div>
        <div className="af-grid-2">
          <Field label="N° de Reserva">
            <input className="admin-input" value={item.nroReserva || ''}
              onChange={e => setField('nroReserva', e.target.value)}
              placeholder="Ej: RES-12345" />
          </Field>
          <Field label="Nombre del Hotel">
            <input className="admin-input" value={item.hotel || ''}
              onChange={e => setField('hotel', e.target.value)}
              placeholder="Ej: Disney's Grand Floridian" />
          </Field>
          <Field label="Dirección">
            <input className="admin-input" value={item.direccion || ''}
              onChange={e => setField('direccion', e.target.value)}
              placeholder="Ej: 4401 Floridian Way, Orlando" />
          </Field>
          <Field label="Huéspedes">
            <input className="admin-input" type="number" min="1"
              value={item.huespedes || ''}
              onChange={e => setField('huespedes', e.target.value)}
              placeholder="Cantidad de personas" />
          </Field>
        </div>
      </div>

      {/* Servicios */}
      <div className="af-hotel-block">
        <div className="af-hotel-block-title">🎁 Servicios incluidos</div>
        <DynamicList label="Promos aplicadas" items={item.promos || []}
          onChange={v => setField('promos', v)} placeholder="Ej: 10% Early Bird..." />
        <DynamicList label="Extras contratados" items={item.extras || []}
          onChange={v => setField('extras', v)} placeholder="Ej: Desayuno buffet..." />
        <DynamicList label="Gratis / Cortesía" items={item.gratis || []}
          onChange={v => setField('gratis', v)} placeholder="Ej: Traslado desde aeropuerto..." />
      </div>

      {/* Pago en hotel */}
      <div className="af-hotel-block">
        <div className="af-hotel-block-title">💳 Pago en el Hotel</div>
        <label className="af-hotel-toggle">
          <input type="checkbox" checked={!!item.pagadoTotal}
            onChange={e => setField('pagadoTotal', e.target.checked)} />
          <span>Marcar como <strong>Pago Total</strong> — sin saldo pendiente en destino</span>
        </label>
        {!item.pagadoTotal && (
          <Field label="Saldo a pagar en el hotel">
            <input className="admin-input" type="number" min="0"
              value={item.saldoEnHotel ?? 0}
              onChange={e => setField('saldoEnHotel', Number(e.target.value))} />
          </Field>
        )}
      </div>

      {/* PDF */}
      <div className="af-hotel-block">
        <div className="af-hotel-block-title">📄 Baucher PDF</div>
        {item.pdfUrl ? (
          <div className="af-pdf-row">
            <a href={item.pdfUrl} target="_blank" rel="noreferrer" className="af-pdf-link">
              📄 Ver PDF adjunto
            </a>
            <button className="af-remove-btn" title="Quitar PDF"
              onClick={() => setField('pdfUrl', '')}>✕</button>
          </div>
        ) : (
          <label className={`af-pdf-upload-btn ${uploading ? 'uploading' : ''}`}>
            {uploading ? '⏳ Subiendo…' : '📎 Adjuntar PDF'}
            <input type="file" accept="application/pdf" style={{ display: 'none' }}
              onChange={handlePdf} disabled={uploading} />
          </label>
        )}
      </div>
    </>
  )
}

/* ── Item Editor ── */
function ItemEditor({ item, onChange, onRemove, bookingId }) {
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

          {/* Campos específicos de paquete */}
          {isPaquete(item.tipo) && (
            <PaqueteFields item={item} setField={setField} />
          )}

          {/* Campos específicos de tickets */}
          {isTicket(item.tipo) && (
            <TicketFields item={item} setField={setField} />
          )}

          {/* Campos específicos de hotel */}
          {isHotel(item.tipo) && (
            <HotelFields item={item} setField={setField} bookingId={bookingId} />
          )}

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

  const addVoucher    = () => setA('vouchers', [...(d.vouchers || []), { id: uid(), nombre: '', url: '', icono: '📄' }])
  const updateVoucher = (i, v) => { const vs = [...(d.vouchers || [])]; vs[i] = v; setA('vouchers', vs) }
  const removeVoucher = i => setA('vouchers', (d.vouchers || []).filter((_, idx) => idx !== i))

  const addViajero    = () => setA('viajeros', [...(d.viajeros || []), { id: uid(), nombre: '', apellido: '', fechaNac: '', tipoDoc: 'DNI', nroDoc: '' }])
  const updateViajero = (i, v) => { const vs = [...(d.viajeros || [])]; vs[i] = v; setA('viajeros', vs) }
  const removeViajero = i => setA('viajeros', (d.viajeros || []).filter((_, idx) => idx !== i))

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

        <div className="af-login-section">
          <div className="af-login-header">🔐 Acceso del viajero</div>
          <div className="af-grid-2">
            <Field label="Usuario">
              <input className="admin-input" value={d.usuario || ''}
                onChange={e => setA('usuario', e.target.value)}
                placeholder="ej: familia-garcia"
                autoCapitalize="none" autoCorrect="off" />
            </Field>
            <Field label="Contraseña">
              <input className="admin-input" value={d.password || ''}
                onChange={e => setA('password', e.target.value)}
                placeholder="ej: disney2026" />
            </Field>
          </div>
          <p className="af-login-hint">El viajero usará estos datos para ingresar a su reserva en www.mamamouse.com.ar</p>
        </div>

        <Field label="Destinos">
          <DestinosField destinos={d.destinos || []} onChange={v => setA('destinos', v)} />
        </Field>
      </Section>

      {/* ── VIAJEROS ── */}
      <Section id="sec-viajeros" icon="👥" title="Datos de los Viajeros">
        {(d.viajeros || []).length === 0 && (
          <p className="af-vouchers-hint">Agregá los datos de cada viajero: nombre, apellido, fecha de nacimiento y documento.</p>
        )}
        {(d.viajeros || []).length > 0 && (
          <div className="af-viajero-header">
            <span>Nombre</span><span>Apellido</span><span>Fecha de nacimiento</span><span>Tipo</span><span>Nro. documento</span><span></span>
          </div>
        )}
        {(d.viajeros || []).map((v, i) => (
          <ViajerRow key={v.id} viajero={v}
            onChange={updated => updateViajero(i, updated)}
            onRemove={() => removeViajero(i)} />
        ))}
        <button className="admin-btn admin-btn-ghost af-add-btn" onClick={addViajero}>
          + Agregar viajero
        </button>
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
            onRemove={() => removeItem(i)}
            bookingId={d.id} />
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

      {/* ── VOUCHERS ── */}
      <Section id="sec-vouchers" icon="📄" title="Bauchers y Recibos">
        <p className="af-vouchers-hint">
          Subí los PDFs de bauchers, recibos y confirmaciones. El viajero podrá descargarlos desde su reserva.
        </p>
        <div className="af-dynamic">
          {(d.vouchers || []).map((v, i) => (
            <VoucherRow
              key={v.id}
              voucher={v}
              onChange={updated => updateVoucher(i, updated)}
              onRemove={() => removeVoucher(i)}
              bookingId={d.id}
            />
          ))}
          <button className="admin-btn admin-btn-ghost af-add-btn" onClick={addVoucher}>
            + Agregar baucher / recibo
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
