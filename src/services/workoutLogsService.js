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

/**
 * Service for managing workout logs
 */
const workoutLogsService = {
  /**
   * Start a new workout log
   * @param {Object} workoutData - Data for the new workout
   * @param {number} workoutData.workoutPlanId - ID of the workout plan
   * @returns {Promise} Promise with workout log data
   */
  async startWorkout(workoutData) {
    try {
      console.log("Starting workout with data:", workoutData);

      // Send workoutPlanId, backend will set initial startTime and endTime
      const requestData = {
        workoutPlanId: parseInt(workoutData.workoutPlanId),
        // Backend should handle setting startTime and endTime initially
      };

      const response = await api.post("/workout-logs", requestData);
      console.log("Workout started:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error starting workout:", error);
      if (error.response) {
        console.error("Server response:", error.response.data);
      }
      throw error.response?.data || { message: "Failed to start workout" };
    }
  },

  /**
   * Complete a workout by updating its end time and potentially start time based on duration
   * @param {number} workoutLogId - ID of the workout log to complete
   * @param {Object} data - Data for the completed workout
   * @param {number} data.durationMinutes - Final duration in minutes (used to calculate startTime)
   * @returns {Promise} Promise with updated workout log data
   */
  async completeWorkout(workoutLogId, data) {
    try {
      console.log(`Completing workout ${workoutLogId} with data:`, data);

      // Current time will be the end time
      const endTime = new Date();

      let requestData = {
        endTime: endTime.toISOString(), // Always set the end time
      };

      // If durationMinutes is provided, send it so the backend can calculate startTime
      if (data.durationMinutes !== undefined) {
        requestData.durationMinutes = parseInt(data.durationMinutes);
      }

      console.log("Sending request to complete workout:", requestData);
      // Use the generic update method or a specific complete endpoint if available
      const response = await api.patch(
        `/workout-logs/${workoutLogId}`,
        requestData
      );
      console.log("Workout completed:", response.data);
      return response.data;
    } catch (error) {
      console.error(`Error completing workout ${workoutLogId}:`, error);
      if (error.response) {
        console.error("Server response:", error.response.data);
      }
      throw error.response?.data || { message: "Failed to complete workout" };
    }
  },

  /**
   * Abandon a workout by deleting the workout log
   * @param {number} workoutLogId - ID of the workout log to abandon
   * @returns {Promise} Promise with deletion result
   */
  async abandonWorkout(workoutLogId) {
    try {
      console.log(`Abandoning workout ${workoutLogId}`);

      // Delete the log entirely when abandoning
      const response = await api.delete(`/workout-logs/${workoutLogId}`);
      console.log("Workout abandoned (deleted):", response.data);
      // Return a success indicator or the response data if needed
      return { success: true, data: response.data };
    } catch (error) {
      console.error(`Error abandoning workout ${workoutLogId}:`, error);
      if (error.response) {
        console.error("Server response:", error.response.data);
      }
      throw error.response?.data || { message: "Failed to abandon workout" };
    }
  },

  /**
   * Get a specific workout log by ID
   * @param {number} id - Workout log ID
   * @returns {Promise} Promise with workout log data
   */
  async getWorkoutLog(id) {
    try {
      const response = await api.get(`/workout-logs/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching workout log ${id}:`, error);
      throw error.response?.data || { message: "Failed to fetch workout log" };
    }
  },

  /**
   * Get all workout logs
   * @returns {Promise} Promise with array of workout logs
   */
  async getWorkoutLogs() {
    try {
      const response = await api.get("/workout-logs");
      return response.data;
    } catch (error) {
      console.error("Error fetching workout logs:", error);
      throw error.response?.data || { message: "Failed to fetch workout logs" };
    }
  },

  /**
   * Get workout logs within a specific date range, optionally for a specific plan.
   * @param {Object} params - Query parameters
   * @param {string} params.startDate - ISO string for start date/time
   * @param {string} params.endDate - ISO string for end date/time
   * @param {number} [params.workoutPlanId] - Optional workout plan ID
   * @returns {Promise<Array>} Promise with an array of workout logs
   */
  async getLogsByDateRange(params) {
    try {
      const queryString = new URLSearchParams({
        startDate: params.startDate,
        endDate: params.endDate,
      });
      if (params.workoutPlanId !== undefined) {
        queryString.append("workoutPlanId", params.workoutPlanId);
      }

      console.log(
        `Fetching logs by date: /workout-logs/by-date?${queryString.toString()}`
      );
      const response = await api.get(
        `/workout-logs/by-date?${queryString.toString()}`
      );
      console.log("Logs received:", response.data);
      return response.data; // Should be an array of logs
    } catch (error) {
      console.error("Error fetching workout logs by date range:", error);
      throw (
        error.response?.data || {
          message: "Failed to fetch workout logs by date",
        }
      );
    }
  },

  /**
   * Update a workout log
   * @param {number} id - Workout log ID
   * @param {Object} updateData - Data to update
   * @param {Date | string} [updateData.startTime] - Updated start time
   * @param {Date | string} [updateData.endTime] - Updated end time
   * @param {number} [updateData.durationMinutes] - Duration in minutes (used by backend to calculate startTime)
   * @returns {Promise} Promise with updated workout log
   */
  async updateWorkoutLog(id, updateData) {
    try {
      console.log(`Updating workout log ${id} with data:`, updateData);

      // Prepare data, ensuring dates are ISO strings if they are Date objects
      const requestData = {};
      if (updateData.startTime) {
        requestData.startTime =
          updateData.startTime instanceof Date
            ? updateData.startTime.toISOString()
            : updateData.startTime;
      }
      if (updateData.endTime) {
        requestData.endTime =
          updateData.endTime instanceof Date
            ? updateData.endTime.toISOString()
            : updateData.endTime;
      }
      if (updateData.durationMinutes !== undefined) {
        requestData.durationMinutes = parseInt(updateData.durationMinutes);
      }
      // Add any other fields that might be updatable, e.g., xpEarned
      if (updateData.xpEarned !== undefined) {
        requestData.xpEarned = parseInt(updateData.xpEarned);
      }

      const response = await api.patch(`/workout-logs/${id}`, requestData);
      console.log("Workout log updated:", response.data);
      return response.data;
    } catch (error) {
      console.error(`Error updating workout log ${id}:`, error);
      if (error.response) {
        console.error("Server response:", error.response.data);
      }
      throw error.response?.data || { message: "Failed to update workout log" };
    }
  },
};

export default workoutLogsService;
