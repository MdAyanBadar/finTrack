import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5001/api",
  withCredentials: true,
});

// 🔐 Attach token automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ❌ Handle expired / invalid token
api.interceptors.response.use(
  (res) => res,
  (err) => {
    // Check if the request failed was the LOGIN request
    const isLoginRequest = err.config.url.includes("/auth/login");

    if (err.response?.status === 401 && !isLoginRequest) {
      // ONLY redirect if we aren't already on/trying to login
      localStorage.removeItem("token");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    
    // IMPORTANT: Always return the error so the .catch() in Login.jsx can see it
    return Promise.reject(err);
  }
);

export default api;