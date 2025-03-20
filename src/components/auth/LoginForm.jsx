import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import FormInput from "../common/FormInput";
import FormButton from "../common/FormButton";
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

const LoginForm = ({ onLogin }) => {
  const navigate = useNavigate();
  // Use the useAuth hook instead of useFetch
  const { login, loading, error, clearError } = useAuth();

  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [errors, setErrors] = useState({});

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

    // Also clear any auth context errors
    if (error) {
      clearError();
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
    console.log("Form submitted");

    if (!validate()) return;

    try {
      console.log("Logging in with:", formData);

      // Use login method from AuthContext instead of fetchData
      const response = await login(formData);
      console.log("Login successful:", response);

      // Token storage is now handled inside the AuthContext

      // // Call the callback function if provided
      // if (onLogin) {
      //   onLogin(response);
      // }

      // Navigate to exercises page - AuthContext already handled token storage
      navigate("/exercises");
    } catch (err) {
      console.error("Login error:", err);
      setErrors({
        ...errors,
        general: err.message || "Invalid username or password",
      });
    }
  };

  return (
    <form className="grid gap-3 my-6" onSubmit={handleSubmit} noValidate>
      {(errors.general || error) && (
        <div className=" text-goldenrod text-body-sm text-center p-2 rounded-md">
          {errors.general || error}
        </div>
      )}

      <div className="grid gap-6">
        <FormInput
          label="Username"
          id="username"
          name="username"
          type="text"
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
      </div>

      <Link
        to="/forgot-password"
        className="text-caption text-start text-gray hover:text-dark-gray"
      >
        Forgot your password?
      </Link>

      <FormButton type="submit" isLoading={loading} fullWidth>
        Sign In
      </FormButton>
    </form>
  );
};

export default LoginForm;
