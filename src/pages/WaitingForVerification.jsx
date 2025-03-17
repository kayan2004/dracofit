import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import authService from "../services/authService";
import AuthLayout from "../components/auth/AuthLayout";
import FormButton from "../components/common/FormButton";

const WaitingForVerification = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState("");
  const [resendError, setResendError] = useState("");

  // Get email from location state if available
  const email = location.state?.email || "";

  const handleResendVerification = async () => {
    if (!email) {
      setResendError(
        "Email address not available. Please try signing up again."
      );
      return;
    }

    setIsResending(true);
    setResendMessage("");
    setResendError("");

    try {
      await authService.resendVerification(email);
      setResendMessage("Verification email sent! Please check your inbox.");
    } catch (error) {
      setResendError(
        error.message ||
          "Failed to resend verification email. Please try again later."
      );
    } finally {
      setIsResending(false);
    }
  };

  const handleGoToLogin = () => {
    navigate("/login");
  };

  return (
    <AuthLayout title="Verify Your Email">
      <div className="mt-8 flex flex-col items-center text-center">
        <div className="bg-midnight-green rounded-full p-5 mb-6">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-16 w-16 text-goldenrod"
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

        <h2 className="text-2xl font-medium text-goldenrod">
          Check your inbox
        </h2>

        <p className="mt-4 text-gray-400 max-w-md">
          We've sent a verification email to:
          <br />
          <span className="font-semibold text-goldenrod break-all">
            {email || "your email address"}
          </span>
        </p>

        <p className="mt-4 text-gray-400">
          Please click the verification link in the email to activate your
          account.
        </p>

        <div className="mt-8 space-y-4 w-full max-w-xs">
          {/* Resend button */}
          <button
            onClick={handleResendVerification}
            disabled={isResending || !email}
            className="w-full flex items-center justify-center py-2 px-4 border border-goldenrod rounded-md shadow-sm bg-midnight-green text-goldenrod hover:bg-midnight-green-darker focus:outline-none disabled:opacity-50"
          >
            {isResending ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-goldenrod"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Sending...
              </>
            ) : (
              "Resend Verification Email"
            )}
          </button>

          {/* Login button */}
          <FormButton onClick={handleGoToLogin} fullWidth>
            Back to Login
          </FormButton>
        </div>

        {/* Status messages */}
        {resendMessage && (
          <div className="mt-4 p-3 bg-midnight-green-darker border border-medium-aquamarine text-medium-aquamarine rounded-md text-sm">
            {resendMessage}
          </div>
        )}

        {resendError && (
          <div className="mt-4 p-3 bg-midnight-green-darker border border-goldenrod text-goldenrod rounded-md text-sm">
            {resendError}
          </div>
        )}
      </div>
    </AuthLayout>
  );
};

export default WaitingForVerification;
