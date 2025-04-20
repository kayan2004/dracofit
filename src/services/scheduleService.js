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

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle unauthorized responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

const scheduleService = {
  /**
   * Get the current user's weekly schedule
   * @returns {Promise} Promise with schedule data
   */
  async getSchedule() {
    try {
      const response = await api.get(`/user-schedule`);
      return response.data;
    } catch (error) {
      console.error("Error fetching schedule:", error);
      throw error.response?.data || { message: "Failed to fetch schedule" };
    }
  },

  /**
   * Update a specific day in the user's schedule
   * @param {string} day - The day to update (monday, tuesday, etc)
   * @param {Object} data - The schedule entry data
   * @returns {Promise} Promise with updated schedule entry
   */
  async updateDay(day, data) {
    try {
      const response = await api.put(`/user-schedule/day/${day}`, data);
      return response.data;
    } catch (error) {
      console.error(`Error updating ${day}:`, error);
      throw error.response?.data || { message: `Failed to update ${day}` };
    }
  },

  /**
   * Clear a specific day in the schedule (set to rest)
   * @param {string} day - Day to clear (monday, tuesday, etc.)
   * @returns {Promise} Promise with updated schedule entry
   */
  async clearDay(day) {
    try {
      const response = await api.delete(`/user-schedule/day/${day}`);
      return response.data;
    } catch (error) {
      console.error(`Error clearing ${day}:`, error);
      throw error.response?.data || { message: `Failed to clear ${day}` };
    }
  },

  /**
   * Reset the entire schedule (clear all days)
   * @returns {Promise} Promise with empty schedule
   */
  async resetSchedule() {
    try {
      const response = await api.delete(`/user-schedule`);
      return response.data;
    } catch (error) {
      console.error("Error resetting schedule:", error);
      throw error.response?.data || { message: "Failed to reset schedule" };
    }
  },
};

export default scheduleService;
