import axios from "axios"; // Import axios

// --- Add API_URL definition ---
// Use environment variable for API URL with fallback (should point to NestJS backend)
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

// --- Create local axios instance ---
// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// --- Add interceptors ---
// Add auth token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token"); // Assuming token is stored in localStorage
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Optional: Add response interceptor for error handling (like 401 Unauthorized)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Example: Handle authorization errors globally for this service
    if (error.response && error.response.status === 401) {
      console.error("Unauthorized access in interactionApi. Redirecting...");
      // Consider more robust redirect logic, maybe using React Router's navigate
      localStorage.removeItem("token");
      localStorage.removeItem("user"); // Clear user data as well
      // Avoid direct window.location.href in SPA if possible, but use as fallback
      window.location.href = "/login";
    }
    // Important: Return the rejected promise so component-level catch blocks still work
    return Promise.reject(error);
  }
);
// --- End Add interceptors ---

/**
 * Saves a chatbot interaction (question and answer) to the database.
 * @param {string} question - The user's question.
 * @param {string} answer - The bot's answer.
 * @returns {Promise<object>} The saved interaction data.
 */
const saveInteraction = async (question, answer) => {
  try {
    // --- Use the local 'api' instance ---
    const response = await api.post("/chatbot-interactions", {
      question,
      answer,
    });
    console.log("Interaction saved:", response.data); // Optional: for debugging
    return response.data;
  } catch (error) {
    // Error logging is now partially handled by the interceptor, but keep specific logging if needed
    console.error(
      "Error saving chatbot interaction (in function):", // Clarify log source
      error.response?.data || error.message
    );
    throw error; // Re-throw to allow component-level handling
  }
};

/**
 * Fetches the chat history for the logged-in user from the database.
 * @returns {Promise<Array<object>>} An array of interaction objects.
 */
const getChatHistory = async () => {
  try {
    // --- Use the local 'api' instance ---
    const response = await api.get("/chatbot-interactions/history");
    return response.data; // Returns array of ChatbotInteraction objects
  } catch (error) {
    // Error logging is now partially handled by the interceptor
    console.error(
      "Failed to fetch chat history (in function):", // Clarify log source
      error.response?.data || error.message
    );
    throw error; // Re-throw to allow component-level handling
  }
};

const interactionApi = {
  saveInteraction,
  getChatHistory,
};

export default interactionApi;
