import React from "react";
import { Link } from "react-router-dom";
import AuthLayout from "../components/auth/AuthLayout";
import LoginForm from "../components/auth/LoginForm";
import AuthSwitch from "../components/auth/AuthSwitch";

const Login = () => {
  const handleLogin = (userData) => {
    console.log("User logged in:", userData);
    // Any additional actions on successful login
  };
  const authContent = {
    title: "Welcome Back !",
    paragraph: "Login to your account",
  };
  return (
    <AuthLayout content={authContent}>
      <LoginForm onLogin={handleLogin} />

      <AuthSwitch isLogin={true} />
    </AuthLayout>
  );
};

export default Login;
