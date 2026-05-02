import { supabase } from "../supabase/supabaseClient";
import { AuthProvider } from "./context/AuthContext";
import { Routes, Route } from "react-router-dom";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import AppShell from "./components/layout/AppShell";
import AuthCallback from "./pages/auth/AuthCallback";
import CustomerListPage from './pages/customers/CustomerListPage'

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route
          path="/"
          element={
            <AppShell>
              <p style={{ color: "rgba(180,210,255,0.4)", fontSize: "13px" }}>
                Dashboard content here
              </p>
            </AppShell>
          }
        />
        <Route path="/lookups/customers" element={
          <AppShell>
            <CustomerListPage />
          </AppShell>
        } />
      </Routes>
    </AuthProvider>
  );
}

/* Add this temporary block to your code to test the DB Seeding
const testConnection = async () => {
  const { data, error } = await supabase.from('customer').select('').limit(5);

  if (error) {
    console.error("❌ Connection Failed:", error.message);
  } else {
    console.log("✅ Success! DB Data found:", data);
  }
};*/

//testConnection();

export default App;