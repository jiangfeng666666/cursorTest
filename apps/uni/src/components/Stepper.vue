<script setup lang="ts">
const props = defineProps<{
  modelValue: number
  step?: number
  min?: number
  suffix?: string
}>()

const emit = defineEmits<{
  (event: 'update:modelValue', value: number): void
}>()

function round(value: number) {
  return Math.round(value * 10) / 10
}

function bump(direction: number) {
  const step = props.step ?? 1
  const min = props.min ?? 0
  emit('update:modelValue', Math.max(min, round(props.modelValue + direction * step)))
}

function onInput(event: { detail: { value: string } }) {
  const value = Number(event.detail.value)
  if (Number.isFinite(value)) emit('update:modelValue', Math.max(props.min ?? 0, value))
}
</script>

<template>
  <view class="stepper">
    <button class="stepper-btn" @click="bump(-1)">−</button>
    <view class="stepper-field">
      <input class="stepper-input" type="digit" :value="String(modelValue)" @input="onInput" />
      <text v-if="suffix" class="stepper-suffix">{{ suffix }}</text>
    </view>
    <button class="stepper-btn" @click="bump(1)">+</button>
  </view>
</template>

<style scoped>
.stepper {
  display: flex;
  align-items: center;
  gap: 12rpx;
}
.stepper-btn {
  width: 80rpx;
  height: 80rpx;
  border-radius: 20rpx;
  border: 1px solid #2c3526;
  background: #11140f;
  color: #e8eedf;
  font-size: 40rpx;
}
.stepper-field {
  flex: 1;
  position: relative;
}
.stepper-input {
  height: 80rpx;
  border-radius: 20rpx;
  border: 1px solid #2c3526;
  background: #11140f;
  color: #e8eedf;
  text-align: center;
  font-size: 32rpx;
  font-weight: 700;
}
.stepper-suffix {
  position: absolute;
  right: 16rpx;
  top: 50%;
  transform: translateY(-50%);
  font-size: 22rpx;
  color: #8b937c;
}
</style>
