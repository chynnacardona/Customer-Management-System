import { AuthProvider } from "./context/AuthContext";
import { Routes, Route } from 'react-router-dom';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import AuthCallback from './pages/auth/AuthCallback';
import AppShell from './components/layout/AppShell';
import { useEffect } from 'react';
import { customerService } from './services/customerService';

function App() {
  useEffect(() => {
    const runFullSuite = async () => {
      console.log("🧪 Starting PR-01 CRUD Suite...");
      try {
        // 1. TEST READ (Filtered)
        const activeList = await customerService.getCustomers('USER');
        console.log("✅ Read Success (Active):", activeList.length);

        //2. TEST CREATE 
        const newCust = await customerService.addCustomer({ 
        custno: 'C0001',          
        custname: 'Test Customer',  
        payterm: 'COD',             
        record_status: 'active' 
        });
        console.log("Created customer:", newCust[0].custno);
        console.log("✅ Create Success");

        // 3. TEST UPDATE
        await customerService.updateCustomer('C0001', { name: 'Updated Name' });
        console.log("✅ Update Success");

        // 4. TEST SOFT DELETE
        await customerService.softDeleteCustomer('C0001');
        console.log("✅ Soft Delete Success");

        // 5. TEST RECOVER
        await customerService.recoverCustomer('C0001');
        console.log("✅ Recover Success");

      } catch (err) {
        console.error("❌ Suite Failed:", err.message);
      }
    };
    runFullSuite();
  }, []);

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

export default App;
