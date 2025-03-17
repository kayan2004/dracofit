import React, { useState } from "react";
import FormInput from "../common/FormInput";
import FormButton from "../common/FormButton";
import authService from "../../services/authService";
import { Link } from "react-router-dom";
// import ForgotPasswordLink from "./ForgotPasswordLink";

const LoginForm = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    // Clear error when user starts typing again
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: "",
      });
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.username) {
      newErrors.username = "Username is required";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    setIsLoading(true);
    try {
      // Use the auth service to log in
      const response = await authService.login(formData);

      // Call the callback function if provided
      if (onLogin) {
        onLogin(response);
      }
    } catch (error) {
      setErrors({
        ...errors,
        general: error.message || "Invalid username or password",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form className="grid gap-6 mt-8" onSubmit={handleSubmit} noValidate>
      {errors.general && (
        <div className="text-red-950 text-md text-center">{errors.general}</div>
      )}
      <FormInput
        label="Username"
        id="username"
        name="username"
        type="username"
        value={formData.username}
        onChange={handleChange}
        error={errors.username}
        required
      />
      <FormInput
        label="Password"
        id="password"
        name="password"
        type="password"
        style={{ letterSpacing: "0.25em" }}
        value={formData.password}
        onChange={handleChange}
        error={errors.password}
        required
      />

      <Link
        to="/forgot-password"
        className="text-xs text-start text-gray-400 hover:text-gray-500 font-medium"
      >
        Forgot your password?
      </Link>

      <FormButton type="submit" isLoading={isLoading} fullWidth>
        Sign In
      </FormButton>
    </form>
  );
};

export default LoginForm;
