import React from 'react'
import { createRoot } from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import './index.css'
import App from './App.jsx'

// Import your Publishable Key
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

const rootElement = document.getElementById('root');
const root = createRoot(rootElement);

if (!PUBLISHABLE_KEY || PUBLISHABLE_KEY.includes('placeholder')) {
  root.render(
    <div className="config-error-container">
      <h1 className="config-error-title">Missing Clerk Configuration</h1>
      <p className="config-error-text">
        The <code>VITE_CLERK_PUBLISHABLE_KEY</code> is missing or set to a placeholder in your <code>.env</code> file.
      </p>
      <div className="config-error-steps">
        <p style={{ marginBottom: '0.5rem', fontWeight: 'bold' }}>To fix this:</p>
        <ol className="config-error-steps-list">
          <li>Get your key from the <a href="https://dashboard.clerk.com" target="_blank" className="config-error-link">Clerk Dashboard</a></li>
          <li>Add it to your <code>.env</code> file:</li>
        </ol>
        <pre className="config-error-code">
          VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
        </pre>
      </div>
    </div>
  )
} else {
  root.render(
    <React.StrictMode>
      <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
        <App />
      </ClerkProvider>
    </React.StrictMode>
  )
}
