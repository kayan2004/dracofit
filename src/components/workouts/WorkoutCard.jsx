import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import workoutExercisesService from "../../services/workoutExercisesService";

/**
 * WorkoutCard component to display workout plan information
 *
 * @param {Object} workout - The workout plan object containing details
 * @param {Function} onEdit - Optional function to handle edit action
 * @param {Function} onDelete - Optional function to handle delete action
 * @param {Boolean} isOwner - Optional flag to determine if the current user is the owner
 */
const WorkoutCard = ({ workout, onEdit, onDelete, isOwner = false }) => {
  const [exercises, setExercises] = useState([]);

  useEffect(() => {
    const fetchExercises = async () => {
      try {
        const exercisesData = await workoutExercisesService.getWorkoutExercises(
          workout.id
        );
        setExercises(Array.isArray(exercisesData) ? exercisesData : []);
      } catch (err) {
        console.error(
          `Error fetching exercises for workout ${workout.id}:`,
          err
        );
        setExercises([]);
      }
    };

    fetchExercises();
  }, [workout.id]);

  // Add this near the beginning of your component
  console.log(`Workout ${workout.id} data:`, workout);
  console.log(
    `Exercise data for workout ${workout.id}:`,
    workout.workoutExercises || workout.exercises || "No exercises data found"
  );
  const exerciseCount = exercises.length;
  console.log(`Calculated exercise count: ${exerciseCount}`);

  // Format duration in minutes to a readable format
  const formattedDuration = formatDuration(workout.durationMinutes);

  // Format date for better display
  const formattedDate = workout.updatedAt
    ? new Date(workout.updatedAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "No date";

  // Determine workout type styling
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

  const typeColor = getTypeStyle(workout.type);

  return (
    <div className="bg-midnight-green rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
      {/* Card Header
      <div className="h-32 bg-gradient-to-r from-dark-slate-gray to-midnight-green flex items-center justify-center p-4">
        <div className="bg-goldenrod/10 w-full h-full rounded-lg flex items-center justify-center">
          {workout.type ? (
            <span className="text-goldenrod text-5xl">
              {getWorkoutTypeEmoji(workout.type)}
            </span>
          ) : (
            <span className="text-goldenrod text-5xl">💪</span>
          )}
        </div>
      </div> */}

      {/* Card Body */}
      <div className="p-5">
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-heading-4 text-goldenrod truncate pr-2">
            {workout.name}
          </h3>
          <span className={`px-2 py-1 rounded-full text-xs ${typeColor}`}>
            {capitalizeFirstLetter(workout.type || "general")}
          </span>
        </div>

        {workout.description && (
          <p className="text-gray mb-4 text-sm line-clamp-2">
            {workout.description}
          </p>
        )}

        {/* Workout stats */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-gray-700 p-2 rounded-lg text-center">
            <p className="text-tiny text-gray">EXERCISES</p>
            <p className="text-goldenrod font-bold">{exerciseCount}</p>
          </div>
          <div className="bg-gray-700 p-2 rounded-lg text-center">
            <p className="text-tiny text-gray">DURATION</p>
            <p className="text-goldenrod font-bold">{formattedDuration}</p>
          </div>
        </div>

        {/* Status Badge */}
        {workout.status && (
          <div className="mb-4">
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                workout.status.toLowerCase() === "active"
                  ? "bg-green-100 text-green-800"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              {workout.status}
            </span>
          </div>
        )}

        {/* Last Updated */}
        <div className="text-xs text-gray mb-4">
          Last updated: {formattedDate}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center">
          <Link
            to={`/workouts/${workout.id}`}
            className="bg-goldenrod text-midnight-green px-4 py-2 rounded-lg font-bold hover:bg-dark-goldenrod transition-colors"
          >
            View Details
          </Link>

          {isOwner && (
            <div className="flex gap-2">
              {onEdit && (
                <button
                  onClick={() => onEdit(workout)}
                  className="bg-gray-700 text-white px-3 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Edit
                </button>
              )}

              {onDelete && (
                <button
                  onClick={() => onDelete(workout.id)}
                  className="bg-gray-700 text-white px-3 py-2 rounded-lg hover:bg-red-800 transition-colors"
                >
                  Delete
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Update the exercise count calculation to handle multiple possible formats
 */
const getExerciseCount = (workout) => {
  // Check all possible locations for workout exercises data
  if (workout.workoutExercises && Array.isArray(workout.workoutExercises)) {
    return workout.workoutExercises.length;
  }

  if (workout.exercises && Array.isArray(workout.exercises)) {
    return workout.exercises.length;
  }

  // If no exercises property exists or it's not an array, return 0
  return 0;
};

/**
 * Format duration in minutes to a readable format
 */
function formatDuration(minutes) {
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
}

/**
 * Get an emoji representing the workout type
 */
function getWorkoutTypeEmoji(type) {
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
}

/**
 * Capitalize the first letter of a string
 */
function capitalizeFirstLetter(string) {
  if (!string) return "";
  return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
}

export default WorkoutCard;
