<template>
  <div class="presenter-list">
    <div
      v-for="presenter in presenters"
      :key="presenter.id"
      class="presenter-item"
      :class="{ active: presenter.id === selectedId }"
      @click="$emit('select', presenter.id)"
    >
      <div class="presenter-content">
        <div class="presenter-icon">👤</div>
        <span class="presenter-name">{{ presenter.name }}</span>
      </div>
      <div class="presenter-actions">
        <button
          @click.stop="$emit('edit', presenter)"
          class="action-btn edit-btn"
          title="Edit"
        >
          ✏️
        </button>
        <button
          @click.stop="$emit('delete', presenter.id)"
          class="action-btn delete-btn"
          title="Delete"
        >
          🗑️
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  presenters: {
    type: Array,
    required: true
  },
  selectedId: {
    type: Number,
    required: true
  }
})

defineEmits(['select', 'edit', 'delete'])
</script>

<style scoped>
.presenter-list {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.presenter-item {
  padding: 0.75rem;
  background: #2a2a2a;
  border: 2px solid #333;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.presenter-item:hover {
  background: #333;
  border-color: #444;
}

.presenter-item.active {
  background: #2563eb;
  border-color: #60a5fa;
}

.presenter-content {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.presenter-icon {
  font-size: 1.125rem;
}

.presenter-name {
  font-weight: 500;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.presenter-actions {
  display: flex;
  gap: 0.25rem;
  justify-content: flex-end;
}

.action-btn {
  padding: 0.25rem 0.5rem;
  background: transparent;
  border: none;
  cursor: pointer;
  border-radius: 4px;
  transition: background 0.2s;
  font-size: 1rem;
}

.action-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.edit-btn:hover {
  background: rgba(59, 130, 246, 0.3);
}

.delete-btn:hover {
  background: rgba(239, 68, 68, 0.3);
}
</style>
