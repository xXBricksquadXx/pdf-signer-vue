import { createRouter, createWebHistory } from 'vue-router'
import SignPdfView from '../views/SignPdfView.vue'
import ConvertDocumentView from '../views/ConvertDocumentView.vue'

const routes = [
  { path: '/', redirect: '/sign' },
  { path: '/sign', component: SignPdfView },
  { path: '/convert', component: ConvertDocumentView },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
