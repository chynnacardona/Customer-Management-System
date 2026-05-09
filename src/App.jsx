import { AuthProvider } from "./context/AuthContext";
import { UserRightsProvider } from "./context/UserRightsContext";
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
import Dashboard from "./pages/dashboard/Dashboard";
import { useRights } from "./context/useRights";
import { canManageDeletedCustomers } from "./utils/accessRules";

function AdminRoute({ children }) {
  const { rights, rightsLoading } = useRights();

  if (rightsLoading) {
    return <div className="flex h-screen items-center justify-center">Loading permissions...</div>;
  }

  if (rights.ADM_USER !== 1) {
    return <Navigate to="/customers" replace />;
  }

  return children;
}

function DeletedCustomersRoute({ children }) {
  const { userType, rightsLoading } = useRights();

  if (rightsLoading) {
    return <div className="flex h-screen items-center justify-center">Loading permissions...</div>;
  }

  if (!canManageDeletedCustomers(userType)) {
    return <Navigate to="/customers" replace />;
  }

  return children;
}

function App() {
  return (
    <AuthProvider>
      <UserRightsProvider>
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
  
          <Route index element={<Dashboard />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="customers" element={<CustomerList />} />
          <Route path="customers/:custno" element={<CustomerDetail />} />
          <Route path="sales" element={<SalesList />} />
          <Route path="products" element={<ProductCatalog />} />
          <Route path="admin" element={<AdminRoute><UserManagement /></AdminRoute>} />
          <Route path="deleted-customers" element={<DeletedCustomersRoute><DeletedCustomers /></DeletedCustomersRoute>} />
          
          <Route path="*" element={<Navigate to="/customers" replace />} />
        </Route>
      </Routes>
      </UserRightsProvider>
    </AuthProvider>
  );
}

export default App;
