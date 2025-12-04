import { ref, reactive, watch, onMounted, onUnmounted } from 'vue'

// Message types for cross-window communication
const MESSAGE_TYPES = {
  SET_STATE: 'SET_STATE',
  UPDATE_TIMER: 'UPDATE_TIMER',
  UPDATE_SCRIPT: 'UPDATE_SCRIPT',
  UPDATE_PLAYBACK: 'UPDATE_PLAYBACK',
  SET_MODE: 'SET_MODE',
  PUSH_MESSAGE: 'PUSH_MESSAGE',
  CLEAR_MESSAGE: 'CLEAR_MESSAGE',
  UPDATE_PRESENTERS: 'UPDATE_PRESENTERS',
  SELECT_PRESENTER: 'SELECT_PRESENTER'
}

// Shared state structure
const createInitialState = () => ({
  // Presenter data
  presenters: [
    { 
      id: 1, 
      name: 'Sample Presenter', 
      script: 'Welcome to the teleprompter!\n\nThis is where your script text will appear.\n\nYou can scroll through it smoothly, adjust the speed, and control playback with the buttons below.\n\nAdd your own presenters and scripts using the menu on the left.' 
    }
  ],
  selectedPresenterId: 1,
  
  // Teleprompter settings
  isPlaying: false,
  speed: 2,
  fontSize: 48,
  scrollPosition: null,
  
  // Timer state
  timerMode: 'up', // 'up' or 'down'
  durationMs: 300000, // 5 minutes default for countdown
  elapsedMs: 0,
  isTimerRunning: false,
  timerStartTime: null,
  
  // App mode
  mode: 'combined', // 'timer' | 'autocue' | 'combined'
  
  // Messaging
  currentMessage: {
    text: '',
    type: 'info', // 'info' | 'warning'
    id: null,
    visible: false
  }
})

// Storage keys
const STORAGE_KEYS = {
  MODE: 'teleprompterMode',
  PRESENTERS: 'teleprompterPresenters',
  SETTINGS: 'teleprompterSettings',
  TIMER_CONFIG: 'teleprompterTimerConfig'
}

export function useTeleprompterSync(role = 'control') {
  const isControl = role === 'control'
  
  // Reactive shared state
  const state = reactive(createInitialState())
  
  // BroadcastChannel for cross-window sync
  let channel = null
  const channelName = 'teleprompter-sync'
  
  // Check BroadcastChannel support
  const supportsBroadcastChannel = typeof BroadcastChannel !== 'undefined'
  
  // Initialize channel
  const initChannel = () => {
    if (supportsBroadcastChannel) {
      try {
        channel = new BroadcastChannel(channelName)
        channel.onmessage = handleMessage
      } catch (e) {
        console.warn('BroadcastChannel failed, falling back to localStorage', e)
      }
    }
  }
  
  // Send message via BroadcastChannel or localStorage
  const sendMessage = (message) => {
    console.debug('[sendMessage]', { type: message.type, payload: message.payload, usingChannel: !!channel })
    if (channel) {
      channel.postMessage(message)
    } else {
      // Fallback: use localStorage
      const key = 'teleprompter-message'
      localStorage.setItem(key, JSON.stringify({
        ...message,
        timestamp: Date.now()
      }))
      // Clear after sending to avoid re-triggering
      setTimeout(() => localStorage.removeItem(key), 100)
    }
  }
  
  // Handle incoming messages
  const handleMessage = (event) => {
    const message = event.data || (typeof event === 'string' ? JSON.parse(event) : null)
    if (!message) return
    
    switch (message.type) {
      case MESSAGE_TYPES.SET_STATE:
        Object.assign(state, message.payload)
        break
        
      case MESSAGE_TYPES.UPDATE_TIMER:
        console.debug('[handleMessage] UPDATE_TIMER received', { payload: message.payload, beforeState: { elapsedMs: state.elapsedMs, isRunning: state.isTimerRunning } })
        Object.assign(state, message.payload)
        console.debug('[handleMessage] UPDATE_TIMER applied', { afterState: { elapsedMs: state.elapsedMs, isRunning: state.isTimerRunning } })
        break
        
      case MESSAGE_TYPES.UPDATE_SCRIPT:
        state.selectedPresenterId = message.payload.selectedPresenterId
        const presenter = state.presenters.find(p => p.id === message.payload.selectedPresenterId)
        if (presenter && message.payload.script !== undefined) {
          presenter.script = message.payload.script
        }
        break
        
      case MESSAGE_TYPES.UPDATE_PLAYBACK:
        Object.assign(state, message.payload)
        break
        
      case MESSAGE_TYPES.SET_MODE:
        state.mode = message.payload.mode
        break
        
      case MESSAGE_TYPES.PUSH_MESSAGE:
        state.currentMessage = {
          text: message.payload.text,
          type: message.payload.type || 'info',
          id: message.payload.id || Date.now().toString(),
          visible: true
        }
        break
        
      case MESSAGE_TYPES.CLEAR_MESSAGE:
        if (!message.payload.id || state.currentMessage.id === message.payload.id) {
          state.currentMessage.visible = false
        }
        break
        
      case MESSAGE_TYPES.UPDATE_PRESENTERS:
        state.presenters = message.payload.presenters
        break
        
      case MESSAGE_TYPES.SELECT_PRESENTER:
        state.selectedPresenterId = message.payload.id
        break
    }
  }
  
  // localStorage fallback listener
  const handleStorageEvent = (event) => {
    if (event.key === 'teleprompter-message' && event.newValue) {
      try {
        const message = JSON.parse(event.newValue)
        handleMessage({ data: message })
      } catch (e) {
        console.error('Failed to parse storage message', e)
      }
    }
  }
  
  // Load initial state from localStorage
  const loadFromStorage = () => {
    try {
      // Load mode
      const savedMode = localStorage.getItem(STORAGE_KEYS.MODE)
      if (savedMode && ['timer', 'autocue', 'combined'].includes(savedMode)) {
        state.mode = savedMode
      }
      
      // Load presenters
      const savedPresenters = localStorage.getItem(STORAGE_KEYS.PRESENTERS)
      if (savedPresenters) {
        const presenters = JSON.parse(savedPresenters)
        if (Array.isArray(presenters) && presenters.length > 0) {
          state.presenters = presenters
          if (!state.presenters.find(p => p.id === state.selectedPresenterId)) {
            state.selectedPresenterId = state.presenters[0].id
          }
        }
      }
      
      // Load settings
      const savedSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS)
      if (savedSettings) {
        const settings = JSON.parse(savedSettings)
        if (settings.speed !== undefined) state.speed = settings.speed
        if (settings.fontSize !== undefined) state.fontSize = settings.fontSize
      }
      
      // Load timer config
      const savedTimerConfig = localStorage.getItem(STORAGE_KEYS.TIMER_CONFIG)
      if (savedTimerConfig) {
        const timerConfig = JSON.parse(savedTimerConfig)
        if (timerConfig.timerMode) state.timerMode = timerConfig.timerMode
        if (timerConfig.durationMs) state.durationMs = timerConfig.durationMs
      }
    } catch (e) {
      console.error('Failed to load from storage', e)
    }
  }
  
  // Save to localStorage (control only)
  const saveToStorage = () => {
    if (!isControl) return
    
    try {
      localStorage.setItem(STORAGE_KEYS.MODE, state.mode)
      localStorage.setItem(STORAGE_KEYS.PRESENTERS, JSON.stringify(state.presenters))
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify({
        speed: state.speed,
        fontSize: state.fontSize
      }))
      localStorage.setItem(STORAGE_KEYS.TIMER_CONFIG, JSON.stringify({
        timerMode: state.timerMode,
        durationMs: state.durationMs
      }))
    } catch (e) {
      console.error('Failed to save to storage', e)
    }
  }
  
  // Watch for changes and broadcast (control only)
  if (isControl) {
    watch(() => state.mode, (newMode) => {
      saveToStorage()
      if (isControl) {
        sendMessage({
          type: MESSAGE_TYPES.SET_MODE,
          payload: { mode: newMode }
        })
      }
    })
    
    watch(() => state.presenters, () => {
      saveToStorage()
      sendMessage({
        type: MESSAGE_TYPES.UPDATE_PRESENTERS,
        payload: { presenters: JSON.parse(JSON.stringify(state.presenters)) }
      })
    }, { deep: true })
    
    watch(() => [state.speed, state.fontSize], () => {
      saveToStorage()
    })
    
    watch(() => [state.timerMode, state.durationMs], () => {
      saveToStorage()
    })
  }
  
  // Public API
  const api = {
    state,
    
    // Playback controls
    play() {
      state.isPlaying = true
      if (isControl) {
        sendMessage({
          type: MESSAGE_TYPES.UPDATE_PLAYBACK,
          payload: { isPlaying: true }
        })
      }
    },
    
    pause() {
      state.isPlaying = false
      if (isControl) {
        sendMessage({
          type: MESSAGE_TYPES.UPDATE_PLAYBACK,
          payload: { isPlaying: false }
        })
      }
    },
    
    togglePlayPause() {
      state.isPlaying = !state.isPlaying
      if (isControl) {
        sendMessage({
          type: MESSAGE_TYPES.UPDATE_PLAYBACK,
          payload: { isPlaying: state.isPlaying }
        })
      }
    },
    
    setSpeed(speed) {
      state.speed = speed
      if (isControl) {
        sendMessage({
          type: MESSAGE_TYPES.UPDATE_PLAYBACK,
          payload: { speed }
        })
      }
    },
    
    setFontSize(fontSize) {
      state.fontSize = fontSize
      if (isControl) {
        sendMessage({
          type: MESSAGE_TYPES.UPDATE_PLAYBACK,
          payload: { fontSize }
        })
      }
    },
    
    setScrollPosition(scrollPosition) {
      state.scrollPosition = scrollPosition
      if (isControl) {
        sendMessage({
          type: MESSAGE_TYPES.UPDATE_PLAYBACK,
          payload: { scrollPosition }
        })
      }
    },
    
    // Timer controls - send commands, not continuous updates
    startTimer() {
      state.isTimerRunning = true
      state.timerStartTime = Date.now() - state.elapsedMs
      if (isControl) {
        sendMessage({
          type: MESSAGE_TYPES.UPDATE_TIMER,
          payload: { 
            isTimerRunning: true, 
            timerStartTime: state.timerStartTime,
            elapsedMs: state.elapsedMs
          }
        })
      }
    },
    
    pauseTimer() {
      // Capture current elapsed before pausing
      const currentElapsed = state.timerStartTime ? Date.now() - state.timerStartTime : state.elapsedMs
      state.elapsedMs = currentElapsed
      state.isTimerRunning = false
      state.timerStartTime = null
      if (isControl) {
        sendMessage({
          type: MESSAGE_TYPES.UPDATE_TIMER,
          payload: { isTimerRunning: false, elapsedMs: currentElapsed, timerStartTime: null }
        })
      }
    },
    
    resetTimer() {
      console.debug('[resetTimer] Resetting timer', { isControl, currentElapsed: state.elapsedMs })
      state.isTimerRunning = false
      state.elapsedMs = 0
      state.timerStartTime = null
      saveToStorage()
      if (isControl) {
        console.debug('[resetTimer] Broadcasting reset to other windows')
        sendMessage({
          type: MESSAGE_TYPES.UPDATE_TIMER,
          payload: { isTimerRunning: false, elapsedMs: 0, timerStartTime: null }
        })
      }
      console.debug('[resetTimer] Reset complete', { elapsedMs: state.elapsedMs, isRunning: state.isTimerRunning })
    },
    
    setTimerMode(mode) {
      state.timerMode = mode
      if (isControl) {
        sendMessage({
          type: MESSAGE_TYPES.UPDATE_TIMER,
          payload: { timerMode: mode }
        })
      }
    },
    
    setTimerDuration(durationMs) {
      state.durationMs = durationMs
      if (isControl) {
        sendMessage({
          type: MESSAGE_TYPES.UPDATE_TIMER,
          payload: { durationMs }
        })
      }
    },
    
    // Mode control
    setMode(mode) {
      state.mode = mode
      // Handled by watcher
    },
    
    // Presenter management
    selectPresenter(id) {
      state.selectedPresenterId = id
      if (isControl) {
        sendMessage({
          type: MESSAGE_TYPES.SELECT_PRESENTER,
          payload: { id }
        })
      }
    },
    
    addPresenter(presenter) {
      if (!isControl) return
      state.presenters.push(presenter)
      // Handled by watcher
    },
    
    updatePresenter(id, updates) {
      if (!isControl) return
      const index = state.presenters.findIndex(p => p.id === id)
      if (index !== -1) {
        state.presenters[index] = { ...state.presenters[index], ...updates }
      }
      // Handled by watcher
    },
    
    deletePresenter(id) {
      if (!isControl) return
      state.presenters = state.presenters.filter(p => p.id !== id)
      if (state.selectedPresenterId === id && state.presenters.length > 0) {
        state.selectedPresenterId = state.presenters[0].id
      }
      // Handled by watcher
    },
    
    setPresenters(presenters) {
      if (!isControl) return
      state.presenters = presenters
      // Handled by watcher
    },
    
    // Messaging
    sendLiveMessage(text, type = 'info') {
      if (!isControl) return
      const id = Date.now().toString()
      sendMessage({
        type: MESSAGE_TYPES.PUSH_MESSAGE,
        payload: { text, type, id }
      })
      // Also update local state
      state.currentMessage = { text, type, id, visible: true }
    },
    
    clearLiveMessage(id = null) {
      if (!isControl) return
      sendMessage({
        type: MESSAGE_TYPES.CLEAR_MESSAGE,
        payload: { id }
      })
      // Also update local state
      state.currentMessage.visible = false
    },
    
    // Import/Export
    exportData() {
      return {
        version: 1,
        exportDate: new Date().toISOString(),
        settings: {
          speed: state.speed,
          fontSize: state.fontSize,
          mode: state.mode
        },
        timer: {
          timerMode: state.timerMode,
          durationMs: state.durationMs
        },
        presenters: state.presenters
      }
    },
    
    importData(data) {
      if (!isControl) return
      
      if (data.presenters && Array.isArray(data.presenters)) {
        state.presenters = data.presenters
        if (data.presenters.length > 0) {
          state.selectedPresenterId = data.presenters[0].id
        }
      }
      
      if (data.settings) {
        if (data.settings.speed !== undefined) state.speed = data.settings.speed
        if (data.settings.fontSize !== undefined) state.fontSize = data.settings.fontSize
        if (data.settings.mode !== undefined) state.mode = data.settings.mode
      }
      
      if (data.timer) {
        if (data.timer.timerMode !== undefined) state.timerMode = data.timer.timerMode
        if (data.timer.durationMs !== undefined) state.durationMs = data.timer.durationMs
      }
      
      saveToStorage()
      
      // Broadcast full state
      sendMessage({
        type: MESSAGE_TYPES.SET_STATE,
        payload: JSON.parse(JSON.stringify(state))
      })
    }
  }
  
  // Lifecycle
  onMounted(() => {
    loadFromStorage()
    initChannel()
    
    // Listen for localStorage events (fallback)
    if (!supportsBroadcastChannel) {
      window.addEventListener('storage', handleStorageEvent)
    }
    
    // If control, broadcast initial state after a delay
    if (isControl) {
      setTimeout(() => {
        sendMessage({
          type: MESSAGE_TYPES.SET_STATE,
          payload: JSON.parse(JSON.stringify(state))
        })
      }, 500)
    }
  })
  
  onUnmounted(() => {
    if (channel) {
      channel.close()
    }
    if (!supportsBroadcastChannel) {
      window.removeEventListener('storage', handleStorageEvent)
    }
  })
  
  return api
}
