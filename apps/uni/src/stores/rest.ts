import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export const useRestStore = defineStore('rest', () => {
  const remaining = ref(0)
  const running = ref(false)
  let timer: ReturnType<typeof setInterval> | null = null

  const label = computed(() => {
    const mins = Math.floor(remaining.value / 60)
    const secs = remaining.value % 60
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  })

  function clear() {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
  }

  function start(seconds = 90) {
    clear()
    remaining.value = seconds
    running.value = true
    timer = setInterval(() => {
      if (remaining.value <= 1) {
        remaining.value = 0
        running.value = false
        clear()
        return
      }
      remaining.value -= 1
    }, 1000)
  }

  function skip() {
    clear()
    remaining.value = 0
    running.value = false
  }

  function add30() {
    if (!running.value) start(30)
    else remaining.value += 30
  }

  return { remaining, running, label, start, skip, add30 }
})
