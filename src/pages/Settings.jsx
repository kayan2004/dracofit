import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import userDetailsService from "../services/userDetailsService";

const Settings = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [hasDetails, setHasDetails] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  const [formData, setFormData] = useState({
    gender: "male",
    birthdate: "",
    weight: 70,
    height: 170,
    fitness_level: "beginner",
    fitness_goal: "maintain",
    workout_days_per_week: 3,
    preferred_workout_types: [],
  });

  // Save original data for cancel functionality
  const [originalData, setOriginalData] = useState({});

  // Fetch user details on component mount
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    const fetchUserDetails = async () => {
      try {
        setLoading(true);
        const details = await userDetailsService.getUserDetails();
        if (details) {
          // Format birthdate from yyyy-mm-dd to yyyy-mm-dd
          const formattedBirthdate = details.birthdate
            ? new Date(details.birthdate).toISOString().split("T")[0]
            : "";

          const formattedDetails = {
            gender: details.gender || "male",
            birthdate: formattedBirthdate,
            weight: details.weight || 70,
            height: details.height || 170,
            fitness_level: details.fitness_level || "beginner",
            fitness_goal: details.fitness_goal || "maintain",
            workout_days_per_week: details.workout_days_per_week || 3,
            preferred_workout_types: Array.isArray(
              details.preferred_workout_types
            )
              ? details.preferred_workout_types
              : [],
          };

          setFormData(formattedDetails);
          setOriginalData(formattedDetails);
          setHasDetails(true);
        }
      } catch (err) {
        // If 404, user doesn't have details yet
        if (err.response && err.response.status === 404) {
          setHasDetails(false);
          setIsEditMode(true); // Start in edit mode if no details exist
        } else {
          setError("Failed to load user details. Please try again.");
          console.error("Error loading user details:", err);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserDetails();
  }, [isAuthenticated, navigate]);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === "preferred_workout_types") {
      const workoutType = value;
      setFormData((prev) => {
        if (checked) {
          return {
            ...prev,
            preferred_workout_types: [
              ...prev.preferred_workout_types,
              workoutType,
            ],
          };
        } else {
          return {
            ...prev,
            preferred_workout_types: prev.preferred_workout_types.filter(
              (type) => type !== workoutType
            ),
          };
        }
      });
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSaving(true);

    try {
      // Format data for API
      const apiData = {
        ...formData,
        weight: Number(formData.weight),
        height: Number(formData.height),
        workout_days_per_week: Number(formData.workout_days_per_week),
      };

      let result;
      if (hasDetails) {
        result = await userDetailsService.updateUserDetails(apiData);
      } else {
        result = await userDetailsService.createUserDetails(apiData);
        setHasDetails(true);
      }

      // Update original data after successful save
      setOriginalData({ ...formData });

      setSuccess("Profile saved successfully!");
      setTimeout(() => setSuccess(null), 3000);
      setIsEditMode(false); // Exit edit mode after save
    } catch (err) {
      console.error("Error saving user details:", err);
      setError(
        err.response?.data?.message ||
          "Failed to save profile information. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  // Cancel edit and revert changes
  const handleCancel = () => {
    setFormData({ ...originalData });
    setIsEditMode(false);
    setError(null);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-slate-gray text-white p-6 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-goldenrod"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-slate-gray text-white p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center mb-6">
          <button
            onClick={() => navigate(-1)}
            className="mr-4 text-goldenrod hover:text-dark-goldenrod transition-colors"
          >
            <span className="text-xl">←</span>
          </button>
          <h1 className="text-2xl font-bold text-goldenrod">
            Profile Settings
          </h1>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
          {error && (
            <div className="mb-4 p-3 bg-red-900/30 border border-red-500 text-red-200 rounded-md">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-900/30 border border-green-500 text-green-200 rounded-md">
              {success}
            </div>
          )}

          {!isEditMode ? (
            // Read-only view
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl text-goldenrod">Personal Information</h2>
                <button
                  onClick={() => setIsEditMode(true)}
                  className="px-4 py-2 bg-goldenrod text-midnight-green rounded-lg font-medium hover:bg-dark-goldenrod transition-colors"
                >
                  Edit Profile
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* Username */}
                <div className="mb-4">
                  <h3 className="text-gray-300 font-medium">Username</h3>
                  <p className="text-white mt-1">{user?.username || "N/A"}</p>
                </div>

                {/* Email */}
                <div className="mb-4">
                  <h3 className="text-gray-300 font-medium">Email</h3>
                  <p className="text-white mt-1">{user?.email || "N/A"}</p>
                </div>

                {/* Gender */}
                <div className="mb-4">
                  <h3 className="text-gray-300 font-medium">Gender</h3>
                  <p className="text-white mt-1">
                    {formData.gender === "male" ? "Male" : "Female"}
                  </p>
                </div>

                {/* Birthdate */}
                <div className="mb-4">
                  <h3 className="text-gray-300 font-medium">Date of Birth</h3>
                  <p className="text-white mt-1">
                    {formData.birthdate || "Not provided"}
                  </p>
                </div>

                {/* Weight */}
                <div className="mb-4">
                  <h3 className="text-gray-300 font-medium">Weight</h3>
                  <p className="text-white mt-1">{formData.weight} kg</p>
                </div>

                {/* Height */}
                <div className="mb-4">
                  <h3 className="text-gray-300 font-medium">Height</h3>
                  <p className="text-white mt-1">{formData.height} cm</p>
                </div>
              </div>

              <h2 className="text-xl text-goldenrod mb-3">
                Fitness Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Fitness Level */}
                <div className="mb-4">
                  <h3 className="text-gray-300 font-medium">Fitness Level</h3>
                  <p className="text-white mt-1 capitalize">
                    {formData.fitness_level.replace("_", " ")}
                  </p>
                </div>

                {/* Fitness Goal */}
                <div className="mb-4">
                  <h3 className="text-gray-300 font-medium">Fitness Goal</h3>
                  <p className="text-white mt-1 capitalize">
                    {formData.fitness_goal.replace("_", " ")}
                  </p>
                </div>

                {/* Workout Days */}
                <div className="mb-4">
                  <h3 className="text-gray-300 font-medium">
                    Workout Frequency
                  </h3>
                  <p className="text-white mt-1">
                    {formData.workout_days_per_week}{" "}
                    {formData.workout_days_per_week === 1 ? "day" : "days"} per
                    week
                  </p>
                </div>

                {/* Preferred Workout Types */}
                <div className="mb-4">
                  <h3 className="text-gray-300 font-medium">
                    Preferred Workout Types
                  </h3>
                  {formData.preferred_workout_types &&
                  formData.preferred_workout_types.length > 0 ? (
                    <div className="flex flex-wrap mt-1 gap-1">
                      {formData.preferred_workout_types.map((type) => (
                        <span
                          key={type}
                          className="bg-gray-700 text-white px-2 py-1 rounded text-sm"
                        >
                          {type}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-white mt-1">None selected</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          ) : (
            // Edit form
            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <h2 className="text-xl text-goldenrod mb-3">
                  Personal Information
                </h2>

                {/* Username and Email removed from edit form */}

                {/* Gender */}
                <div className="mb-4">
                  <label className="block text-gray-300 mb-2">Gender</label>
                  <div className="flex space-x-4">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="gender"
                        value="male"
                        checked={formData.gender === "male"}
                        onChange={handleChange}
                        className="mr-2 text-goldenrod focus:ring-goldenrod"
                      />
                      Male
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="gender"
                        value="female"
                        checked={formData.gender === "female"}
                        onChange={handleChange}
                        className="mr-2 text-goldenrod focus:ring-goldenrod"
                      />
                      Female
                    </label>
                  </div>
                </div>

                {/* Birthdate */}
                <div className="mb-4">
                  <label className="block text-gray-300 mb-2">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    name="birthdate"
                    value={formData.birthdate}
                    onChange={handleChange}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Weight */}
                  <div className="mb-4">
                    <label className="block text-gray-300 mb-2">
                      Weight (kg)
                    </label>
                    <input
                      type="number"
                      name="weight"
                      value={formData.weight}
                      onChange={handleChange}
                      min="30"
                      max="300"
                      step="0.1"
                      className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                      required
                    />
                  </div>

                  {/* Height */}
                  <div className="mb-4">
                    <label className="block text-gray-300 mb-2">
                      Height (cm)
                    </label>
                    <input
                      type="number"
                      name="height"
                      value={formData.height}
                      onChange={handleChange}
                      min="100"
                      max="250"
                      className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h2 className="text-xl text-goldenrod mb-3">
                  Fitness Information
                </h2>

                {/* Fitness Level */}
                <div className="mb-4">
                  <label className="block text-gray-300 mb-2">
                    Fitness Level
                  </label>
                  <select
                    name="fitness_level"
                    value={formData.fitness_level}
                    onChange={handleChange}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                    required
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>

                {/* Fitness Goal */}
                <div className="mb-4">
                  <label className="block text-gray-300 mb-2">
                    Fitness Goal
                  </label>
                  <select
                    name="fitness_goal"
                    value={formData.fitness_goal}
                    onChange={handleChange}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                    required
                  >
                    <option value="weight_loss">Weight Loss</option>
                    <option value="muscle_gain">Muscle Gain</option>
                    <option value="maintain">Maintain Current Fitness</option>
                    <option value="improve_strength">Improve Strength</option>
                    <option value="improve_endurance">Improve Endurance</option>
                  </select>
                </div>

                {/* Workout Days */}
                <div className="mb-4">
                  <label className="block text-gray-300 mb-2">
                    Workout Days per Week
                  </label>
                  <input
                    type="range"
                    name="workout_days_per_week"
                    value={formData.workout_days_per_week}
                    onChange={handleChange}
                    min="1"
                    max="7"
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-goldenrod"
                  />
                  <div className="flex justify-between text-xs text-gray-400 px-1 mt-1">
                    {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                      <span
                        key={day}
                        className={
                          formData.workout_days_per_week >= day
                            ? "text-goldenrod"
                            : ""
                        }
                      >
                        {day}
                      </span>
                    ))}
                  </div>
                  <p className="text-center text-goldenrod mt-2">
                    {formData.workout_days_per_week}{" "}
                    {formData.workout_days_per_week === 1 ? "day" : "days"} per
                    week
                  </p>
                </div>

                {/* Workout Types */}
                <div className="mb-4">
                  <label className="block text-gray-300 mb-2">
                    Preferred Workout Types
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      "Strength Training",
                      "Cardio",
                      "HIIT",
                      "Yoga",
                      "Pilates",
                      "Calisthenics",
                      "CrossFit",
                      "Running",
                    ].map((type) => (
                      <label
                        key={type}
                        className="flex items-center cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          name="preferred_workout_types"
                          value={type}
                          checked={formData.preferred_workout_types.includes(
                            type
                          )}
                          onChange={handleChange}
                          className="mr-2 text-goldenrod focus:ring-goldenrod"
                        />
                        {type}
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className={`px-6 py-3 bg-goldenrod text-midnight-green rounded-lg font-bold transition-colors ${
                    saving
                      ? "opacity-75 cursor-not-allowed"
                      : "hover:bg-dark-goldenrod"
                  }`}
                >
                  {saving ? "Saving..." : "Save Profile"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
