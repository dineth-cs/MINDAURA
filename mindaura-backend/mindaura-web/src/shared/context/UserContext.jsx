import React, { createContext, useState, useEffect } from 'react';
import axiosInstance from '../../utils/axiosInstance';

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('userToken') || null);
  const [isLoading, setIsLoading] = useState(true);

  // Auto-fetch profile if returning token exists
  useEffect(() => {
    const fetchCurrentUser = async () => {
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const response = await axiosInstance.get('/auth/me');
        setUser({ ...response.data.user, token });
      } catch (error) {
        console.error("Session check failed:", error);
        localStorage.removeItem('userToken');
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCurrentUser();
  }, [token]);

  const login = async (email, password) => {
    const response = await axiosInstance.post('/auth/login', { email, password });
    console.log("LOGIN RESPONSE DATA:", response.data);
    
    // Login API returns a flat object with user fields + token
    const { token: newToken, ...userData } = response.data;
    
    localStorage.setItem('userToken', newToken);
    setToken(newToken);
    setUser({ ...userData, token: newToken });
    return response.data;
  };

  const register = async (userData) => {
    const response = await axiosInstance.post('/auth/register', userData);
    const { token: newToken, user: newUser } = response.data;
    localStorage.setItem('userToken', newToken);
    setToken(newToken);
    setUser({ ...newUser, token: newToken });
    return response.data;
  };

  const logout = () => {
    localStorage.removeItem('userToken');
    setToken(null);
    setUser(null);
  };

  return (
    <UserContext.Provider value={{ user, setUser, token, isLoading, login, register, logout }}>
      {children}
    </UserContext.Provider>
  );
};
