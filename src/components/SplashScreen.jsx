import { useState, useEffect } from 'react'

export default function SplashScreen({ onDone }) {
  const [fading, setFading] = useState(false)

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFading(true), 2400)
    const doneTimer = setTimeout(() => onDone(), 3000)
    return () => { clearTimeout(fadeTimer); clearTimeout(doneTimer) }
  }, [onDone])

  return (
    <div className={`splash ${fading ? 'splash-fading' : ''}`}>
      <img src="/logo2.jpeg" alt="Mama Mouse" className="splash-logo" />
    </div>
  )
}
