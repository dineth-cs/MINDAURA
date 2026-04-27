import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import axiosInstance from '../../utils/axiosInstance';
import { UserContext } from '../../shared/context/UserContext';
import { useContext } from 'react';

export default function AdminLogin() {
  const navigate = useNavigate();
  const { login } = useContext(UserContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      // Use the context login() so UserContext state (user.isAdmin) is populated
      // before ProtectedRoute evaluates. Falls back to /auth/login endpoint.
      const data = await login(email, password);
      if (!data.isAdmin) {
        setError('Access denied. This account does not have admin privileges.');
        setIsSubmitting(false);
        return;
      }
      navigate('/admin/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">

      {/* Subtle decorative blobs */}
      <div className="absolute top-[-5%] left-[-5%] w-72 h-72 bg-blue-100 rounded-full blur-[80px] opacity-60 pointer-events-none" />
      <div className="absolute bottom-[-5%] right-[-5%] w-72 h-72 bg-purple-100 rounded-full blur-[80px] opacity-60 pointer-events-none" />

      <div className="relative z-10 w-full max-w-md">

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-horizon-lg border border-gray-100 p-8 sm:p-10">

          {/* Logo & Heading */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 mb-5 shadow-brand">
              <span className="text-white font-black text-2xl">M</span>
            </div>
            <h1 className="text-2xl font-black text-gray-800 tracking-tight">Welcome back</h1>
            <p className="text-gray-500 mt-1.5 text-sm font-medium">Sign in to your MindAura admin panel</p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm font-medium flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full flex-shrink-0"></span>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Email Address</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <FiMail className="text-gray-400 group-focus-within:text-blue-500 transition-colors text-sm" />
                </div>
                <input
                  type="email"
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 text-sm font-medium placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:bg-white focus:ring-3 focus:ring-blue-100 transition-all"
                  placeholder="admin@mindaura.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Password</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <FiLock className="text-gray-400 group-focus-within:text-blue-500 transition-colors text-sm" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="w-full pl-10 pr-11 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 text-sm font-medium placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:bg-white focus:ring-3 focus:ring-blue-100 transition-all"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <FiEyeOff className="text-sm" /> : <FiEye className="text-sm" />}
                </button>
              </div>
            </div>

            {/* Remember me / Forgot */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 accent-purple-600 cursor-pointer"
                />
                <span className="text-sm text-gray-600 font-medium group-hover:text-gray-800 transition-colors">Remember me</span>
              </label>
              <a href="#" className="text-sm font-semibold text-blue-600 hover:text-purple-600 transition-colors">
                Forgot password?
              </a>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-3.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold rounded-xl shadow-brand hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 text-sm ${
                isSubmitting ? 'opacity-70 cursor-not-allowed' : 'active:scale-[0.98]'
              }`}
            >
              {isSubmitting ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 mt-6 font-medium">
          MindAura Admin Portal · Secure Access Only
        </p>
      </div>
    </div>
  );
}
