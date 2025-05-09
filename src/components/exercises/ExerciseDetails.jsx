import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom"; // Ensure useNavigate is imported
import exercisesService from "../../services/exercisesService";
import VideoPlayer from "../common/VideoPlayer";
import { FaRobot } from "react-icons/fa";
// Remove AskAI import if it was previously used here
// import AskAI from "../common/AskAI";

const ExerciseDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate(); // Initialize navigate
  const [exercise, setExercise] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchExercise = async () => {
      try {
        setLoading(true);
        const data = await exercisesService.getExerciseById(id);
        setExercise(data);
        setError(null);
      } catch (err) {
        setError(err.message || "Failed to fetch exercise details.");
        setExercise(null);
      } finally {
        setLoading(false);
      }
    };
    fetchExercise();
  }, [id]);

  // Function to navigate to the main chat page with the exercise query
  const askAboutExercise = () => {
    if (!exercise) return; // Don't navigate if exercise data isn't loaded

    const question = `How can I perform ${exercise.name}?`;
    // Navigate to the chatbot route and pass the question in the state
    navigate("/chatbot", { state: { prefillMessage: question } });
  };

  const getDifficultyColor = (difficulty) => {
    /* ... */
  };
  const handleGoBack = () => navigate(-1);

  if (loading)
    return <div className="text-center p-10">Loading exercise...</div>;
  if (error)
    return <div className="text-center p-10 text-red-500">Error: {error}</div>;
  if (!exercise)
    return <div className="text-center p-10">Exercise not found.</div>;

  return (
    <div className="min-h-screen bg-dark-slate-gray text-gray p-6">
      {/* Back button */}
      <button
        onClick={handleGoBack}
        className="mb-4 text-goldenrod hover:text-dark-goldenrod transition-colors"
      >
        &larr; Back to Exercises
      </button>

      <div className="max-w-4xl mx-auto">
        {/* Header section */}
        <div className="mb-6 text-center md:text-left">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            {exercise.name}
          </h1>
          <span
            className={`px-3 py-1 rounded-full text-sm font-semibold ${getDifficultyColor(
              exercise.difficulty
            )}`}
          >
            {exercise.difficulty}
          </span>
        </div>

        {/* Main content grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left column: Video and Muscles */}
          <div className="md:col-span-1 space-y-4">
            {exercise.videoUrl && <VideoPlayer videoUrl={exercise.videoUrl} />}
            <div className="bg-midnight-green p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-goldenrod mb-2">
                Target Muscles
              </h3>
              <ul className="list-disc list-inside text-gray">
                {exercise.targetMuscles?.map((muscle, index) => (
                  <li key={index}>{muscle}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right column: Description, Instructions, Ask AI Button */}
          <div className="md:col-span-2 space-y-6">
            {exercise.description && (
              <div className="bg-midnight-green p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-goldenrod mb-2">
                  Description
                </h3>
                <p className="text-gray">{exercise.description}</p>
              </div>
            )}
            {exercise.instructions && (
              <div className="bg-midnight-green p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-goldenrod mb-2">
                  Instructions
                </h3>
                <ol className="list-decimal list-inside text-gray space-y-1">
                  {exercise.instructions
                    .split("\n")
                    .map(
                      (step, index) =>
                        step.trim() && <li key={index}>{step.trim()}</li>
                    )}
                </ol>
              </div>
            )}

            {/* Ask AI Button - Updated onClick */}
            <div className="bg-dark-aquamarine rounded-lg">
              <button
                onClick={askAboutExercise} // Use the new handler
                className="w-full text-midnight-green rounded-xl p-4 flex items-center justify-center transition-colors hover:bg-opacity-80"
              >
                <FaRobot className="text-goldenrod text-xl mr-3" />
                <span>Ask AI: How to perform {exercise.name}?</span>
              </button>
            </div>

            {/* Placeholder for Add to Workout Button */}
            {/* <button className="w-full bg-goldenrod text-midnight-green font-bold py-2 px-4 rounded hover:bg-dark-goldenrod transition-colors">
              Add to Workout (Coming Soon)
            </button> */}

            {/* Remove the AskAI component if it was here */}
            {/* <AskAI context={exercise} /> */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExerciseDetails;
