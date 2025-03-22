import React, { createContext, useState, useEffect } from "react";
import authService from "../services/authService";

// Create the Auth Context
export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Initialize auth state on app load
  useEffect(() => {
    const initializeAuth = () => {
      try {
        // Check for existing token and user data
        const token = localStorage.getItem("token");
        if (token) {
          const userData = authService.getCurrentUser();
          setCurrentUser(userData);
          setIsAuthenticated(true);
        }
      } catch (err) {
        console.error("Error initializing auth state:", err);
        setError("Failed to restore authentication state");
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Login function
  const login = async (credentials) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authService.login(credentials);
      setCurrentUser(response.user);
      setIsAuthenticated(true);
      return response;
    } catch (err) {
      setError(err.message || "Login failed");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Register function
  const register = async (userData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authService.register(userData);
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
    authService.logout();
    setCurrentUser(null);
    setIsAuthenticated(false);
  };

  const verifyEmail = async (token) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authService.verifyEmail(token);
      return response;
    } catch (err) {
      setError(err.message || "Email verification failed");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Request password reset
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

  // Reset password
  const resetPassword = async (token, newPassword) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authService.resetPassword(token, newPassword);
      return response;
    } catch (err) {
      setError(err.message || "Password reset failed");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Resend verification email
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

  // Clear any auth errors
  const clearError = () => {
    setError(null);
  };

  // Provide the context value to children
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
