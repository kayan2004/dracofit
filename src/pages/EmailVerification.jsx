import React, { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import AuthLayout from "../components/auth/AuthLayout";
import { useAuth } from "../hooks/useAuth";
import VerificationIcon from "../components/icons/VerificationIcon";
import FailedVerificationIcon from "../components/icons/FailedVerificationIcon";
import StatusDisplay from "../components/auth/StatusDisplay";

const EmailVerification = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("verifying"); // verifying, success, error
  const [message, setMessage] = useState("");
  const verificationAttempted = useRef(false);

  // Get token from URL query parameters
  const token = searchParams.get("token");

  // Use the useAuth hook instead of useFetch
  const { verifyEmail, loading, error } = useAuth();

  useEffect(() => {
    // Prevent multiple verification attempts
    if (verificationAttempted.current) return;

    if (!token) {
      setStatus("error");
      setMessage("No verification token found");
      return;
    }

    const handleVerification = async () => {
      // Set the ref to prevent future attempts
      verificationAttempted.current = true;
      setStatus("verifying");

      try {
        // Use verifyEmail from the useAuth hook
        const response = await verifyEmail(token);
        console.log("Verification successful:", response);

        setStatus("success");
        setMessage(
          "Your email has been successfully verified! You can now log in."
        );
      } catch (err) {
        console.error("Verification failed:", err);

        // If the error message indicates the email is already verified, treat as success
        if (err.message && err.message.includes("already verified")) {
          setStatus("success");
          setMessage("Your email has already been verified. You can log in.");
        } else {
          setStatus("error");
          setMessage(
            err.message ||
              "Verification failed. The token may be invalid or expired."
          );
        }
      }
    };

    handleVerification();
  }, [token, verifyEmail]);

  const handleNavigate = () => {
    navigate(status === "success" ? "/login" : "/");
  };

  const content = {
    title:
      status === "verifying"
        ? "Verifying Your Email"
        : status === "success"
        ? "Email Verified"
        : "Verification Failed",

    paragraph:
      status === "verifying"
        ? "Please wait while we confirm your email address..."
        : status === "success"
        ? "Your account is now active and ready to use."
        : "We encountered an issue with your verification link.",
  };

  return (
    <AuthLayout content={content}>
      <div className="mt-8 flex flex-col items-center">
        {status === "verifying" && (
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-goldenrod"></div>
            <p className="mt-4 text-lg text-goldenrod">
              Verifying your email...
            </p>
          </div>
        )}

        {status === "success" && (
          <StatusDisplay
            icon={<VerificationIcon />}
            message={message}
            buttonText="Go to Login"
            onButtonClick={handleNavigate}
            messageClassName="text-body"
            buttonProps={{ styles: "p-4 mt-3" }}
          />
        )}

        {status === "error" && (
          <StatusDisplay
            icon={<FailedVerificationIcon />}
            message={message}
            buttonText="Back to Home"
            onButtonClick={handleNavigate}
            messageClassName="text-body"
            buttonProps={{ styles: "p-4 mt-3" }}
          />
        )}
      </div>
    </AuthLayout>
  );
};

export default EmailVerification;
