import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import workoutsService from "../services/workoutsService";
import workoutExercisesService from "../services/workoutExercisesService";
import workoutLogsService from "../services/workoutLogsService";
import exerciseLogsService from "../services/exerciseLogsService";
import Timer from "../components/common/Timer";
import CurrentExercisePanel from "../components/workouts/CurrentExercisePanel";
import VideoPlayer from "../components/common/VideoPlayer";
// import userPetService from "../services/userPetService"; // Not used directly

// Helper to generate a unique key for sessionStorage
const getSessionStorageKey = (workoutId, userId) =>
  `activeWorkoutSession_${userId}_${workoutId}`;

const WorkoutSession = () => {
  const { workoutId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [loading, setLoading] = useState(true);
  const [workout, setWorkout] = useState(null);
  const [workoutLog, setWorkoutLog] = useState(null);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [completedExercises, setCompletedExercises] = useState([]);
  const [startTime, setStartTime] = useState(null);
  const [error, setError] = useState(null);
  const [currentSetIndex, setCurrentSetIndex] = useState(0);
  const [currentExerciseSetData, setCurrentExerciseSetData] = useState([]);
  const [notification, setNotification] = useState({
    show: false,
    message: "",
    type: "",
  });
  const [isSessionMarkedCompleted, setIsSessionMarkedCompleted] =
    useState(false);

  // --- ADD THIS REF ---
  const isInitializingRef = useRef(false);
  // --- END ADD REF ---

  const sessionStorageKey = currentUser
    ? getSessionStorageKey(workoutId, currentUser.id)
    : null;

  const showNotification = (message, type = "success") => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: "", type: "" });
    }, 3000);
  };

  // EFFECT TO SAVE STATE TO SESSION STORAGE
  useEffect(() => {
    if (
      !sessionStorageKey ||
      loading ||
      error ||
      isSessionMarkedCompleted || // Do not save if session was just marked completed
      (workoutLog && workoutLog.endTime) // Do not save if the log itself is already completed
    ) {
      // If the session is marked completed, ensure its storage is cleared.
      if (
        (isSessionMarkedCompleted || (workoutLog && workoutLog.endTime)) &&
        sessionStorageKey
      ) {
        sessionStorage.removeItem(sessionStorageKey);
      }
      return;
    }

    if (
      workoutLog &&
      workoutLog.id &&
      startTime &&
      workout &&
      workout.exercises &&
      workout.exercises.length > 0
    ) {
      const sessionState = {
        workoutLog, // Save the full workoutLog
        currentExerciseIndex,
        completedExercises,
        startTime: startTime.toISOString(),
        currentSetIndex,
        currentExerciseSetData,
        workout,
      };
      try {
        sessionStorage.setItem(sessionStorageKey, JSON.stringify(sessionState));
        console.log("Session state saved.");
      } catch (e) {
        console.error("Error saving session state to sessionStorage:", e);
      }
    }
  }, [
    workoutLog,
    currentExerciseIndex,
    completedExercises,
    startTime,
    currentSetIndex,
    currentExerciseSetData,
    workout,
    sessionStorageKey,
    loading,
    error,
    isSessionMarkedCompleted, // Add as dependency
  ]);

  // EFFECT TO INITIALIZE WORKOUT SESSION (OR RESUME)
  useEffect(() => {
    if (!workoutId || !currentUser || !sessionStorageKey) {
      if (!currentUser) setError("User not available. Cannot start session.");
      else if (!workoutId) setError("Workout ID is missing.");
      setLoading(false);
      return;
    }

    const initializeWorkoutSession = async () => {
      // --- ADD THIS GUARD ---
      if (
        isInitializingRef.current &&
        !sessionStorage.getItem(sessionStorageKey)
      ) {
        // Only skip if truly a new init and already running
        console.log(
          "WorkoutSession: Initialization already in progress, skipping duplicate run."
        );
        return;
      }
      isInitializingRef.current = true;
      // --- END GUARD ---

      setLoading(true);
      setError(null);
      setIsSessionMarkedCompleted(false);
      let sessionResumed = false;

      try {
        const savedSessionRaw = sessionStorage.getItem(sessionStorageKey);
        if (savedSessionRaw) {
          const parsedSession = JSON.parse(savedSessionRaw);
          if (
            parsedSession.workoutLog &&
            parsedSession.workoutLog.id &&
            !parsedSession.workoutLog.endTime &&
            parsedSession.startTime &&
            parsedSession.workout &&
            parsedSession.workout.exercises &&
            parsedSession.workout.exercises.length > 0 &&
            typeof parsedSession.currentExerciseIndex === "number" &&
            parsedSession.currentExerciseIndex <
              parsedSession.workout.exercises.length
          ) {
            setWorkout(parsedSession.workout);
            setWorkoutLog(parsedSession.workoutLog);
            setStartTime(new Date(parsedSession.startTime));
            setCurrentExerciseIndex(parsedSession.currentExerciseIndex);
            setCurrentSetIndex(parsedSession.currentSetIndex || 0);
            setCompletedExercises(parsedSession.completedExercises || []);
            setCurrentExerciseSetData(
              parsedSession.currentExerciseSetData || []
            );
            sessionResumed = true;
            console.log("Workout session resumed from sessionStorage.");
          } else {
            // Invalid session data or session was already completed, clear it
            console.log(
              "Session data invalid or workout already completed in storage. Clearing sessionStorage."
            );
            sessionStorage.removeItem(sessionStorageKey);
          }
        }
      } catch (e) {
        console.error("Error parsing session data from sessionStorage:", e);
        sessionStorage.removeItem(sessionStorageKey);
      }

      if (sessionResumed) {
        setLoading(false);
        isInitializingRef.current = false; // Reset guard if session resumed
        return;
      }

      // Reset states for a fresh start if not resuming
      setWorkout(null);
      setWorkoutLog(null);
      setStartTime(null);
      setCurrentExerciseIndex(0);
      setCurrentSetIndex(0);
      setCompletedExercises([]);
      setCurrentExerciseSetData([]);

      try {
        const workoutData = await workoutsService.getWorkoutById(workoutId);
        const exercisesData = await workoutExercisesService.getWorkoutExercises(
          workoutId
        );

        const combinedData = {
          ...workoutData,
          exercises: exercisesData.map((item) => {
            const exercise = item.exercise || {};
            return {
              id: exercise.id,
              exerciseId: exercise.id,
              name: exercise.name || "Unknown Exercise",
              muscleGroup: exercise.muscleGroup || exercise.target || "Various",
              instructions: exercise.instructions || "",
              sets: item.sets || 3,
              reps: item.reps || 10,
              restTimeSeconds: item.restTimeSeconds || 60,
              videoUrl: exercise.videoUrl || exercise.vimeo_id || null,
            };
          }),
        };

        if (!combinedData.exercises || combinedData.exercises.length === 0) {
          setError(
            "This workout has no exercises. Please add exercises to the workout first."
          );
          setLoading(false);
          return;
        }
        setWorkout(combinedData);

        // This is the critical API call
        console.log(
          "WorkoutSession: Attempting to start new workout log via API..."
        );
        const initialWorkoutLog = await workoutLogsService.startWorkout({
          workoutPlanId: parseInt(workoutId),
        });
        setWorkoutLog(initialWorkoutLog);
        setStartTime(new Date(initialWorkoutLog.startTime || Date.now()));
        console.log(
          "New workout session started with log ID:",
          initialWorkoutLog.id
        );
      } catch (err) {
        console.error("Error initializing new workout session:", err);
        setError(
          `Failed to start workout: ${
            err.response?.data?.message || err.message || "Unknown error"
          }`
        );
      } finally {
        setLoading(false);
        // --- RESET GUARD IN FINALLY ---
        isInitializingRef.current = false;
        // --- END RESET ---
      }
    };

    initializeWorkoutSession();

    // Optional: Cleanup ref on unmount, though finally block should handle it.
    // return () => {
    //   isInitializingRef.current = false;
    // };
  }, [workoutId, currentUser, sessionStorageKey]);

  const handleSetComplete = async (setData) => {
    if (isSessionMarkedCompleted || (workoutLog && workoutLog.endTime)) {
      showNotification("Workout already completed.", "info");
      return; // Prevent actions if workout is already considered complete
    }
    try {
      const exercises = workout?.exercises || [];
      const currentExercise = exercises[currentExerciseIndex];
      const totalSets = currentExercise?.sets || 3;

      if (!currentExercise || !workoutLog?.id) {
        console.error("Missing current exercise or workout log ID");
        showNotification("Error: Cannot record set.", "error");
        return;
      }

      const newSetEntry = {
        setNumber: currentSetIndex + 1,
        reps: parseInt(setData.reps) || 0,
        weight:
          setData.weight !== undefined && setData.weight !== ""
            ? parseInt(setData.weight)
            : undefined,
      };
      const updatedSetData = [...currentExerciseSetData, newSetEntry];
      setCurrentExerciseSetData(updatedSetData);

      if (currentSetIndex >= totalSets - 1) {
        console.log(
          `Last set for exercise ${currentExercise.id} completed. Saving ExerciseLog.`
        );
        try {
          const payload = {
            exerciseId: currentExercise.exerciseId,
            setsData: updatedSetData,
          };
          await exerciseLogsService.createExerciseLog(workoutLog.id, payload);
          showNotification(
            `Exercise ${currentExercise.name} completed and logged!`
          );
          setCurrentExerciseSetData([]);
          setCurrentSetIndex(0);

          if (currentExerciseIndex < exercises.length - 1) {
            setCompletedExercises([
              ...completedExercises,
              currentExerciseIndex,
            ]);
            setCurrentExerciseIndex(currentExerciseIndex + 1);
          } else {
            setCompletedExercises([
              ...completedExercises,
              currentExerciseIndex,
            ]);
            await handleCompleteWorkout(); // Await completion
          }
        } catch (createErr) {
          console.error("Error creating exercise log:", createErr);
          showNotification(
            `Failed to save exercise log: ${
              createErr.response?.data?.message?.join(", ") ||
              createErr.message ||
              "Unknown error"
            }`,
            "error"
          );
        }
      } else {
        setCurrentSetIndex(currentSetIndex + 1);
        showNotification(`Set ${currentSetIndex + 1} completed! Next set.`);
      }
    } catch (err) {
      console.error("Error in handleSetComplete:", err);
      showNotification(`An unexpected error occurred: ${err.message}`, "error");
    }
  };

  const handleCompleteWorkout = async () => {
    if (!workoutLog || !workoutLog.id || workoutLog.endTime) {
      // Check if already has endTime
      console.warn(
        "Workout log not available for completion or already completed."
      );
      if (workoutLog && workoutLog.id && workoutLog.endTime) {
        // If somehow called again on an already completed log, just navigate
        navigate(`/workout-summary/${workoutLog.id}`);
      }
      return;
    }

    const currentEndTime = new Date();
    try {
      const updatedLogFromServer = await workoutLogsService.completeWorkout(
        workoutLog.id,
        {
          endTime: currentEndTime.toISOString(),
        }
      );

      setWorkoutLog(updatedLogFromServer); // Update state with the log that has endTime
      setIsSessionMarkedCompleted(true); // Set flag to prevent further saves/actions

      // Explicitly clear session storage as a final step for this session
      if (sessionStorageKey) {
        sessionStorage.removeItem(sessionStorageKey);
        console.log("Session storage cleared on workout completion.");
      }

      showNotification("Workout completed successfully!");
      setTimeout(() => {
        navigate(`/workout-summary/${workoutLog.id}`);
      }, 1500);
    } catch (err) {
      console.error("Error completing workout:", err);
      showNotification(
        `Failed to complete workout: ${
          err.response?.data?.message || err.message || "Unknown error"
        }`,
        "error"
      );
      // Do NOT set isSessionMarkedCompleted to true if API call fails
    }
  };

  const handleAbandonWorkout = async () => {
    if (window.confirm("Are you sure you want to abandon this workout?")) {
      try {
        setIsSessionMarkedCompleted(true); // Mark as completed to stop session saving
        if (sessionStorageKey) {
          sessionStorage.removeItem(sessionStorageKey);
        }
        if (workoutLog && workoutLog.id && !workoutLog.endTime) {
          // Only abandon if not already completed
          await workoutLogsService.abandonWorkout(workoutLog.id);
        }
        showNotification("Workout abandoned.");
        setTimeout(() => {
          navigate("/workouts");
        }, 1000);
      } catch (err) {
        console.error("Error abandoning workout:", err);
        showNotification("Failed to abandon workout.", "error");
        setIsSessionMarkedCompleted(false); // Revert if abandon failed
      }
    }
  };

  if (loading) {
    return (
      <div className="p-4 text-center text-goldenrod">
        Loading workout session...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-500">
        <p>{error}</p>
        <button
          onClick={() => navigate("/workouts")}
          className="mt-4 bg-goldenrod hover:bg-dark-goldenrod text-midnight-green py-2 px-4 rounded-md"
        >
          Back to Workouts
        </button>
      </div>
    );
  }

  const exercises = workout?.exercises || [];
  const currentExercise = exercises[currentExerciseIndex];
  const totalSets = currentExercise?.sets || 3;
  const vimeoVideoId = currentExercise?.videoUrl;

  // Disable interactions if the session is considered completed
  const sessionIsEffectivelyOver =
    isSessionMarkedCompleted || (workoutLog && workoutLog.endTime);

  return (
    <div className="p-4 max-w-lg mx-auto bg-midnight-green min-h-screen mb-16">
      {notification.show && (
        <div
          className={`fixed top-4 right-4 p-3 rounded-md shadow-md z-50 ${
            notification.type === "error" ? "bg-red-600" : "bg-dark-slate-gray"
          } text-goldenrod`}
        >
          {notification.message}
        </div>
      )}
      <h1 className="text-2xl font-bold mb-4 text-goldenrod ">
        {workout?.name}
      </h1>
      <div className="mb-4">
        <Timer startTime={startTime} isPaused={sessionIsEffectivelyOver} />
      </div>
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray mb-1">
          <span>
            Exercise {currentExerciseIndex + 1} of {exercises.length}
          </span>
          <span>
            {exercises.length > 0
              ? Math.round((completedExercises.length / exercises.length) * 100)
              : 0}
            % complete
          </span>
        </div>
        <div className="w-full bg-midnight-green-darker rounded-full h-2.5">
          <div
            className="bg-medium-aquamarine h-2.5 rounded-full"
            style={{
              width: `${
                exercises.length > 0
                  ? (completedExercises.length / exercises.length) * 100
                  : 0
              }%`,
            }}
          ></div>
        </div>
      </div>
      {currentExercise &&
        !sessionIsEffectivelyOver && ( // Only show if session not over
          <div className="mb-4 p-4 bg-midnight-green-darker rounded-lg">
            <h3 className="text-xl font-semibold text-medium-aquamarine mb-2">
              {currentExercise.name}
            </h3>
            <p className="text-sm text-goldenrod">
              Target: {currentExercise.muscleGroup}
            </p>
          </div>
        )}
      {currentExercise &&
        vimeoVideoId &&
        !sessionIsEffectivelyOver && ( // Only show if session not over
          <div className="mb-4">
            <VideoPlayer
              videoUrl={vimeoVideoId}
              title={`Video for ${currentExercise.name}`}
            />
          </div>
        )}
      {currentExercise &&
        !sessionIsEffectivelyOver && ( // Only show if session not over
          <CurrentExercisePanel
            exercise={currentExercise}
            currentSetIndex={currentSetIndex}
            totalSets={totalSets}
            onCompleteSet={handleSetComplete}
            isLastExercise={currentExerciseIndex === exercises.length - 1}
            isLastSet={currentSetIndex === totalSets - 1}
            disabled={sessionIsEffectivelyOver} // Pass disabled prop
          />
        )}
      {sessionIsEffectivelyOver && workoutLog && workoutLog.endTime && (
        <div className="p-4 my-4 text-center bg-dark-slate-gray rounded-lg">
          <p className="text-lg text-green-400">Workout Completed!</p>
          <p className="text-gray-300">Redirecting to summary...</p>
        </div>
      )}
      <button
        onClick={handleAbandonWorkout}
        className={`w-full text-goldenrod py-2 rounded-md mt-6 ${
          sessionIsEffectivelyOver
            ? "bg-gray-600 cursor-not-allowed"
            : "bg-sepia hover:bg-dark-goldenrod"
        }`}
        disabled={sessionIsEffectivelyOver}
      >
        Abandon Workout
      </button>
    </div>
  );
};

export default WorkoutSession;
