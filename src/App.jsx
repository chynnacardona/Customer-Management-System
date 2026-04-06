import { Routes, Route } from 'react-router-dom'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import AuthCallback from './pages/auth/AuthCallback' 
import AppShell from './components/layout/AppShell' // I-uncomment mo na 'to

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/auth/callback" element={<AuthCallback />} /> 
      <Route path="/*" element={
        <AppShell> {/* I-uncomment mo na rin 'to */}
          <p style={{ color: 'rgba(180,210,255,0.4)', fontSize: '13px' }}>
            Dashboard content here
          </p>
        </AppShell>
      } />
    </Routes>
  )
}