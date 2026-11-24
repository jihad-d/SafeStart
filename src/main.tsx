import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
// Styles de base en premier : les styles propres à chaque page (importés par App)
// doivent passer après pour pouvoir les surcharger (ex. marge des champs avec icône).
import '@fontsource-variable/sora'
import './index.css'
import App from './App'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
    <App />
  </BrowserRouter>
)
