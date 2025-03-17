import React from "react";
import { Link } from "react-router-dom";
import AuthLayout from "../components/auth/AuthLayout";
import LoginForm from "../components/auth/LoginForm";
import AuthSwitch from "../components/auth/AuthSwitch";

const Login = () => {
  return (
    <AuthLayout title="Login">
      <LoginForm />

      <AuthSwitch isLogin={true} />
    </AuthLayout>
  );
};

export default Login;
