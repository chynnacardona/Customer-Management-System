import { Routes, Route } from 'react-router-dom'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import AppShell from './components/layout/AppShell'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/*" element={
        <AppShell>
          <p style={{ color: 'rgba(180,210,255,0.4)', fontSize: '13px' }}>
            Dashboard content here
          </p>
        </AppShell>
      } />
    </Routes>
  )
}

export default App