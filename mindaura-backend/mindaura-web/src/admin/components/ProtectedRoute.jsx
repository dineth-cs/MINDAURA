import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { UserContext } from '../../shared/context/UserContext';

/**
 * ProtectedRoute Wrapper
 * Ensures only authenticated administrators can access the nested routes.
 */
const ProtectedRoute = ({ children }) => {
  const { user, isLoading } = useContext(UserContext);

  // 1. Handle Loading State
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center dark:bg-[#0a0f18] bg-slate-50">
        <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin shadow-lg"></div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 animate-pulse">Verifying Neural Clearance...</span>
        </div>
      </div>
    );
  }

  // 2. Redirect to Login if not authenticated or not an admin
  if (!user || user.isAdmin !== true) {
    console.warn("Unauthorized access attempt detected. Redirecting to Admin Login.");
    return <Navigate to="/admin/login" replace />;
  }

  // 3. Render authenticated content
  return children;
};

export default ProtectedRoute;
