<script setup lang="ts">
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import {
  api,
  ApiError,
  fileUrl,
  type DayMeals,
  type Food,
  type Meal,
  type MealSlot,
} from '../../utils/api'
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
const pending = ref<{ url: string; kind: 'image' | 'video' } | null>(null)
const preview = ref<{ url: string; kind: 'image' | 'video' } | null>(null)

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

function mediaPayload() {
  return pending.value
    ? { mediaUrl: pending.value.url, mediaKind: pending.value.kind }
    : {}
}

async function addFood(food: Food) {
  busy.value = true
  error.value = ''
  try {
    await api.logMeal({ slot: slot.value, foodId: food.id, servings: 1, ...mediaPayload() })
    pending.value = null
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
      ...mediaPayload(),
    })
    customName.value = ''
    pending.value = null
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

function chooseKind(kind: 'image' | 'video', mealId?: string) {
  if (kind === 'image') {
    uni.chooseImage({
      count: 1,
      success: (res) => {
        void uploadPath(res.tempFilePaths[0], mealId)
      },
    })
    return
  }
  uni.chooseVideo({
    compressed: true,
    maxDuration: 60,
    success: (res) => {
      void uploadPath(res.tempFilePath, mealId)
    },
  })
}

function pickMedia(mealId?: string) {
  uni.showActionSheet({
    itemList: ['选图片', '选视频'],
    success: (res) => {
      chooseKind(res.tapIndex === 0 ? 'image' : 'video', mealId)
    },
  })
}

async function uploadPath(filePath: string, mealId?: string) {
  busy.value = true
  error.value = ''
  try {
    const uploaded = await api.uploadMedia(filePath)
    if (mealId) {
      await api.attachMealMedia(mealId, { mediaUrl: uploaded.url, mediaKind: uploaded.kind })
      day.value = await api.meals()
    } else {
      pending.value = uploaded
    }
  } catch (err) {
    error.value = err instanceof ApiError ? err.message : '上传失败'
  } finally {
    busy.value = false
  }
}

function openMedia(meal: Meal) {
  if (!meal.mediaUrl || !meal.mediaKind) return
  preview.value = { url: fileUrl(meal.mediaUrl), kind: meal.mediaKind }
}

function srcOf(url: string) {
  return fileUrl(url)
}
</script>

<template>
  <view class="page">
    <view class="title">今天吃什么</view>
    <text class="sub">点一下常见食物就能落账，外卖就手填热量。可以配一张图或一段视频。</text>

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
      <view v-for="meal in group.meals" :key="meal.id" class="card meal">
        <view class="row">
          <view class="grow">
            <text class="name">{{ meal.name }}</text>
            <text class="sub">{{ meal.servings }}×{{ meal.servingLabel }} · {{ meal.kcal }} kcal · 蛋白 {{ meal.proteinG }}g</text>
          </view>
          <text class="sub" @click="remove(meal.id)">删除</text>
        </view>
        <image
          v-if="meal.mediaKind === 'image' && meal.mediaUrl"
          class="thumb"
          mode="aspectFill"
          :src="srcOf(meal.mediaUrl)"
          @click="openMedia(meal)"
        />
        <video
          v-else-if="meal.mediaKind === 'video' && meal.mediaUrl"
          class="thumb"
          :src="srcOf(meal.mediaUrl)"
          controls
          object-fit="cover"
        />
        <text v-else class="link" @click="pickMedia(meal.id)">补一张图/视频</text>
      </view>
      <text v-if="!group.meals.length" class="sub empty">还没记</text>
    </view>

    <text class="section">记到{{ slots.find((item) => item.id === slot)?.name }}</text>
    <view v-if="pending" class="card pending">
      <image v-if="pending.kind === 'image'" class="thumb" mode="aspectFill" :src="srcOf(pending.url)" />
      <video v-else class="thumb" :src="srcOf(pending.url)" controls object-fit="cover" />
      <text class="sub" @click="pending = null">去掉附件</text>
    </view>
    <view class="media-btns">
      <button class="btn btn-ghost" :disabled="busy" @click="pickMedia()">配图/视频</button>
    </view>
    <view class="chips">
      <view v-for="food in foods" :key="food.id" class="chip" @click="addFood(food)">
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

    <view v-if="preview" class="mask" @click="preview = null">
      <image v-if="preview.kind === 'image'" class="full" mode="aspectFit" :src="preview.url" />
      <video v-else class="full" :src="preview.url" controls autoplay object-fit="contain" />
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
.meal {
  margin-bottom: 12rpx;
}
.row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}
.grow {
  flex: 1;
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
.link {
  display: block;
  margin-top: 16rpx;
  color: #d6ff4b;
  font-size: 24rpx;
}
.thumb {
  width: 100%;
  height: 280rpx;
  border-radius: 20rpx;
  margin-top: 16rpx;
  background: #11140f;
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
.media-btns {
  margin: 8rpx 0 24rpx;
}
.pending {
  margin-bottom: 16rpx;
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
.mask {
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.82);
  z-index: 30;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40rpx;
  box-sizing: border-box;
}
.full {
  width: 100%;
  height: 70vh;
}
</style>
