import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import workoutsService from "../../services/workoutsService";
import workoutExercisesService from "../../services/workoutExercisesService";
import ExerciseCard from "../exercises/ExerciseCard"; // Correctly importing ExerciseCard

// A simple pencil icon component (or you can use a library like react-icons)
const EditIcon = ({ className = "" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
    className={`w-5 h-5 ${className}`}
  >
    <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
    <path
      fillRule="evenodd"
      d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"
      clipRule="evenodd"
    />
  </svg>
);

/**
 * Component to display full details of a workout plan
 * including all exercises, instructions, and metadata
 */
const WorkoutDetails = ({ workoutId }) => {
  const params = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  // Use provided workoutId or get from URL params
  const id = workoutId || params.id;

  const [workout, setWorkout] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Remove the duplicate useEffect and keep only one clean implementation
  // Replace both existing useEffect hooks with this single one:

  useEffect(() => {
    const fetchWorkoutDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        // Determine which ID to use (from props or from URL params)
        const workoutIdToUse = workoutId || id;

        if (!workoutIdToUse) {
          throw new Error("No workout ID provided");
        }

        console.log(`Fetching workout with ID: ${workoutIdToUse}`);

        // Get workout basic data
        const workoutData = await workoutsService.getWorkoutById(
          workoutIdToUse
        );
        console.log("Workout data received:", workoutData);

        // Set the workout data
        setWorkout(workoutData);

        // Fetch workout exercises separately
        console.log(`Fetching exercises for workout ID: ${workoutIdToUse}`);
        const exercisesData = await workoutExercisesService.getWorkoutExercises(
          workoutIdToUse
        );
        console.log("Exercise data received:", exercisesData);

        // Determine the exercises array based on the response format
        let exerciseArray = [];

        if (Array.isArray(exercisesData)) {
          exerciseArray = exercisesData;
        } else if (exercisesData && Array.isArray(exercisesData.exercises)) {
          exerciseArray = exercisesData.exercises;
        }

        // Update the exercises state with the array we determined
        setExercises(exerciseArray);

        // Log the count for debugging
        console.log(
          `Exercise count for workout ${workoutIdToUse}:`,
          exerciseArray.length
        );
      } catch (err) {
        console.error("Error fetching workout details:", err);
        setError(err.message || "Failed to load workout details");
        setExercises([]); // Initialize with empty array on error
      } finally {
        setLoading(false);
      }
    };

    // Only fetch if we have an ID (either from props or params)
    if (workoutId || id) {
      fetchWorkoutDetails();
    } else {
      console.error("No workout ID provided");
      setError("No workout ID provided");
      setLoading(false);
    }
  }, [workoutId, id]); // Dependencies: both possible sources of the ID

  // Handle Go Back button
  const handleGoBack = () => {
    navigate(-1);
  };

  // Format duration helper
  const formatDuration = (minutes) => {
    if (!minutes && minutes !== 0) return "N/A";

    if (minutes < 60) {
      return `${minutes} min`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return remainingMinutes > 0
        ? `${hours}h ${remainingMinutes}m`
        : `${hours}h`;
    }
  };

  // Get workout type emoji
  const getWorkoutTypeEmoji = (type) => {
    switch (type?.toLowerCase()) {
      case "strength":
        return "🏋️";
      case "cardio":
        return "🏃";
      case "hiit":
        return "⚡";
      case "flexibility":
        return "🧘";
      case "hybrid":
        return "🔄";
      default:
        return "💪";
    }
  };

  // Get type badge style
  const getTypeStyle = (type) => {
    switch (type?.toLowerCase()) {
      case "strength":
        return "bg-emerald-100 text-emerald-800";
      case "cardio":
        return "bg-blue-100 text-blue-800";
      case "hiit":
        return "bg-amber-100 text-amber-800";
      case "flexibility":
        return "bg-purple-100 text-purple-800";
      case "hybrid":
        return "bg-indigo-100 text-indigo-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Helper function to get primary muscle (similar to Exercises.jsx)
  const getPrimaryMuscleForWorkoutExercise = (exercise) => {
    if (!exercise) return null;
    if (exercise.primaryMuscleGroup) return exercise.primaryMuscleGroup;
    if (
      exercise.targetMuscles &&
      Array.isArray(exercise.targetMuscles) &&
      exercise.targetMuscles.length > 0
    ) {
      return exercise.targetMuscles[0]; // Or join them: exercise.targetMuscles.join(', ')
    }
    return null; // Or a default like "N/A"
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-midnight-green p-6 flex flex-col items-center justify-center text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-goldenrod"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-dark-slate-gray p-6 flex flex-col items-center justify-center text-white">
        <div className="bg-sepia/20 border border-goldenrod text-goldenrod p-6 rounded-lg max-w-lg w-full text-center">
          <div className="text-3xl mb-3">⚠️</div>
          <h2 className="text-xl font-bold mb-2">Error Loading Workout</h2>
          <p>{error}</p>
          <button
            onClick={handleGoBack}
            className="mt-4 px-4 py-2 bg-goldenrod text-midnight-green-darker rounded-lg flex items-center justify-center mx-auto"
          >
            <span className="mr-2">←</span>
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!workout) {
    return (
      <div className="min-h-screen bg-dark-slate-gray p-6 flex flex-col items-center justify-center text-white">
        <div className="bg-sepia/20 border border-goldenrod text-goldenrod p-6 rounded-lg max-w-lg w-full text-center">
          <div className="text-3xl mb-3">⚠️</div>
          <h2 className="text-xl font-bold mb-2">Workout Not Found</h2>
          <p>
            The workout you're looking for doesn't exist or has been removed.
          </p>
          <button
            onClick={handleGoBack}
            className="mt-4 px-4 py-2 bg-goldenrod text-midnight-green-darker rounded-lg flex items-center justify-center mx-auto"
          >
            <span className="mr-2">←</span>
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-slate-gray text-white p-6 ">
      {/* Back button */}
      <button
        onClick={handleGoBack}
        className="flex items-center text-goldenrod hover:text-dark-goldenrod transition-colors mb-6"
      >
        <span className="mr-2">←</span>
        Back to Workouts
      </button>

      <div className="max-w-4xl mx-auto">
        {/* Header section */}
        <div className="mb-8">
          <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
            <div className="flex items-center gap-3">
              {" "}
              {/* Wrapper for title and edit icon */}
              <h1 className="text-4xl text-goldenrod">{workout.name}</h1>
              {isAuthenticated && workout.userId === user?.id && (
                <button
                  onClick={() => navigate(`/workouts/edit/${workout.id}`)}
                  title="Edit Workout"
                  className="text-goldenrod hover:text-yellow-500 transition-colors p-1 rounded-full hover:bg-gray-700" // Added some padding and hover effect
                >
                  <EditIcon className="w-6 h-6" />
                </button>
              )}
            </div>
            <span
              className={`px-3 py-1 rounded-full text-sm ${getTypeStyle(
                workout.type
              )}`}
            >
              {workout.type}
            </span>
          </div>

          {workout.description && (
            <p className="text-gray mb-6">{workout.description}</p>
          )}

          {/* Workout metadata - Icons are already present here */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
            <div className="bg-midnight-green rounded-lg p-4 flex flex-col items-center justify-center">
              <span className="text-4xl mb-2">
                {getWorkoutTypeEmoji(workout.type)} {/* Icon for Type */}
              </span>
              <h3 className="text-lg text-goldenrod font-medium">Type</h3>
              <p className="text-gray">{workout.type || "General"}</p>
            </div>
            <div className="bg-midnight-green rounded-lg p-4 flex flex-col items-center justify-center">
              <span className="text-4xl mb-2">⏱️</span>{" "}
              {/* Icon for Duration */}
              <h3 className="text-lg text-goldenrod font-medium">Duration</h3>
              <p className="text-gray">
                {formatDuration(workout.durationMinutes)}
              </p>
            </div>
            <div className="bg-midnight-green rounded-lg p-4 flex flex-col items-center justify-center">
              <span className="text-4xl mb-2">🏋️</span>{" "}
              {/* Icon for Exercises count */}
              <h3 className="text-lg text-goldenrod font-medium">Exercises</h3>
              <p className="text-gray">
                {exercises ? exercises.length : 0} exercises
              </p>
            </div>
          </div>
        </div>

        {/* Exercises section */}
        <div className="mb-8">
          {/* Changed title from "Workout Routine" to "Exercises" */}
          <h2 className="text-2xl text-goldenrod mb-6">Exercises</h2>

          {exercises.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {exercises.map((exerciseItem, index) => {
                // Normalize the exercise object before passing to ExerciseCard
                const normalizedExercise = exerciseItem.exercise
                  ? {
                      ...exerciseItem.exercise,
                      primaryMuscleGroup: getPrimaryMuscleForWorkoutExercise(
                        exerciseItem.exercise
                      ),
                      // Ensure other fields expected by ExerciseCard are present or have defaults if necessary
                      id: exerciseItem.exercise.id || `temp-id-${index}`, // Ensure ID is present
                      name: exerciseItem.exercise.name || "Unnamed Exercise",
                    }
                  : null;

                return (
                  <div
                    key={exerciseItem.id || `workout-item-${index}`} // Use exerciseItem.id from the workout_exercises table
                    className="bg-midnight-green-darker rounded-lg overflow-hidden flex flex-col"
                  >
                    {/* Exercise header with order number and name (displayed by WorkoutDetails) */}
                    <div className="bg-midnight-green px-4 py-2 flex justify-between items-center">
                      <div className="flex items-center">
                        <span className="bg-goldenrod text-midnight-green w-8 h-8 rounded-full flex items-center justify-center font-bold mr-3">
                          {index + 1}
                        </span>
                        <h3 className="font-medium text-goldenrod">
                          {exerciseItem.exercise?.name || "Exercise"}
                        </h3>
                      </div>
                    </div>

                    <div className="p-4 flex-grow flex flex-col justify-between">
                      <div>
                        {/* Sets, Reps, Rest specific to this workout item */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                          <div className="bg-midnight-green p-3 rounded-lg flex flex-col items-center">
                            <span className="text-gray text-sm">SETS</span>
                            <span className="text-xl text-goldenrod">
                              {exerciseItem.sets}
                            </span>
                          </div>
                          <div className="bg-midnight-green p-3 rounded-lg flex flex-col items-center">
                            <span className="text-gray text-sm">REPS</span>
                            <span className="text-xl text-goldenrod">
                              {exerciseItem.reps}
                            </span>
                          </div>
                          <div className="bg-midnight-green p-3 rounded-lg flex flex-col items-center">
                            <span className="text-gray text-sm">REST</span>
                            <span className="text-xl text-goldenrod">
                              {exerciseItem.restTimeSeconds}s
                            </span>
                          </div>
                        </div>

                        {/* Use ExerciseCard with the normalized exercise object */}
                        {normalizedExercise && (
                          <ExerciseCard exercise={normalizedExercise} />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-gray-800 rounded-lg p-6 text-center">
              <p className="text-gray">
                No exercises have been added to this workout.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkoutDetails;
