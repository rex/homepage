import { createApp } from 'vue';
import App from './App.vue';
import './main.css';

document.documentElement.style.setProperty('--font-display', '"Orbitron"');
document.documentElement.style.setProperty('--font-body', '"Rajdhani"');

createApp(App).mount('#app');
