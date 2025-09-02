import React, { useState } from "react";
import { Link } from "react-router-dom";
import AuthLayout from "../components/auth/AuthLayout";
import FormInput from "../components/common/FormInput";
import FormButton from "../components/common/FormButton";
import { useAuth } from "../hooks/useAuth";
import SecondaryButton from "../components/common/SecondaryButton";
import EmailIcon from "../components/icons/EmailIcon";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [validationError, setValidationError] = useState("");

  // Use the useAuth hook instead of useFetch
  const { forgotPassword, loading: isLoading, error: authError } = useAuth();

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
      // Use forgotPassword from useAuth hook
      await forgotPassword(email);
      setIsSubmitted(true);
    } catch (err) {
      // Error is already handled by the hook
      console.error("Failed to send reset link:", err);
    }
  };

  const content = {
    title: "Reset Password",
    paragraph:
      "Enter your email address and we'll send you a link to reset your password.",
  };

  const submittedContent = {
    title: "Reset Password",
  };
  if (isSubmitted) {
    return (
      <AuthLayout content={submittedContent}>
        <div className="bg-midnight-green p-6 rounded-lg text-center mt-6">
          <div className=" flex justify-center items-center ">
            <EmailIcon styles="text-center" />
          </div>
          <p className="text-gray mb-4">
            We've sent a password reset link to{" "}
            <strong className="text-goldenrod">{email}</strong>
          </p>
          <p className="text-gray-400 mb-6">
            Check your email inbox and follow the instructions to reset your
            password.
          </p>
          {/* <Link
            to="/login"
            className="text-goldenrod hover:text-dark-goldenrod"
          >
            Back to Login
          </Link> */}
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout content={content}>
      <form onSubmit={handleSubmit} className="grid gap-4 mt-6">
        {(validationError || authError) && (
          <div className=" text-goldenrod text-body text-center p-2 rounded-md">
            {validationError || authError}
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

        {/* <SecondaryButton styles="text-center mt-4 p-3">
          <Link
            to="/login"
            className="text-goldenrod hover:text-dark-goldenrod"
          >
            Back to Login
          </Link>
        </SecondaryButton> */}
      </form>
    </AuthLayout>
  );
};

export default ForgotPassword;
