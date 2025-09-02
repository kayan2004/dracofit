import axios from "axios";
import api from "./api"; // Ensure api is imported

// Use environment variable for API URL with fallback
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

// Create axios instance with default config
const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add auth token to requests if available
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor for error handling
axiosInstance.interceptors.response.use(
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

const API_URL_PET = "/user-pets";

const userPetService = {
  async getUserPet() {
    try {
      const response = await api.get(API_URL_PET); // Use API_URL_PET
      return response.data;
    } catch (error) {
      console.error("Error fetching user pet:", error);
      // Consider if returning default data is always desired or if throwing error is better
      return {
        name: "Dragon",
        level: 1,
        stage: "baby",
        currentAnimation: "idle",
        healthPoints: 100,
        currentStreak: 0,
        // maxHealth: 100, // maxHealth is not on the entity
        xp: 0,
        xpToNextLevel: 100,
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

  /**
   * Update user pet streak (called after workout completion)
   */
  async updateStreak() {
    try {
      const response = await api.post(`${API_URL_PET}/streak`);
      console.log("Streak updated successfully:", response.data);
      return response.data;
    } catch (error) {
      console.error(
        "Error updating streak:",
        error.response?.data || error.message
      );
      throw error;
    }
  },

  async restartJourney() {
    try {
      const response = await api.post(`${API_URL_PET}/restart-journey`);
      return response.data; // Backend returns the new pet object
    } catch (error) {
      console.error(
        "Error restarting journey:",
        error.response?.data || error.message
      );
      throw error.response?.data || new Error("Failed to restart journey");
    }
  },
};

export default userPetService;
