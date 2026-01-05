<template>
  <div class="control-view">
    <div class="control-layout">
      <!-- Left Sidebar -->
      <div v-if="showMenu" class="sidebar">
      <!-- Branding & Quick Actions -->
      <div class="sidebar-header">        
        <button 
          @click="openProgramView" 
          class="btn btn-primary btn-block btn-launch"
        >
          📺 Open Program View
        </button>
      </div>

      <!-- Presenters Section -->
      <div class="sidebar-section">
        <div class="section-header">
          <h2 class="section-title">Presenters</h2>
          <button @click="handleAddPresenter" class="btn-icon-sm" title="Add Presenter">
            <span>+</span>
          </button>
        </div>
        
        <PresenterList
          :presenters="sync.state.presenters"
          :selectedId="sync.state.selectedPresenterId"
          @select="handleSelectPresenter"
          @edit="handleEditPresenter"
          @delete="handleDeletePresenter"
        />
      </div>

      <!-- Data Management -->
      <div class="sidebar-footer">
        <div class="data-management">
          <button @click="handleExport" class="btn btn-secondary btn-sm btn-block">
            ↓ Export Data
          </button>
          <button @click="triggerImport" class="btn btn-secondary btn-sm btn-block">
            ↑ Import Data
          </button>
        </div>
        
        <input
          ref="fileInputRef"
          type="file"
          accept=".json"
          @change="handleImport"
          style="display: none"
        />
      </div>
      </div>

      <!-- Main Content Area -->
      <div class="main-content">
      <!-- Top Control Bar -->
      <div class="top-bar">
        <button @click="showMenu = !showMenu" class="btn btn-secondary">
          {{ showMenu ? '◀ Hide Sidebar' : '▶ Show Sidebar' }}
        </button>

        <div class="mode-selector-top">
          <label>Display Mode:</label>
          <div class="mode-tabs">
            <button 
              @click="() => { selectedMode = 'timer'; handleModeChange(); }"
              :class="['mode-tab', { active: selectedMode === 'timer' }]"
            >
              ⏱️ Timer
            </button>
            <button 
              @click="() => { selectedMode = 'autocue'; handleModeChange(); }"
              :class="['mode-tab', { active: selectedMode === 'autocue' }]"
            >
              📜 Teleprompter
            </button>
            <button 
              @click="() => { selectedMode = 'combined'; handleModeChange(); }"
              :class="['mode-tab', { active: selectedMode === 'combined' }]"
            >
              ⏱️📜 Combined
            </button>
          </div>
        </div>

        <div class="presenter-badge">
          <span class="badge-label">Current:</span>
          <span class="badge-name">{{ selectedPresenter?.name || 'None' }}</span>
        </div>
      </div>

      <!-- Timer Controls Section -->
      <div v-if="selectedMode === 'timer' || selectedMode === 'combined'" class="control-section timer-section">
        <div class="section-header-inline">
          <h3>⏱️ Timer</h3>
        </div>
        <TimerDisplay
          :elapsed-ms="sync.state.elapsedMs"
          :duration-ms="sync.state.durationMs"
          :timer-mode="sync.state.timerMode"
          :is-running="sync.state.isTimerRunning"
          :timer-start-time="sync.state.timerStartTime"
          :show-controls="true"
          :size="selectedMode === 'timer' ? 'large' : 'medium'"
          @start="sync.startTimer"
          @pause="sync.pauseTimer"
          @reset="sync.resetTimer"
          @update-mode="sync.setTimerMode"
          @update-duration="sync.setTimerDuration"
        />
      </div>

      <!-- Teleprompter Section -->
      <div v-if="selectedMode === 'autocue' || selectedMode === 'combined'" class="control-section teleprompter-section">
        <div class="section-header-inline">
          <h3>📜 Teleprompter</h3>
          
          <div class="teleprompter-controls-inline">
            <button @click="handleReset" class="btn btn-icon-sm" title="Reset to Top">
              ↻
            </button>
            
            <button 
              @click="handlePlayPause" 
              :class="['btn btn-icon-sm', sync.state.isPlaying ? 'btn-warning' : 'btn-success']"
              :title="sync.state.isPlaying ? 'Pause' : 'Play'"
            >
              {{ sync.state.isPlaying ? '⏸' : '▶' }}
            </button>

            <div class="inline-control">
              <label>Speed</label>
              <input
                type="range"
                min="1"
                max="10"
                v-model.number="speed"
                @input="handleSpeedChange"
                class="slider-inline"
              />
              <span class="value-badge">{{ sync.state.speed }}</span>
            </div>

            <div class="inline-control">
              <label>Size</label>
              <input
                type="range"
                min="24"
                max="72"
                v-model.number="fontSize"
                @input="handleFontSizeChange"
                class="slider-inline"
              />
              <span class="value-badge">{{ sync.state.fontSize }}px</span>
            </div>
          </div>
        </div>

        <TeleprompterDisplay
          :script="selectedPresenter?.script || ''"
          :font-size="sync.state.fontSize"
          :is-playing="sync.state.isPlaying"
          :speed="sync.state.speed"
          :show-controls="false"
          @scroll-position="handleScrollPosition"
          class="teleprompter-preview"
        />
      </div>

      <!-- Messaging Section -->
      <div class="control-section message-section">
        <div class="section-header-inline">
          <h3>💬 Live Message to Presenter</h3>
        </div>
        
        <div class="message-input-group">
          <input
            v-model="messageText"
            type="text"
            placeholder="Type message to send to program view..."
            class="message-input"
            @keyup.enter="handleSendMessage"
          />
          <select v-model="messageType" class="message-type-select">
            <option value="info">ℹ️ Info</option>
            <option value="warning">⚠️ Warning</option>
          </select>
          <button 
            @click="handleSendMessage" 
            class="btn btn-primary"
            :disabled="!messageText.trim()"
          >
            Send
          </button>
          <button 
            @click="handleClearMessage" 
            class="btn btn-secondary"
            :disabled="!sync.state.currentMessage.visible"
          >
            Clear
          </button>
        </div>
        
        <div v-if="sync.state.currentMessage.visible" class="current-message-preview">
          <span class="preview-label">Currently showing:</span>
          <span class="preview-text">{{ sync.state.currentMessage.text }}</span>
          <span :class="['preview-badge', sync.state.currentMessage.type]">
            {{ sync.state.currentMessage.type }}
          </span>
        </div>
      </div>
      </div>
    </div>

    <!-- Presenter Editor Modal -->
    <PresenterEditor
      v-if="editMode"
      :presenter="editingPresenter"
      :is-new="isNewPresenter"
      @save="handleSavePresenter"
      @cancel="handleCancelEdit"
    />

    <!-- Notification Toast -->
    <div v-if="notification" class="notification-toast">
      <span class="icon">ℹ</span>
      <span>{{ notification }}</span>
    </div>

    <!-- Confirm Dialog -->
    <div v-if="confirmDialog" class="modal-overlay">
      <div class="modal confirm-dialog">
        <h3>Confirm</h3>
        <p>{{ confirmDialog.message }}</p>
        <div class="btn-group">
          <button @click="confirmDialog.onConfirm" class="btn btn-danger">
            Delete
          </button>
          <button @click="confirmDialog = null" class="btn btn-secondary">
            Cancel
          </button>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <footer class="app-footer">
      <p>&copy; {{ new Date().getFullYear() }} Brendan Gooden. 
        <a href="https://github.com/brendangooden/av-presenter-suite" target="_blank" rel="noopener noreferrer">View on GitHub</a>
      </p>
    </footer>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useTeleprompterSync } from '../composables/useTeleprompterSync'
import PresenterList from '../components/PresenterList.vue'
import PresenterEditor from '../components/PresenterEditor.vue'
import TeleprompterDisplay from '../components/TeleprompterDisplay.vue'
import TimerDisplay from '../components/TimerDisplay.vue'

const router = useRouter()
const route = useRoute()
const role = route.name.toLowerCase() // 'control' or 'program'

const sync = useTeleprompterSync(role)

const showMenu = ref(true)
const editMode = ref(false)
const editingPresenter = ref(null)
const isNewPresenter = ref(false)
const notification = ref(null)
const confirmDialog = ref(null)
const fileInputRef = ref(null)

const selectedMode = ref(sync.state.mode)
const speed = ref(sync.state.speed)
const fontSize = ref(sync.state.fontSize)

// Message controls
const messageText = ref('')
const messageType = ref('info')

// Keep selectedMode in sync with state
watch(() => sync.state.mode, (newMode) => {
  if (newMode && selectedMode.value !== newMode) {
    selectedMode.value = newMode
  }
}, { immediate: true })

const selectedPresenter = computed(() => {
  return sync.state.presenters.find(p => p.id === sync.state.selectedPresenterId)
})

// Open program view
const openProgramView = () => {
  window.open('/program', '_blank')
}

// Notification helper
const showNotification = (message) => {
  notification.value = message
  setTimeout(() => {
    notification.value = null
  }, 3000)
}

// Role switching
const switchRole = (newRole) => {
  router.push({ name: newRole === 'control' ? 'Control' : 'Program' })
}

// Mode change
const handleModeChange = () => {
  sync.setMode(selectedMode.value)
}

// Timer runs independently now - no tick handler needed

// Presenter management
const handleSelectPresenter = (id) => {
  sync.selectPresenter(id)
}

const handleAddPresenter = () => {
  const newId = Math.max(...sync.state.presenters.map(p => p.id), 0) + 1
  editMode.value = true
  editingPresenter.value = { id: newId, name: '', script: '' }
  isNewPresenter.value = true
}

const handleEditPresenter = (presenter) => {
  editMode.value = true
  editingPresenter.value = { ...presenter }
  isNewPresenter.value = false
}

const handleSavePresenter = (presenter) => {
  if (!presenter.name.trim()) {
    showNotification('Please enter a presenter name')
    return
  }

  if (isNewPresenter.value) {
    sync.addPresenter(presenter)
    sync.selectPresenter(presenter.id)
  } else {
    sync.updatePresenter(presenter.id, presenter)
  }

  editMode.value = false
  editingPresenter.value = null
}

const handleDeletePresenter = (id) => {
  if (sync.state.presenters.length === 1) {
    showNotification('You must have at least one presenter')
    return
  }
  
  confirmDialog.value = {
    message: 'Are you sure you want to delete this presenter?',
    onConfirm: () => {
      sync.deletePresenter(id)
      confirmDialog.value = null
    }
  }
}

const handleCancelEdit = () => {
  editMode.value = false
  editingPresenter.value = null
}

// Playback controls
const handlePlayPause = () => {
  sync.togglePlayPause()
}

const handleReset = () => {
  sync.pause()
  // Reset scroll handled in TeleprompterDisplay component
}

const handleSpeedChange = () => {
  sync.setSpeed(speed.value)
}

const handleFontSizeChange = () => {
  sync.setFontSize(fontSize.value)
}

const handleScrollPosition = (position) => {
  sync.setScrollPosition(position)
}

// Import/Export
const handleExport = () => {
  const data = sync.exportData()
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `teleprompter-data-${new Date().toISOString().split('T')[0]}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  showNotification('Data exported successfully!')
}

const handleImport = (event) => {
  const file = event.target.files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result)
      sync.importData(data)
      selectedMode.value = sync.state.mode
      showNotification(`Imported ${data.presenters?.length || 0} presenter(s) successfully!`)
    } catch (error) {
      showNotification('Error reading file: ' + error.message)
    }
  }
  reader.onerror = () => {
    showNotification('Error reading file')
  }
  reader.readAsText(file)
  
  // Reset input
  event.target.value = ''
}

const triggerImport = () => {
  fileInputRef.value?.click()
}

// Messaging
const handleSendMessage = () => {
  if (!messageText.value.trim()) return
  sync.sendLiveMessage(messageText.value, messageType.value)
  messageText.value = ''
}

const handleClearMessage = () => {
  sync.clearLiveMessage()
}

// Keyboard controls
const handleKeyDown = (e) => {
  if (e.code === 'Space' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) {
    e.preventDefault()
    handlePlayPause()
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
.control-view {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #000;
  color: #fff;
}

.control-layout {
  flex: 1;
  display: flex;
  min-height: 0;
}

/* === SIDEBAR === */
.sidebar {
  width: 280px;
  background: #1a1a1a;
  border-right: 1px solid #333;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.sidebar-header {
  padding: 1.5rem;
  border-bottom: 1px solid #333;
  background: #0f0f0f;
}

.app-title {
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 1rem;
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.btn-launch {
  font-size: 1rem;
  padding: 0.75rem;
  font-weight: 600;
}

.sidebar-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #333;
  background: #0f0f0f;
}

.section-title {
  font-size: 0.875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #999;
}

.btn-icon-sm {
  width: 32px;
  height: 32px;
  padding: 0;
  background: #2563eb;
  border: none;
  border-radius: 6px;
  color: #fff;
  font-size: 1.25rem;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-icon-sm:hover {
  background: #1d4ed8;
  transform: scale(1.05);
}

.sidebar-footer {
  padding: 1.5rem;
  border-top: 1px solid #333;
  background: #0f0f0f;
}

.data-management {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

/* === MAIN CONTENT === */
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;
  background: #0a0a0a;
}

/* Top Bar */
.top-bar {
  display: flex;
  align-items: center;
  gap: 2rem;
  padding: 1rem 1.5rem;
  background: #1a1a1a;
  border-bottom: 2px solid #333;
  flex-shrink: 0;
}

.mode-selector-top {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.mode-selector-top label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #999;
  white-space: nowrap;
}

.mode-tabs {
  display: flex;
  gap: 0.5rem;
  background: #0a0a0a;
  padding: 0.25rem;
  border-radius: 8px;
}

.mode-tab {
  padding: 0.5rem 1rem;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 6px;
  color: #999;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.mode-tab:hover {
  color: #fff;
  background: #1a1a1a;
}

.mode-tab.active {
  background: #2563eb;
  color: #fff;
  border-color: #3b82f6;
}

.presenter-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #0a0a0a;
  border-radius: 6px;
  border: 1px solid #333;
}

.badge-label {
  font-size: 0.75rem;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.badge-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: #3b82f6;
}

/* Control Sections */
.control-section {
  padding: 1.5rem;
  border-bottom: 1px solid #333;
  flex-shrink: 0;
}

.section-header-inline {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
  gap: 2rem;
}

.section-header-inline h3 {
  font-size: 1rem;
  font-weight: 600;
  color: #fff;
  white-space: nowrap;
}

.teleprompter-controls-inline {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.inline-control {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.inline-control label {
  font-size: 0.75rem;
  font-weight: 500;
  color: #999;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.slider-inline {
  width: 100px;
}

.value-badge {
  min-width: 48px;
  padding: 0.25rem 0.5rem;
  background: #1a1a1a;
  border: 1px solid #333;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  text-align: center;
  font-family: 'Monaco', 'Courier New', monospace;
}

.timer-section {
  background: #0f0f0f;
}

.teleprompter-section {
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;
}

.teleprompter-preview {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  border: 1px solid #333;
  border-radius: 8px;
  background: #000;
}

.message-section {
  background: #0f0f0f;
}

.message-input-group {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.message-input {
  flex: 1;
  background: #1a1a1a;
  border: 1px solid #444;
  color: #fff;
  padding: 0.75rem 1rem;
  border-radius: 6px;
  font-size: 0.9375rem;
}

.message-input:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.message-type-select {
  background: #1a1a1a;
  border: 1px solid #444;
  color: #fff;
  padding: 0.75rem 1rem;
  border-radius: 6px;
  font-size: 0.875rem;
  min-width: 120px;
}

.current-message-preview {
  margin-top: 1rem;
  padding: 0.75rem 1rem;
  background: #1a1a1a;
  border: 1px solid #444;
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.preview-label {
  font-size: 0.75rem;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.preview-text {
  flex: 1;
  font-size: 0.875rem;
  color: #fff;
  font-weight: 500;
}

.preview-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.preview-badge.info {
  background: #1e40af;
  color: #93c5fd;
}

.preview-badge.warning {
  background: #92400e;
  color: #fbbf24;
}

/* Notification Toast */
.notification-toast {
  position: fixed;
  top: 1rem;
  right: 1rem;
  background: #d97706;
  color: #fff;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  z-index: 1000;
  animation: slideInRight 0.3s ease-out;
}

@keyframes slideInRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* Responsive */
@media (max-width: 1200px) {
  .teleprompter-controls-inline {
    flex-direction: column;
    align-items: stretch;
  }
  
  .inline-control {
    justify-content: space-between;
  }
  
  .slider-inline {
    width: auto;
    flex: 1;
  }
}

@media (max-width: 768px) {
  .sidebar {
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    z-index: 100;
    box-shadow: 2px 0 8px rgba(0, 0, 0, 0.5);
  }
  
  .top-bar {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }
  
  .mode-selector-top {
    flex-direction: column;
  }
  
  .mode-tabs {
    flex-direction: column;
  }
}

/* Footer styles */
.app-footer {
  flex-shrink: 0;
  width: 100%;
  padding: 0.75rem 1rem;
  background: #0a0a0a;
  border-top: 1px solid #333;
  text-align: center;
  font-size: 0.75rem;
  color: #666;
}

.app-footer p {
  margin: 0;
}

.app-footer a {
  color: #3b82f6;
  text-decoration: none;
  transition: color 0.2s;
}

.app-footer a:hover {
  color: #60a5fa;
  text-decoration: underline;
}
</style>
