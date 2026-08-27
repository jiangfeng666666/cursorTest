import Fastify from 'fastify'
import cookie from '@fastify/cookie'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import multipart from '@fastify/multipart'
import staticFiles from '@fastify/static'
import { mkdirSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { authenticate } from './auth.js'
import { authRoutes } from './routes/auth.js'
import { catalogRoutes } from './routes/catalog.js'
import { mealRoutes } from './routes/meals.js'
import { statsRoutes } from './routes/stats.js'
import { uploadRoutes, uploadsRoot } from './routes/uploads.js'
import { workoutRoutes } from './routes/workouts.js'

const here = dirname(fileURLToPath(import.meta.url))

function loadEnv() {
  const envPath = resolve(here, '../.env')
  try {
    const text = readFileSync(envPath, 'utf8')
    for (const line of text.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eq = trimmed.indexOf('=')
      if (eq === -1) continue
      const key = trimmed.slice(0, eq).trim()
      let value = trimmed.slice(eq + 1).trim()
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1)
      }
      if (!(key in process.env)) process.env[key] = value
    }
  } catch {
    // .env is optional when the process already has DATABASE_URL / JWT_SECRET
  }
}

loadEnv()

const app = Fastify({ logger: true, bodyLimit: 45 * 1024 * 1024 })

await app.register(cors, {
  origin: true,
  credentials: true,
})
await app.register(cookie)
await app.register(jwt, {
  secret: process.env.JWT_SECRET ?? 'dev-only-change-me',
  cookie: {
    cookieName: 'token',
    signed: false,
  },
})
await app.register(multipart, {
  limits: { fileSize: 40 * 1024 * 1024 },
})

const uploadDir = uploadsRoot()
mkdirSync(uploadDir, { recursive: true })
await app.register(staticFiles, {
  root: uploadDir,
  prefix: '/uploads/',
})

app.decorate('authenticate', authenticate)

app.get('/api/health', async () => ({ ok: true, name: 'kailian' }))

await app.register(authRoutes)
await app.register(catalogRoutes)
await app.register(workoutRoutes)
await app.register(mealRoutes)
await app.register(uploadRoutes)
await app.register(statsRoutes)

const port = Number(process.env.PORT ?? 3001)
const host = process.env.HOST ?? '0.0.0.0'

try {
  await app.listen({ port, host })
} catch (error) {
  app.log.error(error)
  process.exit(1)
}
