import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import workoutsService from "../../services/workoutsService";
import workoutExercisesService from "../../services/workoutExercisesService";

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

  if (loading) {
    return (
      <div className="min-h-screen bg-midnight-green p-6 flex flex-col items-center justify-center text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-goldenrod"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-midnight-green p-6 flex flex-col items-center justify-center text-white">
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
      <div className="min-h-screen bg-midnight-green p-6 flex flex-col items-center justify-center text-white">
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
    <div className="min-h-screen bg-midnight-green text-white p-6 pb-24">
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
            <h1 className="text-4xl text-goldenrod">{workout.name}</h1>
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

          {/* Workout metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
            <div className="bg-gray-800 rounded-lg p-4 flex flex-col items-center justify-center">
              <span className="text-4xl mb-2">
                {getWorkoutTypeEmoji(workout.type)}
              </span>
              <h3 className="text-lg text-goldenrod font-medium">Type</h3>
              <p className="text-gray">{workout.type || "General"}</p>
            </div>
            <div className="bg-gray-800 rounded-lg p-4 flex flex-col items-center justify-center">
              <span className="text-4xl mb-2">⏱️</span>
              <h3 className="text-lg text-goldenrod font-medium">Duration</h3>
              <p className="text-gray">
                {formatDuration(workout.durationMinutes)}
              </p>
            </div>
            <div className="bg-gray-800 rounded-lg p-4 flex flex-col items-center justify-center">
              <span className="text-4xl mb-2">🏋️</span>
              <h3 className="text-lg text-goldenrod font-medium">Exercises</h3>
              <p className="text-gray">
                {exercises ? exercises.length : 0} exercises
              </p>
            </div>
          </div>
        </div>

        {/* Exercises section */}
        <div className="mb-8">
          <h2 className="text-2xl text-goldenrod mb-6">Workout Routine</h2>

          {exercises.length > 0 ? (
            <div className="space-y-6">
              {exercises.map((exerciseItem, index) => (
                <div
                  key={exerciseItem.id}
                  className="bg-gray-800 rounded-lg overflow-hidden"
                >
                  {/* Exercise header with order number */}
                  <div className="bg-gray-700 px-4 py-2 flex justify-between items-center">
                    <div className="flex items-center">
                      <span className="bg-goldenrod text-midnight-green w-8 h-8 rounded-full flex items-center justify-center font-bold mr-3">
                        {index + 1}
                      </span>
                      <h3 className="font-medium text-goldenrod">
                        {exerciseItem.exercise?.name || "Exercise"}
                      </h3>
                    </div>
                  </div>

                  {/* Exercise details */}
                  <div className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="bg-gray-700 p-3 rounded-lg flex flex-col items-center">
                        <span className="text-gray text-sm">SETS</span>
                        <span className="text-xl text-goldenrod">
                          {exerciseItem.sets}
                        </span>
                      </div>
                      <div className="bg-gray-700 p-3 rounded-lg flex flex-col items-center">
                        <span className="text-gray text-sm">REPS</span>
                        <span className="text-xl text-goldenrod">
                          {exerciseItem.reps}
                        </span>
                      </div>
                      <div className="bg-gray-700 p-3 rounded-lg flex flex-col items-center">
                        <span className="text-gray text-sm">REST</span>
                        <span className="text-xl text-goldenrod">
                          {exerciseItem.restTimeSeconds}s
                        </span>
                      </div>
                    </div>

                    {/* Exercise card itself */}
                    {exerciseItem.exercise && (
                      <div className="bg-midnight-green rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 flex h-24">
                        {/* Exercise Image - Left side */}
                        <div className="w-24 h-full bg-midnight-green-darker flex-shrink-0">
                          {exerciseItem.exercise.videoUrl ? (
                            <img
                              src={`https://vumbnail.com/${exerciseItem.exercise.videoUrl}.jpg`}
                              alt={exerciseItem.exercise.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src =
                                  "/images/exercise-placeholder.jpg";
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-800 text-gray-600">
                              <span>No image</span>
                            </div>
                          )}
                        </div>

                        {/* Exercise Details - Right side */}
                        <div className="p-3 flex flex-col justify-between flex-grow">
                          <div>
                            {/* Target Muscle */}
                            {exerciseItem.exercise.targetMuscles &&
                              exerciseItem.exercise.targetMuscles.length >
                                0 && (
                                <p className="text-xs text-gray-400 mt-0.5">
                                  Targets:{" "}
                                  {exerciseItem.exercise.targetMuscles[0]}
                                </p>
                              )}

                            {/* Equipment */}
                            {exerciseItem.exercise.equipment && (
                              <p className="text-xs text-gray-400">
                                Equipment: {exerciseItem.exercise.equipment}
                              </p>
                            )}
                          </div>

                          {/* View Exercise Details Link */}
                          <div className="flex justify-end">
                            <a
                              href={`/exercises/${exerciseItem.exercise.id}`}
                              className="text-xs text-goldenrod hover:text-yellow-500 transition-colors"
                            >
                              Exercise Details →
                            </a>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-gray-800 rounded-lg p-6 text-center">
              <p className="text-gray">
                No exercises have been added to this workout.
              </p>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="mt-8 flex flex-wrap gap-4 justify-center">
          {/* Only show edit button if the user is the owner of the workout */}
          {isAuthenticated && workout.userId === user?.id && (
            <button
              onClick={() => navigate(`/workouts/edit/${workout.id}`)}
              className="px-6 py-3 bg-goldenrod text-midnight-green rounded-lg font-bold hover:bg-dark-goldenrod transition-colors"
            >
              Edit Workout
            </button>
          )}

          {/* Start workout button - for all users */}
          <button
            onClick={() => {
              // Navigate to workout log or start screen
              console.log("Start workout:", workout.id);
              // navigate(`/workout-log/start/${workout.id}`);
            }}
            className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            Start Workout
          </button>

          {/* Copy workout button
          {isAuthenticated && (
            <button
              onClick={() => {
                console.log("Copy workout:", workout.id);
                // Implement copy functionality
              }}
              className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Copy to My Workouts
            </button>
          )} */}
        </div>
      </div>
    </div>
  );
};

export default WorkoutDetails;
