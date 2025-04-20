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

const workoutExercisesService = {
  /**
   * Get all exercises for a specific workout
   * @param {number} workoutId - Workout ID
   * @returns {Promise} Promise with workout exercises
   */
  async getWorkoutExercises(workoutId) {
    try {
      const response = await api.get(`/workout-plans/${workoutId}/exercises`);
      return response.data;
    } catch (error) {
      console.error(
        `Error fetching exercises for workout ${workoutId}:`,
        error
      );
      throw (
        error.response?.data || { message: "Failed to fetch workout exercises" }
      );
    }
  },

  /**
   * Get a specific exercise from a workout
   * @param {number} workoutId - Workout ID
   * @param {number} exerciseId - Exercise ID
   * @returns {Promise} Promise with workout exercise details
   */
  async getWorkoutExercise(workoutId, exerciseId) {
    try {
      const response = await api.get(
        `/workout-plans/${workoutId}/exercises/${exerciseId}`
      );
      return response.data;
    } catch (error) {
      console.error(
        `Error fetching exercise ${exerciseId} from workout ${workoutId}:`,
        error
      );
      throw (
        error.response?.data || { message: "Failed to fetch workout exercise" }
      );
    }
  },

  /**
   * Add an exercise to a workout
   * @param {number} workoutId - Workout ID
   * @param {Object} exerciseData - Exercise data to add
   * @param {number} exerciseData.exerciseId - ID of the exercise to add
   * @param {number} exerciseData.sets - Number of sets
   * @param {number} exerciseData.reps - Number of reps
   * @param {number} exerciseData.restTimeSeconds - Rest time in seconds
   * @param {number} exerciseData.orderIndex - Order in the workout
   * @param {number} [exerciseData.duration] - Optional duration in seconds
   * @returns {Promise} Promise with created workout exercise
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
   * Add multiple exercises to a workout at once
   * @param {number} workoutId - Workout ID
   * @param {Array} exercisesData - Array of exercise data objects
   * @returns {Promise} Promise with the result
   */
  async addExercisesToWorkout(workoutId, exercisesData) {
    try {
      // Create an array of promises for parallel processing
      const addPromises = exercisesData.map((exerciseData) =>
        this.addExerciseToWorkout(workoutId, exerciseData)
      );

      // Execute all promises and wait for all to complete
      const results = await Promise.all(addPromises);
      return results;
    } catch (error) {
      console.error(
        `Error adding multiple exercises to workout ${workoutId}:`,
        error
      );
      throw (
        error.response?.data || {
          message: "Failed to add exercises to workout",
        }
      );
    }
  },

  /**
   * Update an exercise in a workout
   * @param {number} workoutId - Workout ID
   * @param {number} exerciseId - Exercise ID
   * @param {Object} exerciseData - Updated exercise data
   * @returns {Promise} Promise with updated workout exercise
   */
  async updateWorkoutExercise(workoutId, exerciseId, exerciseData) {
    try {
      const response = await api.patch(
        `/workout-plans/${workoutId}/exercises/${exerciseId}`,
        exerciseData
      );
      return response.data;
    } catch (error) {
      console.error(
        `Error updating exercise ${exerciseId} in workout ${workoutId}:`,
        error
      );
      throw (
        error.response?.data || { message: "Failed to update workout exercise" }
      );
    }
  },

  /**
   * Remove an exercise from a workout
   * @param {number} workoutId - Workout ID
   * @param {number} exerciseId - Exercise ID
   * @returns {Promise} Promise with deletion result
   */
  async removeExerciseFromWorkout(workoutId, exerciseId) {
    try {
      const response = await api.delete(
        `/workout-plans/${workoutId}/exercises/${exerciseId}`
      );
      return response.data;
    } catch (error) {
      console.error(
        `Error removing exercise ${exerciseId} from workout ${workoutId}:`,
        error
      );
      throw (
        error.response?.data || {
          message: "Failed to remove exercise from workout",
        }
      );
    }
  },

  /**
   * Reorder exercises in a workout
   * @param {number} workoutId - Workout ID
   * @param {Array<number>} exerciseIds - Array of exercise IDs in their new order
   * @returns {Promise} Promise with result
   */
  async reorderWorkoutExercises(workoutId, exerciseIds) {
    try {
      const response = await api.post(
        `/workout-plans/${workoutId}/exercises/reorder`,
        { exerciseIds }
      );
      return response.data;
    } catch (error) {
      console.error(
        `Error reordering exercises in workout ${workoutId}:`,
        error
      );
      throw (
        error.response?.data || {
          message: "Failed to reorder workout exercises",
        }
      );
    }
  },

  /**
   * Update sets, reps or rest time for an exercise
   * @param {number} workoutId - Workout ID
   * @param {number} exerciseId - Exercise ID
   * @param {Object} updateData - Data to update (sets, reps, restTimeSeconds)
   * @returns {Promise} Promise with updated workout exercise
   */
  async updateExerciseParams(workoutId, exerciseId, updateData) {
    try {
      const response = await api.patch(
        `/workout-plans/${workoutId}/exercises/${exerciseId}`,
        updateData
      );
      return response.data;
    } catch (error) {
      console.error(
        `Error updating exercise parameters in workout ${workoutId}:`,
        error
      );
      throw (
        error.response?.data || {
          message: "Failed to update exercise parameters",
        }
      );
    }
  },
};

export default workoutExercisesService;
