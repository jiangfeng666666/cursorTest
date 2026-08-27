<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  modelValue: number
  step?: number
  min?: number
  suffix?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: number]
}>()

const step = computed(() => props.step ?? 1)
const min = computed(() => props.min ?? 0)

function bump(direction: number) {
  const next = Math.max(min.value, round(props.modelValue + direction * step.value))
  emit('update:modelValue', next)
}

function round(value: number) {
  return Math.round(value * 10) / 10
}

function onInput(event: Event) {
  const value = Number((event.target as HTMLInputElement).value)
  if (Number.isFinite(value)) emit('update:modelValue', Math.max(min.value, value))
}
</script>

<template>
  <div class="flex items-center gap-2">
    <button
      type="button"
      class="h-12 w-12 shrink-0 rounded-2xl border border-line bg-void text-2xl text-ink"
      @click="bump(-1)"
    >
      −
    </button>
    <div class="relative flex-1">
      <input
        :value="modelValue"
        inputmode="decimal"
        class="tabular h-12 w-full rounded-2xl border border-line bg-void px-3 text-center font-mono text-xl font-bold text-ink outline-none focus:border-acid"
        @input="onInput"
      />
      <span v-if="suffix" class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-mute">
        {{ suffix }}
      </span>
    </div>
    <button
      type="button"
      class="h-12 w-12 shrink-0 rounded-2xl border border-line bg-void text-2xl text-ink"
      @click="bump(1)"
    >
      +
    </button>
  </div>
</template>
