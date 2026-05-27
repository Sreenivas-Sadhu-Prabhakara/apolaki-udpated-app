import { createPinia } from 'pinia'
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { useUserStore } from './stores/userStore'
import './styles/main.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)

// Check the server-owned session cookie before the first navigation.
const userStore = useUserStore()

async function bootstrap() {
  await userStore.restoreSession()
  app.use(router)
  app.mount('#app')
}

bootstrap()
