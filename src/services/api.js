import axios from "axios";

// Use environment variable for API URL - Make sure this points to your NestJS backend root
// If your auth routes are /api/auth/*, then baseURL should be http://localhost:3000
// If your auth routes are /auth/*, then baseURL should be http://localhost:3000
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000"; // Adjust if needed, remove '/api' if it's not part of all routes

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Keep this if you might use cookie/session auth features
  headers: {
    "Content-Type": "application/json",
  },
});

// Add auth token interceptor (moved from authService.js)
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token"); // Or wherever you store your token
    if (token) {
      // Ensure the key is exactly 'Authorization'
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    // Handle request errors (optional)
    return Promise.reject(error);
  }
);

// Optional: Add response interceptor (example)
// api.interceptors.response.use(
//   (response) => response,
//   (error) => {
//     if (error.response && error.response.status === 401) {
//       console.error("Unauthorized or Token Expired - Logging out...");
//       // Potentially call logout logic or redirect
//       localStorage.removeItem('token');
//       localStorage.removeItem('user');
//       // window.location.href = '/login'; // Force redirect
//     }
//     return Promise.reject(error);
//   }
// );

export default api;
