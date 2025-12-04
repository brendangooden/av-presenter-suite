<template>
  <div
    ref="scrollContainer"
    class="teleprompter-display"
    :style="{ fontSize: fontSize + 'px', cursor: cursorStyle }"
    @mousedown="handleMouseDown"
    @mousemove="handleMouseMove"
    @mouseup="handleMouseUp"
    @mouseleave="handleMouseLeave"
  >
    <div class="teleprompter-content">
      <p
        v-for="(line, index) in lines"
        :key="index"
        class="teleprompter-line"
      >
        {{ line || '\u00A0' }}
      </p>
      <div class="spacer"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  script: {
    type: String,
    default: ''
  },
  fontSize: {
    type: Number,
    default: 48
  },
  isPlaying: {
    type: Boolean,
    default: false
  },
  speed: {
    type: Number,
    default: 2
  },
  showControls: {
    type: Boolean,
    default: true
  },
  scrollPosition: {
    type: Number,
    default: null
  }
})

const emit = defineEmits(['scroll-position'])

const scrollContainer = ref(null)
const isDragging = ref(false)
const startY = ref(0)
const startScrollTop = ref(0)
const scrollInterval = ref(null)
const scrollAccumulator = ref(0)
const lastScrollTime = ref(null)

const lines = computed(() => props.script.split('\n'))

const cursorStyle = computed(() => {
  if (isDragging.value) return 'grabbing'
  if (props.showControls) return 'grab'
  return 'none'
})

// Drag to scroll
const handleMouseDown = (e) => {
  isDragging.value = true
  startY.value = e.pageY
  startScrollTop.value = scrollContainer.value?.scrollTop || 0
}

const handleMouseMove = (e) => {
  if (!isDragging.value || !scrollContainer.value) return
  e.preventDefault()
  const deltaY = e.pageY - startY.value
  scrollContainer.value.scrollTop = startScrollTop.value - deltaY
  // Emit scroll position for syncing
  emit('scroll-position', scrollContainer.value.scrollTop)
}

const handleMouseUp = () => {
  isDragging.value = false
}

const handleMouseLeave = () => {
  isDragging.value = false
}

// Auto-scroll using setInterval (works in background)
const scroll = () => {
  if (scrollContainer.value) {
    const now = Date.now()
    const delta = lastScrollTime.value ? (now - lastScrollTime.value) / 16.67 : 1 // Normalize to ~60fps
    lastScrollTime.value = now
    
    // Adjusted speed calculation with delta time
    scrollAccumulator.value += props.speed * 0.125 * delta
    
    if (scrollAccumulator.value >= 1) {
      const pixelsToScroll = Math.floor(scrollAccumulator.value)
      scrollContainer.value.scrollTop += pixelsToScroll
      scrollAccumulator.value -= pixelsToScroll
    }
  }
}

// Watch for play state changes
watch(() => props.isPlaying, (isPlaying) => {
  if (isPlaying) {
    scrollAccumulator.value = 0
    lastScrollTime.value = Date.now()
    // Use setInterval for consistent background operation
    scrollInterval.value = setInterval(scroll, 16) // ~60fps
  } else {
    if (scrollInterval.value) {
      clearInterval(scrollInterval.value)
      scrollInterval.value = null
    }
    lastScrollTime.value = null
  }
})

// Watch for speed changes
watch(() => props.speed, () => {
  if (props.isPlaying) {
    scrollAccumulator.value = 0
  }
})

// Reset scroll position (exposed for parent components)
const resetScroll = () => {
  if (scrollContainer.value) {
    scrollContainer.value.scrollTop = 0
  }
}

// Watch for external scroll position updates (from sync)
watch(() => props.scrollPosition, (newPosition) => {
  if (newPosition !== null && scrollContainer.value && !isDragging.value) {
    scrollContainer.value.scrollTop = newPosition
  }
})

// Cleanup
onUnmounted(() => {
  if (scrollInterval.value) {
    clearInterval(scrollInterval.value)
  }
})

// Start auto-scroll if already playing on mount
onMounted(() => {
  if (props.isPlaying) {
    lastScrollTime.value = Date.now()
    scrollInterval.value = setInterval(scroll, 16)
  }
})

defineExpose({
  resetScroll
})
</script>

<style scoped>
.teleprompter-display {
  width: 100%;
  height: 100%;
  overflow-y: auto;
  background: #000;
  color: #fff;
  padding: 0 3rem;
  line-height: 1.5;
  user-select: none;
  -webkit-user-select: none;
}

.teleprompter-content {
  max-width: 1024px;
  margin: 0 auto;
  padding: 3rem 0;
}

.teleprompter-line {
  margin-bottom: 1rem;
  text-align: center;
}

.spacer {
  height: 100vh;
}

/* Custom scrollbar */
.teleprompter-display::-webkit-scrollbar {
  width: 8px;
}

.teleprompter-display::-webkit-scrollbar-track {
  background: #0a0a0a;
}

.teleprompter-display::-webkit-scrollbar-thumb {
  background: #333;
  border-radius: 4px;
}

.teleprompter-display::-webkit-scrollbar-thumb:hover {
  background: #444;
}
</style>
