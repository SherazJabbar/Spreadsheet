import { createRouter, createWebHistory } from 'vue-router'
import Spreadsheet from '../views/Spreadsheet.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'Spreadsheet',
      component: Spreadsheet,
    },
  ],
})

export default router
