import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import PropTypes from "prop-types";

/**
 * Exercise Card component displaying exercise in a compact horizontal layout
 * with Vimeo thumbnail as the static image
 * @param {Object} exercise - The exercise object containing details
 * @param {Function} onSelect - Optional callback when exercise is selected
 */
const ExerciseCard = ({ exercise, onSelect }) => {
  // Default image if none is provided
  const defaultImage = "/images/exercise-placeholder.jpg";
  const [thumbnailUrl, setThumbnailUrl] = useState(
    exercise.imageUrl || defaultImage
  );

  // Extract Vimeo ID from URL or use direct ID
  useEffect(() => {
    if (exercise.videoUrl) {
      // Extract Vimeo ID
      let vimeoId = exercise.videoUrl;

      // If it's a number, it's likely already the ID
      if (/^\d+$/.test(exercise.videoUrl)) {
        vimeoId = exercise.videoUrl;
      } else {
        // Try to extract ID from URL
        const match = exercise.videoUrl.match(
          /(?:vimeo\.com\/(?:manage\/videos\/|video\/|))(\d+)(?:$|\/|\?)/
        );
        if (match && match[1]) {
          vimeoId = match[1];
        }
      }

      // Set the thumbnail URL from Vimeo
      setThumbnailUrl(`https://vumbnail.com/${vimeoId}.jpg`);
    }
  }, [exercise.videoUrl, exercise.imageUrl]);

  // Function to handle click events
  const handleClick = () => {
    if (onSelect) {
      onSelect(exercise);
    }
  };

  return (
    <div
      className="bg-midnight-green rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 flex h-24"
      onClick={handleClick}
    >
      {/* Exercise Image - Left side */}
      <div className="w-24 h-full bg-midnight-green-darker flex-shrink-0">
        <img
          src={thumbnailUrl}
          alt={exercise.name}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.onerror = null; // Prevent infinite loop
            e.target.src = defaultImage;
          }}
        />
      </div>

      {/* Exercise Details - Right side */}
      <div className="p-3 flex flex-col justify-between flex-grow">
        <div>
          {/* Exercise Name */}
          <h3 className="text-sm font-bold text-goldenrod truncate">
            {exercise.name}
          </h3>

          {/* Target Muscle */}
          {exercise.primaryMuscleGroup && (
            <p className="text-xs text-gray-400 mt-0.5">
              Targets: {exercise.primaryMuscleGroup}
            </p>
          )}
        </div>

        {/* Badges Section */}
        <div className="flex items-center justify-center mt-1">
          {/* View Details Link */}
          <Link
            to={`/exercises/${exercise.id}`}
            className="text-xs text-goldenrod hover:text-yellow-500 transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            Details →
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
    videoUrl: PropTypes.string,
    imageUrl: PropTypes.string,
  }).isRequired,
  onSelect: PropTypes.func,
};

export default ExerciseCard;
