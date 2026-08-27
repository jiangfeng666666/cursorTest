export type User = {
  id: string
  email: string
  name: string
}

export type Exercise = {
  id: string
  name: string
  muscleGroup: string
  equipment: string
}

export type WorkoutSet = {
  id: string
  setIndex: number
  weightKg: number
  reps: number
  createdAt: string
}

export type WorkoutExercise = Exercise & {
  last: { weightKg: number; reps: number } | null
  sets: WorkoutSet[]
}

export type Workout = {
  id: string
  title: string
  startedAt: string
  finishedAt: string | null
  setCount: number
  volume: number
  exercises: WorkoutExercise[]
}

export type WorkoutSummary = {
  id: string
  title: string
  startedAt: string
  finishedAt?: string | null
  setCount: number
  volume: number
}

export type Template = {
  id: string
  name: string
  blurb: string
  exercises: Exercise[]
}

export type Stats = {
  workoutsThisWeek: number
  totalWorkouts: number
  metrics: { id: string; weightKg: number; loggedAt: string }[]
  recentWorkouts: WorkoutSummary[]
}

export class ApiError extends Error {
  status: number
  body: unknown

  constructor(status: number, message: string, body: unknown) {
    super(message)
    this.status = status
    this.body = body
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  })

  const text = await response.text()
  const data = text ? JSON.parse(text) : null

  if (!response.ok) {
    throw new ApiError(response.status, data?.error ?? '请求失败', data)
  }

  return data as T
}

export const api = {
  health: () => request<{ ok: boolean }>('/api/health'),
  me: () => request<User>('/api/auth/me'),
  login: (email: string, password: string) =>
    request<User>('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (payload: { email: string; name: string; password: string }) =>
    request<User>('/api/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  logout: () => request<{ ok: boolean }>('/api/auth/logout', { method: 'POST' }),
  templates: () => request<Template[]>('/api/templates'),
  exercises: () => request<Exercise[]>('/api/exercises'),
  activeWorkout: () => request<{ workout: Workout | null }>('/api/workouts/active'),
  workouts: () => request<WorkoutSummary[]>('/api/workouts'),
  workout: (id: string) => request<Workout>(`/api/workouts/${id}`),
  startWorkout: (title: string, exerciseIds: string[]) =>
    request<Workout>('/api/workouts', {
      method: 'POST',
      body: JSON.stringify({ title, exerciseIds }),
    }),
  addExercise: (workoutId: string, exerciseId: string) =>
    request<Workout>(`/api/workouts/${workoutId}/exercises`, {
      method: 'POST',
      body: JSON.stringify({ exerciseId }),
    }),
  logSet: (workoutId: string, payload: { exerciseId: string; weightKg: number; reps: number }) =>
    request<Workout>(`/api/workouts/${workoutId}/sets`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  finishWorkout: (workoutId: string) =>
    request<Workout>(`/api/workouts/${workoutId}/finish`, { method: 'POST' }),
  stats: () => request<Stats>('/api/stats'),
  logWeight: (weightKg: number) =>
    request<{ id: string; weightKg: number; loggedAt: string }>('/api/metrics', {
      method: 'POST',
      body: JSON.stringify({ weightKg }),
    }),
}
