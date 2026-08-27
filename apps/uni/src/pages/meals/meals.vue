<script setup lang="ts">
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { api, ApiError, type DayMeals, type Food, type MealSlot } from '../../utils/api'
import { useAuthStore } from '../../stores/auth'

const slots: { id: MealSlot; name: string }[] = [
  { id: 'breakfast', name: '早餐' },
  { id: 'lunch', name: '午餐' },
  { id: 'dinner', name: '晚餐' },
  { id: 'snack', name: '加餐' },
]

const auth = useAuthStore()
const day = ref<DayMeals | null>(null)
const foods = ref<Food[]>([])
const slot = ref<MealSlot>('breakfast')
const customName = ref('')
const customKcal = ref(300)
const customProtein = ref(10)
const error = ref('')
const busy = ref(false)

const grouped = computed(() =>
  slots.map((item) => ({
    ...item,
    meals: (day.value?.meals || []).filter((meal) => meal.slot === item.id),
  })),
)

onShow(async () => {
  if (!(await auth.requireLogin())) return
  await refresh()
})

async function refresh() {
  try {
    const [mealData, foodData] = await Promise.all([api.meals(), api.foods()])
    day.value = mealData
    foods.value = foodData
  } catch (err) {
    error.value = err instanceof ApiError ? err.message : '加载失败'
  }
}

async function addFood(food: Food) {
  busy.value = true
  error.value = ''
  try {
    await api.logMeal({ slot: slot.value, foodId: food.id, servings: 1 })
    day.value = await api.meals()
  } catch (err) {
    error.value = err instanceof ApiError ? err.message : '没记下'
  } finally {
    busy.value = false
  }
}

async function addCustom() {
  if (!customName.value.trim()) {
    error.value = '先写吃了什么'
    return
  }
  busy.value = true
  error.value = ''
  try {
    await api.logMeal({
      slot: slot.value,
      name: customName.value.trim(),
      kcal: Number(customKcal.value),
      proteinG: Number(customProtein.value),
      servings: 1,
    })
    customName.value = ''
    day.value = await api.meals()
  } catch (err) {
    error.value = err instanceof ApiError ? err.message : '没记下'
  } finally {
    busy.value = false
  }
}

async function remove(id: string) {
  busy.value = true
  error.value = ''
  try {
    await api.deleteMeal(id)
    day.value = await api.meals()
  } catch (err) {
    error.value = err instanceof ApiError ? err.message : '删不掉'
  } finally {
    busy.value = false
  }
}

function onKcalInput(event: { detail: { value: string } }) {
  const value = Number(event.detail.value)
  if (Number.isFinite(value)) customKcal.value = value
}

function onProteinInput(event: { detail: { value: string } }) {
  const value = Number(event.detail.value)
  if (Number.isFinite(value)) customProtein.value = value
}
</script>

<template>
  <view class="page">
    <view class="title">今天吃什么</view>
    <text class="sub">点一下常见食物就能落账，外卖就手填热量。</text>

    <view class="totals">
      <view class="card stat">
        <text class="sub">热量</text>
        <text class="stat-num acid">{{ Math.round(day?.totalKcal || 0) }}</text>
        <text class="sub">kcal</text>
      </view>
      <view class="card stat">
        <text class="sub">蛋白</text>
        <text class="stat-num">{{ Math.round(day?.totalProtein || 0) }}</text>
        <text class="sub">g</text>
      </view>
    </view>

    <view class="slots">
      <view
        v-for="item in slots"
        :key="item.id"
        class="slot"
        :class="{ on: slot === item.id }"
        @click="slot = item.id"
      >
        <text>{{ item.name }}</text>
      </view>
    </view>

    <text v-if="error" class="heat">{{ error }}</text>

    <view v-for="group in grouped" :key="group.id" class="block">
      <text class="section">{{ group.name }}</text>
      <view v-for="meal in group.meals" :key="meal.id" class="card row">
        <view>
          <text class="name">{{ meal.name }}</text>
          <text class="sub">{{ meal.servings }} {{ meal.servingLabel }} · {{ meal.kcal }} kcal · 蛋白 {{ meal.proteinG }}g</text>
        </view>
        <text class="sub" @click="remove(meal.id)">删除</text>
      </view>
      <text v-if="!group.meals.length" class="sub empty">还没记</text>
    </view>

    <text class="section">记到{{ slots.find((item) => item.id === slot)?.name }}</text>
    <view class="chips">
      <view
        v-for="food in foods"
        :key="food.id"
        class="chip"
        @click="addFood(food)"
      >
        <text class="chip-name">{{ food.name }}</text>
        <text class="chip-kcal">{{ food.kcal }}kcal</text>
      </view>
    </view>

    <view class="card custom">
      <text class="name">手写一笔</text>
      <input class="field" v-model="customName" placeholder="比如：鸡腿饭" />
      <view class="pair">
        <view class="half">
          <text class="sub">热量 kcal</text>
          <input class="field" type="digit" :value="String(customKcal)" @input="onKcalInput" />
        </view>
        <view class="half">
          <text class="sub">蛋白 g</text>
          <input class="field" type="digit" :value="String(customProtein)" @input="onProteinInput" />
        </view>
      </view>
      <button class="btn btn-acid" :disabled="busy" @click="addCustom">记下这顿</button>
    </view>
  </view>
</template>

<style scoped>
.totals {
  display: flex;
  gap: 24rpx;
  margin: 32rpx 0;
}
.stat {
  flex: 1;
}
.stat-num {
  display: block;
  font-size: 56rpx;
  font-weight: 700;
  margin: 8rpx 0 4rpx;
}
.slots {
  display: flex;
  gap: 12rpx;
  margin-bottom: 16rpx;
}
.slot {
  flex: 1;
  height: 64rpx;
  border-radius: 16rpx;
  border: 1px solid #2c3526;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
  color: #8b937c;
}
.slot.on {
  background: #d6ff4b;
  color: #11140f;
  border-color: #d6ff4b;
}
.block {
  margin-top: 12rpx;
}
.section {
  display: block;
  margin: 28rpx 0 12rpx;
  color: #8b937c;
  font-size: 26rpx;
}
.row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12rpx;
}
.name {
  display: block;
  font-weight: 700;
  font-size: 30rpx;
  margin-bottom: 6rpx;
}
.empty {
  display: block;
  margin-bottom: 8rpx;
}
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}
.chip {
  border: 1px solid #2c3526;
  background: #1a1f17;
  border-radius: 999rpx;
  padding: 12rpx 22rpx;
}
.chip-name {
  font-size: 26rpx;
  margin-right: 8rpx;
}
.chip-kcal {
  font-size: 22rpx;
  color: #d6ff4b;
}
.custom {
  margin-top: 32rpx;
}
.custom .field {
  margin-top: 16rpx;
}
.pair {
  display: flex;
  gap: 16rpx;
  margin: 16rpx 0 24rpx;
}
.half {
  flex: 1;
}
.half .field {
  margin-top: 8rpx;
}
</style>
