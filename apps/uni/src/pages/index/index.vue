<script setup lang="ts">
import { onShow } from '@dcloudio/uni-app'
import { ref } from 'vue'
import { api, ApiError, type Stats, type Template, type Workout } from '../../utils/api'
import { useAuthStore } from '../../stores/auth'

const auth = useAuthStore()
const stats = ref<Stats | null>(null)
const templates = ref<Template[]>([])
const active = ref<Workout | null>(null)
const error = ref('')
const starting = ref<string | null>(null)

onShow(async () => {
  if (!(await auth.requireLogin())) return
  try {
    const [statsData, templateData, activeData] = await Promise.all([
      api.stats(),
      api.templates(),
      api.activeWorkout(),
    ])
    stats.value = statsData
    templates.value = templateData
    active.value = activeData.workout
  } catch (err) {
    error.value = err instanceof ApiError ? err.message : '加载失败'
  }
})

async function start(template: Template) {
  starting.value = template.id
  error.value = ''
  try {
    const workout = await api.startWorkout(
      template.name,
      template.exercises.map((item) => item.id),
    )
    uni.navigateTo({ url: `/pages/train/train?id=${workout.id}` })
  } catch (err) {
    if (err instanceof ApiError && err.status === 409) {
      const body = err.body as { workoutId?: string }
      if (body.workoutId) {
        uni.navigateTo({ url: `/pages/train/train?id=${body.workoutId}` })
        return
      }
    }
    error.value = err instanceof ApiError ? err.message : '没法开练'
  } finally {
    starting.value = null
  }
}

function resume() {
  if (!active.value) return
  uni.navigateTo({ url: `/pages/train/train?id=${active.value.id}` })
}

async function logout() {
  await auth.logout()
  uni.reLaunch({ url: '/pages/login/login' })
}

function goMeals() {
  uni.navigateTo({ url: '/pages/meals/meals' })
}

function exerciseLine(template: Template) {
  return template.exercises.map((item) => item.name).join(' · ')
}
</script>

<template>
  <view class="page">
    <view class="head">
      <view>
        <text class="sub">你好，{{ auth.user?.name }}</text>
        <view class="title">今天练什么</view>
      </view>
      <text class="sub" @click="logout">退出</text>
    </view>

    <view class="stats">
      <view class="card stat">
        <text class="sub">本周已练</text>
        <text class="stat-num acid">{{ stats?.workoutsThisWeek ?? '—' }}</text>
        <text class="sub">场</text>
      </view>
      <view class="card stat">
        <text class="sub">累计</text>
        <text class="stat-num">{{ stats?.totalWorkouts ?? '—' }}</text>
        <text class="sub">场训练</text>
      </view>
    </view>

    <view class="card eat" @click="goMeals">
      <text class="acid tiny">吃饭</text>
      <view class="active-title">今天 {{ Math.round(stats?.kcalToday || 0) }} kcal</view>
      <text class="sub">蛋白 {{ Math.round(stats?.proteinToday || 0) }} g · {{ stats?.mealsToday || 0 }} 笔</text>
      <button class="btn btn-acid" @click.stop="goMeals">去记一顿</button>
    </view>

    <view v-if="active" class="card active">
      <text class="acid tiny">进行中</text>
      <view class="active-title">{{ active.title }}</view>
      <text class="sub">已记 {{ active.setCount }} 组</text>
      <button class="btn btn-acid" @click="resume">继续这场</button>
    </view>

    <text class="section">模板开练</text>
    <text v-if="error" class="heat">{{ error }}</text>
    <view
      v-for="template in templates"
      :key="template.id"
      class="card template"
      @click="start(template)"
    >
      <view class="row">
        <text class="template-name">{{ template.name }}</text>
        <text class="acid tiny">{{ starting === template.id ? '…' : 'GO' }}</text>
      </view>
      <text class="sub">{{ template.blurb }}</text>
      <text class="sub names">{{ exerciseLine(template) }}</text>
    </view>
  </view>
</template>

<style scoped>
.head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}
.stats {
  display: flex;
  gap: 24rpx;
  margin-top: 40rpx;
}
.stat {
  flex: 1;
}
.stat-num {
  display: block;
  font-size: 64rpx;
  font-weight: 700;
  margin: 12rpx 0 4rpx;
}
.active {
  margin-top: 32rpx;
  border-color: rgba(214, 255, 75, 0.4);
  background: rgba(214, 255, 75, 0.08);
}
.active-title {
  font-size: 34rpx;
  font-weight: 700;
  margin: 8rpx 0;
}
.active .btn,
.eat .btn {
  margin-top: 24rpx;
}
.eat {
  margin-top: 32rpx;
}
.tiny {
  font-size: 22rpx;
}
.section {
  display: block;
  margin: 48rpx 0 16rpx;
  color: #8b937c;
  font-size: 26rpx;
}
.template {
  margin-bottom: 24rpx;
}
.row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.template-name {
  font-size: 34rpx;
  font-weight: 700;
}
.names {
  display: block;
  margin-top: 16rpx;
}
</style>
