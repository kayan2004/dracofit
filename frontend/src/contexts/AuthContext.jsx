import React, { createContext, useState, useEffect } from "react";
import authService from "../services/authService"; // Ensure this path is correct

// Create the Auth Context
export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Initialize auth state on app load
  useEffect(() => {
    const initializeAuth = async () => {
      console.log("AuthContext: Initializing authentication...");
      try {
        const token = localStorage.getItem("token");
        if (token) {
          console.log("AuthContext: Token found in localStorage.");
          // Assuming authService.getCurrentUser() might be async (e.g., fetches from API if token is valid)
          // or could be sync (e.g., decodes token or gets from localStorage)
          const userData = await authService.getCurrentUser(); // Await it
          console.log("AuthContext: getCurrentUser response:", userData);

          if (userData && typeof userData.id !== "undefined") {
            console.log(
              "AuthContext: User data and ID found. Setting user and authenticating."
            );
            setCurrentUser(userData);
            setIsAuthenticated(true);
          } else {
            // Token exists but user data is not valid or id is missing
            console.warn(
              "AuthContext: Token found but user data is invalid or missing ID. Logging out."
            );
            authService.logout(); // Clear invalid token/state
            setCurrentUser(null);
            setIsAuthenticated(false);
          }
        } else {
          // No token, user is not authenticated
          console.log(
            "AuthContext: No token found. User is not authenticated."
          );
          setCurrentUser(null);
          setIsAuthenticated(false);
        }
      } catch (err) {
        console.error("AuthContext: Error initializing auth state:", err);
        setError("Failed to restore authentication state");
        // Ensure clean state on error
        setCurrentUser(null);
        setIsAuthenticated(false);
      } finally {
        console.log(
          "AuthContext: Finished initialization. Setting loading to false."
        );
        setLoading(false); // setLoading(false) should be the very last thing
      }
    };

    initializeAuth();
  }, []); // Empty dependency array means this runs once on mount

  // Login function
  const login = async (credentials) => {
    console.log("AuthContext: Attempting login...");
    setLoading(true);
    setError(null);
    try {
      const response = await authService.login(credentials);
      console.log("AuthContext: Login service response:", response);
      // Assuming response.user contains the full user object with id
      if (response.user && typeof response.user.id !== "undefined") {
        console.log(
          "AuthContext: Login successful. Setting user and authenticating."
        );
        setCurrentUser(response.user);
        setIsAuthenticated(true);
      } else {
        // Login succeeded but user object is not as expected
        console.error(
          "AuthContext: Login successful but user data is incomplete.",
          response
        );
        throw new Error("Login successful but user data is incomplete.");
      }

      // This part seems specific, ensure authService.hasCompletedProfileSetup() is correct
      const hasProfile = await authService.hasCompletedProfileSetup();
      console.log("AuthContext: Profile setup status:", hasProfile);
      return {
        ...response,
        hasCompletedProfile: hasProfile,
      };
    } catch (err) {
      console.error("AuthContext: Login failed:", err);
      setError(err.message || "Login failed");
      // Ensure clean state on login failure
      setCurrentUser(null);
      setIsAuthenticated(false);
      throw err;
    } finally {
      console.log(
        "AuthContext: Login attempt finished. Setting loading to false."
      );
      setLoading(false);
    }
  };

  // Register function
  const register = async (userData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authService.register(userData);
      // After registration, the user might not be logged in automatically,
      // or they might be. Adjust state accordingly if needed.
      // For now, just returning response.
      return response;
    } catch (err) {
      setError(err.message || "Registration failed");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    console.log("AuthContext: Logging out.");
    authService.logout(); // This should clear localStorage token
    setCurrentUser(null);
    setIsAuthenticated(false);
    // Potentially redirect or clear other app state if needed
  };

  const verifyEmail = async (token) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authService.verifyEmail(token);
      // If verification implies login or user data update, handle here
      return response;
    } catch (err) {
      setError(err.message || "Email verification failed");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const forgotPassword = async (email) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authService.forgotPassword(email);
      return response;
    } catch (err) {
      setError(err.message || "Password reset request failed");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (token, newPassword) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authService.resetPassword(token, newPassword);
      // If password reset implies login or state change, handle here
      return response;
    } catch (err) {
      setError(err.message || "Password reset failed");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const resendVerification = async (email) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authService.resendVerification(email);
      return response;
    } catch (err) {
      setError(err.message || "Failed to resend verification email");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  const contextValue = {
    currentUser,
    loading,
    error,
    isAuthenticated,
    login,
    register,
    logout,
    verifyEmail,
    forgotPassword,
    resetPassword,
    resendVerification,
    clearError,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};
