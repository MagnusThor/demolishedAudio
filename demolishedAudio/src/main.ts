import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'

import { basicSetup } from 'codemirror'
import VueCodemirror from 'vue-codemirror'





const app = createApp(App)

app.use(VueCodemirror, {
    autofocus: true,
    disabled: false,
    indentWithTab: true,
    tabSize: 2,
    placeholder: 'Code goes here...',
    extensions: [basicSetup]
    
  });

app.use(createPinia())

app.mount('#app')
