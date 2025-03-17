import React from "react";
import { Link } from "react-router-dom";
import AuthLayout from "../components/auth/AuthLayout";
import SignupForm from "../components/auth/SignupForm";
import AuthSwitch from "../components/auth/AuthSwitch";
const Signup = () => {
  return (
    <AuthLayout title="Create Account">
      <SignupForm />
      <AuthSwitch isLogin={false} />
    </AuthLayout>
  );
};

export default Signup;
