import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'

export async function authenticate(this: FastifyInstance, request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify()
  } catch {
    return reply.code(401).send({ error: '未登录' })
  }
}

export function userIdFrom(request: FastifyRequest) {
  return request.user.sub
}
