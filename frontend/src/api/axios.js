import axios from 'axios';

const api = axios.create({
  baseURL: 'https://fastapi-and-react.onrender.com', 
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token'); 
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// this runs after every response comes back from the backend
api.interceptors.response.use(
  (response) => response, // If success (200), just return the data
  (error) => {
    if (error.response && error.response.status === 401) {
      console.log("Token expired or invalid. Logging out...");
      
      localStorage.removeItem('token'); 
      
      if (window.location.pathname !== '/login') {
          window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
