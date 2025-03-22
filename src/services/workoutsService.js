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
const workoutsService = {
  /**
   * Get all workouts with optional filters
   * @param {Object} params - Query parameters for filtering
   * @returns {Promise} Promise with workout data
   */
  async getAllWorkouts(params = {}) {
    try {
      const queryString = new URLSearchParams();

      // Add all params to query string
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          queryString.append(key, value);
        }
      });

      const response = await api.get(
        `/workout-plans?${queryString.toString()}`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching workouts:", error);
      throw error.response?.data || { message: "Failed to fetch workouts" };
    }
  },

  /**
   * Get a specific workout by ID
   * @param {string} id - Workout ID
   * @returns {Promise} Promise with workout data
   */
  async getWorkoutById(id) {
    try {
      const response = await api.get(`/workout-plans/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching workout ${id}:`, error);
      throw (
        error.response?.data || { message: "Failed to fetch workout details" }
      );
    }
  },

  /**
   * Create a new workout
   * @param {Object} workoutData - New workout data
   * @returns {Promise} Promise with created workout
   */
  async createWorkout(workoutData) {
    try {
      const response = await api.post("/workout-plans", workoutData);
      return response.data;
    } catch (error) {
      console.error("Error creating workout:", error);
      throw error.response?.data || { message: "Failed to create workout" };
    }
  },

  /**
   * Update an existing workout
   * @param {string} id - Workout ID
   * @param {Object} workoutData - Updated workout data
   * @returns {Promise} Promise with updated workout
   */
  async updateWorkout(id, workoutData) {
    try {
      const response = await api.put(`/workout-plans/${id}`, workoutData);
      return response.data;
    } catch (error) {
      console.error(`Error updating workout ${id}:`, error);
      throw error.response?.data || { message: "Failed to update workout" };
    }
  },

  /**
   * Delete a workout
   * @param {string} id - Workout ID
   * @returns {Promise} Promise with deletion result
   */
  async deleteWorkout(id) {
    try {
      const response = await api.delete(`/workout-plans/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting workout ${id}:`, error);
      throw error.response?.data || { message: "Failed to delete workout" };
    }
  },

  /**
   * Add an exercise to a workout
   * @param {string} workoutId - Workout ID
   * @param {Object} exerciseData - Exercise data to add
   * @returns {Promise} Promise with updated workout
   */
  async addExerciseToWorkout(workoutId, exerciseData) {
    try {
      const response = await api.post(
        `/workout-plans/${workoutId}/exercises`,
        exerciseData
      );
      return response.data;
    } catch (error) {
      console.error(`Error adding exercise to workout ${workoutId}:`, error);
      throw (
        error.response?.data || { message: "Failed to add exercise to workout" }
      );
    }
  },

  /**
   * Remove an exercise from a workout
   * @param {string} workoutId - Workout ID
   * @param {string} exerciseId - Exercise ID to remove
   * @returns {Promise} Promise with updated workout
   */
  async removeExerciseFromWorkout(workoutId, exerciseId) {
    try {
      const response = await api.delete(
        `/workout-plans/${workoutId}/exercises/${exerciseId}`
      );
      return response.data;
    } catch (error) {
      console.error(
        `Error removing exercise from workout ${workoutId}:`,
        error
      );
      throw (
        error.response?.data || {
          message: "Failed to remove exercise from workout",
        }
      );
    }
  },
};

export default workoutsService;
