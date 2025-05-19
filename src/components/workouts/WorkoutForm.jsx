import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import workoutsService from "../../services/workoutsService";
import exercisesService from "../../services/exercisesService";
import workoutExercisesService from "../../services/workoutExercisesService";
import ExerciseCard from "../exercises/ExerciseCard";
import ExerciseFilters from "../exercises/ExerciseFilters"; // Import the ExerciseFilters component
import ExercisesModal from "../exercises/ExercisesModal";
import FormButton from "../common/FormButton"; // Add this import
import SecondaryButton from "../common/SecondaryButton"; // Add this import

const WorkoutForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const isEditMode = !!id;
  const exerciseSelectRef = useRef(null);

  const [workout, setWorkout] = useState({
    name: "",
    description: "",
    type: "STRENGTH",
    durationMinutes: 30,
  });

  const [workoutExercises, setWorkoutExercises] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isAddingExercise, setIsAddingExercise] = useState(false);
  const [isExerciseModalOpen, setIsExerciseModalOpen] = useState(false);

  const workoutTypes = [
    { value: "strength", label: "Strength" },
    { value: "cardio", label: "Cardio" },
    { value: "hiit", label: "HIIT" },
    { value: "flexibility", label: "Flexibility" },
    { value: "hybrid", label: "Hybrid" },
  ];

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

  useEffect(() => {
    const fetchWorkout = async () => {
      if (!isEditMode || !isAuthenticated) return;

      try {
        setLoading(true);
        const workoutData = await workoutsService.getWorkoutById(id);

        if (workoutData.userId !== user?.id) {
          setError("You don't have permission to edit this workout");
          navigate("/workouts");
          return;
        }

        setWorkout({
          name: workoutData.name || "",
          description: workoutData.description || "",
          type: workoutData.type || "STRENGTH",
          durationMinutes: workoutData.durationMinutes || 30,
        });

        const exercisesData = await workoutExercisesService.getWorkoutExercises(
          id
        );

        const sortedExercises = [...exercisesData].sort(
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

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setWorkout((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleDurationChange = (e) => {
    const value = Math.max(1, parseInt(e.target.value) || 0);
    setWorkout((prev) => ({
      ...prev,
      durationMinutes: value,
    }));
  };

  const handleCancel = () => {
    navigate(isEditMode ? `/workouts/${id}` : "/workouts");
  };

  const validateForm = () => {
    if (!workout.name.trim()) {
      setError("Workout name is required");
      return false;
    }

    if (workout.name.length > 100) {
      setError("Workout name cannot exceed 100 characters");
      return false;
    }

    if (workout.description.length > 1000) {
      setError("Description cannot exceed 1000 characters");
      return false;
    }

    if (workout.durationMinutes < 1) {
      setError("Duration must be at least 1 minute");
      return false;
    }

    if (workoutExercises.length === 0) {
      setError("Add at least one exercise to your workout");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setSubmitLoading(true);
      setError(null);

      const workoutForSubmission = {
        ...workout,
        type: workout.type.toLowerCase(),
      };

      let workoutId = id;

      if (isEditMode) {
        await workoutsService.updateWorkout(id, workoutForSubmission);

        try {
          const currentExercises =
            await workoutExercisesService.getWorkoutExercises(id);

          const currentExercisesMap = new Map();
          currentExercises.forEach((ex) => {
            currentExercisesMap.set(ex.id, ex);
          });

          const updatedExercisesMap = new Map();
          const exercisesToAdd = [];

          for (let i = 0; i < workoutExercises.length; i++) {
            const exercise = workoutExercises[i];

            if (exercise.id) {
              updatedExercisesMap.set(exercise.id, {
                ...exercise,
                orderIndex: i + 1,
              });
            } else {
              exercisesToAdd.push({
                exerciseId: exercise.exerciseId,
                sets: exercise.sets,
                reps: exercise.reps,
                restTimeSeconds: exercise.restTimeSeconds,
                orderIndex: i + 1,
              });
            }
          }

          const exercisesToDelete = [];
          currentExercisesMap.forEach((ex) => {
            if (!updatedExercisesMap.has(ex.id)) {
              exercisesToDelete.push(ex.id);
            }
          });

          const exercisesToUpdate = [];
          updatedExercisesMap.forEach((ex) => {
            exercisesToUpdate.push({
              id: ex.id,
              sets: ex.sets,
              reps: ex.reps,
              restTimeSeconds: ex.restTimeSeconds,
              orderIndex: ex.orderIndex,
            });
          });

          for (const exId of exercisesToDelete) {
            await workoutExercisesService.removeExerciseFromWorkout(id, exId);
          }

          for (const ex of exercisesToUpdate) {
            await workoutExercisesService.updateWorkoutExercise(id, ex.id, ex);
          }

          if (exercisesToAdd.length > 0) {
            await workoutExercisesService.addExercisesToWorkout(
              id,
              exercisesToAdd
            );
          }
        } catch (exerciseErr) {
          console.error("Error updating workout exercises:", exerciseErr);
          setError(
            `Workout updated but failed to update exercises: ${
              exerciseErr.message || "Unknown error"
            }`
          );
        }
      } else {
        const newWorkout = await workoutsService.createWorkout(
          workoutForSubmission
        );
        workoutId = newWorkout.id;

        if (workoutExercises.length > 0) {
          try {
            for (const ex of workoutExercises) {
              await workoutExercisesService.addExerciseToWorkout(workoutId, {
                exerciseId: ex.exerciseId,
                sets: ex.sets,
                reps: ex.reps,
                restTimeSeconds: ex.restTimeSeconds,
                orderIndex: ex.orderIndex,
              });
            }
          } catch (exerciseErr) {
            console.error(
              "Error adding exercises to new workout:",
              exerciseErr
            );
            setError(
              `Workout created but failed to add exercises: ${
                exerciseErr.message || "Unknown error"
              }`
            );
          }
        }
      }

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

  const ExerciseSelectionPanel = () => {
    const [selectedExerciseId, setSelectedExerciseId] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [exercises, setExercises] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [filters, setFilters] = useState({
      difficulty: "",
      targetMuscles: [],
      equipment: "",
      type: "",
    });
    const [showFilters, setShowFilters] = useState(false);

    const [sets, setSets] = useState(3);
    const [reps, setReps] = useState(10);
    const [restTimeSeconds, setRestTimeSeconds] = useState(60);

    useEffect(() => {
      const fetchExercises = async () => {
        try {
          setLoading(true);

          const params = {};
          if (searchQuery) params.search = searchQuery;
          if (filters.difficulty) params.difficulty = filters.difficulty;
          if (filters.equipment) params.equipment = filters.equipment;
          if (filters.type) params.type = filters.type;
          if (filters.targetMuscles.length > 0)
            params.targetMuscles = filters.targetMuscles;

          const response = await exercisesService.getFilteredExercises(params);

          setExercises(
            Array.isArray(response) ? response : response.exercises || []
          );
        } catch (err) {
          console.error("Error fetching exercises:", err);
          setError("Failed to load exercises. Please try again.");
        } finally {
          setLoading(false);
        }
      };

      fetchExercises();
    }, [searchQuery, filters]);

    const handleFilterChange = (filterType, value) => {
      setFilters((prev) => {
        if (filterType === "targetMuscles") {
          const updatedMuscles = prev.targetMuscles.includes(value)
            ? prev.targetMuscles.filter((muscle) => muscle !== value)
            : [...prev.targetMuscles, value];

          return { ...prev, targetMuscles: updatedMuscles };
        }

        return { ...prev, [filterType]: value };
      });
    };

    const clearFilters = () => {
      setFilters({
        difficulty: "",
        targetMuscles: [],
        equipment: "",
        type: "",
      });
      setSearchQuery("");
    };

    const handleAddExercise = () => {
      if (!selectedExerciseId) return;

      const selectedExercise = exercises.find(
        (ex) => ex.id === selectedExerciseId
      );
      if (!selectedExercise) return;

      const exerciseToAdd = {
        exercise: selectedExercise,
        exerciseId: selectedExerciseId,
        sets,
        reps,
        restTimeSeconds,
      };

      setWorkoutExercises((prev) => [...prev, exerciseToAdd]);
      setIsAddingExercise(false);
    };

    return (
      <div className="border border-gray-600 rounded-lg p-4 bg-midnight-green">
        <h3 className="text-heading-4 text-goldenrod mb-4">Add Exercise</h3>

        <div className="mb-4">
          <input
            type="text"
            placeholder="Search exercises..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-goldenrod"
          />
        </div>

        <ExerciseFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          onClearFilters={clearFilters}
          showFilters={showFilters}
          onToggleFilters={() => setShowFilters(!showFilters)}
        />

        <div className="grid grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray mb-1">
              Sets
            </label>
            <input
              type="number"
              min="1"
              value={sets}
              onChange={(e) => setSets(parseInt(e.target.value) || 1)}
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-goldenrod"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray mb-1">
              Reps
            </label>
            <input
              type="number"
              min="1"
              value={reps}
              onChange={(e) => setReps(parseInt(e.target.value) || 1)}
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-goldenrod"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray mb-1">
              Rest (sec)
            </label>
            <input
              type="number"
              min="0"
              value={restTimeSeconds}
              onChange={(e) =>
                setRestTimeSeconds(parseInt(e.target.value) || 0)
              }
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-goldenrod"
            />
          </div>
        </div>

        <div className="mt-4 max-h-80 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-goldenrod"></div>
            </div>
          ) : error ? (
            <p className="text-red-400 text-center py-4">{error}</p>
          ) : exercises.length === 0 ? (
            <p className="text-gray-400 text-center py-4">
              No exercises found. Try adjusting your search or filters.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {exercises.map((exercise) => (
                <div
                  key={exercise.id}
                  className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                    selectedExerciseId === exercise.id
                      ? "border-goldenrod bg-gray-700"
                      : "border-gray-700 bg-gray-800 hover:bg-gray-700"
                  }`}
                  onClick={() => setSelectedExerciseId(exercise.id)}
                >
                  <h4 className="font-medium">{exercise.name}</h4>
                  <div className="text-sm text-gray-400 mt-1 flex flex-wrap gap-2">
                    {exercise.difficulty && (
                      <span className="px-2 py-0.5 bg-gray-700 rounded-full">
                        {exercise.difficulty}
                      </span>
                    )}
                    {exercise.equipment && (
                      <span className="px-2 py-0.5 bg-gray-700 rounded-full">
                        {exercise.equipment}
                      </span>
                    )}
                    {exercise.targetMuscles && exercise.targetMuscles[0] && (
                      <span className="px-2 py-0.5 bg-gray-700 rounded-full">
                        {exercise.targetMuscles[0]}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-between mt-6">
          <button
            type="button"
            onClick={() => setIsAddingExercise(false)}
            className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleAddExercise}
            disabled={!selectedExerciseId}
            className={`px-4 py-2 rounded-lg ${
              !selectedExerciseId
                ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                : "bg-goldenrod text-midnight-green hover:bg-dark-goldenrod"
            } transition-colors`}
          >
            Add to Workout
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-dark-slate-gray text-white p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-heading-1 text-goldenrod mb-6">
          {isEditMode ? "Edit Workout" : "Create New Workout"}
        </h1>

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
            <div className="bg-midnight-green rounded-lg p-6">
              <h2 className="text-heading-3 text-goldenrod mb-4">
                Workout Details
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    className="w-full bg-midnight-green-darker   rounded-lg px-3 py-2 text-goldenrod focus:outline-none focus:border-goldenrod"
                    placeholder="e.g., Full Body Strength"
                    required
                    maxLength={100}
                  />
                  <div className="text-xs text-gray mt-1">
                    {workout.name.length}/100 characters
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="durationMinutes"
                    className="block text-sm font-medium text-gray mb-1"
                  >
                    Duration (minutes) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    id="durationMinutes"
                    name="durationMinutes"
                    value={workout.durationMinutes}
                    onChange={handleDurationChange}
                    min="1"
                    className="w-full bg-midnight-green-darker  rounded-lg px-3 py-2 text-goldenrod focus:outline-none focus:border-goldenrod"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="type"
                    className="block text-sm font-medium text-gray mb-1"
                  >
                    Workout Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="type"
                    name="type"
                    value={workout.type}
                    onChange={handleInputChange}
                    className="w-full bg-midnight-green-darker rounded-lg px-3 py-2 text-goldenrod focus:outline-none focus:border-goldenrod"
                    required
                  >
                    {workoutTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

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
                  maxLength={1000}
                  className="w-full bg-midnight-green-darker rounded-lg px-3 py-2 text-goldenrod focus:outline-none focus:border-goldenrod"
                  placeholder="Describe your workout plan..."
                ></textarea>
                <div className="text-xs text-gray mt-1">
                  {workout.description.length}/1000 characters
                </div>
              </div>
            </div>

            <div className="bg-midnight-green rounded-lg p-6">
              <div className="grid items-center justify-center gap-4  mb-4">
                <h2 className="text-heading-3 text-goldenrod">Exercises</h2>
                {!isAddingExercise && (
                  <button
                    type="button"
                    onClick={() => setIsExerciseModalOpen(true)}
                    className="bg-goldenrod text-midnight-green px-4 py-2 rounded-lg font-medium hover:bg-dark-goldenrod transition-colors"
                  >
                    + Add Exercise
                  </button>
                )}
              </div>

              {workoutExercises.length > 0 ? (
                <div className={`mb-${isAddingExercise ? "4" : "0"}`}>
                  <h3 className="text-heading-4 mb-4 text-gray">
                    Selected Exercises
                  </h3>
                  <div className="space-y-4">
                    {workoutExercises.map((exerciseItem, index) => (
                      <div
                        key={index}
                        className="bg-dark-aquamarine/70 rounded-lg p-4"
                      >
                        <div className="flex flex-col md:flex-row md:items-center gap-4">
                          {/* Order indicator */}
                          <div className="flex-shrink-0 flex items-center justify-center bg-midnight-green h-10 w-10 rounded-full">
                            <span className="text-goldenrod font-bold">
                              {index + 1}
                            </span>
                          </div>

                          {/* Exercise card */}
                          <div className="flex-grow">
                            <ExerciseCard
                              exercise={exerciseItem.exercise}
                              onSelect={() => {}} // No selection action needed here
                            />
                          </div>

                          {/* Exercise parameters */}
                          <div className=" bg-midnight-green px-4 h-[5.9rem] rounded-lg flex gap-3 items-center ">
                            <span className="text-sm px-2 py-2 bg-midnight-green-darker rounded-full text-goldenrod">
                              {exerciseItem.sets} sets
                            </span>
                            <span className="text-sm px-2 py-2 bg-midnight-green-darker  rounded-full text-goldenrod">
                              {exerciseItem.reps} reps
                            </span>
                            <span className="text-sm px-2 py-2 bg-midnight-green-darker  rounded-full text-goldenrod">
                              {exerciseItem.restTimeSeconds}s rest
                            </span>
                          </div>

                          {/* Control buttons */}
                          <div className="flex-shrink-0 flex items-center space-x-2">
                            <button
                              type="button"
                              onClick={() => {
                                // Move exercise up
                                if (index > 0) {
                                  const updatedExercises = [
                                    ...workoutExercises,
                                  ];
                                  const temp = updatedExercises[index];
                                  updatedExercises[index] =
                                    updatedExercises[index - 1];
                                  updatedExercises[index - 1] = temp;
                                  setWorkoutExercises(updatedExercises);
                                }
                              }}
                              disabled={index === 0}
                              className={`p-2 rounded-md ${
                                index === 0
                                  ? "bg-gray-600 text-gray cursor-not-allowed"
                                  : "bg-midnight-green text-gray hover:bg-midnight-green-darker"
                              }`}
                              aria-label="Move exercise up"
                            >
                              ↑
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                // Move exercise down
                                if (index < workoutExercises.length - 1) {
                                  const updatedExercises = [
                                    ...workoutExercises,
                                  ];
                                  const temp = updatedExercises[index];
                                  updatedExercises[index] =
                                    updatedExercises[index + 1];
                                  updatedExercises[index + 1] = temp;
                                  setWorkoutExercises(updatedExercises);
                                }
                              }}
                              disabled={index === workoutExercises.length - 1}
                              className={`p-2 rounded-md ${
                                index === workoutExercises.length - 1
                                  ? "bg-gray-600 text-gray cursor-not-allowed"
                                  : "bg-midnight-green text-gray hover:bg-midnight-green-darker"
                              }`}
                              aria-label="Move exercise down"
                            >
                              ↓
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                // Remove exercise
                                const updatedExercises =
                                  workoutExercises.filter(
                                    (_, i) => i !== index
                                  );
                                setWorkoutExercises(updatedExercises);
                              }}
                              className="p-2 rounded-md bg-red-900 hover:bg-red-950 text-gray"
                              aria-label="Remove exercise"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div
                  className={`bg-midnight-green-darker rounded-lg p-6 text-center ${
                    isAddingExercise ? "mb-4" : ""
                  }`}
                >
                  <p className="text-gray">No exercises added yet.</p>
                </div>
              )}

              {isAddingExercise && <ExerciseSelectionPanel />}
            </div>

            <div className="flex items-center gap-5 justify-center mt-8">
              <SecondaryButton
                onClick={handleCancel}
                styles="p-6 border-b-6 border-r-6 text-xl"
              >
                Cancel
              </SecondaryButton>

              <FormButton
                type="submit"
                isLoading={submitLoading}
                styles="p-6 border-b-6 border-r-6 "
                fontsize="text-xl"
              >
                {isEditMode ? "Update Workout" : "Create Workout"}
              </FormButton>
            </div>
          </form>
        )}
      </div>
      <ExercisesModal
        isOpen={isExerciseModalOpen}
        onClose={() => setIsExerciseModalOpen(false)}
        onExerciseSelect={(exercise, params) => {
          const newExercise = {
            exerciseId: exercise.id,
            workoutPlanId: id,
            exercise: exercise,
            sets: params.sets,
            reps: params.reps,
            restTimeSeconds: params.restTimeSeconds,
            orderIndex: workoutExercises.length + 1,
          };
          setWorkoutExercises((prev) => [...prev, newExercise]);
        }}
        initialParams={{
          sets: 3,
          reps: 10,
          restTimeSeconds: 60,
        }}
      />
    </div>
  );
};

export default WorkoutForm;
