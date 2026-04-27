import React, { useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Global State
import { UserProvider, UserContext } from './shared/context/UserContext';
import { ThemeProvider } from './shared/context/ThemeContext';
import { Toaster } from 'react-hot-toast';

// Admin Imports
import AdminLogin from './admin/pages/AdminLogin';
import AdminDashboardLayout from './admin/components/AdminDashboardLayout';
import ProtectedRoute from './admin/components/ProtectedRoute';
import DashboardHome from './admin/pages/DashboardHome';
import AdminStats from './admin/pages/AdminStats';
import UserManagement from './admin/pages/UserManagement';
import SystemSecurity from './admin/pages/SystemSecurity';
import AdminSettings from './admin/pages/AdminSettings';
import SupportRequests from './admin/pages/SupportRequests';
import ModelAnalytics from './admin/pages/ModelAnalytics';
import AuditLogs from './admin/pages/AuditLogs';

// Application Router Map
const AppRoutes = () => {
  const { user } = useContext(UserContext);

  return (
    <Routes>
      {/* === ROOT REDIRECT TO ADMIN === */}
      <Route path="/" element={user && user.isAdmin ? <Navigate to="/admin/dashboard" replace /> : <Navigate to="/admin/login" replace />} />
      
      {/* === ADMIN ROUTES === */}
      <Route path="/admin/login" element={user && user.isAdmin ? <Navigate to="/admin/dashboard" replace /> : <AdminLogin />} />
      
      <Route 
        path="/admin" 
        element={
          <ProtectedRoute>
            <AdminDashboardLayout />
          </ProtectedRoute>
        }
      >
        {/* Redirect /admin directly to the dashboard overview */}
        <Route index element={<Navigate to="dashboard" replace />} />
        
        {/* Main Landing Dashboard */}
        <Route path="dashboard" element={<DashboardHome />} />
        
        {/* Detailed Command Center Analytics */}
        <Route path="stats" element={<AdminStats />} />
        
        <Route path="users" element={<UserManagement />} />
        <Route path="models" element={<ModelAnalytics />} />
        <Route path="security" element={<SystemSecurity />} />
        <Route path="audit-logs" element={<AuditLogs />} />
        <Route path="support" element={<SupportRequests />} />
        <Route path="settings" element={<AdminSettings />} />
      </Route>

      {/* CATCH ALL REDIRECT TO ADMIN */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default function App() {
  return (
    <ThemeProvider>
        <Toaster position="top-right" reverseOrder={false} />
        <UserProvider>
            <BrowserRouter>
                <AppRoutes />
            </BrowserRouter>
        </UserProvider>
    </ThemeProvider>
  );
}
