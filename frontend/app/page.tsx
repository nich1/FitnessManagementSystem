'use client'

import { useEffect, useState } from 'react'

export default function Home() {
  const [apiStatus, setApiStatus] = useState<string>('Checking...')

  useEffect(() => {
    fetch('http://localhost:8000/health')
      .then(res => res.json())
      .then(data => setApiStatus(data.status))
      .catch(() => setApiStatus('Not connected'))
  }, [])

  return (
    <main style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '2rem',
      gap: '1.5rem'
    }}>
      <h1 style={{ fontSize: '2.5rem', fontWeight: 700 }}>
        Fitness Management System
      </h1>
      <p style={{ color: '#888', fontSize: '1.1rem' }}>
        Track calories, macros, training, and more
      </p>
      <div style={{
        marginTop: '2rem',
        padding: '1rem 2rem',
        background: '#1a1a1a',
        borderRadius: '8px',
        border: '1px solid #333'
      }}>
        <span style={{ color: '#888' }}>API Status: </span>
        <span style={{ 
          color: apiStatus === 'healthy' ? '#22c55e' : '#ef4444',
          fontWeight: 600
        }}>
          {apiStatus}
        </span>
      </div>
    </main>
  )
}

