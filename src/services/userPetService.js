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

const userPetService = {
  async getUserPet() {
    try {
      const response = await api.get("/user-pets");
      return response.data;
    } catch (error) {
      console.error("Error fetching user pet:", error);
      // Return default pet data if API call fails
      return {
        name: "Dragon",
        level: 1,
        stage: "baby",
        currentAnimation: "idle",
        healthPoints: 100,
        currentStreak: 0,
      };
    }
  },

  async updatePet(petData) {
    try {
      const response = await api.patch("/user-pets", petData);
      return response.data;
    } catch (error) {
      console.error("Error updating pet:", error);
      throw error;
    }
  },

  async resurrectPet() {
    try {
      const response = await api.post("/user-pets/resurrect");
      return response.data;
    } catch (error) {
      console.error("Error resurrecting pet:", error);
      throw error;
    }
  },
};

export default userPetService;
