import { randomUUID } from 'node:crypto'
import { createWriteStream } from 'node:fs'
import { mkdir, unlink } from 'node:fs/promises'
import { resolve } from 'node:path'
import { pipeline } from 'node:stream/promises'
import type { FastifyInstance } from 'fastify'
import { authenticate, userIdFrom } from '../auth.js'

const allowed: Record<string, { kind: 'image' | 'video'; ext: string }> = {
  'image/jpeg': { kind: 'image', ext: '.jpg' },
  'image/jpg': { kind: 'image', ext: '.jpg' },
  'image/pjpeg': { kind: 'image', ext: '.jpg' },
  'image/png': { kind: 'image', ext: '.png' },
  'image/webp': { kind: 'image', ext: '.webp' },
  'image/gif': { kind: 'image', ext: '.gif' },
  'video/mp4': { kind: 'video', ext: '.mp4' },
  'video/quicktime': { kind: 'video', ext: '.mov' },
  'video/webm': { kind: 'video', ext: '.webm' },
}

export function uploadsRoot() {
  return resolve(process.cwd(), 'uploads')
}

export async function uploadRoutes(app: FastifyInstance) {
  app.post('/api/uploads', { preHandler: authenticate }, async (request, reply) => {
    const file = await request.file()
    if (!file) return reply.code(400).send({ error: '请选择图片或视频' })

    const meta = allowed[file.mimetype]
    if (!meta) {
      return reply.code(400).send({ error: '只支持 jpg/png/webp/gif/mp4/mov/webm' })
    }

    const uid = userIdFrom(request)
    const dir = resolve(uploadsRoot(), uid)
    await mkdir(dir, { recursive: true })
    const filename = `${randomUUID()}${meta.ext}`
    const filepath = resolve(dir, filename)
    await pipeline(file.file, createWriteStream(filepath))

    if (file.file.truncated) {
      await unlink(filepath).catch(() => undefined)
      return reply.code(413).send({ error: '文件太大，图片不超过 8MB，视频不超过 40MB' })
    }

    return {
      url: `/uploads/${uid}/${filename}`,
      kind: meta.kind,
    }
  })
}
