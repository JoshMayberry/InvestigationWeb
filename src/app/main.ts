import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import VueMaterialAdapter from 'vue-material-adapter'

import './styles/style.css'
import 'material-components-web/dist/material-components-web.css'

const app = createApp(App)

app.use(router)
app.use(VueMaterialAdapter)

app.mount('#app')