import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../prisma.js'
import { authenticate, userIdFrom } from '../auth.js'

const slots = ['breakfast', 'lunch', 'dinner', 'snack'] as const

const createBody = z.object({
  slot: z.enum(slots),
  foodId: z.string().optional(),
  name: z.string().max(40).optional(),
  servings: z.number().positive().max(20).optional(),
  kcal: z.number().min(0).max(5000).optional(),
  proteinG: z.number().min(0).max(400).optional(),
})

function dayRange(dateText?: string) {
  const base = dateText ? new Date(`${dateText}T00:00:00`) : new Date()
  if (Number.isNaN(base.getTime())) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const end = new Date(today)
    end.setDate(end.getDate() + 1)
    return { start: today, end }
  }
  base.setHours(0, 0, 0, 0)
  const end = new Date(base)
  end.setDate(end.getDate() + 1)
  return { start: base, end }
}

function serialize(meal: {
  id: string
  slot: string
  name: string
  servings: number
  kcal: number
  proteinG: number
  eatenAt: Date
  food: { servingLabel: string } | null
}) {
  return {
    id: meal.id,
    slot: meal.slot,
    name: meal.name,
    servings: meal.servings,
    kcal: meal.kcal,
    proteinG: meal.proteinG,
    eatenAt: meal.eatenAt,
    servingLabel: meal.food?.servingLabel ?? '份',
  }
}

export async function mealRoutes(app: FastifyInstance) {
  app.get('/api/foods', { preHandler: authenticate }, async () => {
    return prisma.food.findMany({
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    })
  })

  app.get('/api/meals', { preHandler: authenticate }, async (request, reply) => {
    const query = request.query as { date?: string }
    const { start, end } = dayRange(query.date)
    if (query.date && Number.isNaN(new Date(`${query.date}T00:00:00`).getTime())) {
      return reply.code(400).send({ error: '日期格式不对' })
    }

    const meals = await prisma.meal.findMany({
      where: { userId: userIdFrom(request), eatenAt: { gte: start, lt: end } },
      include: { food: true },
      orderBy: { eatenAt: 'asc' },
    })

    const totalKcal = meals.reduce((sum, meal) => sum + meal.kcal, 0)
    const totalProtein = meals.reduce((sum, meal) => sum + meal.proteinG, 0)

    return {
      date: start.toISOString().slice(0, 10),
      totalKcal,
      totalProtein,
      meals: meals.map(serialize),
    }
  })

  app.post('/api/meals', { preHandler: authenticate }, async (request, reply) => {
    const parsed = createBody.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.issues[0]?.message ?? '参数错误' })
    }

    const servings = parsed.data.servings ?? 1
    let name = parsed.data.name?.trim()
    let kcal = parsed.data.kcal
    let proteinG = parsed.data.proteinG ?? 0
    let foodId: string | undefined

    if (parsed.data.foodId) {
      const food = await prisma.food.findUnique({ where: { id: parsed.data.foodId } })
      if (!food) return reply.code(400).send({ error: '食物不存在' })
      foodId = food.id
      name = food.name
      kcal = Math.round(food.kcal * servings * 10) / 10
      proteinG = Math.round(food.proteinG * servings * 10) / 10
    }

    if (!name || kcal == null) {
      return reply.code(400).send({ error: '请选择食物或填写名称和热量' })
    }

    const meal = await prisma.meal.create({
      data: {
        userId: userIdFrom(request),
        slot: parsed.data.slot,
        foodId,
        name,
        servings,
        kcal,
        proteinG,
      },
      include: { food: true },
    })

    return serialize(meal)
  })

  app.delete('/api/meals/:id', { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const meal = await prisma.meal.findFirst({
      where: { id, userId: userIdFrom(request) },
    })
    if (!meal) return reply.code(404).send({ error: '找不到这条记录' })
    await prisma.meal.delete({ where: { id } })
    return { ok: true }
  })
}
