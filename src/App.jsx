import { AuthProvider } from "./context/AuthContext";
import { Routes, Route } from 'react-router-dom'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import AuthCallback from './pages/auth/AuthCallback'
import AppShell from './components/layout/AppShell'

function App() {
  return (
    <AuthProvider>
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/*" element={
        <AppShell>
          <p style={{ color: 'rgba(180,210,255,0.4)', fontSize: '13px' }}>
            Dashboard content here
          </p>
        </AppShell>
      } />
    </Routes>
    </AuthProvider>
  );
}

export default App