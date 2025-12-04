import { createRouter, createWebHistory } from 'vue-router'
import ControlView from '../views/ControlView.vue'
import ProgramView from '../views/ProgramView.vue'

const routes = [
  {
    path: '/',
    redirect: '/control'
  },
  {
    path: '/control',
    name: 'Control',
    component: ControlView,
    meta: { title: 'Control Panel - Teleprompter' }
  },
  {
    path: '/program',
    name: 'Program',
    component: ProgramView,
    meta: { title: 'Program View - Teleprompter' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Set page title based on route
router.beforeEach((to, from, next) => {
  document.title = to.meta.title || 'Teleprompter'
  next()
})

export default router
