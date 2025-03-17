import React, { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import authService from "../services/authService";
import AuthLayout from "../components/auth/AuthLayout";
import FormButton from "../components/common/FormButton";

const EmailVerification = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("verifying"); // verifying, success, error
  const [message, setMessage] = useState("");
  const verificationAttempted = useRef(false);

  useEffect(() => {
    // Prevent multiple verification attempts
    if (verificationAttempted.current) return;

    const token = searchParams.get("token");

    if (!token) {
      setStatus("error");
      setMessage("No verification token found");
      return;
    }

    const verifyEmail = async () => {
      // Set the ref to prevent future attempts
      verificationAttempted.current = true;

      try {
        const response = await authService.verifyEmail(token);
        console.log("Verification successful:", response);

        setStatus("success");
        setMessage(
          "Your email has been successfully verified! You can now log in."
        );
      } catch (error) {
        console.error("Verification failed:", error);

        // If the error indicates the email is already verified, treat as success
        if (
          error.response?.status === 400 &&
          error.response?.data?.message?.includes("already verified")
        ) {
          setStatus("success");
          setMessage("Your email has already been verified. You can log in.");
        } else {
          setStatus("error");
          setMessage(
            error.response?.data?.message ||
              "Verification failed. The token may be invalid or expired."
          );
        }
      }
    };

    verifyEmail();
  }, []); // Empty dependency array with useRef prevents multiple verification attempts

  const handleNavigate = () => {
    navigate(status === "success" ? "/login" : "/");
  };

  return (
    <AuthLayout title="Email Verification">
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
          <div className="flex flex-col items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-16 w-16 text-medium-aquamarine"
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
            <p className="mt-4 text-lg text-center text-goldenrod">{message}</p>
            <FormButton onClick={handleNavigate} className="mt-6" fullWidth>
              Go to Login
            </FormButton>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center">
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
                d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="mt-4 text-lg text-center text-goldenrod">{message}</p>
            <FormButton onClick={handleNavigate} className="mt-6" fullWidth>
              Back to Home
            </FormButton>
          </div>
        )}
      </div>
    </AuthLayout>
  );
};

export default EmailVerification;
