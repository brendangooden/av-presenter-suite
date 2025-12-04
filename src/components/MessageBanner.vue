<template>
  <div
    class="message-banner"
    :class="[typeClass, { 'fade-in': visible }]"
    v-if="visible"
  >
    <div class="message-content">
      <span class="message-icon">{{ icon }}</span>
      <span class="message-text">{{ message }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'

const props = defineProps({
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    default: 'info' // 'info' or 'warning'
  },
  autoHide: {
    type: Boolean,
    default: false
  },
  autoHideDelay: {
    type: Number,
    default: 10000 // 10 seconds
  }
})

const visible = ref(true)

const typeClass = computed(() => `type-${props.type}`)

const icon = computed(() => {
  return props.type === 'warning' ? '⚠️' : 'ℹ️'
})

let hideTimeout = null

watch(() => props.message, () => {
  visible.value = true
  
  if (props.autoHide) {
    if (hideTimeout) clearTimeout(hideTimeout)
    hideTimeout = setTimeout(() => {
      visible.value = false
    }, props.autoHideDelay)
  }
})

onMounted(() => {
  if (props.autoHide) {
    hideTimeout = setTimeout(() => {
      visible.value = false
    }, props.autoHideDelay)
  }
})
</script>

<style scoped>
.message-banner {
  position: fixed;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
  padding: 1.5rem 3rem;
  border-radius: 8px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
  min-width: 300px;
  max-width: 80vw;
}

.message-content {
  display: flex;
  align-items: center;
  gap: 1rem;
  font-size: 1.5rem;
  font-weight: bold;
}

.message-icon {
  font-size: 2rem;
}

.message-text {
  flex: 1;
}

.type-info {
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: #fff;
}

.type-warning {
  background: linear-gradient(135deg, #f59e0b 0%, #dc2626 100%);
  color: #fff;
}

.fade-in {
  animation: fadeIn 0.3s ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}
</style>
