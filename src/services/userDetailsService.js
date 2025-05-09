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

const API_ENDPOINT = "/user-details";

const createUserDetails = async (detailsData) => {
  try {
    const response = await api.post(API_ENDPOINT, detailsData);
    return response.data;
  } catch (error) {
    console.error(
      "Error creating user details:",
      error.response?.data || error.message
    );
    throw error;
  }
};

const getUserDetails = async () => {
  try {
    const response = await api.get(API_ENDPOINT);
    return response.data;
  } catch (error) {
    console.error(
      "Error fetching user details:",
      error.response?.data || error.message
    );
    throw error;
  }
};

const updateUserDetails = async (detailsData) => {
  try {
    const response = await api.patch(API_ENDPOINT, detailsData);
    return response.data;
  } catch (error) {
    console.error(
      "Error updating user details:",
      error.response?.data || error.message
    );
    throw error;
  }
};

const uploadProfilePicture = async (formData) => {
  try {
    // The endpoint path must match your backend controller exactly
    const response = await api.post(
      `${API_ENDPOINT}/profile-picture`,
      formData,
      {
        headers: {
          // Axios might set this automatically for FormData, but explicitly setting it can sometimes help
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data; // Should return { profilePictureUrl: '...' }
  } catch (error) {
    console.error(
      "Error uploading profile picture:",
      error.response?.data || error.message
    );
    throw error;
  }
};

const userDetailsService = {
  createUserDetails,
  getUserDetails,
  updateUserDetails,
  uploadProfilePicture, // Export the new function
};

export default userDetailsService;
