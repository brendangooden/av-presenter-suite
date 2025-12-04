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
            placeholder="Enter script text here..."
            class="form-textarea"
          ></textarea>
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

const localPresenter = ref({ ...props.presenter })
const nameInput = ref(null)

watch(() => props.presenter, (newVal) => {
  localPresenter.value = { ...newVal }
}, { deep: true })

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
