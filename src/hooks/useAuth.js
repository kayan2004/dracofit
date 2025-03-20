import { useContext } from "react";
import { AuthContext } from "../contexts/authContext";

/**
 * Custom hook for accessing authentication functionality
 * @returns {Object} Authentication context with the following properties:
 * - currentUser: The currently logged in user or null
 * - isAuthenticated: Boolean indicating if a user is logged in
 * - loading: Boolean indicating if an auth operation is in progress
 * - error: Error message string or null
 * - login: Function to login user with credentials
 * - register: Function to register a new user
 * - logout: Function to logout the current user
 * - verifyEmail: Function to verify email with token
 * - forgotPassword: Function to request a password reset
 * - resetPassword: Function to reset password with token
 * - resendVerification: Function to resend verification email
 * - clearError: Function to clear any auth errors
 */
export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
};
