import { Routes, Route, Link } from 'react-router-dom'
import './App.css'

// 1. Import your pages
import CustomerList from './pages/customers/CustomerList'
import CustomerDetail from './pages/customers/CustomerDetail'

// 2. Import your new Security component
import ProtectedRoute from './components/ProtectedRoute' 

const Dashboard = () => <div className="page-content"><h1>📊 Dashboard</h1></div>
const Login = () => <div className="page-content"><h1>🔐 Login Page</h1><p>Please sign in.</p></div>

function App() {
  return (
    <div className="cms-layout">
      <aside className="sidebar">
        <h2>CMS Admin</h2>
        <nav>
          <ul>
            <li><Link to="/">🏠 Dashboard</Link></li>
            <li><Link to="/customers">👥 Customers</Link></li>
          </ul>
        </nav>
      </aside>

      <main className="main-content">
        <Routes>
          {/* Public Route */}
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Dashboard />} />

          {/* PROTECTED ROUTES */}
          <Route 
            path="/customers" 
            element={
              <ProtectedRoute>
                <CustomerList />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/customers/:id" 
            element={
              <ProtectedRoute>
                <CustomerDetail />
              </ProtectedRoute>
            } 
          />

          <Route path="*" element={<h1>404 - Not Found</h1>} />
        </Routes>
      </main>
    </div>
  )
}

export default App