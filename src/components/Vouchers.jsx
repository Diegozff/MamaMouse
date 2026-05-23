export default function Vouchers({ vouchers = [] }) {
  return (
    <div className="fade-in">
      <div className="content-header">
        <div className="content-title">Bauchers y Recibos 📄</div>
        <div className="content-subtitle">Tus documentos de viaje listos para descargar</div>
      </div>

      {vouchers.length === 0 ? (
        <div className="voucher-empty">
          <div className="voucher-empty-icon">📂</div>
          <p className="voucher-empty-text">
            Tus bauchers y recibos aparecerán aquí en cuanto estén disponibles.<br />
            ¡Pronto vas a poder descargarlos desde acá!
          </p>
        </div>
      ) : (
        <div className="vouchers-list">
          {vouchers.map(v => (
            <a
              key={v.id}
              href={v.url}
              target="_blank"
              rel="noreferrer"
              className="voucher-card"
            >
              <div className="voucher-card-icon">{v.icono || '📄'}</div>
              <div className="voucher-card-info">
                <div className="voucher-card-nombre">{v.nombre}</div>
                {v.descripcion && (
                  <div className="voucher-card-desc">{v.descripcion}</div>
                )}
              </div>
              <div className="voucher-card-action">
                <span className="voucher-card-btn">⬇ Descargar</span>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
