<template>
  <div class="timer-display" :class="sizeClass">
    <div v-if="showControls" class="timer-controls">
      <div class="timer-config-row">
        <div class="timer-mode-selector">
          <label>Mode:</label>
          <select :value="timerMode" @change="handleModeChange" class="timer-select">
            <option value="up">Count Up</option>
            <option value="down">Count Down</option>
          </select>
        </div>

        <div v-if="timerMode === 'down'" class="duration-setter">
          <label>Duration:</label>
          <input
            type="number"
            :value="durationMinutes"
            @input="handleMinutesChange"
            min="0"
            max="999"
            class="time-input"
            placeholder="MM"
          />
          <span class="time-separator">:</span>
          <input
            type="number"
            :value="durationSeconds"
            @input="handleSecondsChange"
            min="0"
            max="59"
            class="time-input"
            placeholder="SS"
          />
        </div>

        <div class="timer-buttons">
          <button
            @click="handleStartPause"
            class="btn btn-primary"
            :class="{ 'btn-success': !isRunning, 'btn-warning': isRunning }"
          >
            {{ isRunning ? '⏸ Pause' : '▶ Start' }}
          </button>
          <button @click="handleReset" class="btn btn-secondary">
            ↻ Reset
          </button>
        </div>
      </div>
    </div>

    <div class="timer-value" :class="timerClass">
      {{ formattedTime }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  elapsedMs: {
    type: Number,
    default: 0
  },
  durationMs: {
    type: Number,
    default: 300000 // 5 minutes
  },
  timerMode: {
    type: String,
    default: 'up' // 'up' or 'down'
  },
  isRunning: {
    type: Boolean,
    default: false
  },
  timerStartTime: {
    type: Number,
    default: null
  },
  showControls: {
    type: Boolean,
    default: true
  },
  size: {
    type: String,
    default: 'medium' // 'small', 'medium', 'large', 'xlarge'
  }
})

const emit = defineEmits(['start', 'pause', 'reset', 'update-mode', 'update-duration'])

const localElapsed = ref(props.elapsedMs)
const timerInterval = ref(null)
const startTimeStamp = ref(null)

const sizeClass = computed(() => `size-${props.size}`)

const durationMinutes = computed(() => Math.floor(props.durationMs / 60000))
const durationSeconds = computed(() => Math.floor((props.durationMs % 60000) / 1000))

const formatTime = (ms) => {
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  }
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

const formattedTime = computed(() => {
  if (props.timerMode === 'down') {
    // Show full duration if not started yet
    if (!props.isRunning && localElapsed.value === 0) {
      return formatTime(props.durationMs)
    }
    const remaining = Math.max(0, props.durationMs - localElapsed.value)
    return formatTime(remaining)
  }
  return formatTime(localElapsed.value)
})

const formattedRemaining = computed(() => {
  const remaining = Math.max(0, props.durationMs - localElapsed.value)
  return formatTime(remaining)
})

const timerClass = computed(() => {
  if (props.timerMode === 'down') {
    const remaining = props.durationMs - localElapsed.value
    if (remaining <= 0) return 'timer-expired'
    if (remaining <= 60000) return 'timer-warning' // Last minute
  }
  return ''
})

const handleModeChange = (e) => {
  emit('update-mode', e.target.value)
}

const handleMinutesChange = (e) => {
  const minutes = parseInt(e.target.value) || 0
  const newDuration = minutes * 60000 + (props.durationMs % 60000)
  emit('update-duration', newDuration)
}

const handleSecondsChange = (e) => {
  const seconds = parseInt(e.target.value) || 0
  const minutes = Math.floor(props.durationMs / 60000)
  const newDuration = minutes * 60000 + seconds * 1000
  emit('update-duration', newDuration)
}

const handleStartPause = () => {
  if (props.isRunning) {
    emit('pause')
  } else {
    emit('start')
  }
}

const handleReset = () => {
  localElapsed.value = 0
  emit('reset')
}

// Timer loop using setInterval (works in background tabs)
const updateTimer = () => {
  if (startTimeStamp.value !== null) {
    const now = Date.now()
    localElapsed.value = now - startTimeStamp.value
  }
}

// Watch for running state changes
watch(() => props.isRunning, (isRunning) => {
  console.debug('[TimerDisplay] isRunning changed', { isRunning, localElapsed: localElapsed.value, startTimeStamp: startTimeStamp.value })
  if (isRunning) {
    // Calculate start timestamp based on current elapsed
    startTimeStamp.value = Date.now() - localElapsed.value
    console.debug('[TimerDisplay] Starting timer', { startTimeStamp: startTimeStamp.value })
    
    // Use setInterval instead of requestAnimationFrame - runs in background
    timerInterval.value = setInterval(updateTimer, 50) // 20Hz update
  } else {
    console.debug('[TimerDisplay] Stopping timer')
    if (timerInterval.value) {
      clearInterval(timerInterval.value)
      timerInterval.value = null
    }
  }
})

// Sync elapsed from props when not running OR when explicitly reset to 0
watch(() => props.elapsedMs, (newVal, oldVal) => {
  console.debug('[TimerDisplay] elapsedMs prop changed', { oldVal, newVal, isRunning: props.isRunning, willUpdate: !props.isRunning || newVal === 0 })
  if (!props.isRunning || newVal === 0) {
    localElapsed.value = newVal
    console.debug('[TimerDisplay] Updated localElapsed', { localElapsed: localElapsed.value })
    // Clear start timestamp when reset to 0
    if (newVal === 0) {
      startTimeStamp.value = null
      console.debug('[TimerDisplay] Cleared startTimeStamp (reset to 0)')
    }
  }
})

// Sync start time from props
watch(() => props.timerStartTime, (newVal) => {
  if (newVal !== null && props.isRunning) {
    startTimeStamp.value = newVal
    localElapsed.value = Date.now() - newVal
  }
})

// Cleanup
onUnmounted(() => {
  if (timerInterval.value) {
    clearInterval(timerInterval.value)
  }
})

// Start if already running on mount
onMounted(() => {
  localElapsed.value = props.elapsedMs
  if (props.isRunning) {
    startTimeStamp.value = Date.now() - props.elapsedMs
    timerInterval.value = setInterval(updateTimer, 50)
  }
})
</script>

<style scoped>
.timer-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
}

.timer-controls {
  width: 100%;
  max-width: 100%;
}

.timer-config-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2rem;
  flex-wrap: wrap;
}

.timer-mode-selector,
.duration-setter {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.timer-mode-selector label,
.duration-setter label {
  font-weight: 500;
  white-space: nowrap;
}

.timer-select,
.time-input {
  background: #2a2a2a;
  border: 1px solid #444;
  color: #fff;
  padding: 0.5rem;
  border-radius: 4px;
  font-size: 1rem;
}

.time-input {
  width: 70px;
  text-align: center;
  font-family: 'Monaco', 'Courier New', monospace;
  font-weight: bold;
}

.time-separator {
  font-size: 1.25rem;
  font-weight: bold;
  color: #999;
}

.timer-buttons {
  display: flex;
  gap: 0.75rem;
}

.timer-value {
  font-family: 'Monaco', 'Courier New', monospace;
  font-weight: bold;
  color: #fff;
  text-align: center;
  transition: color 0.3s;
}

.timer-value.timer-warning {
  color: #fbbf24;
  animation: pulse 1s infinite;
}

.timer-value.timer-expired {
  color: #ef4444;
  animation: pulse 0.5s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* Size variants */
.size-small .timer-value {
  font-size: 1.5rem;
}

.size-medium .timer-value {
  font-size: 3rem;
}

.size-large .timer-value {
  font-size: 5rem;
}

.size-xlarge .timer-value {
  font-size: 8rem;
}

.size-small .timer-controls {
  font-size: 0.875rem;
}
</style>
