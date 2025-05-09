import axios from "axios";

// Use environment variable for API URL with fallback
const CHATBOT_API_URL =
  import.meta.env.VITE_CHATBOT_API_URL || "http://localhost:5000";

// Create axios instance with default config
const api = axios.create({
  baseURL: CHATBOT_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // THIS IS CRITICAL for sessions to work
  timeout: 200000, // 30-second timeout for model responses
});

const checkHealth = async () => {
  try {
    const response = await api.get("/health");
    return {
      online: response.data.status === "success",
      details: response.data.data || {},
    };
  } catch (error) {
    console.error("Error checking chatbot health:", error);
    return { online: false, error: error.message };
  }
};

const chatbotService = {
  async sendMessage(message) {
    try {
      const response = await api.post("/chat", { message });

      // Check for success/error status in response
      if (response.data.status === "error") {
        throw new Error(response.data.message || "Unknown error occurred");
      }

      return response.data.response;
    } catch (error) {
      console.error("Error sending message to chatbot:", error);
      throw error;
    }
  },

  checkHealth,
};

export default chatbotService;
