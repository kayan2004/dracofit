import axios from "axios";

// Use environment variable for API URL with fallback
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add auth token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle authorization errors
    if (error.response && error.response.status === 401) {
      console.error("Unauthorized access. Redirecting to login page...");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

const userDetailsService = {
  // Get user details
  async getUserDetails() {
    try {
      const response = await api.get("/user-details");
      return response.data;
    } catch (error) {
      console.error("Error fetching user details:", error);
      throw error;
    }
  },

  // Create user details
  async createUserDetails(userDetails) {
    try {
      const response = await api.post("/user-details", userDetails);
      return response.data;
    } catch (error) {
      console.error("Error creating user details:", error);
      throw error;
    }
  },

  // Update user details
  async updateUserDetails(userDetails) {
    try {
      const response = await api.patch("/user-details", userDetails);
      return response.data;
    } catch (error) {
      console.error("Error updating user details:", error);
      throw error;
    }
  },

  // Delete user details
  async deleteUserDetails() {
    try {
      const response = await api.delete("/user-details");
      return response.data;
    } catch (error) {
      console.error("Error deleting user details:", error);
      throw error;
    }
  },
};

export default userDetailsService;
