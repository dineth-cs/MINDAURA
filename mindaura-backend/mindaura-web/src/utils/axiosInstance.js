import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'https://mindaura-wfut.onrender.com/api',
});

// Intercept requests and append active local tokens automatically
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('userToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default axiosInstance;
