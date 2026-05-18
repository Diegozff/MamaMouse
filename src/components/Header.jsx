export default function Header({ titular }) {
  return (
    <div className="header">
      <div className="header-logo-placeholder">🐭</div>
      <h1>MAMA MOUSE</h1>
      <div className="header-subtitle">Agente Oficial Disney · Universal</div>
      <div className="header-traveler">✨ Hola, {titular}!</div>
    </div>
  )
}
