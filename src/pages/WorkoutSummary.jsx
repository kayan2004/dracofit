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
        setError(null); // Reset error on new fetch

        // Fetch the workout log
        console.log(`Fetching workout log with ID: ${workoutLogId}`);
        const workoutData = await workoutLogsService.getWorkoutLog(
          workoutLogId
        );
        console.log("Workout Log Data:", workoutData);
        setWorkoutLog(workoutData);

        // Fetch the exercise logs for this workout log
        console.log(
          `Fetching exercise logs for workout log ID: ${workoutLogId}`
        );
        const exerciseData = await exerciseLogsService.getExerciseLogs(
          workoutLogId
        );
        console.log("Exercise Logs Data:", exerciseData);
        setExerciseLogs(exerciseData);
      } catch (err) {
        console.error("Error fetching workout summary:", err);
        if (err.response) {
          console.error("Server Response:", err.response.data);
        }
        setError(
          `Failed to load workout summary: ${
            err.message || "Unknown error"
          }. Please try again.`
        );
      } finally {
        setLoading(false);
      }
    };

    fetchWorkoutData();
  }, [workoutLogId]);

  // Updated to format minutes
  const formatDuration = (minutes) => {
    if (minutes === undefined || minutes === null || isNaN(minutes))
      return "0 min";
    const mins = Math.floor(minutes);
    return `${mins} min`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch (e) {
      return "Invalid Date";
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (e) {
      return "Invalid Time";
    }
  };

  // Updated to use exerciseLogs and setsData
  const getTotalWeightLifted = () => {
    if (!exerciseLogs || exerciseLogs.length === 0) return 0;

    return exerciseLogs.reduce((total, exerciseLog) => {
      // Use setsData instead of sets
      if (!exerciseLog.setsData || exerciseLog.setsData.length === 0)
        return total;

      const exerciseTotal = exerciseLog.setsData.reduce(
        (subtotal, set) => subtotal + (set.weight || 0) * (set.reps || 0), // Handle potentially missing weight/reps
        0
      );

      return total + exerciseTotal;
    }, 0);
  };

  // Updated to use exerciseLogs and setsData
  const getTotalReps = () => {
    if (!exerciseLogs || exerciseLogs.length === 0) return 0;

    return exerciseLogs.reduce((total, exerciseLog) => {
      // Use setsData instead of sets
      if (!exerciseLog.setsData || exerciseLog.setsData.length === 0)
        return total;

      const exerciseTotal = exerciseLog.setsData.reduce(
        (subtotal, set) => subtotal + (set.reps || 0), // Handle potentially missing reps
        0
      );

      return total + exerciseTotal;
    }, 0);
  };

  const handleShareWorkout = () => {
    // Implement sharing functionality
    alert("Sharing functionality will be implemented in the future.");
  };

  // --- Loading State ---
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

  // --- Error State ---
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

  // --- No Workout Log Found State ---
  // Check specifically if workoutLog is null AFTER loading and no error
  if (!workoutLog) {
    return (
      <div className="min-h-screen bg-dark-slate-gray text-white p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-heading-1 text-goldenrod mb-6">
            Workout Not Found
          </h1>
          <p className="text-gray-400 mb-6">
            Could not find details for the requested workout log.
          </p>
          <div className="flex justify-center">
            <FormButton onClick={() => navigate("/workouts")}>
              Back to Workouts
            </FormButton>
          </div>
        </div>
      </div>
    );
  }

  // --- Main Content ---
  return (
    <div className="min-h-screen bg-dark-slate-gray text-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header with completion message */}
        <div className="mb-6 text-center">
          <div className="inline-block bg-green-800/30 border border-green-700 rounded-full px-4 py-1 text-green-400 text-sm mb-2">
            <FaCheckCircle className="inline mr-1" /> Workout Complete!
          </div>
          <h1 className="text-heading-1 text-goldenrod">
            {/* Use optional chaining in case workoutPlan is null */}
            {workoutLog.workoutPlan?.name || "Workout"}
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
                  {/* Use durationMinutes from workoutLog */}
                  {formatDuration(workoutLog.durationMinutes)}
                </div>
              </div>

              <div className="text-center">
                <div className="text-gray-400 mb-1 flex items-center justify-center">
                  <FaDumbbell className="mr-1" /> Exercises
                </div>
                <div className="text-2xl md:text-3xl font-bold text-goldenrod">
                  {/* Check if exerciseLogs is an array */}
                  {Array.isArray(exerciseLogs) ? exerciseLogs.length : 0}
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

          {/* Check if exerciseLogs is an array and has items */}
          {Array.isArray(exerciseLogs) && exerciseLogs.length > 0 ? (
            exerciseLogs.map((exerciseLog) => (
              <div
                key={exerciseLog.id} // Use exerciseLog.id as key
                className="bg-midnight-green rounded-lg mb-4 overflow-hidden shadow-md"
              >
                <div className="bg-dark-slate-gray p-3">
                  {/* Use optional chaining for safety */}
                  <h3 className="font-bold">
                    {exerciseLog.exercise?.name || "Unknown Exercise"}
                  </h3>
                </div>
                <div className="p-4">
                  {/* Check setsData instead of sets */}
                  {exerciseLog.setsData && exerciseLog.setsData.length > 0 ? (
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
                          {/* Iterate over setsData */}
                          {exerciseLog.setsData.map((set, index) => (
                            // Use index or set.setNumber for key if set.id doesn't exist
                            <tr
                              key={`${exerciseLog.id}-set-${index}`}
                              className="border-b border-gray-800"
                            >
                              {/* Use set.setNumber if available, otherwise index + 1 */}
                              <td className="py-2 text-left">
                                {set.setNumber ?? index + 1}
                              </td>
                              <td className="py-2 text-right">
                                {/* Display weight or '-' if undefined/null */}
                                {set.weight !== undefined && set.weight !== null
                                  ? `${set.weight} lbs`
                                  : "-"}
                              </td>
                              <td className="py-2 text-right">
                                {set.reps ?? "-"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-gray-400 italic text-sm">
                      No sets recorded for this exercise.
                    </p>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="bg-midnight-green rounded-lg p-4 text-center text-gray-400">
              No exercises were logged for this workout.
            </div>
          )}
        </div>

        {/* Notes and achievements (Keep as is, assuming workoutLog.notes exists) */}
        {/* <div className="bg-midnight-green rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <FaRegCalendarCheck className="text-goldenrod mr-2" /> Workout Notes
          </h2>
          <p className="text-gray-300 mb-4">
            {workoutLog.notes || "No notes recorded for this workout."}
          </p> */}
        {/* Achievements section can remain */}
        {/* <div className="mt-6 pt-6 border-t border-gray-700">
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
          </div> */}
        {/* </div> */}

        {/* Action buttons (Keep as is)
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
        </div> */}
      </div>
    </div>
  );
};

export default WorkoutSummary;
