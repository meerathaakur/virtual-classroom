// import { Buffer } from 'buffer';
// import crypto from 'crypto';
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/tailwind.css'
import App from './App.jsx'

// if (typeof globalThis.crypto === 'undefined') {
//   globalThis.crypto = crypto; // Assign the Node.js crypto to globalThis if not present
// }

// window.Buffer = Buffer;

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
