import type { FastifyInstance } from 'fastify'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '../prisma.js'
import { authenticate, userIdFrom } from '../auth.js'

const registerBody = z.object({
  email: z.string().email('邮箱格式不对'),
  name: z.string().min(1, '请填写称呼').max(32),
  password: z.string().min(6, '密码至少 6 位'),
})

const loginBody = z.object({
  email: z.string().email('邮箱格式不对'),
  password: z.string().min(1, '请填写密码'),
})

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
    secure: process.env.NODE_ENV === 'production',
  }
}

function publicUser(user: { id: string; email: string; name: string }) {
  return { id: user.id, email: user.email, name: user.name }
}

export async function authRoutes(app: FastifyInstance) {
  app.post('/api/auth/register', async (request, reply) => {
    const parsed = registerBody.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.issues[0]?.message ?? '参数错误' })
    }

    const email = parsed.data.email.trim().toLowerCase()
    const exists = await prisma.user.findUnique({ where: { email } })
    if (exists) {
      return reply.code(409).send({ error: '这个邮箱已经注册过了' })
    }

    const user = await prisma.user.create({
      data: {
        email,
        name: parsed.data.name.trim(),
        passwordHash: await bcrypt.hash(parsed.data.password, 10),
      },
    })

    const token = await reply.jwtSign({ sub: user.id })
    reply.setCookie('token', token, cookieOptions())
    return publicUser(user)
  })

  app.post('/api/auth/login', async (request, reply) => {
    const parsed = loginBody.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.issues[0]?.message ?? '参数错误' })
    }

    const email = parsed.data.email.trim().toLowerCase()
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) {
      return reply.code(401).send({ error: '邮箱或密码不对' })
    }

    const token = await reply.jwtSign({ sub: user.id })
    reply.setCookie('token', token, cookieOptions())
    return publicUser(user)
  })

  app.post('/api/auth/logout', async (_request, reply) => {
    reply.clearCookie('token', { path: '/' })
    return { ok: true }
  })

  app.get('/api/auth/me', { preHandler: authenticate }, async (request) => {
    const user = await prisma.user.findUnique({
      where: { id: userIdFrom(request) },
      select: { id: true, email: true, name: true },
    })
    if (!user) {
      return { id: '', email: '', name: '' }
    }
    return user
  })
}
