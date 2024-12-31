import React from 'react'
import { Routes, Route } from 'react-router-dom'
import TokenInitializer from './components/TokenInitializer'

function App() {
  return (
    <TokenInitializer>
      <Routes>
        <Route path="/" element={<div>Home Page</div>} />
      </Routes>
    </TokenInitializer>
  )
}

export default App