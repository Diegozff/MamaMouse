const CACHE = 'mama-mouse-v1'

const PRECACHE = [
  '/',
  '/index.html',
  '/logo.png',
]

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(PRECACHE))
  )
  self.skipWaiting()
})

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', e => {
  const { request } = e
  const url = new URL(request.url)

  // API y PDFs: siempre red — no cachear datos dinámicos
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/bookings/pdfs/') ||
    url.pathname.startsWith('/guides/')
  ) {
    return
  }

  // Navegación (HTML): network-first para que siempre reciba la última versión
  if (request.mode === 'navigate') {
    e.respondWith(
      fetch(request).catch(() => caches.match('/index.html'))
    )
    return
  }

  // Recursos estáticos: cache-first
  e.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached
      return fetch(request).then(response => {
        if (response.ok && request.method === 'GET') {
          const clone = response.clone()
          caches.open(CACHE).then(c => c.put(request, clone))
        }
        return response
      })
    })
  )
})
