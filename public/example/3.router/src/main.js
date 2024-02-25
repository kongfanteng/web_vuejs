import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

router.beforeEach(() => {
  console.log('before each')
})

router.beforeResolve(() => {
  console.log('before resolve')
})

router.afterEach(() => {
  console.log('after each')
})

createApp(App).use(router).mount('#app')
