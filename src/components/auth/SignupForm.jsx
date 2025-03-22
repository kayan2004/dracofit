import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import FormInput from "../common/FormInput";
import FormButton from "../common/FormButton";
import { useAuth } from "../../hooks/useAuth";

const SignupForm = ({ onSignup }) => {
  const navigate = useNavigate();

  // Use useAuth hook for authentication
  const { register, loading: isLoading, error: authError } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    username: "",
    firstName: "",
    lastName: "",
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    // Clear error when user starts typing again
    if (errors[name] || errors.general) {
      const updatedErrors = { ...errors };
      delete updatedErrors[name];
      delete updatedErrors.general;
      setErrors(updatedErrors);
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (!formData.username) {
      newErrors.username = "Username is required";
    }

    if (!formData.firstName) {
      newErrors.firstName = "First name is required";
    }

    if (!formData.lastName) {
      newErrors.lastName = "Last name is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    // Create a copy of formData without confirmPassword
    const { confirmPassword, ...registrationData } = formData;

    try {
      console.log("Registering with data:", registrationData);

      // Use register method from useAuth
      const response = await register(registrationData);
      console.log("Registration successful:", response);

      // Navigate to waiting verification page with the email
      navigate("/waiting-verification", { state: { email: formData.email } });

      // Call the callback function if provided
      if (onSignup) {
        onSignup(response);
      }
    } catch (err) {
      console.error("Registration error:", err);
      setErrors({
        ...errors,
        general: err.message || "Registration failed",
      });
    }
  };

  return (
    <form className="my-6 grid text- gap-6" onSubmit={handleSubmit}>
      {(errors.general || authError) && (
        <div className="text-goldenrod text-body text-center p-2 rounded-md">
          {errors.general || authError}
        </div>
      )}

      <FormInput
        label="First Name"
        id="firstName"
        name="firstName"
        value={formData.firstName}
        onChange={handleChange}
        error={errors.firstName}
        required
      />

      <FormInput
        label="Last Name"
        id="lastName"
        name="lastName"
        value={formData.lastName}
        onChange={handleChange}
        error={errors.lastName}
        required
      />

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
        label="Email Address"
        id="email"
        name="email"
        type="email"
        value={formData.email}
        onChange={handleChange}
        error={errors.email}
        required
      />

      <FormInput
        label="Password"
        id="password"
        name="password"
        type="password"
        value={formData.password}
        onChange={handleChange}
        error={errors.password}
        style={{ letterSpacing: "0.25em" }}
        required
      />

      <FormInput
        label="Confirm Password"
        id="confirmPassword"
        name="confirmPassword"
        type="password"
        value={formData.confirmPassword}
        onChange={handleChange}
        style={{ letterSpacing: "0.25em" }}
        error={errors.confirmPassword}
        required
      />

      <FormButton type="submit" isLoading={isLoading} fullWidth>
        Sign Up
      </FormButton>
    </form>
  );
};

export default SignupForm;
