import { AuthProvider } from "./context/AuthContext";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import AppShell from "./components/layout/AppShell";
import AuthCallback from "./pages/auth/AuthCallback";
import ProtectedRoute from "./pages/auth/ProtectedRoute";

import CustomerList from "./pages/customers/CustomerList";
import CustomerDetail from "./pages/customers/CustomerDetail";
import DeletedCustomers from "./pages/customers/DeletedCustomers";
import UserManagement from "./pages/admin/UserManagement";
import ProductCatalog from "./pages/products/ProductCatalog";
import SalesList from "./pages/sales/SalesList";

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/auth/callback" element={<AuthCallback />} />

        {/* Protected Application Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppShell /> 
            </ProtectedRoute>
          }
        >
  
          <Route index element={<Navigate to="/customers" replace />} />
          <Route path="customers" element={<CustomerList />} />
          <Route path="customers/:custno" element={<CustomerDetail />} />
          <Route path="sales" element={<SalesList />} />
          <Route path="products" element={<ProductCatalog />} />
          <Route path="admin" element={<UserManagement />} />
          <Route path="deleted-customers" element={<DeletedCustomers />} />
          
          <Route path="*" element={<Navigate to="/customers" replace />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App;