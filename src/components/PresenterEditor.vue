<template>
  <div class="modal-overlay">
    <div class="modal editor-modal">
      <div class="modal-header">
        <h2>{{ isNew ? 'Add Presenter' : 'Edit Presenter' }}</h2>
        <button @click="$emit('cancel')" class="close-btn">✕</button>
      </div>

      <div class="modal-body">
        <div class="form-group">
          <label>Presenter Name</label>
          <input
            v-model="localPresenter.name"
            type="text"
            placeholder="Enter presenter name"
            class="form-input"
            ref="nameInput"
          />
        </div>

        <div class="form-group">
          <label>Script</label>
          <textarea
            v-model="localPresenter.script"
            placeholder="Enter presenter script text here... Teleprompter mode will automatically be enabled during presentation."
            class="form-textarea"
          ></textarea>
        </div>

        <div class="form-group">
          <label>Presenter Timer (optional)</label>
          <div class="timer-config">
            <input
              v-model="timerMinutes"
              type="number"
              min="0"
              max="999"
              placeholder="MM"
              class="time-input"
            />
            <span class="time-separator">:</span>
            <input
              v-model="timerSeconds"
              type="number"
              min="0"
              max="59"
              placeholder="SS"
              class="time-input"
            />
            <button
              v-if="timerMinutes || timerSeconds"
              type="button"
              class="timer-clear-btn"
              @click="clearTimer"
            >
              Clear
            </button>
          </div>
          <p class="form-hint">Leave blank to count up. Set a value to auto-start a countdown.</p>
        </div>
      </div>

      <div class="modal-footer">
        <button @click="handleSave" class="btn btn-primary">
          💾 Save
        </button>
        <button @click="$emit('cancel')" class="btn btn-secondary">
          Cancel
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'

const props = defineProps({
  presenter: {
    type: Object,
    required: true
  },
  isNew: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['save', 'cancel'])

const normalizePresenter = (presenter) => ({
  timerDurationMs: null,
  ...presenter
})

const localPresenter = ref(normalizePresenter(props.presenter))
const nameInput = ref(null)
const timerMinutes = ref('')
const timerSeconds = ref('')

const syncTimerInputsFromPresenter = (presenter) => {
  const duration = typeof presenter.timerDurationMs === 'number' && presenter.timerDurationMs > 0
    ? presenter.timerDurationMs
    : null

  if (duration) {
    timerMinutes.value = String(Math.floor(duration / 60000))
    timerSeconds.value = String(Math.floor((duration % 60000) / 1000)).padStart(2, '0')
  } else {
    timerMinutes.value = ''
    timerSeconds.value = ''
  }
}

syncTimerInputsFromPresenter(localPresenter.value)

const updateTimerDuration = () => {
  const minutes = parseInt(timerMinutes.value, 10)
  const seconds = parseInt(timerSeconds.value, 10)

  const hasMinutes = !isNaN(minutes)
  const hasSeconds = !isNaN(seconds)

  if (!hasMinutes && !hasSeconds) {
    localPresenter.value.timerDurationMs = null
    return
  }

  const safeMinutes = hasMinutes ? Math.max(0, minutes) : 0
  const safeSeconds = hasSeconds ? Math.max(0, Math.min(59, seconds)) : 0
  const totalMs = safeMinutes * 60000 + safeSeconds * 1000
  localPresenter.value.timerDurationMs = totalMs > 0 ? totalMs : null
}

const clearTimer = () => {
  timerMinutes.value = ''
  timerSeconds.value = ''
  localPresenter.value.timerDurationMs = null
}

watch(() => props.presenter, (newVal) => {
  localPresenter.value = normalizePresenter(newVal)
  syncTimerInputsFromPresenter(localPresenter.value)
}, { deep: true })

watch([timerMinutes, timerSeconds], updateTimerDuration)

const handleSave = () => {
  emit('save', { ...localPresenter.value })
}

onMounted(() => {
  // Focus name input when modal opens
  setTimeout(() => {
    nameInput.value?.focus()
  }, 100)
})
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  z-index: 1000;
}

.modal {
  background: #1a1a1a;
  border-radius: 8px;
  width: 100%;
  max-width: 768px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  border-bottom: 1px solid #333;
}

.modal-header h2 {
  font-size: 1.25rem;
  font-weight: bold;
}

.close-btn {
  background: transparent;
  border: none;
  color: #fff;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  transition: background 0.2s;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-size: 0.875rem;
  font-weight: 500;
}

.form-input,
.form-textarea {
  background: #2a2a2a;
  border: 1px solid #444;
  color: #fff;
  padding: 0.75rem;
  border-radius: 4px;
  font-family: inherit;
  font-size: 1rem;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: #2563eb;
}

.form-textarea {
  min-height: 384px;
  resize: vertical;
  font-family: 'Monaco', 'Courier New', monospace;
}


.timer-config {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.timer-config .time-input {
  background: #2a2a2a;
  border: 1px solid #444;
  color: #fff;
  padding: 0.5rem;
  border-radius: 4px;
  font-size: 1rem;
  width: 70px;
  text-align: center;
  font-family: 'Monaco', 'Courier New', monospace;
  font-weight: bold;
}

.timer-config .time-separator {
  font-size: 1.25rem;
  font-weight: bold;
  color: #999;
}

.timer-clear-btn {
  background: transparent;
  border: 1px solid #444;
  color: #f87171;
  padding: 0.35rem 0.75rem;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.timer-clear-btn:hover {
  border-color: #f87171;
  color: #fca5a5;
}

.form-hint {
  margin: 0.25rem 0 0;
  font-size: 0.75rem;
  color: #9ca3af;
}

.modal-footer {
  display: flex;
  gap: 0.5rem;
  padding: 1rem;
  border-top: 1px solid #333;
}

.modal-footer .btn {
  flex: 1;
}
</style>
