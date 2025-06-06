import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'http://35.154.206.37:3000/api/admin',
});

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default axiosInstance;