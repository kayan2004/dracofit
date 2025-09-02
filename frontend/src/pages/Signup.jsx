import React from "react";
import { Link } from "react-router-dom";
import AuthLayout from "../components/auth/AuthLayout";
import SignupForm from "../components/auth/SignupForm";
import AuthSwitch from "../components/auth/AuthSwitch";
const Signup = () => {
  const authContent = {
    title: "Register",
    paragraph: "Create a new account",
  };
  return (
    <AuthLayout content={authContent}>
      <SignupForm />
      <AuthSwitch isLogin={false} />
    </AuthLayout>
  );
};

export default Signup;
