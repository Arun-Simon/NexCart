import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="top-right"
        gutter={8}
        toastOptions={{
          duration: 3500,
          style: {
            background: '#1e2535',
            color: '#f1f5f9',
            border: '1px solid #2a3347',
            borderRadius: '12px',
            fontSize: '14px',
          },
          success: { iconTheme: { primary: '#34d399', secondary: '#1e2535' } },
          error:   { iconTheme: { primary: '#f87171', secondary: '#1e2535' } },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>
)
