import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import 'bootstrap/dist/css/bootstrap.min.css';
import * as bootstrap from 'bootstrap';
import 'bootstrap/dist/js/bootstrap.bundle.js';

import axios from 'axios';
import VueAxios from 'vue-axios';

const app = createApp(App)

app.use(router)

app.use(VueAxios, axios);


app.mount('#app')
