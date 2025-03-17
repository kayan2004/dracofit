import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import AuthLayout from "../components/auth/AuthLayout";
import FormInput from "../components/common/FormInput";
import FormButton from "../components/common/FormButton";
import authService from "../services/authService";

const ResetPassword = () => {
  // Extract token from query parameters
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const token = queryParams.get("token");

  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Check if token exists
  useEffect(() => {
    console.log("URL query parameters:", location.search);
    console.log("Token from query:", token);

    if (!token) {
      console.warn("No reset token found, redirecting to forgot password");
      navigate("/forgot-password");
    }
  }, [token, navigate, location]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    // Clear error when typing
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: "",
      });
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords don't match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    setIsLoading(true);

    try {
      // Log the request details for debugging
      console.log("Reset password request details:", {
        token: token,
        passwordLength: formData.password.length,
      });

      // Match the parameter name with what your API expects
      await authService.resetPassword(token, formData.password);
      console.log("Password reset successful!");
      setIsSubmitted(true);
    } catch (error) {
      console.error("Password reset failed:", error);
      setErrors({
        ...errors,
        general: error.message || "Password reset failed. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <AuthLayout title="Password Reset Successful">
        <div className="bg-midnight-green p-6 rounded-lg text-center">
          <div className="mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-16 w-16 mx-auto text-goldenrod"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <p className="text-goldenrod mb-4">
            Your password has been successfully reset.
          </p>
          <p className="text-gray-400 mb-6">
            You can now log in with your new password.
          </p>
          <Link
            to="/login"
            className="text-goldenrod hover:text-dark-goldenrod"
          >
            Go to Login
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Create New Password">
      <p className="text-gray-400 mb-6 text-center">
        Enter your new password below.
      </p>

      <form onSubmit={handleSubmit} className="grid gap-4">
        {errors.general && (
          <div className="bg-customDarkGold/20 border border-customGold text-goldenrod text-md text-center p-2 rounded-md">
            {errors.general}
          </div>
        )}

        <FormInput
          label="New Password"
          id="password"
          name="password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          error={errors.password}
          required
        />

        <FormInput
          label="Confirm Password"
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          value={formData.confirmPassword}
          onChange={handleChange}
          error={errors.confirmPassword}
          required
        />

        <FormButton type="submit" isLoading={isLoading} fullWidth>
          Reset Password
        </FormButton>

        <div className="text-center mt-4">
          <Link
            to="/login"
            className="text-goldenrod hover:text-dark-goldenrod"
          >
            Back to Login
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
};

export default ResetPassword;
