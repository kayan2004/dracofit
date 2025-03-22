import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import workoutsService from "../../services/workoutsService";
import exercisesService from "../../services/exercisesService";

const WorkoutForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const isEditMode = !!id;
  const exerciseSelectRef = useRef(null);

  // Form state
  const [workout, setWorkout] = useState({
    name: "",
    description: "",
    type: "strength",
    durationMinutes: 30,
    isPublic: false,
    status: "ACTIVE",
  });

  const [workoutExercises, setWorkoutExercises] = useState([]);
  const [availableExercises, setAvailableExercises] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState(null);
  const [exerciseSearchTerm, setExerciseSearchTerm] = useState("");
  const [filteredExercises, setFilteredExercises] = useState([]);
  const [selectedExerciseId, setSelectedExerciseId] = useState("");
  const [currentExerciseInfo, setCurrentExerciseInfo] = useState({
    sets: 3,
    reps: 10,
    restTimeSeconds: 60,
  });

  // New state for exercise selection modal/panel
  const [isAddingExercise, setIsAddingExercise] = useState(false);

  // Define workout types
  const workoutTypes = [
    { value: "strength", label: "Strength" },
    { value: "cardio", label: "Cardio" },
    { value: "hiit", label: "HIIT" },
    { value: "flexibility", label: "Flexibility" },
    { value: "hybrid", label: "Hybrid" },
  ];

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/login", {
        state: {
          from: `/workouts/${isEditMode ? "edit/" + id : "create"}`,
          message: `Please log in to ${
            isEditMode ? "edit" : "create"
          } workouts`,
        },
      });
    }
  }, [isAuthenticated, authLoading, navigate, id, isEditMode]);

  // Load workout data for edit mode
  useEffect(() => {
    const fetchWorkout = async () => {
      if (!isEditMode || !isAuthenticated) return;

      try {
        setLoading(true);
        const workoutData = await workoutsService.getWorkoutById(id);

        // Check if the user is the owner of the workout
        if (workoutData.userId !== user?.id) {
          setError("You don't have permission to edit this workout");
          navigate("/workouts");
          return;
        }

        setWorkout({
          name: workoutData.name || "",
          description: workoutData.description || "",
          type: workoutData.type || "strength",
          durationMinutes: workoutData.durationMinutes || 30,
          isPublic: workoutData.isPublic || false,
          status: workoutData.status || "ACTIVE",
        });

        // Sort exercises by orderIndex
        const sortedExercises = [...(workoutData.workoutExercises || [])].sort(
          (a, b) => a.orderIndex - b.orderIndex
        );

        setWorkoutExercises(sortedExercises);
      } catch (err) {
        console.error("Error fetching workout:", err);
        setError(err.message || "Failed to load workout");
      } finally {
        setLoading(false);
      }
    };

    fetchWorkout();
  }, [id, isEditMode, isAuthenticated, user, navigate]);

  // Load available exercises only when adding exercise is clicked
  useEffect(() => {
    const fetchExercises = async () => {
      if (!isAddingExercise) return;

      try {
        setLoading(true);
        const response = await exercisesService.getExercises(1, 100);

        // Handle different possible response formats
        let exercises = [];
        if (Array.isArray(response)) {
          exercises = response;
        } else if (response.exercises && Array.isArray(response.exercises)) {
          exercises = response.exercises;
        } else if (response.data && Array.isArray(response.data)) {
          exercises = response.data;
        }

        setAvailableExercises(exercises);
        setFilteredExercises(exercises);
      } catch (err) {
        console.error("Error fetching exercises:", err);
        setError(err.message || "Failed to load exercises");
      } finally {
        setLoading(false);
      }
    };

    fetchExercises();
  }, [isAddingExercise]);

  // Focus on search input when exercise panel is opened
  useEffect(() => {
    if (isAddingExercise && exerciseSelectRef.current) {
      setTimeout(() => {
        exerciseSelectRef.current.focus();
      }, 100);
    }
  }, [isAddingExercise]);

  // Filter exercises when search term changes
  useEffect(() => {
    if (!exerciseSearchTerm.trim()) {
      setFilteredExercises(availableExercises);
      return;
    }

    const filtered = availableExercises.filter(
      (exercise) =>
        exercise.name
          .toLowerCase()
          .includes(exerciseSearchTerm.toLowerCase()) ||
        (exercise.targetMuscles &&
          exercise.targetMuscles.some((muscle) =>
            muscle.toLowerCase().includes(exerciseSearchTerm.toLowerCase())
          ))
    );

    setFilteredExercises(filtered);
  }, [exerciseSearchTerm, availableExercises]);

  // Handle basic input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setWorkout((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Handle exercise selection
  const handleExerciseSelect = (e) => {
    setSelectedExerciseId(e.target.value);
  };

  // Handle exercise info input
  const handleExerciseInfoChange = (e) => {
    const { name, value } = e.target;
    setCurrentExerciseInfo((prev) => ({
      ...prev,
      [name]: parseInt(value, 10) || 0,
    }));
  };

  // Toggle exercise adding panel
  const toggleAddExercise = () => {
    setIsAddingExercise(!isAddingExercise);
    if (!isAddingExercise) {
      // Reset when opening
      setExerciseSearchTerm("");
      setSelectedExerciseId("");
    }
  };

  // Cancel adding exercise
  const cancelAddExercise = () => {
    setIsAddingExercise(false);
    setExerciseSearchTerm("");
    setSelectedExerciseId("");
    setCurrentExerciseInfo({
      sets: 3,
      reps: 10,
      restTimeSeconds: 60,
    });
  };

  // Add exercise to workout
  const handleAddExercise = () => {
    if (!selectedExerciseId) return;

    const selectedExercise = availableExercises.find(
      (ex) =>
        ex.id === parseInt(selectedExerciseId, 10) ||
        ex.id === selectedExerciseId
    );

    if (!selectedExercise) return;

    const newExercise = {
      id: Date.now(), // Temporary ID for the UI
      exerciseId: selectedExercise.id,
      workoutPlanId: id, // Only relevant for edit mode
      exercise: selectedExercise,
      sets: currentExerciseInfo.sets,
      reps: currentExerciseInfo.reps,
      restTimeSeconds: currentExerciseInfo.restTimeSeconds,
      orderIndex: workoutExercises.length + 1,
    };

    setWorkoutExercises((prev) => [...prev, newExercise]);

    // Reset selection and info
    setSelectedExerciseId("");
    setCurrentExerciseInfo({
      sets: 3,
      reps: 10,
      restTimeSeconds: 60,
    });

    // Close the exercise panel
    setIsAddingExercise(false);
  };

  // Remove exercise from workout
  const handleRemoveExercise = async (exerciseIndex) => {
    const exerciseToRemove = workoutExercises[exerciseIndex];

    // If in edit mode and the exercise has a real ID, remove it from the server
    if (
      isEditMode &&
      exerciseToRemove.id &&
      !exerciseToRemove.id.toString().includes(".")
    ) {
      try {
        await workoutsService.removeExerciseFromWorkout(
          id,
          exerciseToRemove.id
        );
      } catch (err) {
        console.error("Error removing exercise:", err);
        setError(err.message || "Failed to remove exercise from workout");
        return;
      }
    }

    // Remove from state and update order indices
    setWorkoutExercises((prev) => {
      const updated = prev.filter((_, index) => index !== exerciseIndex);
      // Update order indices
      return updated.map((ex, index) => ({
        ...ex,
        orderIndex: index + 1,
      }));
    });
  };

  // Handle exercise reordering (move up)
  const handleMoveExerciseUp = (index) => {
    if (index === 0) return;

    setWorkoutExercises((prev) => {
      const updated = [...prev];
      const temp = updated[index];
      updated[index] = updated[index - 1];
      updated[index - 1] = temp;

      // Update order indices
      return updated.map((ex, idx) => ({
        ...ex,
        orderIndex: idx + 1,
      }));
    });
  };

  // Handle exercise reordering (move down)
  const handleMoveExerciseDown = (index) => {
    if (index === workoutExercises.length - 1) return;

    setWorkoutExercises((prev) => {
      const updated = [...prev];
      const temp = updated[index];
      updated[index] = updated[index + 1];
      updated[index + 1] = temp;

      // Update order indices
      return updated.map((ex, idx) => ({
        ...ex,
        orderIndex: idx + 1,
      }));
    });
  };

  // Form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form
    if (!workout.name.trim()) {
      setError("Workout name is required");
      return;
    }

    if (workoutExercises.length === 0) {
      setError("Add at least one exercise to your workout");
      return;
    }

    try {
      setSubmitLoading(true);
      setError(null);

      let workoutId = id;

      // Create or update the workout
      if (isEditMode) {
        await workoutsService.updateWorkout(id, workout);
      } else {
        const newWorkout = await workoutsService.createWorkout(workout);
        workoutId = newWorkout.id;
      }

      // Add exercises (for new workout or new exercises in edit mode)
      if (!isEditMode) {
        // For new workout, add all exercises
        for (const exercise of workoutExercises) {
          const exerciseData = {
            exerciseId: exercise.exerciseId,
            sets: exercise.sets,
            reps: exercise.reps,
            restTimeSeconds: exercise.restTimeSeconds,
            orderIndex: exercise.orderIndex,
          };

          await workoutsService.addExerciseToWorkout(workoutId, exerciseData);
        }
      } else {
        // For edit mode, only add exercises that don't have a server ID yet
        for (const exercise of workoutExercises) {
          // Check if it's a temporary ID (client-side only)
          if (exercise.id && exercise.id.toString().includes(".")) {
            const exerciseData = {
              exerciseId: exercise.exerciseId,
              sets: exercise.sets,
              reps: exercise.reps,
              restTimeSeconds: exercise.restTimeSeconds,
              orderIndex: exercise.orderIndex,
            };

            await workoutsService.addExerciseToWorkout(workoutId, exerciseData);
          }
        }
      }

      // Navigate back to workouts list with success message
      navigate(`/workouts/${workoutId}`);
    } catch (err) {
      console.error("Error saving workout:", err);
      setError(
        err.message || `Failed to ${isEditMode ? "update" : "create"} workout`
      );
    } finally {
      setSubmitLoading(false);
    }
  };

  // Cancel and go back
  const handleCancel = () => {
    navigate(isEditMode ? `/workouts/${id}` : "/workouts");
  };

  // If still loading authentication state, show loading spinner
  if (authLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-goldenrod"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-midnight-green text-white p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-heading-1 text-goldenrod mb-6">
          {isEditMode ? "Edit Workout" : "Create New Workout"}
        </h1>

        {/* Error Message */}
        {error && (
          <div className="bg-customDarkGold/20 border border-customGold text-goldenrod p-4 rounded-lg mb-8">
            <p>{error}</p>
          </div>
        )}

        {loading && !isAddingExercise ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-goldenrod"></div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Workout Information */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-heading-3 text-goldenrod mb-4">
                Workout Details
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Workout details fields remain the same... */}

                {/* Workout Name */}
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray mb-1"
                  >
                    Workout Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={workout.name}
                    onChange={handleInputChange}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-goldenrod"
                    placeholder="e.g., Full Body Strength"
                    required
                  />
                </div>

                {/* Other workout details fields remain the same... */}
              </div>

              {/* Description */}
              <div className="mt-6">
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-gray mb-1"
                >
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={workout.description}
                  onChange={handleInputChange}
                  rows="4"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-goldenrod"
                  placeholder="Describe your workout plan..."
                ></textarea>
              </div>
            </div>

            {/* Exercises Section */}
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-heading-3 text-goldenrod">Exercises</h2>
                {!isAddingExercise && (
                  <button
                    type="button"
                    onClick={toggleAddExercise}
                    className="bg-goldenrod text-midnight-green px-4 py-2 rounded-lg font-medium hover:bg-dark-goldenrod transition-colors"
                  >
                    + Add Exercise
                  </button>
                )}
              </div>

              {/* Exercise List */}
              {workoutExercises.length > 0 ? (
                <div className={`mb-${isAddingExercise ? "4" : "0"}`}>
                  <h3 className="text-heading-4 mb-4">Selected Exercises</h3>
                  <div className="space-y-4">
                    {workoutExercises.map((exercise, index) => (
                      <div
                        key={index}
                        className="bg-gray-700 rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between"
                      >
                        <div className="flex-1">
                          <div className="flex items-center">
                            <span className="text-goldenrod font-bold mr-2">
                              {index + 1}.
                            </span>
                            <h4 className="text-md font-medium">
                              {exercise.exercise
                                ? exercise.exercise.name
                                : "Exercise"}
                            </h4>
                          </div>
                          <div className="text-gray flex flex-wrap gap-3 mt-2">
                            <span>{exercise.sets} sets</span>
                            <span>{exercise.reps} reps</span>
                            <span>{exercise.restTimeSeconds}s rest</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 mt-3 md:mt-0">
                          <button
                            type="button"
                            onClick={() => handleMoveExerciseUp(index)}
                            disabled={index === 0}
                            className={`p-2 rounded ${
                              index === 0
                                ? "bg-gray-600 text-gray cursor-not-allowed"
                                : "bg-gray-600 text-white hover:bg-gray-500"
                            }`}
                            title="Move Up"
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveExerciseDown(index)}
                            disabled={index === workoutExercises.length - 1}
                            className={`p-2 rounded ${
                              index === workoutExercises.length - 1
                                ? "bg-gray-600 text-gray cursor-not-allowed"
                                : "bg-gray-600 text-white hover:bg-gray-500"
                            }`}
                            title="Move Down"
                          >
                            ↓
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveExercise(index)}
                            className="p-2 rounded bg-red-700 text-white hover:bg-red-600"
                            title="Remove"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div
                  className={`bg-gray-700 rounded-lg p-6 text-center ${
                    isAddingExercise ? "mb-4" : ""
                  }`}
                >
                  <p className="text-gray">No exercises added yet.</p>
                  {!isAddingExercise && (
                    <p className="text-sm mt-2">
                      Click "Add Exercise" to start building your workout.
                    </p>
                  )}
                </div>
              )}

              {/* Exercise Selection Panel - Only shown when adding */}
              {isAddingExercise && (
                <div className="bg-gray-700 rounded-lg p-4 mt-4 border border-gray-600 shadow-lg">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-heading-4">Add Exercise</h3>
                    <button
                      type="button"
                      onClick={cancelAddExercise}
                      className="text-gray hover:text-white"
                    >
                      × Close
                    </button>
                  </div>

                  {loading ? (
                    <div className="flex justify-center items-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-goldenrod"></div>
                    </div>
                  ) : (
                    <>
                      {/* Exercise Search */}
                      <div className="mb-4">
                        <label
                          htmlFor="exerciseSearch"
                          className="block text-sm font-medium text-gray mb-1"
                        >
                          Search Exercises
                        </label>
                        <input
                          ref={exerciseSelectRef}
                          type="text"
                          id="exerciseSearch"
                          value={exerciseSearchTerm}
                          onChange={(e) =>
                            setExerciseSearchTerm(e.target.value)
                          }
                          className="w-full bg-gray-600 border border-gray-500 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-goldenrod"
                          placeholder="Search by name or muscle group..."
                        />
                      </div>

                      {/* Exercise Grid */}
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray mb-2">
                          Available Exercises
                        </label>
                        <div className="max-h-60 overflow-y-auto bg-gray-600 rounded-lg p-2">
                          {filteredExercises.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {filteredExercises.map((exercise) => (
                                <div
                                  key={exercise.id}
                                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                                    selectedExerciseId === exercise.id
                                      ? "bg-goldenrod/30 border border-goldenrod"
                                      : "bg-gray-700 hover:bg-gray-650"
                                  }`}
                                  onClick={() =>
                                    setSelectedExerciseId(exercise.id)
                                  }
                                >
                                  <div className="font-medium">
                                    {exercise.name}
                                  </div>
                                  {exercise.targetMuscles && (
                                    <div className="text-xs text-gray mt-1">
                                      {exercise.targetMuscles.join(", ")}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-4 text-gray">
                              {exerciseSearchTerm
                                ? "No exercises match your search"
                                : "No exercises available"}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Exercise Details */}
                      {selectedExerciseId && (
                        <div className="border-t border-gray-600 pt-4 mt-4">
                          <h4 className="text-md font-medium mb-3">
                            Exercise Details
                          </h4>
                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <label
                                htmlFor="sets"
                                className="block text-sm font-medium text-gray mb-1"
                              >
                                Sets
                              </label>
                              <input
                                type="number"
                                id="sets"
                                name="sets"
                                min="1"
                                max="20"
                                value={currentExerciseInfo.sets}
                                onChange={handleExerciseInfoChange}
                                className="w-full bg-gray-600 border border-gray-500 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-goldenrod"
                              />
                            </div>
                            <div>
                              <label
                                htmlFor="reps"
                                className="block text-sm font-medium text-gray mb-1"
                              >
                                Reps
                              </label>
                              <input
                                type="number"
                                id="reps"
                                name="reps"
                                min="0"
                                max="100"
                                value={currentExerciseInfo.reps}
                                onChange={handleExerciseInfoChange}
                                className="w-full bg-gray-600 border border-gray-500 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-goldenrod"
                              />
                            </div>
                            <div>
                              <label
                                htmlFor="restTimeSeconds"
                                className="block text-sm font-medium text-gray mb-1"
                              >
                                Rest (sec)
                              </label>
                              <input
                                type="number"
                                id="restTimeSeconds"
                                name="restTimeSeconds"
                                min="0"
                                max="300"
                                step="5"
                                value={currentExerciseInfo.restTimeSeconds}
                                onChange={handleExerciseInfoChange}
                                className="w-full bg-gray-600 border border-gray-500 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-goldenrod"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Add Button */}
                      <div className="mt-4 flex justify-end">
                        <button
                          type="button"
                          onClick={handleAddExercise}
                          disabled={!selectedExerciseId}
                          className={`px-4 py-2 rounded-lg font-medium ${
                            !selectedExerciseId
                              ? "bg-gray-600 text-gray cursor-not-allowed"
                              : "bg-goldenrod text-midnight-green hover:bg-dark-goldenrod"
                          }`}
                        >
                          Add to Workout
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Form Actions */}
            <div className="flex justify-between">
              <button
                type="button"
                onClick={handleCancel}
                className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitLoading}
                className="px-6 py-3 bg-goldenrod text-midnight-green rounded-lg font-bold hover:bg-dark-goldenrod transition-colors flex items-center"
              >
                {submitLoading ? (
                  <>
                    <span className="animate-spin mr-2">⟳</span>
                    Saving...
                  </>
                ) : (
                  `${isEditMode ? "Update" : "Create"} Workout`
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default WorkoutForm;
