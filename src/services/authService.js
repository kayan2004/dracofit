import axios from "axios";

// Use environment variable for API URL
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

class AuthService {
  // Login user and store token
  async login(credentials) {
    try {
      console.log("Login credentials:", credentials);
      // Changed from /auth/signin to /auth/login to match backend
      const response = await api.post("/auth/login", credentials);
      console.log("Login response:", response.data);

      // Handle both formats that the backend might send
      if (response.data.accessToken) {
        localStorage.setItem("token", response.data.accessToken);
        console.log("Stored token:", response.data.accessToken);
      } else if (response.data.access_token) {
        localStorage.setItem("token", response.data.access_token);
        console.log("Stored token:", response.data.access_token);
      }

      // Store user info if included in response
      if (response.data.user) {
        localStorage.setItem("user", JSON.stringify(response.data.user));
      }

      return response.data;
    } catch (error) {
      console.error("Login error:", error);
      throw (
        error.response?.data || { message: "Login failed. Please try again." }
      );
    }
  }

  // Register new user
  async register(userData) {
    try {
      // Changed from /auth/signup to /auth/register to match backend
      const response = await api.post("/auth/register", userData);
      return response.data;
    } catch (error) {
      console.error("Registration error:", error);
      throw (
        error.response?.data || {
          message: "Registration failed. Please try again.",
        }
      );
    }
  }

  // Logout user and clear storage
  logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  }

  // Get current logged in user
  getCurrentUser() {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  }

  // Check if user is logged in
  isLoggedIn() {
    return !!localStorage.getItem("token");
  }

  // Request password reset
  async forgotPassword(email) {
    try {
      const response = await api.post("/auth/forgot-password", { email });
      return response.data;
    } catch (error) {
      console.error("Forgot password error:", error);
      throw (
        error.response?.data || { message: "Request failed. Please try again." }
      );
    }
  }

  // Reset password with token
  async resetPassword(token, newPassword) {
    try {
      // Send token as query parameter instead of in request body
      const response = await api.post(`/auth/reset-password?token=${token}`, {
        newPassword: newPassword, // Changed from newPassword to match backend expectation
      });
      return response.data;
    } catch (error) {
      console.error("Reset password error:", error);
      throw (
        error.response?.data || {
          message: "Password reset failed. Please try again.",
        }
      );
    }
  }

  // Verify email with token
  async verifyEmail(token) {
    try {
      const response = await api.get(`/auth/verify-email?token=${token}`);
      return response.data;
    } catch (error) {
      console.error("Email verification error:", error);
      throw (
        error.response?.data || {
          message: "Verification failed. The token may be invalid or expired.",
        }
      );
    }
  }

  // Resend verification email
  async resendVerification(email) {
    try {
      console.log("Resending verification to:", email);
      const response = await api.post("/auth/resend-verification", { email });
      console.log("Resend verification response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Resend verification error:", error);
      throw (
        error.response?.data || {
          message:
            "Failed to resend verification email. Please try again later.",
        }
      );
    }
  }

  // Check if user has completed profile setup
  async hasCompletedProfileSetup() {
    try {
      const token = localStorage.getItem("token");
      if (!token) return false;

      const response = await api.get("/user-details", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return !!response.data;
    } catch (error) {
      // If 404 Not Found, user hasn't completed profile setup
      if (error.response?.status === 404) {
        return false;
      }
      console.error("Error checking profile setup:", error);
      return false;
    }
  }
}

export default new AuthService();
