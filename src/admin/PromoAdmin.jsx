import { useState, useEffect, useRef } from 'react'

export default function PromoAdmin({ onBack }) {
  const [config, setConfig] = useState({
    activa: false,
    imagen: '',
    ctaUrl: '',
    ctaLabel: '💬 ¡Me interesa! Contactar ahora'
  })
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving]       = useState(false)
  const [saved, setSaved]         = useState(false)
  const [imgKey, setImgKey]       = useState(0)
  const fileRef = useRef(null)

  useEffect(() => {
    fetch('/api/promo')
      .then(r => r.json())
      .then(d => setConfig(c => ({ ...c, ...d })))
      .catch(() => {})
  }, [])

  const handleUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const res  = await fetch('/api/upload-promo', {
        method: 'POST',
        headers: { 'Content-Type': file.type },
        body: file
      })
      const data = await res.json()
      if (data.ok) {
        setConfig(c => ({ ...c, imagen: data.url }))
        setImgKey(k => k + 1)
      } else {
        alert('Error al subir imagen: ' + data.error)
      }
    } catch {
      alert('Error al subir imagen')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await fetch('/api/promo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch {
      alert('Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="admin-shell">
      <header className="admin-topbar">
        <div className="admin-topbar-brand">
          <img src="/logo.png" alt="Mama Mouse" className="admin-topbar-logo" />
          <div>
            <div className="admin-topbar-name">MAMA MOUSE</div>
            <div className="admin-topbar-sub">Popup de Novedad</div>
          </div>
        </div>
        <div className="admin-topbar-right">
          <button className="admin-btn admin-btn-ghost" onClick={onBack}>← Volver</button>
        </div>
      </header>

      <main className="promo-admin-main">

        {/* Toggle activo / inactivo */}
        <div className="promo-admin-card">
          <div className="promo-admin-card-title">Estado del popup</div>
          <label className="promo-admin-toggle-row">
            <div className={`promo-admin-toggle-switch ${config.activa ? 'on' : ''}`}
              onClick={() => setConfig(c => ({ ...c, activa: !c.activa }))}>
              <div className="promo-admin-toggle-knob" />
            </div>
            <span className="promo-admin-toggle-text">
              {config.activa ? '✅ Visible para los visitantes' : '⛔ Oculto — no se muestra'}
            </span>
          </label>
        </div>

        {/* Imagen */}
        <div className="promo-admin-card">
          <div className="promo-admin-card-title">Imagen del popup</div>
          <div className="promo-admin-img-row">
            {config.imagen
              ? <img
                  key={imgKey}
                  src={`${config.imagen}?v=${imgKey}`}
                  alt="Vista previa"
                  className="promo-admin-preview-img"
                />
              : <div className="promo-admin-no-img">Sin imagen cargada</div>
            }
            <div className="promo-admin-img-actions">
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                style={{ display: 'none' }}
                onChange={handleUpload}
              />
              <button
                className="admin-btn admin-btn-primary"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? '⏳ Subiendo...' : '📷 Cambiar imagen'}
              </button>
              <p className="promo-admin-hint">JPG, PNG o WebP · Reemplaza la imagen anterior</p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="promo-admin-card">
          <div className="promo-admin-card-title">Botón de acción (CTA)</div>
          <label className="promo-admin-label">Link del botón</label>
          <input
            type="url"
            className="admin-input"
            value={config.ctaUrl}
            onChange={e => setConfig(c => ({ ...c, ctaUrl: e.target.value }))}
            placeholder="https://wa.me/5493412143631?text=..."
          />
          <label className="promo-admin-label" style={{ marginTop: 12 }}>Texto del botón</label>
          <input
            type="text"
            className="admin-input"
            value={config.ctaLabel}
            onChange={e => setConfig(c => ({ ...c, ctaLabel: e.target.value }))}
            placeholder="💬 ¡Me interesa! Contactar ahora"
          />
          <p className="promo-admin-hint">
            Si dejás el link vacío, el botón de acción no aparece (solo el botón "Cerrar").
          </p>
        </div>

        <button
          className="admin-btn admin-btn-primary promo-admin-save"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? '⏳ Guardando...' : saved ? '✅ ¡Guardado!' : '💾 Guardar cambios'}
        </button>
      </main>
    </div>
  )
}
