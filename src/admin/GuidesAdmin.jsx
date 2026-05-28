import { useState, useEffect, useRef } from 'react'

const CATEGORIAS = ['Disney World', 'Universal', 'Destino', 'Otro']
const COLORES     = ['#78C5E0','#9B7EC8','#E8609A','#4CAF50','#FF9800','#7B5EA8','#1565C0','#00897B','#F06292','#6D4C41','#E53935','#F57C00']
const ICONOS_SUGERIDOS = ['🏰','🌍','🎬','🦁','🎭','🧙','🌌','🌴','🛍️','🏨','🎢','✈️','📚','🗺️','🍔','🎡','🌊','🎠']

function emptyGuide() {
  return {
    id:         '',
    nombre:     '',
    categoria:  'Disney World',
    icono:      '📚',
    descripcion:'',
    color:      '#9B7EC8',
    archivo:    '',
    tamano:     '',
    actualizado: new Date().toLocaleDateString('es-AR', { month: 'short', year: 'numeric' }).replace('.', ''),
  }
}

function slugify(str) {
  return str.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim().replace(/\s+/g, '-')
}

/* ── Tarjeta de guía en el admin ── */
function GuideRow({ guide, onEdit, onDelete, onUpload }) {
  return (
    <div className="ga-row">
      <div className="ga-row-accent" style={{ background: guide.color }} />
      <div className="ga-row-icon" style={{ background: guide.color + '22', color: guide.color }}>
        {guide.icono}
      </div>
      <div className="ga-row-info">
        <div className="ga-row-nombre">{guide.nombre}</div>
        <div className="ga-row-meta">
          <span className="ga-row-cat">{guide.categoria}</span>
          <span>{guide.tamano || '—'}</span>
          <span>{guide.actualizado || '—'}</span>
          <span className={`ga-row-status ${guide.pdfExists ? 'ga-status-ok' : 'ga-status-miss'}`}>
            {guide.pdfExists ? '✅ PDF subido' : '⚠️ Sin PDF'}
          </span>
        </div>
      </div>
      <div className="ga-row-actions">
        <button className="ga-btn ga-btn-upload" onClick={() => onUpload(guide)} title="Subir PDF">
          📤 Subir PDF
        </button>
        <button className="ga-btn ga-btn-edit" onClick={() => onEdit(guide)} title="Editar">
          ✏️
        </button>
        <button className="ga-btn ga-btn-del" onClick={() => onDelete(guide)} title="Eliminar">
          🗑
        </button>
      </div>
    </div>
  )
}

/* ── Modal de edición ── */
function GuideModal({ guide, onSave, onClose }) {
  const [form, setForm] = useState({ ...guide })
  const [saving, setSaving] = useState(false)
  const isNew = !guide.nombre

  const set = (k, v) => setForm(f => {
    const updated = { ...f, [k]: v }
    // Auto-generar archivo e id si es nuevo y cambia el nombre
    if (isNew && k === 'nombre') {
      const slug = slugify(v)
      updated.id      = slug
      updated.archivo = slug + '.pdf'
    }
    return updated
  })

  const handleSave = async () => {
    if (!form.nombre.trim() || !form.id.trim()) return
    setSaving(true)
    try {
      const r = await fetch('/api/guides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guide: form }),
      })
      if (r.ok) onSave()
      else {
        const d = await r.json()
        alert('Error: ' + (d.error || 'No se pudo guardar'))
      }
    } catch (e) {
      alert('Error de conexión: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="ib-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="ib-modal" style={{ maxWidth: 520 }}>
        <div className="ib-modal-header">
          <div className="ib-modal-title">
            <span>{isNew ? '➕' : '✏️'}</span>
            <span>{isNew ? 'Nueva guía' : 'Editar guía'}</span>
          </div>
          <button className="ib-close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="ib-modal-body" style={{ display:'flex', flexDirection:'column', gap:12 }}>

          {/* Preview */}
          <div className="ga-preview" style={{ borderLeft:`4px solid ${form.color}`, background: form.color + '11' }}>
            <span style={{ fontSize:28 }}>{form.icono || '📚'}</span>
            <div>
              <div style={{ fontWeight:700, fontSize:15 }}>{form.nombre || 'Nombre de la guía'}</div>
              <div style={{ fontSize:12, color:'var(--text-light)' }}>{form.categoria} · {form.tamano || 'PDF'}</div>
            </div>
          </div>

          {/* Nombre */}
          <label className="ga-label">
            Nombre
            <input className="admin-input" value={form.nombre} onChange={e => set('nombre', e.target.value)}
              placeholder="Ej: Magic Kingdom" autoFocus />
          </label>

          {/* ID (archivo) */}
          <div style={{ display:'flex', gap:8 }}>
            <label className="ga-label" style={{ flex:1 }}>
              ID (slug)
              <input className="admin-input" value={form.id} onChange={e => set('id', e.target.value)}
                placeholder="magic-kingdom" />
            </label>
            <label className="ga-label" style={{ flex:1 }}>
              Archivo PDF
              <input className="admin-input" value={form.archivo} onChange={e => set('archivo', e.target.value)}
                placeholder="magic-kingdom.pdf" />
            </label>
          </div>

          {/* Categoría */}
          <label className="ga-label">
            Categoría
            <select className="admin-input" value={form.categoria} onChange={e => set('categoria', e.target.value)}>
              {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>

          {/* Icono */}
          <label className="ga-label">
            Ícono (emoji)
            <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginTop:4 }}>
              {ICONOS_SUGERIDOS.map(ic => (
                <button key={ic} type="button"
                  onClick={() => set('icono', ic)}
                  style={{
                    fontSize:20, padding:'4px 8px', borderRadius:8, border:'2px solid',
                    borderColor: form.icono === ic ? form.color : 'transparent',
                    background: form.icono === ic ? form.color + '22' : 'var(--bg)',
                    cursor:'pointer',
                  }}>
                  {ic}
                </button>
              ))}
              <input className="admin-input" value={form.icono} onChange={e => set('icono', e.target.value)}
                style={{ width:60, textAlign:'center', fontSize:20 }} />
            </div>
          </label>

          {/* Color */}
          <label className="ga-label">
            Color
            <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginTop:4, alignItems:'center' }}>
              {COLORES.map(c => (
                <button key={c} type="button"
                  onClick={() => set('color', c)}
                  style={{
                    width:28, height:28, borderRadius:'50%', background:c, border:'3px solid',
                    borderColor: form.color === c ? '#333' : 'transparent',
                    cursor:'pointer',
                  }} />
              ))}
              <input type="color" value={form.color} onChange={e => set('color', e.target.value)}
                style={{ width:36, height:28, borderRadius:6, border:'1px solid var(--border)', cursor:'pointer' }} />
            </div>
          </label>

          {/* Descripción */}
          <label className="ga-label">
            Descripción
            <textarea className="admin-input" value={form.descripcion} onChange={e => set('descripcion', e.target.value)}
              rows={3} placeholder="Breve descripción del contenido de la guía…" style={{ resize:'vertical' }} />
          </label>

          {/* Tamaño y fecha */}
          <div style={{ display:'flex', gap:8 }}>
            <label className="ga-label" style={{ flex:1 }}>
              Tamaño (referencia)
              <input className="admin-input" value={form.tamano} onChange={e => set('tamano', e.target.value)}
                placeholder="Ej: 3.8 MB" />
            </label>
            <label className="ga-label" style={{ flex:1 }}>
              Actualizado
              <input className="admin-input" value={form.actualizado} onChange={e => set('actualizado', e.target.value)}
                placeholder="Ej: Ene 2026" />
            </label>
          </div>

          <div className="ib-modal-actions">
            <button className="admin-btn admin-btn-ghost" onClick={onClose}>Cancelar</button>
            <button className="admin-btn admin-btn-primary" onClick={handleSave}
              disabled={saving || !form.nombre.trim()}>
              {saving ? '⏳ Guardando…' : '💾 Guardar guía'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Modal de upload PDF ── */
function UploadModal({ guide, onDone, onClose }) {
  const [status,   setStatus]   = useState('idle') // idle | uploading | ok | error
  const [progress, setProgress] = useState(0)
  const [errMsg,   setErrMsg]   = useState('')
  const inputRef = useRef()

  const handleFile = async (file) => {
    if (!file || !file.name.endsWith('.pdf')) {
      setErrMsg('Solo se aceptan archivos PDF')
      return
    }
    setStatus('uploading')
    setErrMsg('')
    try {
      const arrayBuffer = await file.arrayBuffer()
      const r = await fetch(`/api/upload-guide/${guide.id}`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/pdf' },
        body:    arrayBuffer,
      })
      const data = await r.json()
      if (r.ok) {
        setStatus('ok')
      } else {
        setErrMsg(data.error || 'Error al subir')
        setStatus('error')
      }
    } catch (e) {
      setErrMsg(e.message)
      setStatus('error')
    }
  }

  return (
    <div className="ib-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="ib-modal" style={{ maxWidth: 440 }}>
        <div className="ib-modal-header">
          <div className="ib-modal-title"><span>📤</span><span>Subir PDF — {guide.nombre}</span></div>
          <button className="ib-close-btn" onClick={onClose}>✕</button>
        </div>
        <div className="ib-modal-body">
          {status === 'ok' ? (
            <div style={{ textAlign:'center', padding:'16px 0' }}>
              <div style={{ fontSize:48 }}>✅</div>
              <div style={{ fontWeight:700, fontSize:16, marginTop:8 }}>¡PDF subido exitosamente!</div>
              <div style={{ fontSize:13, color:'var(--text-light)', marginTop:4 }}>
                Guardado como <code>{guide.archivo}</code>
              </div>
              <button className="admin-btn admin-btn-primary" onClick={onDone} style={{ marginTop:16 }}>
                Listo
              </button>
            </div>
          ) : (
            <>
              <p className="ib-hint">
                Seleccioná el PDF para <strong>{guide.nombre}</strong>.
                Se guardará como <code>{guide.archivo}</code>.
              </p>

              <div
                className="ga-dropzone"
                onClick={() => inputRef.current?.click()}
                onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('ga-dropzone-over') }}
                onDragLeave={e => e.currentTarget.classList.remove('ga-dropzone-over')}
                onDrop={e => {
                  e.preventDefault()
                  e.currentTarget.classList.remove('ga-dropzone-over')
                  handleFile(e.dataTransfer.files[0])
                }}
              >
                <input ref={inputRef} type="file" accept=".pdf" style={{ display:'none' }}
                  onChange={e => handleFile(e.target.files[0])} />
                {status === 'uploading' ? (
                  <div style={{ color:'var(--purple)' }}>⏳ Subiendo PDF…</div>
                ) : (
                  <>
                    <div style={{ fontSize:36 }}>📄</div>
                    <div style={{ fontWeight:600 }}>Arrastrá el PDF aquí</div>
                    <div style={{ fontSize:13, color:'var(--text-light)' }}>o hacé click para seleccionar</div>
                  </>
                )}
              </div>

              {errMsg && (
                <div style={{ color:'#e53935', fontSize:13, marginTop:8 }}>❌ {errMsg}</div>
              )}

              <div className="ib-modal-actions" style={{ marginTop:12 }}>
                <button className="admin-btn admin-btn-ghost" onClick={onClose}>Cancelar</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── Panel principal ── */
export default function GuidesAdmin({ onBack }) {
  const [guides,     setGuides]     = useState([])
  const [loading,    setLoading]    = useState(true)
  const [editGuide,  setEditGuide]  = useState(null)   // null | guide object
  const [uploadGuide,setUploadGuide]= useState(null)   // null | guide object
  const [filterCat,  setFilterCat]  = useState('Todos')

  const loadGuides = async () => {
    setLoading(true)
    try {
      const r = await fetch('/api/guides')
      const d = await r.json()
      setGuides(d.guides || [])
    } catch {}
    setLoading(false)
  }

  useEffect(() => { loadGuides() }, [])

  const handleDelete = async (guide) => {
    if (!window.confirm(`¿Eliminar la guía "${guide.nombre}"?\nSe eliminará también el PDF si fue subido.`)) return
    try {
      const r = await fetch(`/api/guides/${encodeURIComponent(guide.id)}`, { method: 'DELETE' })
      if (r.ok) loadGuides()
      else { const d = await r.json(); alert('Error: ' + d.error) }
    } catch (e) { alert('Error: ' + e.message) }
  }

  const categorias = ['Todos', ...new Set(guides.map(g => g.categoria))]
  const filtradas  = filterCat === 'Todos' ? guides : guides.filter(g => g.categoria === filterCat)

  return (
    <div className="admin-shell">
      {/* Header */}
      <header className="admin-topbar admin-topbar-sticky">
        <div className="admin-topbar-brand">
          <img src="/logo.png" alt="Mama Mouse" className="admin-topbar-logo" />
          <div>
            <div className="admin-topbar-name">MAMA MOUSE</div>
            <div className="admin-topbar-sub">Gestión de Guías</div>
          </div>
        </div>
        <div className="admin-topbar-right">
          <button className="admin-btn admin-btn-primary" onClick={() => setEditGuide(emptyGuide())}>
            ➕ Nueva guía
          </button>
          <button className="admin-btn admin-btn-ghost" onClick={onBack}>← Volver</button>
        </div>
      </header>

      <div className="admin-content" style={{ padding:'24px 24px 48px' }}>

        {/* Hero */}
        <div className="ga-hero">
          <div className="ga-hero-icon">📚</div>
          <div>
            <div className="ga-hero-title">Biblioteca de Guías</div>
            <div className="ga-hero-sub">
              {guides.length} guía{guides.length !== 1 ? 's' : ''} · {guides.filter(g => g.pdfExists).length} con PDF subido
            </div>
          </div>
        </div>

        {/* Filtro por categoría */}
        <div className="guides-filter-row" style={{ marginBottom:16 }}>
          {categorias.map(c => (
            <button key={c}
              className={`guides-filter-btn ${filterCat === c ? 'active' : ''}`}
              onClick={() => setFilterCat(c)}>
              {c}
            </button>
          ))}
        </div>

        {/* Lista */}
        {loading ? (
          <div className="guides-loading">Cargando guías…</div>
        ) : filtradas.length === 0 ? (
          <div className="guides-loading" style={{ color:'var(--text-light)' }}>
            No hay guías en esta categoría.{' '}
            <button className="admin-btn admin-btn-primary" style={{ marginLeft:8 }}
              onClick={() => setEditGuide(emptyGuide())}>
              + Agregar
            </button>
          </div>
        ) : (
          <div className="ga-list">
            {filtradas.map(g => (
              <GuideRow
                key={g.id}
                guide={g}
                onEdit={setEditGuide}
                onDelete={handleDelete}
                onUpload={setUploadGuide}
              />
            ))}
          </div>
        )}

        {/* Nota */}
        <div className="guides-note" style={{ marginTop:24 }}>
          💡 Los PDFs se almacenan en el volumen persistente de Railway. Cada viajero puede descargarlos desde su perfil en la sección "Guías".
        </div>
      </div>

      {/* Modales */}
      {editGuide && (
        <GuideModal
          guide={editGuide}
          onSave={() => { setEditGuide(null); loadGuides() }}
          onClose={() => setEditGuide(null)}
        />
      )}
      {uploadGuide && (
        <UploadModal
          guide={uploadGuide}
          onDone={() => { setUploadGuide(null); loadGuides() }}
          onClose={() => setUploadGuide(null)}
        />
      )}
    </div>
  )
}
