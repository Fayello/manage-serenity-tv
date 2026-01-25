import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Activation from './pages/Activation';
import Home from './pages/Home';
import AdminLogin from './pages/admin/Login';
import AdminDashboard from './pages/admin/Dashboard';
import AdminRoute from './components/AdminRoute';
import { checkActivationStatus } from './utils/device';

function App() {
  const [isActivated, setIsActivated] = useState(null); // null = unknown/loading

  useEffect(() => {
    const verify = async () => {
      const status = await checkActivationStatus();
      setIsActivated(status);
    };
    verify();
  }, []);

  const handleActivation = () => {
    setIsActivated(true);
  };

  if (isActivated === null) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <div className="animate-pulse flex flex-col items-center gap-2">
          <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin"></div>
          <span className="text-xs font-mono text-slate-500">VERIFYING DEVICE...</span>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/activation"
          element={isActivated ? <Navigate to="/" /> : <Activation onActivate={handleActivation} />}
        />
        <Route
          path="/"
          element={isActivated ? <Home /> : <Navigate to="/activation" />}
        />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin/dashboard"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
