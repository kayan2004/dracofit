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

class ExercisesService {
  /**
   * Get all exercises with optional pagination
   * @param {number} page - Page number (default: 1)
   * @param {number} limit - Items per page (default: 10)
   * @returns {Promise} Promise with exercises data
   */
  async getExercises(page = 1, limit = 10) {
    try {
      const response = await api.get(`/exercises?page=${page}&limit=${limit}`);
      console.log("API response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error fetching exercises:", error);
      throw error.response?.data || { message: "Failed to fetch exercises" };
    }
  }

  /**
   * Get exercises with filters and pagination
   * @param {Object} filters - Filter options
   * @param {string} [filters.difficulty] - Exercise difficulty level (beginner, intermediate, advanced)
   * @param {string[]} [filters.targetMuscles] - Target muscle groups
   * @param {string} [filters.equipment] - Equipment used
   * @param {string} [filters.type] - Exercise type
   * @param {number} [page=1] - Page number
   * @param {number} [limit=10] - Number of items per page
   * @returns {Promise} Promise with filtered exercises data
   */
  async getFilteredExercises(filters = {}, page = 1, limit = 20) {
    try {
      // Build query string from filters
      const queryParams = new URLSearchParams();

      // Add difficulty if present
      if (filters.difficulty) {
        queryParams.append("difficulty", filters.difficulty);
      }

      // Add target muscles if present
      if (filters.targetMuscles && filters.targetMuscles.length > 0) {
        // If it's an array, append each value
        filters.targetMuscles.forEach((muscle) => {
          queryParams.append("targetMuscles", muscle);
        });
      }

      // Add equipment if present
      if (filters.equipment) {
        queryParams.append("equipment", filters.equipment);
      }

      // Add type if present
      if (filters.type) {
        queryParams.append("type", filters.type);
      }

      // Add pagination parameters
      queryParams.append("page", page);
      queryParams.append("limit", limit);

      const response = await api.get(
        `/exercises/filter?${queryParams.toString()}`
      );
      console.log("Filtered API response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error fetching filtered exercises:", error);
      throw (
        error.response?.data || {
          message: "Failed to fetch filtered exercises",
        }
      );
    }
  }

  /**
   * Get a single exercise by ID
   * @param {number} id - Exercise ID
   * @returns {Promise} Promise with exercise data
   */
  async getExerciseById(id) {
    try {
      const response = await api.get(`/exercises/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching exercise ${id}:`, error);
      throw error.response?.data || { message: "Failed to fetch exercise" };
    }
  }

  /**
   * Search exercises by term using the filter endpoint
   * @param {string} searchTerm - The search term
   * @param {number} [page=1] - Page number
   * @param {number} [limit=20] - Number of items per page
   * @returns {Promise} Promise with search results
   */
  async searchExercises(searchTerm, page = 1, limit = 20) {
    try {
      // Build query parameters
      const queryParams = new URLSearchParams();
      queryParams.append("searchTerm", searchTerm);
      queryParams.append("page", page);
      queryParams.append("limit", limit);

      const response = await api.get(
        `/exercises/filter?${queryParams.toString()}`
      );
      console.log("Search API response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error searching exercises:", error);
      throw error.response?.data || { message: "Failed to search exercises" };
    }
  }
}

export default new ExercisesService();
