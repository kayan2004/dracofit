import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import AuthLayout from "../components/auth/AuthLayout";
import FormButton from "../components/common/FormButton";
import { useAuth } from "../hooks/useAuth";
import EmailIcon from "../components/icons/EmailIcon";
import SecondaryButton from "../components/common/SecondaryButton";
const WaitingForVerification = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [resendMessage, setResendMessage] = useState("");
  const [resendError, setResendError] = useState("");

  // Get email from location state if available
  const email = location.state?.email || "";

  // Use the useAuth hook
  const {
    resendVerification,
    loading: isResending,
    error: authError,
  } = useAuth();

  const handleResendVerification = async () => {
    if (!email) {
      setResendError(
        "Email address not available. Please try signing up again."
      );
      return;
    }

    // Clear previous messages
    setResendMessage("");
    setResendError("");

    try {
      // Use resendVerification from useAuth hook
      await resendVerification(email);
      setResendMessage("We've sent a new verification email to:");
    } catch (error) {
      setResendError(
        error.message ||
          "Failed to resend verification email. Please try again later."
      );
    }
  };

  const handleGoToLogin = () => {
    navigate("/login");
  };

  const content = {
    title: "Verify Your Email",
    paragraph: "Check your inbox.",
  };

  const message = resendMessage || "We've sent a verification email to:";

  return (
    <AuthLayout content={content}>
      <div className="mt-8 flex flex-col items-center text-center">
        <EmailIcon />

        <p className="mt-4 text-gray max-w-md text-body">
          {message}
          <br />
          <span className=" text-goldenrod break-all">
            {email || "your email address"}
          </span>
        </p>

        <div className="mt-8  w-full max-w-xs">
          {/* Resend button using the new SecondaryButton component */}
          <div className="grid gap-1">
            <SecondaryButton
              onClick={handleResendVerification}
              disabled={!email}
              isLoading={isResending}
              loadingText="Sending..."
              fullWidth
              styles={"py-3 px-3"}
            >
              Resend Verification Email
            </SecondaryButton>
            {(resendError || authError) && (
              <div className=" text-goldenrod  text-caption">
                {resendError || authError}
              </div>
            )}
          </div>

          {/* Login button */}
          <FormButton onClick={handleGoToLogin} fullWidth>
            Back to Login
          </FormButton>
        </div>
      </div>
    </AuthLayout>
  );
};

export default WaitingForVerification;
