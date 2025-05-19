import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import exercisesService from "../../services/exercisesService";
import exerciseLogsService from "../../services/exerciseLogsService"; // Import exerciseLogsService
import VideoPlayer from "../common/VideoPlayer";
import { FaRobot, FaChartLine, FaSpinner } from "react-icons/fa"; // Added FaChartLine and FaSpinner

const ExerciseDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [exercise, setExercise] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasProgressData, setHasProgressData] = useState(false);
  const [checkingProgress, setCheckingProgress] = useState(false);

  useEffect(() => {
    const fetchExerciseAndProgress = async () => {
      try {
        setLoading(true);
        setHasProgressData(false); // Reset progress data flag
        setCheckingProgress(true); // Indicate progress check has started

        const exerciseData = await exercisesService.getExerciseById(id);
        setExercise(exerciseData);
        setError(null); // Clear previous error if exercise fetch succeeds

        // After fetching exercise, check for progress data
        if (exerciseData) {
          try {
            const historyLogs = await exerciseLogsService.getExerciseHistory(
              id
            );
            if (historyLogs && historyLogs.length > 0) {
              setHasProgressData(true);
            } else {
              setHasProgressData(false);
            }
          } catch (progressError) {
            console.error(
              "Failed to check exercise progress:",
              progressError.message
            );
            // Don't set the main page error, just means progress button won't show
            setHasProgressData(false);
          }
        }
      } catch (err) {
        setError(err.message || "Failed to fetch exercise details.");
        setExercise(null);
        setHasProgressData(false); // Ensure it's false on error
      } finally {
        setLoading(false);
        setCheckingProgress(false); // Indicate progress check has finished
      }
    };

    if (id) {
      fetchExerciseAndProgress();
    }
  }, [id]);

  const askAboutExercise = () => {
    if (!exercise) return;
    const question = `How can I perform ${exercise.name}?`;
    navigate("/chatbot", { state: { prefillMessage: question } });
  };

  const viewProgressChart = () => {
    if (!exercise) return;
    navigate(`/exercises/${exercise.id}/progress`);
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case "beginner":
        return "bg-green-500 text-white";
      case "intermediate":
        return "bg-yellow-500 text-black";
      case "expert":
        return "bg-red-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };
  const handleGoBack = () => navigate(-1);

  if (loading && !exercise)
    // Show initial loading only if exercise is not yet set
    return (
      <div className="text-center p-10 text-white">
        <FaSpinner className="animate-spin text-4xl mx-auto text-goldenrod" />
        <p className="mt-2">Loading exercise...</p>
      </div>
    );
  if (error)
    return (
      <div className="text-center p-10 text-red-400 bg-red-900/30 rounded-lg">
        Error: {error}
      </div>
    );
  if (!exercise)
    return (
      <div className="text-center p-10 text-gray-400">Exercise not found.</div>
    );

  return (
    <div className="min-h-screen bg-dark-slate-gray text-gray-300 p-6">
      <button
        onClick={handleGoBack}
        className="mb-4 text-goldenrod hover:text-dark-goldenrod transition-colors"
      >
        &larr; Back to Exercises
      </button>

      <div className="max-w-4xl mx-auto">
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 space-y-4">
            {exercise.videoUrl && <VideoPlayer videoUrl={exercise.videoUrl} />}
            <div className="bg-midnight-green p-4 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-goldenrod mb-2">
                Target Muscles
              </h3>
              <ul className="list-disc list-inside text-gray-300">
                {exercise.targetMuscles?.map((muscle, index) => (
                  <li key={index}>{muscle}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="md:col-span-2 space-y-6">
            {exercise.description && (
              <div className="bg-midnight-green p-4 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-goldenrod mb-2">
                  Description
                </h3>
                <p className="text-gray-300">{exercise.description}</p>
              </div>
            )}
            {exercise.instructions && (
              <div className="bg-midnight-green p-4 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-goldenrod mb-2">
                  Instructions
                </h3>
                <ol className="list-decimal list-inside text-gray-300 space-y-1">
                  {exercise.instructions
                    .split("\n")
                    .map(
                      (step, index) =>
                        step.trim() && <li key={index}>{step.trim()}</li>
                    )}
                </ol>
              </div>
            )}

            <div className="bg-dark-aquamarine rounded-lg shadow">
              <button
                onClick={askAboutExercise}
                className="w-full text-midnight-green rounded-xl p-4 flex items-center justify-center transition-colors hover:bg-opacity-80"
              >
                <FaRobot className="text-goldenrod text-xl mr-3" />
                <span>Ask AI: How to perform {exercise.name}?</span>
              </button>
            </div>

            {/* See Progress Chart Button */}
            {hasProgressData && (
              <div className="mt-4">
                <button
                  onClick={viewProgressChart}
                  disabled={checkingProgress || loading} // Disable if still checking or main loading
                  className="w-full bg-goldenrod text-midnight-green font-bold py-3 px-4 rounded-lg hover:bg-dark-goldenrod transition-colors flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {checkingProgress || loading ? (
                    <FaSpinner className="animate-spin text-xl mr-3" />
                  ) : (
                    <FaChartLine className="text-xl mr-3" />
                  )}
                  <span>See Progress Chart</span>
                </button>
              </div>
            )}
            {!checkingProgress && !hasProgressData && !loading && (
              <div className="bg-midnight-green p-4 rounded-lg shadow text-center text-gray-400 text-sm">
                No progress data logged for this exercise yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExerciseDetails;
