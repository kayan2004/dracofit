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

const exerciseLogsService = {
  /**
   * Create a new exercise log for a workout
   * @param {number} workoutLogId - Workout log ID
   * @param {Object} exerciseLogData - Exercise log data
   * @returns {Promise} Promise with exercise log data
   */
  async createExerciseLog(workoutLogId, exerciseLogData) {
    try {
      console.log(
        `Creating exercise log for workout ${workoutLogId}:`,
        exerciseLogData
      );
      const response = await api.post(
        `/workout-logs/${workoutLogId}/exercises`,
        exerciseLogData
      );
      console.log("Created exercise log:", response.data);
      return response.data;
    } catch (error) {
      console.error(
        `Error creating exercise log for workout ${workoutLogId}:`,
        error
      );
      throw (
        error.response?.data || { message: "Failed to create exercise log" }
      );
    }
  },

  /**
   * Get all exercise logs for a workout
   * @param {number} workoutLogId - Workout log ID
   * @returns {Promise} Promise with exercise logs array
   */
  async getExerciseLogs(workoutLogId) {
    try {
      const response = await api.get(`/workout-logs/${workoutLogId}/exercises`);
      return response.data;
    } catch (error) {
      console.error(
        `Error fetching exercise logs for workout ${workoutLogId}:`,
        error
      );
      throw (
        error.response?.data || { message: "Failed to fetch exercise logs" }
      );
    }
  },

  /**
   * Update an exercise log
   * @param {number} workoutLogId - Workout log ID
   * @param {number} exerciseLogId - Exercise log ID
   * @param {Object} updateData - Update data
   * @returns {Promise} Promise with updated exercise log
   */
  async updateExerciseLog(workoutLogId, exerciseLogId, updateData) {
    try {
      console.log(`Updating exercise log ${exerciseLogId}:`, updateData);
      const response = await api.patch(
        `/workout-logs/${workoutLogId}/exercises/${exerciseLogId}`,
        updateData
      );
      console.log("Updated exercise log:", response.data);
      return response.data;
    } catch (error) {
      console.error(`Error updating exercise log ${exerciseLogId}:`, error);
      throw (
        error.response?.data || { message: "Failed to update exercise log" }
      );
    }
  },

  /**
   * Record a set for an exercise log
   * @param {number} workoutLogId - Workout log ID
   * @param {number} exerciseLogId - Exercise log ID
   * @param {Object} setData - Set data with weight and reps
   * @returns {Promise} Promise with set data
   */
  async addSetToExerciseLog(workoutLogId, exerciseLogId, setData) {
    try {
      console.log(`Adding set to exercise log ${exerciseLogId}:`, setData);
      const response = await api.post(
        `/workout-logs/${workoutLogId}/exercises/${exerciseLogId}/sets`,
        setData
      );
      console.log("Added set:", response.data);
      return response.data;
    } catch (error) {
      console.error(
        `Error adding set to exercise log ${exerciseLogId}:`,
        error
      );
      throw (
        error.response?.data || { message: "Failed to add set to exercise log" }
      );
    }
  },

  /**
   * Delete a set from an exercise log
   * @param {number} workoutLogId - Workout log ID
   * @param {number} exerciseLogId - Exercise log ID
   * @param {number} setId - Set ID to delete
   * @returns {Promise} Promise with operation result
   */
  async deleteSet(workoutLogId, exerciseLogId, setId) {
    try {
      const response = await api.delete(
        `/workout-logs/${workoutLogId}/exercises/${exerciseLogId}/sets/${setId}`
      );
      console.log(`Deleted set ${setId}:`, response.data);
      return response.data;
    } catch (error) {
      console.error(`Error deleting set ${setId}:`, error);
      throw error.response?.data || { message: "Failed to delete set" };
    }
  },

  // --- NEW METHOD ---
  /**
   * Get historical log data for a specific exercise.
   * @param {number} exerciseId - The ID of the exercise.
   * @returns {Promise<Array>} Promise with an array of exercise log history.
   */
  async getExerciseHistory(exerciseId) {
    try {
      console.log(
        `[exerciseLogsService] Fetching history for exercise ID: ${exerciseId}`
      );
      const response = await api.get(
        `/exercise-analytics/history/${exerciseId}`
      );
      console.log(
        `[exerciseLogsService] History for exercise ${exerciseId}:`,
        response.data
      );
      return response.data;
    } catch (error) {
      console.error(
        `[exerciseLogsService] Error fetching history for exercise ${exerciseId}:`,
        error.response?.data || error.message || error
      );
      throw (
        error.response?.data || {
          message: `Failed to fetch history for exercise ${exerciseId}`,
        }
      );
    }
  },
  // --- END NEW METHOD ---
};

export default exerciseLogsService;
