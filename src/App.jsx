import { AuthProvider } from './context/AuthContext';
import { Routes, Route } from 'react-router-dom'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <AuthProvider>
      <YourRouterComponents />
      </AuthProvider>
      </Routes>
  );
}

export default App