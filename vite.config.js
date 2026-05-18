import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { writeFile } from 'node:fs/promises'
import path from 'node:path'

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'booking-api',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          if (req.url === '/api/booking' && req.method === 'POST') {
            const chunks = []
            req.on('data', c => chunks.push(c))
            req.on('end', async () => {
              try {
                const { id, data } = JSON.parse(Buffer.concat(chunks).toString())
                const filePath = path.resolve('public/bookings', `${id}.json`)
                await writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8')
                res.setHeader('Content-Type', 'application/json')
                res.setHeader('Access-Control-Allow-Origin', '*')
                res.end(JSON.stringify({ ok: true }))
              } catch (e) {
                res.statusCode = 500
                res.end(JSON.stringify({ ok: false, error: e.message }))
              }
            })
          } else {
            next()
          }
        })
      }
    }
  ]
})
