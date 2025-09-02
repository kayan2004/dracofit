import api from "./api";

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

  /**
   * Fetches the profile of the currently authenticated user using the stored token.
   * Assumes an endpoint like GET /auth/profile or GET /users/me exists on the backend.
   * @returns {Promise<object>} The user profile data.
   */
  async getProfile() {
    try {
      // Use the imported 'api' instance. The interceptor will add the token.
      // Adjust the endpoint '/auth/profile' if your backend uses a different one (e.g., '/users/me')
      const response = await api.get("/auth/profile");
      console.log("Fetched profile:", response.data);
      return response.data;
    } catch (error) {
      console.error(
        "Error fetching user profile:",
        error.response?.data || error.message
      );
      // Don't necessarily throw here, let the caller handle it (e.g., logout if 401)
      throw error; // Re-throw the error so the AuthContext can catch it
    }
  }
}

export default new AuthService();
