import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../prisma.js'
import { authenticate, userIdFrom } from '../auth.js'

const metricBody = z.object({
  weightKg: z.number().min(20).max(400),
})

function startOfToday() {
  const copy = new Date()
  copy.setHours(0, 0, 0, 0)
  return copy
}

function startOfWeek(date: Date) {
  const copy = new Date(date)
  const day = copy.getDay()
  const offset = day === 0 ? 6 : day - 1
  copy.setHours(0, 0, 0, 0)
  copy.setDate(copy.getDate() - offset)
  return copy
}

export async function statsRoutes(app: FastifyInstance) {
  app.get('/api/stats', { preHandler: authenticate }, async (request) => {
    const uid = userIdFrom(request)
    const weekStart = startOfWeek(new Date())

    const [workoutsThisWeek, totalWorkouts, metrics, recent, mealsToday] = await Promise.all([
      prisma.workout.count({
        where: { userId: uid, finishedAt: { not: null }, startedAt: { gte: weekStart } },
      }),
      prisma.workout.count({ where: { userId: uid, finishedAt: { not: null } } }),
      prisma.bodyMetric.findMany({
        where: { userId: uid },
        orderBy: { loggedAt: 'desc' },
        take: 12,
      }),
      prisma.workout.findMany({
        where: { userId: uid, finishedAt: { not: null } },
        orderBy: { startedAt: 'desc' },
        take: 5,
        include: { sets: true },
      }),
      prisma.meal.findMany({
        where: { userId: uid, eatenAt: { gte: startOfToday() } },
      }),
    ])

    return {
      workoutsThisWeek,
      totalWorkouts,
      metrics: metrics
        .slice()
        .reverse()
        .map((item) => ({
          id: item.id,
          weightKg: item.weightKg,
          loggedAt: item.loggedAt,
        })),
      recentWorkouts: recent.map((workout) => ({
        id: workout.id,
        title: workout.title,
        startedAt: workout.startedAt,
        setCount: workout.sets.length,
        volume: workout.sets.reduce((sum, set) => sum + set.weightKg * set.reps, 0),
      })),
      kcalToday: mealsToday.reduce((sum, meal) => sum + meal.kcal, 0),
      proteinToday: mealsToday.reduce((sum, meal) => sum + meal.proteinG, 0),
      mealsToday: mealsToday.length,
    }
  })

  app.post('/api/metrics', { preHandler: authenticate }, async (request, reply) => {
    const parsed = metricBody.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({ error: '体重需要在 20–400 kg' })
    }
    const metric = await prisma.bodyMetric.create({
      data: {
        userId: userIdFrom(request),
        weightKg: parsed.data.weightKg,
      },
    })
    return { id: metric.id, weightKg: metric.weightKg, loggedAt: metric.loggedAt }
  })
}
