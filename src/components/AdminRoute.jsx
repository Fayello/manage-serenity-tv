import React from 'react';
import { Navigate } from 'react-router-dom';
import { authService } from '../services/api';

const AdminRoute = ({ children }) => {
    if (!authService.isAuthenticated()) {
        return <Navigate to="/admin/login" replace />;
    }
    return children;
};

export default AdminRoute;
