import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import exercisesService from "../../services/exercisesService";
import VideoPlayer from "../common/VideoPlayer"; // Import the new component

const ExerciseDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [exercise, setExercise] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchExercise = async () => {
      try {
        setLoading(true);
        const data = await exercisesService.getExerciseById(id);
        setExercise(data);
      } catch (err) {
        console.error("Error fetching exercise:", err);
        setError(err.message || "Failed to load exercise details");
      } finally {
        setLoading(false);
      }
    };

    fetchExercise();
  }, [id]);

  const handleGoBack = () => {
    navigate(-1);
  };

  // Function to get difficulty color class
  const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case "beginner":
        return "bg-emerald-100 text-emerald-800";
      case "intermediate":
        return "bg-amber-100 text-amber-800";
      case "advanced":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-slate-gray flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-goldenrod"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-dark-slate-gray p-6 flex flex-col items-center justify-center text-gray">
        <div className="bg-sepia/20 border border-goldenrod text-goldenrod p-6 rounded-lg max-w-lg w-full text-center">
          <div className="text-3xl mb-3">⚠️</div>
          <h2 className="text-xl font-bold mb-2">Error Loading Exercise</h2>
          <p>{error}</p>
          <button
            onClick={handleGoBack}
            className="mt-4 px-4 py-2 bg-goldenrod text-midnight-green-darker rounded-lg flex items-center justify-center"
          >
            <span className="mr-2">←</span>
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!exercise) {
    return (
      <div className="min-h-screen bg-midnight-green p-6 flex flex-col items-center justify-center text-white">
        <div className="bg-sepia/20 border border-goldenrod text-goldenrod p-6 rounded-lg max-w-lg w-full text-center">
          <div className="text-3xl mb-3">⚠️</div>
          <h2 className="text-xl font-bold mb-2">Exercise Not Found</h2>
          <p>
            The exercise you're looking for doesn't exist or has been removed.
          </p>
          <button
            onClick={handleGoBack}
            className="mt-4 px-4 py-2 bg-goldenrod text-midnight-green-darker rounded-lg flex items-center justify-center"
          >
            <span className="mr-2">←</span>
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-slate-gray text-gray p-6">
      {/* Back button */}
      <button
        onClick={handleGoBack}
        className="flex items-center text-goldenrod hover:text-dark-goldenrod transition-colors mb-6"
      >
        <span className="mr-2">←</span>
        Back to Exercises
      </button>

      <div className="max-w-4xl mx-auto">
        {/* Header section */}
        <div className="mb-8">
          <h1 className="text-4xl text-goldenrod mb-4">{exercise.name}</h1>

          <div className="flex flex-wrap gap-3 mt-4">
            {/* Difficulty badge */}
            {exercise.difficulty && (
              <span
                className={`px-3 py-1 rounded-full text-sm ${getDifficultyColor(
                  exercise.difficulty
                )}`}
              >
                {exercise.difficulty}
              </span>
            )}

            {/* Equipment badge */}
            {exercise.equipment && (
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-700 text-white">
                <span className="mr-1">🏋️</span>
                {exercise.equipment}
              </span>
            )}

            {/* Exercise type badge */}
            {exercise.type && (
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-dark-slate-gray text-white">
                {exercise.type}
              </span>
            )}
          </div>
        </div>

        {/* Main content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left column - Video/Image and target muscles */}
          <div className="md:col-span-1">
            {/* Use the new VideoPlayer component */}
            <VideoPlayer
              url={exercise.videoUrl}
              title={`${exercise.name} demonstration`}
              className="mb-6"
              fallbackImage={
                exercise.imageUrl
                  ? {
                      src: exercise.imageUrl,
                      alt: `${exercise.name} demonstration`,
                    }
                  : null
              }
            />

            {/* Target muscles */}
            <div className="bg-gray-800 rounded-xl p-5 mb-6">
              <h3 className="text-xl text-goldenrod mb-3">Target Muscles</h3>
              <div className="flex flex-wrap gap-2">
                {exercise.targetMuscles && exercise.targetMuscles.length > 0 ? (
                  exercise.targetMuscles.map((muscle, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-dark-slate-gray rounded-full text-sm"
                    >
                      {muscle}
                    </span>
                  ))
                ) : (
                  <p className="text-gray-400">No target muscles specified</p>
                )}
              </div>
            </div>
          </div>

          {/* Right column - Description and instructions */}
          <div className="md:col-span-2">
            {/* Description */}
            <div className="bg-gray-800 rounded-xl p-6 mb-6">
              <h3 className="text-2xl text-goldenrod mb-4">
                About This Exercise
              </h3>
              {exercise.description ? (
                <p className="text-white leading-relaxed whitespace-pre-line">
                  {exercise.description}
                </p>
              ) : (
                <p className="text-gray-400 italic">
                  No description available for this exercise.
                </p>
              )}
            </div>

            {/* Instructions (if you want to add this field to your backend) */}
            <div className="bg-gray-800 rounded-xl p-6 mb-6">
              <h3 className="text-2xl text-goldenrod mb-4">How To Perform</h3>
              {exercise.instructions ? (
                <ol className="text-white leading-relaxed list-decimal pl-5 space-y-2">
                  {exercise.instructions.split("\n").map((step, index) => (
                    <li key={index}>{step}</li>
                  ))}
                </ol>
              ) : (
                <p className="text-gray-400 italic">
                  Detailed instructions not available for this exercise.
                </p>
              )}
            </div>

            {/* Add to workout button */}
            <div className="mt-8 flex justify-center">
              <button
                className="px-6 py-3 bg-goldenrod text-midnight-green-darker rounded-lg border-r-6 border-b-6 border-dark-goldenrod hover:bg-dark-goldenrod transition-colors"
                onClick={() => {
                  // This will be implemented when workout functionality is ready
                  console.log("Add to workout:", exercise);
                }}
              >
                Add to Workout
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExerciseDetails;
