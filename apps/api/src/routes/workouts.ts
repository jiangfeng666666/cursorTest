import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../prisma.js'
import { authenticate, userIdFrom } from '../auth.js'

const createBody = z.object({
  title: z.string().min(1).max(40),
  exerciseIds: z.array(z.string()).min(1, '至少选一个动作'),
})

const setBody = z.object({
  exerciseId: z.string(),
  weightKg: z.number().min(0).max(1000),
  reps: z.number().int().min(1).max(200),
})

const addExerciseBody = z.object({
  exerciseId: z.string(),
})

async function lastSetFor(userId: string, exerciseId: string, excludeWorkoutId?: string) {
  const last = await prisma.workoutSet.findFirst({
    where: {
      exerciseId,
      workout: {
        userId,
        finishedAt: { not: null },
        ...(excludeWorkoutId ? { id: { not: excludeWorkoutId } } : {}),
      },
    },
    orderBy: { createdAt: 'desc' },
  })
  return last ? { weightKg: last.weightKg, reps: last.reps } : null
}

async function serializeWorkout(userId: string, workoutId: string) {
  const workout = await prisma.workout.findFirst({
    where: { id: workoutId, userId },
    include: {
      exercises: { include: { exercise: true }, orderBy: { sortOrder: 'asc' } },
      sets: { orderBy: [{ createdAt: 'asc' }] },
    },
  })
  if (!workout) return null

  const exercises = await Promise.all(
    workout.exercises.map(async (row) => ({
      id: row.exercise.id,
      name: row.exercise.name,
      muscleGroup: row.exercise.muscleGroup,
      equipment: row.exercise.equipment,
      last: await lastSetFor(userId, row.exercise.id, workout.id),
      sets: workout.sets
        .filter((set) => set.exerciseId === row.exercise.id)
        .map((set) => ({
          id: set.id,
          setIndex: set.setIndex,
          weightKg: set.weightKg,
          reps: set.reps,
          createdAt: set.createdAt,
        })),
    })),
  )

  const volume = workout.sets.reduce((sum, set) => sum + set.weightKg * set.reps, 0)

  return {
    id: workout.id,
    title: workout.title,
    startedAt: workout.startedAt,
    finishedAt: workout.finishedAt,
    setCount: workout.sets.length,
    volume,
    exercises,
  }
}

export async function workoutRoutes(app: FastifyInstance) {
  app.get('/api/workouts/active', { preHandler: authenticate }, async (request) => {
    const uid = userIdFrom(request)
    const active = await prisma.workout.findFirst({
      where: { userId: uid, finishedAt: null },
      orderBy: { startedAt: 'desc' },
    })
    if (!active) return { workout: null }
    return { workout: await serializeWorkout(uid, active.id) }
  })

  app.get('/api/workouts', { preHandler: authenticate }, async (request) => {
    const uid = userIdFrom(request)
    const workouts = await prisma.workout.findMany({
      where: { userId: uid, finishedAt: { not: null } },
      include: { sets: true },
      orderBy: { startedAt: 'desc' },
      take: 30,
    })
    return workouts.map((workout) => ({
      id: workout.id,
      title: workout.title,
      startedAt: workout.startedAt,
      finishedAt: workout.finishedAt,
      setCount: workout.sets.length,
      volume: workout.sets.reduce((sum, set) => sum + set.weightKg * set.reps, 0),
    }))
  })

  app.get('/api/workouts/:id', { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const workout = await serializeWorkout(userIdFrom(request), id)
    if (!workout) return reply.code(404).send({ error: '找不到这次训练' })
    return workout
  })

  app.post('/api/workouts', { preHandler: authenticate }, async (request, reply) => {
    const parsed = createBody.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.issues[0]?.message ?? '参数错误' })
    }

    const uid = userIdFrom(request)
    const open = await prisma.workout.findFirst({ where: { userId: uid, finishedAt: null } })
    if (open) {
      return reply.code(409).send({ error: '还有未结束的训练', workoutId: open.id })
    }

    const uniqueIds = [...new Set(parsed.data.exerciseIds)]
    const found = await prisma.exercise.findMany({ where: { id: { in: uniqueIds } } })
    if (found.length !== uniqueIds.length) {
      return reply.code(400).send({ error: '有动作不存在' })
    }

    const workout = await prisma.workout.create({
      data: {
        userId: uid,
        title: parsed.data.title.trim(),
        exercises: {
          create: uniqueIds.map((exerciseId, index) => ({
            exerciseId,
            sortOrder: index,
          })),
        },
      },
    })

    return serializeWorkout(uid, workout.id)
  })

  app.post('/api/workouts/:id/exercises', { preHandler: authenticate }, async (request, reply) => {
    const parsed = addExerciseBody.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({ error: '参数错误' })
    }
    const { id } = request.params as { id: string }
    const uid = userIdFrom(request)
    const workout = await prisma.workout.findFirst({
      where: { id, userId: uid },
      include: { exercises: true },
    })
    if (!workout || workout.finishedAt) {
      return reply.code(400).send({ error: '这场训练不能再加动作' })
    }
    if (workout.exercises.some((row) => row.exerciseId === parsed.data.exerciseId)) {
      return serializeWorkout(uid, id)
    }

    await prisma.workoutExercise.create({
      data: {
        workoutId: id,
        exerciseId: parsed.data.exerciseId,
        sortOrder: workout.exercises.length,
      },
    })
    return serializeWorkout(uid, id)
  })

  app.post('/api/workouts/:id/sets', { preHandler: authenticate }, async (request, reply) => {
    const parsed = setBody.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.issues[0]?.message ?? '参数错误' })
    }
    const { id } = request.params as { id: string }
    const uid = userIdFrom(request)
    const workout = await prisma.workout.findFirst({
      where: { id, userId: uid },
      include: { exercises: true, sets: true },
    })
    if (!workout || workout.finishedAt) {
      return reply.code(400).send({ error: '这场训练已经结束' })
    }
    if (!workout.exercises.some((row) => row.exerciseId === parsed.data.exerciseId)) {
      return reply.code(400).send({ error: '这个动作不在当前训练里' })
    }

    const setIndex =
      workout.sets.filter((set) => set.exerciseId === parsed.data.exerciseId).length + 1

    await prisma.workoutSet.create({
      data: {
        workoutId: id,
        exerciseId: parsed.data.exerciseId,
        setIndex,
        weightKg: parsed.data.weightKg,
        reps: parsed.data.reps,
      },
    })

    return serializeWorkout(uid, id)
  })

  app.post('/api/workouts/:id/finish', { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const uid = userIdFrom(request)
    const workout = await prisma.workout.findFirst({ where: { id, userId: uid } })
    if (!workout) return reply.code(404).send({ error: '找不到这次训练' })
    if (workout.finishedAt) return serializeWorkout(uid, id)

    await prisma.workout.update({
      where: { id },
      data: { finishedAt: new Date() },
    })
    return serializeWorkout(uid, id)
  })
}
