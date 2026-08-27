import type { FastifyInstance } from 'fastify'
import { prisma } from '../prisma.js'
import { authenticate } from '../auth.js'
import { templates } from '../templates.js'

export async function catalogRoutes(app: FastifyInstance) {
  app.get('/api/exercises', { preHandler: authenticate }, async () => {
    return prisma.exercise.findMany({
      orderBy: [{ muscleGroup: 'asc' }, { name: 'asc' }],
    })
  })

  app.get('/api/templates', { preHandler: authenticate }, async () => {
    const all = await prisma.exercise.findMany()
    const byName = new Map(all.map((item) => [item.name, item]))

    return templates.map((template) => ({
      id: template.id,
      name: template.name,
      blurb: template.blurb,
      exercises: template.exercises
        .map((name) => byName.get(name))
        .filter((item): item is NonNullable<typeof item> => Boolean(item)),
    }))
  })
}
