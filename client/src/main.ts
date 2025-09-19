import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';

import 'primeicons/primeicons.css';
import '@/assets/styles.scss';

import PrimeVue from 'primevue/config';
import Aura from '@primeuix/themes/aura'; // เพิ่มตรงนี้
import ConfirmationService from 'primevue/confirmationservice';
import ToastService from 'primevue/toastservice';
import Toast from 'primevue/toast';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);
app.use(PrimeVue, {
  theme: {
    preset: Aura,
    options: {}
  },
  ripple: true
});
app.use(ToastService);
app.use(ConfirmationService);

app.component('Toast', Toast);

app.mount('#app');