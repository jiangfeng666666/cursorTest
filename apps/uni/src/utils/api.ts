export type User = {
  id: string
  email: string
  name: string
}

export type AuthUser = User & { token?: string }

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
  kcalToday: number
  proteinToday: number
  mealsToday: number
}

export type Food = {
  id: string
  name: string
  category: string
  servingLabel: string
  kcal: number
  proteinG: number
}

export type MealSlot = 'breakfast' | 'lunch' | 'dinner' | 'snack'

export type Meal = {
  id: string
  slot: MealSlot
  name: string
  servings: number
  kcal: number
  proteinG: number
  eatenAt: string
  servingLabel: string
}

export type DayMeals = {
  date: string
  totalKcal: number
  totalProtein: number
  meals: Meal[]
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

const TOKEN_KEY = 'kailian_token'

export function getToken() {
  return uni.getStorageSync(TOKEN_KEY) as string
}

export function setToken(token: string) {
  uni.setStorageSync(TOKEN_KEY, token)
}

export function clearToken() {
  uni.removeStorageSync(TOKEN_KEY)
}

function baseUrl() {
  let base = '/api'
  // #ifndef H5
  base = 'http://127.0.0.1:3001/api'
  // #endif
  return base
}

function request<T>(path: string, options: { method?: UniNamespace.RequestOptions['method']; data?: unknown } = {}) {
  return new Promise<T>((resolve, reject) => {
    const token = getToken()
    const header: Record<string, string> = {}
    if (options.data) header['Content-Type'] = 'application/json'
    if (token) header.Authorization = `Bearer ${token}`

    uni.request({
      url: `${baseUrl()}${path}`,
      method: options.method || 'GET',
      data: options.data as string | Record<string, unknown> | ArrayBuffer | undefined,
      header,
      success(res) {
        const data = res.data as { error?: string }
        if ((res.statusCode || 0) >= 400) {
          reject(new ApiError(res.statusCode || 0, data?.error || '请求失败', data))
          return
        }
        resolve(data as T)
      },
      fail(err) {
        reject(new ApiError(0, err.errMsg || '网络错误', err))
      },
    })
  })
}

export const api = {
  me: () => request<User>('/auth/me'),
  login: (email: string, password: string) =>
    request<AuthUser>('/auth/login', { method: 'POST', data: { email, password } }),
  register: (payload: { email: string; name: string; password: string }) =>
    request<AuthUser>('/auth/register', { method: 'POST', data: payload }),
  logout: () => request<{ ok: boolean }>('/auth/logout', { method: 'POST' }),
  templates: () => request<Template[]>('/templates'),
  exercises: () => request<Exercise[]>('/exercises'),
  activeWorkout: () => request<{ workout: Workout | null }>('/workouts/active'),
  workouts: () => request<WorkoutSummary[]>('/workouts'),
  workout: (id: string) => request<Workout>(`/workouts/${id}`),
  startWorkout: (title: string, exerciseIds: string[]) =>
    request<Workout>('/workouts', { method: 'POST', data: { title, exerciseIds } }),
  addExercise: (workoutId: string, exerciseId: string) =>
    request<Workout>(`/workouts/${workoutId}/exercises`, { method: 'POST', data: { exerciseId } }),
  logSet: (workoutId: string, payload: { exerciseId: string; weightKg: number; reps: number }) =>
    request<Workout>(`/workouts/${workoutId}/sets`, { method: 'POST', data: payload }),
  finishWorkout: (workoutId: string) =>
    request<Workout>(`/workouts/${workoutId}/finish`, { method: 'POST', data: {} }),
  stats: () => request<Stats>('/stats'),
  foods: () => request<Food[]>('/foods'),
  meals: (date?: string) => request<DayMeals>(date ? `/meals?date=${date}` : '/meals'),
  logMeal: (payload: {
    slot: MealSlot
    foodId?: string
    name?: string
    servings?: number
    kcal?: number
    proteinG?: number
  }) => request<Meal>('/meals', { method: 'POST', data: payload }),
  deleteMeal: (id: string) => request<{ ok: boolean }>(`/meals/${id}`, { method: 'DELETE', data: {} }),
  logWeight: (weightKg: number) =>
    request<{ id: string; weightKg: number; loggedAt: string }>('/metrics', {
      method: 'POST',
      data: { weightKg },
    }),
}
