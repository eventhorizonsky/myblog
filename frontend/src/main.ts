import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import "./globals.css";

const app = createApp(App);
app.use(router);
app.mount("#app");
