import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Activation from './pages/Activation';
import Home from './pages/Home';
import AdminLogin from './pages/admin/Login';
import AdminDashboard from './pages/admin/Dashboard';
import AdminRoute from './components/AdminRoute';
import { checkActivationStatus } from './utils/device';

function App() {
  const [isActivated, setIsActivated] = useState(checkActivationStatus());

  const handleActivation = () => {
    setIsActivated(true);
  };

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
