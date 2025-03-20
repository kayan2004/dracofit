import React, { useState } from "react";
import { Link } from "react-router-dom";
import AuthLayout from "../components/auth/AuthLayout";
import FormInput from "../components/common/FormInput";
import FormButton from "../components/common/FormButton";
import { useFetch } from "../hooks/useFetch";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [validationError, setValidationError] = useState("");

  // Use the useFetch hook for password reset request
  const {
    fetchData,
    loading: isLoading,
    error,
  } = useFetch("/auth/forgot-password", {
    method: "POST",
    immediate: false, // Don't fetch on component mount
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Form validation
    if (!email) {
      setValidationError("Email is required");
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setValidationError("Please enter a valid email address");
      return;
    }

    setValidationError("");

    try {
      // Use fetchData from useFetch hook
      await fetchData({ email });
      setIsSubmitted(true);
    } catch (err) {
      // Error is already handled by the hook
      console.error("Failed to send reset link:", err);
    }
  };

  if (isSubmitted) {
    return (
      <AuthLayout title="Check Your Email">
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
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <p className="text-goldenrod mb-4">
            We've sent a password reset link to <strong>{email}</strong>
          </p>
          <p className="text-gray-400 mb-6">
            Check your email inbox and follow the instructions to reset your
            password.
          </p>
          <Link
            to="/login"
            className="text-goldenrod hover:text-dark-goldenrod"
          >
            Back to Login
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Reset Password">
      <p className="text-gray-400 mb-6 text-center">
        Enter your email address and we'll send you a link to reset your
        password.
      </p>

      <form onSubmit={handleSubmit} className="grid gap-4">
        {(validationError || error) && (
          <div className="bg-customDarkGold/20 border border-customGold text-goldenrod text-md text-center p-2 rounded-md">
            {validationError || error}
          </div>
        )}

        <FormInput
          label="Email Address"
          id="email"
          name="email"
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setValidationError("");
          }}
          required
        />

        <FormButton type="submit" isLoading={isLoading} fullWidth>
          Send Reset Link
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

export default ForgotPassword;
