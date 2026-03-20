import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { applyTheme, getTheme } from './themes'
import './globals.css'

window.api.settings.get('theme').then(id => {
  applyTheme(getTheme(id ?? 'midnight'))
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
