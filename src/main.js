import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap/dist/js/bootstrap.bundle';
import moment from 'moment';

import axios from 'axios';
import VueAxios from 'vue-axios';

const app = createApp(App)

app.use(router)

app.use(VueAxios, axios);


app.use(moment)

app.mount('#app')
