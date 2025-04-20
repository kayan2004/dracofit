import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import FormInput from "../components/common/FormInput";
import FormButton from "../components/common/FormButton";
import AuthLayout from "../components/auth/AuthLayout";
import userDetailsService from "../services/userDetailsService";

// Define API URL - Vite uses import.meta.env instead of process.env
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const ProfileSetup = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    gender: "male",
    birthdate: "",
    weight: "",
    height: "",
    fitness_level: "beginner",
    fitness_goal: "maintain",
    workout_days_per_week: 3,
    preferred_workout_types: [],
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleWorkoutTypeChange = (type) => {
    const types = [...formData.preferred_workout_types];
    if (types.includes(type)) {
      const index = types.indexOf(type);
      types.splice(index, 1);
    } else {
      types.push(type);
    }
    setFormData({
      ...formData,
      preferred_workout_types: types,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // Format the data - convert string values to appropriate types
      const dataToSubmit = {
        ...formData,
        weight: parseFloat(formData.weight),
        height: parseFloat(formData.height),
        workout_days_per_week: parseInt(formData.workout_days_per_week),
        // Make sure the date is in ISO format
        birthdate: new Date(formData.birthdate).toISOString().split("T")[0],
      };

      console.log("Submitting user details:", dataToSubmit);

      // Use the userDetailsService instead of direct axios call
      const response = await userDetailsService.createUserDetails(dataToSubmit);

      console.log("Profile details saved successfully:", response);

      // Redirect to home page after successful submission
      navigate("/exercises");
    } catch (err) {
      console.error("Error saving profile details:", err);
      setError(
        err.response?.data?.message ||
          "Failed to save profile details. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      content={{
        title: "Complete Your Profile",
        paragraph:
          "Tell us more about yourself to customize your fitness journey",
      }}
    >
      <form onSubmit={handleSubmit} className="grid gap-4 mt-6">
        {error && (
          <div className="text-goldenrod text-body text-center p-2 rounded-md">
            {error}
          </div>
        )}

        <div className="mb-4">
          <label className="block text-white mb-2">Gender</label>
          <div className="flex gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="gender"
                value="male"
                checked={formData.gender === "male"}
                onChange={handleChange}
                className="mr-2"
              />
              <span className="text-gray-300">Male</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="gender"
                value="female"
                checked={formData.gender === "female"}
                onChange={handleChange}
                className="mr-2"
              />
              <span className="text-gray-300">Female</span>
            </label>
          </div>
        </div>

        <FormInput
          label="Birth Date"
          id="birthdate"
          name="birthdate"
          type="date"
          value={formData.birthdate}
          onChange={handleChange}
          required
        />

        <FormInput
          label="Weight (kg)"
          id="weight"
          name="weight"
          type="number"
          step="0.1"
          value={formData.weight}
          onChange={handleChange}
          required
        />

        <FormInput
          label="Height (cm)"
          id="height"
          name="height"
          type="number"
          step="0.1"
          value={formData.height}
          onChange={handleChange}
          required
        />

        <div className="mb-4">
          <label className="block text-white mb-2">Fitness Level</label>
          <select
            name="fitness_level"
            value={formData.fitness_level}
            onChange={handleChange}
            className="w-full px-4 py-2 bg-midnight-green border border-dark-slate-gray rounded focus:outline-none focus:ring-2 focus:ring-goldenrod"
            required
          >
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-white mb-2">Fitness Goal</label>
          <select
            name="fitness_goal"
            value={formData.fitness_goal}
            onChange={handleChange}
            className="w-full px-4 py-2 bg-midnight-green border border-dark-slate-gray rounded focus:outline-none focus:ring-2 focus:ring-goldenrod"
            required
          >
            <option value="weight_loss">Weight Loss</option>
            <option value="muscle_gain">Muscle Gain</option>
            <option value="maintain">Maintain</option>
            <option value="improve_strength">Improve Strength</option>
            <option value="improve_endurance">Improve Endurance</option>
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-white mb-2">Workout Days Per Week</label>
          <input
            type="range"
            name="workout_days_per_week"
            min="1"
            max="7"
            value={formData.workout_days_per_week}
            onChange={handleChange}
            className="w-full"
          />
          <div className="text-center text-gray-300 mt-1">
            {formData.workout_days_per_week} days
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-white mb-2">
            Preferred Workout Types
          </label>
          <div className="grid grid-cols-2 gap-2">
            {[
              "cardio",
              "strength",
              "flexibility",
              "hiit",
              "yoga",
              "crossfit",
            ].map((type) => (
              <label key={type} className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.preferred_workout_types.includes(type)}
                  onChange={() => handleWorkoutTypeChange(type)}
                  className="mr-2"
                />
                <span className="text-gray-300 capitalize">{type}</span>
              </label>
            ))}
          </div>
        </div>

        <FormButton type="submit" isLoading={isLoading} fullWidth>
          Save Profile
        </FormButton>
      </form>
    </AuthLayout>
  );
};

export default ProfileSetup;
