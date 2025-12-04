<template>
  <div class="program-view" :class="modeClass">
    <!-- Timer Only Mode -->
    <div v-if="sync.state.mode === 'timer'" class="timer-only-layout">
      <div class="presenter-info">
        {{ selectedPresenter?.name || 'No Presenter Selected' }}
      </div>
      <TimerDisplay
        :elapsed-ms="sync.state.elapsedMs"
        :duration-ms="sync.state.durationMs"
        :timer-mode="sync.state.timerMode"
        :is-running="sync.state.isTimerRunning"
        :timer-start-time="sync.state.timerStartTime"
        :show-controls="false"
        size="xlarge"
      />
      <MessageBanner
        v-if="sync.state.currentMessage.visible"
        :message="sync.state.currentMessage.text"
        :type="sync.state.currentMessage.type"
      />
    </div>

    <!-- Teleprompter Only Mode -->
    <div v-else-if="sync.state.mode === 'autocue'" class="autocue-only-layout">
      <div class="timer-bar">
        <TimerDisplay
          :elapsed-ms="sync.state.elapsedMs"
          :duration-ms="sync.state.durationMs"
          :timer-mode="sync.state.timerMode"
          :is-running="sync.state.isTimerRunning"
          :timer-start-time="sync.state.timerStartTime"
          :show-controls="false"
          size="small"
        />
      </div>
      <TeleprompterDisplay
        :script="selectedPresenter?.script || ''"
        :font-size="sync.state.fontSize"
        :is-playing="sync.state.isPlaying"
        :speed="sync.state.speed"
        :scroll-position="sync.state.scrollPosition"
        :show-controls="false"
        class="teleprompter-main"
      />
      <MessageBanner
        v-if="sync.state.currentMessage.visible"
        :message="sync.state.currentMessage.text"
        :type="sync.state.currentMessage.type"
      />
    </div>

    <!-- Combined Mode -->
    <div v-else class="combined-layout">
      <div class="timer-panel">
        <TimerDisplay
          :elapsed-ms="sync.state.elapsedMs"
          :duration-ms="sync.state.durationMs"
          :timer-mode="sync.state.timerMode"
          :is-running="sync.state.isTimerRunning"
          :timer-start-time="sync.state.timerStartTime"
          :show-controls="false"
          size="medium"
        />
      </div>
      <TeleprompterDisplay
        :script="selectedPresenter?.script || ''"
        :font-size="sync.state.fontSize"
        :is-playing="sync.state.isPlaying"
        :speed="sync.state.speed"
        :scroll-position="sync.state.scrollPosition"
        :show-controls="false"
        class="teleprompter-main"
      />
      <MessageBanner
        v-if="sync.state.currentMessage.visible"
        :message="sync.state.currentMessage.text"
        :type="sync.state.currentMessage.type"
      />
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useTeleprompterSync } from '../composables/useTeleprompterSync'
import TeleprompterDisplay from '../components/TeleprompterDisplay.vue'
import TimerDisplay from '../components/TimerDisplay.vue'
import MessageBanner from '../components/MessageBanner.vue'

const route = useRoute()
const role = route.name.toLowerCase() // 'control' or 'program'

const sync = useTeleprompterSync(role)

const selectedPresenter = computed(() => {
  return sync.state.presenters.find(p => p.id === sync.state.selectedPresenterId)
})

const modeClass = computed(() => `mode-${sync.state.mode}`)

// Keyboard controls for spacebar
const handleKeyDown = (e) => {
  // In program view, spacebar can still control playback for convenience
  if (e.code === 'Space' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) {
    e.preventDefault()
    // Note: This won't broadcast since program view is read-only,
    // but can help if control view is closed temporarily
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
})
</script>

<style scoped>
.program-view {
  width: 100vw;
  height: 100vh;
  background: #000;
  color: #fff;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* Timer Only Layout */
.timer-only-layout {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  position: relative;
}

.presenter-info {
  position: absolute;
  top: 2rem;
  font-size: 2rem;
  color: #666;
  text-align: center;
  width: 100%;
}

/* Autocue Only Layout */
.autocue-only-layout {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
}

.timer-bar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 10;
  background: rgba(0, 0, 0, 0.8);
  padding: 0.5rem 1rem;
  display: flex;
  justify-content: center;
}

.teleprompter-main {
  flex: 1;
  width: 100%;
  height: 100%;
}

/* Combined Layout */
.combined-layout {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
}

.timer-panel {
  background: rgba(0, 0, 0, 0.9);
  padding: 1rem;
  display: flex;
  justify-content: center;
  border-bottom: 2px solid #333;
}
</style>
