import axios from "axios";

const API_URL = "http://localhost:8000";

const api = axios.create({
  baseURL: "https://fastapiandreact-production.up.railway.app",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authService = {
  login: async (email, password) => {
    const formData = new URLSearchParams();
    formData.append("username", email);
    formData.append("password", password);
    const response = await api.post("/auth/login", formData);
    if (response.data.access_token) {
      localStorage.setItem("token", response.data.access_token);
    }
    return response.data;
  },
  register: async (email, password) => {
    return api.post("/auth/register", { email, password });
  },
  logout: () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  }
};

export const docService = {
  getAll: async () => {
    const response = await api.get("/documents/");
    return response.data;
  },
  upload: async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post("/documents/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/documents/${id}`, {
      headers: {
        'Content-Type': 'application/json',
      }
    });
    return response.data;
  },
  // ----------------------------------
  getLink: async (id) => {
    const response = await api.post(`/signatures/${id}/share`);
    return response.data;
  }
};

export default api;
