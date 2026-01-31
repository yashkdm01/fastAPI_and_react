import axios from 'axios';

const api = axios.create({
  baseURL: 'https://fastapi-and-react.onrender.com',
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    
    const isAuthRequest = config.url.includes('/auth/login') || config.url.includes('/auth/register');

    if (token && !isAuthRequest) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
