import React from "react";
import { Link } from "react-router-dom";
import PropTypes from "prop-types";

/**
 * Exercise Card component to display basic exercise information
 * @param {Object} exercise - The exercise object containing details
 * @param {Function} onSelect - Optional callback when exercise is selected
 */
const ExerciseCard = ({ exercise, onSelect }) => {
  // Default image if none is provided
  const defaultImage = "/images/exercise-placeholder.jpg";

  // Function to handle click events
  const handleClick = () => {
    if (onSelect) {
      onSelect(exercise);
    }
  };

  return (
    <div
      className="bg-amber-100 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300"
      onClick={handleClick}
    >
      {/* Exercise Image */}
      <div className="relative h-40 overflow-hidden bg-gray-800">
        {/* <img
          src={exercise.imageUrl || defaultImage}
          alt={exercise.name}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.src = defaultImage;
          }}
        /> */}

        {/* Difficulty Badge */}
        <div className="absolute top-0 right-0 m-2">
          <span
            className={`px-2 py-1 text-xs font-semibold rounded ${
              exercise.difficulty === "beginner"
                ? "bg-green-800 text-green-200"
                : exercise.difficulty === "intermediate"
                ? "bg-yellow-800 text-yellow-200"
                : "bg-red-800 text-red-200"
            }`}
          >
            {exercise.difficulty?.charAt(0).toUpperCase() +
              exercise.difficulty?.slice(1) || "Beginner"}
          </span>
        </div>

        {/* Muscle Group Badge */}
        {exercise.primaryMuscleGroup && (
          <div className="absolute bottom-0 left-0 m-2">
            <span className="px-2 py-1 text-xs font-semibold rounded bg-goldenrod/30 text-goldenrod">
              {exercise.primaryMuscleGroup}
            </span>
          </div>
        )}
      </div>

      {/* Exercise Details */}
      <div className="p-4">
        <h3 className="text-lg font-bold text-goldenrod mb-2 truncate">
          {exercise.name}
        </h3>

        <p className="text-gray-400 text-sm line-clamp-2 mb-3 h-10">
          {exercise.description || "No description available."}
        </p>

        {/* Equipment & Category */}
        <div className="flex flex-wrap gap-2 mt-2">
          {exercise.equipment && (
            <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">
              {exercise.equipment}
            </span>
          )}

          {exercise.category && (
            <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">
              {exercise.category}
            </span>
          )}
        </div>

        {/* View Details Link */}
        <div className="mt-4 flex justify-end">
          <Link
            to={`/exercises/${exercise.id}`}
            className="text-sm text-goldenrod hover:text-yellow-500 transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            View Details →
          </Link>
        </div>
      </div>
    </div>
  );
};

ExerciseCard.propTypes = {
  exercise: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    name: PropTypes.string.isRequired,
    description: PropTypes.string,
    difficulty: PropTypes.string,
    primaryMuscleGroup: PropTypes.string,
    equipment: PropTypes.string,
    category: PropTypes.string,
    imageUrl: PropTypes.string,
  }).isRequired,
  onSelect: PropTypes.func,
};

export default ExerciseCard;
