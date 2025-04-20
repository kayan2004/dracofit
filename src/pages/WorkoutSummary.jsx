import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import workoutLogsService from "../services/workoutLogsService";
import exerciseLogsService from "../services/exerciseLogsService";
import FormButton from "../components/common/FormButton";
import {
  FaCheckCircle,
  FaClock,
  FaDumbbell,
  FaFire,
  FaTrophy,
  FaShareAlt,
  FaRegCalendarCheck,
  FaChartLine,
  FaHome,
} from "react-icons/fa";

const WorkoutSummary = () => {
  const { workoutLogId } = useParams();
  const navigate = useNavigate();

  const [workoutLog, setWorkoutLog] = useState(null);
  const [exerciseLogs, setExerciseLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchWorkoutData = async () => {
      try {
        setLoading(true);

        // Fetch the workout log
        const workoutData = await workoutLogsService.getWorkoutLog(
          workoutLogId
        );
        setWorkoutLog(workoutData);

        // Fetch the exercise logs
        const exerciseData = await exerciseLogsService.getExerciseLogs(
          workoutLogId
        );
        setExerciseLogs(exerciseData);
      } catch (err) {
        console.error("Error fetching workout summary:", err);
        setError("Failed to load workout summary. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchWorkoutData();
  }, [workoutLogId]);

  const formatDuration = (seconds) => {
    if (!seconds) return "0:00";

    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTotalWeightLifted = () => {
    if (!exerciseLogs) return 0;

    return exerciseLogs.reduce((total, exercise) => {
      if (!exercise.sets) return total;

      const exerciseTotal = exercise.sets.reduce(
        (subtotal, set) => subtotal + (set.weight * set.reps || 0),
        0
      );

      return total + exerciseTotal;
    }, 0);
  };

  const getTotalReps = () => {
    if (!exerciseLogs) return 0;

    return exerciseLogs.reduce((total, exercise) => {
      if (!exercise.sets) return total;

      const exerciseTotal = exercise.sets.reduce(
        (subtotal, set) => subtotal + (set.reps || 0),
        0
      );

      return total + exerciseTotal;
    }, 0);
  };

  const handleShareWorkout = () => {
    // Implement sharing functionality
    alert("Sharing functionality will be implemented in the future.");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-slate-gray text-white p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-heading-1 text-goldenrod mb-6">
            Loading Workout Summary...
          </h1>
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-goldenrod"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-dark-slate-gray text-white p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-heading-1 text-goldenrod mb-6">Error</h1>
          <div className="bg-sepia/20 border border-sepia text-white p-4 rounded-lg mb-6">
            <p>{error}</p>
          </div>
          <div className="flex justify-center">
            <FormButton onClick={() => navigate("/workouts")}>
              Back to Workouts
            </FormButton>
          </div>
        </div>
      </div>
    );
  }

  if (!workoutLog) {
    return (
      <div className="min-h-screen bg-dark-slate-gray text-white p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-heading-1 text-goldenrod mb-6">
            Workout Not Found
          </h1>
          <div className="flex justify-center">
            <FormButton onClick={() => navigate("/workouts")}>
              Back to Workouts
            </FormButton>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-slate-gray text-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header with completion message */}
        <div className="mb-6 text-center">
          <div className="inline-block bg-green-800/30 border border-green-700 rounded-full px-4 py-1 text-green-400 text-sm mb-2">
            <FaCheckCircle className="inline mr-1" /> Workout Complete!
          </div>
          <h1 className="text-heading-1 text-goldenrod">
            {workoutLog.workoutPlan.name}
          </h1>
          <p className="text-gray-400">
            {formatDate(workoutLog.startTime)} •{" "}
            {formatTime(workoutLog.startTime)}
          </p>
        </div>

        {/* Workout stats overview */}
        <div className="bg-midnight-green rounded-lg shadow-lg mb-8 overflow-hidden">
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-gray-400 mb-1 flex items-center justify-center">
                  <FaClock className="mr-1" /> Duration
                </div>
                <div className="text-2xl md:text-3xl font-bold text-goldenrod">
                  {formatDuration(workoutLog.durationSeconds)}
                </div>
              </div>

              <div className="text-center">
                <div className="text-gray-400 mb-1 flex items-center justify-center">
                  <FaDumbbell className="mr-1" /> Exercises
                </div>
                <div className="text-2xl md:text-3xl font-bold text-goldenrod">
                  {exerciseLogs.length}
                </div>
              </div>

              <div className="text-center">
                <div className="text-gray-400 mb-1 flex items-center justify-center">
                  <FaFire className="mr-1" /> Weight Lifted
                </div>
                <div className="text-2xl md:text-3xl font-bold text-goldenrod">
                  {getTotalWeightLifted()} lbs
                </div>
              </div>

              <div className="text-center">
                <div className="text-gray-400 mb-1 flex items-center justify-center">
                  <FaTrophy className="mr-1" /> Total Reps
                </div>
                <div className="text-2xl md:text-3xl font-bold text-goldenrod">
                  {getTotalReps()}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Exercise details */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <FaDumbbell className="text-goldenrod mr-2" /> Exercise Details
          </h2>

          {exerciseLogs.map((exerciseLog) => (
            <div
              key={exerciseLog.id}
              className="bg-midnight-green rounded-lg mb-4 overflow-hidden shadow-md"
            >
              <div className="bg-dark-slate-gray p-3">
                <h3 className="font-bold">{exerciseLog.exercise.name}</h3>
              </div>
              <div className="p-4">
                {exerciseLog.sets && exerciseLog.sets.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-gray-400 border-b border-gray-700">
                          <th className="pb-2 text-left">Set</th>
                          <th className="pb-2 text-right">Weight</th>
                          <th className="pb-2 text-right">Reps</th>
                        </tr>
                      </thead>
                      <tbody>
                        {exerciseLog.sets.map((set, index) => (
                          <tr key={set.id} className="border-b border-gray-800">
                            <td className="py-2 text-left">{index + 1}</td>
                            <td className="py-2 text-right">
                              {set.weight} lbs
                            </td>
                            <td className="py-2 text-right">{set.reps}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-400 italic text-sm">
                    No sets recorded
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Notes and achievements */}
        <div className="bg-midnight-green rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <FaRegCalendarCheck className="text-goldenrod mr-2" /> Workout Notes
          </h2>

          <p className="text-gray-300 mb-4">
            {workoutLog.notes || "No notes recorded for this workout."}
          </p>

          <div className="mt-6 pt-6 border-t border-gray-700">
            <div className="flex items-center mb-3">
              <FaTrophy className="text-goldenrod mr-2" />
              <h3 className="text-lg font-semibold">Achievements</h3>
            </div>

            <div className="bg-dark-slate-gray rounded-lg p-4">
              <div className="flex items-center">
                <div className="mr-3 bg-sepia/30 p-2 rounded-full">
                  <FaFire className="text-sepia" />
                </div>
                <div>
                  <p className="font-semibold">Workout Completed</p>
                  <p className="text-gray-400 text-sm">
                    You've completed a full workout session!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex space-x-3">
            <Link to="/workouts">
              <FormButton styles="px-4 py-2 flex items-center">
                <FaHome className="mr-2" /> Home
              </FormButton>
            </Link>
            <Link to="/progress">
              <FormButton styles="px-4 py-2 flex items-center">
                <FaChartLine className="mr-2" /> View Progress
              </FormButton>
            </Link>
          </div>

          <button
            onClick={handleShareWorkout}
            className="flex items-center bg-dark-slate-gray hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <FaShareAlt className="mr-2" /> Share Workout
          </button>
        </div>
      </div>
    </div>
  );
};

export default WorkoutSummary;
