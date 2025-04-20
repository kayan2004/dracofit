import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import workoutService from "../../services/workoutService";
import workoutLogsService from "../../services/workoutLogsService";
import exerciseLogsService from "../../services/exerciseLogsService";
import workoutExercisesService from "../../services/workoutExercisesService";
import Timer from "../common/Timer";
import CurrentExercisePanel from "./CurrentExercisePanel";

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
  const [notification, setNotification] = useState({
    show: false,
    message: "",
    type: "",
  });

  // Add state to track current exercise log
  const [currentExerciseLog, setCurrentExerciseLog] = useState(null);

  const showNotification = (message, type = "success") => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: "", type: "" });
    }, 3000);
  };

  // Fetch workout details
  useEffect(() => {
    const fetchWorkoutDetails = async () => {
      try {
        setLoading(true);

        // Get workout with exercises
        console.log(`Fetching workout with ID: ${workoutId}`);
        const data = await workoutService.getWorkoutById(workoutId);
        console.log("Workout data received:", data);

        // Directly fetch exercises as a fallback
        if (!data.exercises || data.exercises.length === 0) {
          console.log("No exercises found, trying direct fetch");
          try {
            const exercises = await workoutExercisesService.getWorkoutExercises(
              workoutId
            );
            console.log("Directly fetched exercises:", exercises);

            if (exercises && exercises.length > 0) {
              data.exercises = exercises;
            }
          } catch (exerciseError) {
            console.error("Error fetching exercises directly:", exerciseError);
          }
        }

        // Log exercises specifically
        console.log("Exercises:", data.exercises);

        // Check if exercises exist
        if (!data.exercises || data.exercises.length === 0) {
          console.error("No exercises found in the workout data");
          setError(
            "This workout has no exercises. Please add exercises to the workout first."
          );
          setLoading(false);
          return;
        }

        // Process exercises to ensure consistent property names
        const normalizedExercises = data.exercises.map((ex) => {
          // Print each exercise to understand its structure
          console.log("Exercise item:", ex);

          // Check for exercise nested inside workout_exercise entry
          const exerciseData = ex.exercise || ex;

          return {
            id: ex.id || ex.exerciseId || (ex.exercise && ex.exercise.id),
            exerciseId:
              ex.exerciseId || (ex.exercise && ex.exercise.id) || ex.id,
            name: exerciseData.name || exerciseData.exerciseName || "Exercise",
            target: exerciseData.target || exerciseData.muscleGroup || "Muscle",
            sets: ex.sets || 3,
            reps: ex.reps || 10,
            restTimeSeconds: ex.restTimeSeconds || 60,
            instructions: exerciseData.instructions || "",
          };
        });

        // Replace with normalized exercises
        data.exercises = normalizedExercises;
        console.log("Normalized exercises:", normalizedExercises);

        setWorkout(data);

        // Continue with starting the workout
        const newWorkoutLog = await workoutLogsService.startWorkout({
          workoutPlanId: parseInt(workoutId),
          status: "paused",
        });

        setWorkoutLog(newWorkoutLog);
        setStartTime(new Date());

        // Initialize the first exercise log
        if (data.exercises && data.exercises.length > 0) {
          await initializeExerciseLog(newWorkoutLog.id, data.exercises[0]);
        }

        setLoading(false);
      } catch (err) {
        console.error("Error fetching workout details:", err);
        setError(`Failed to load workout: ${err.message || "Unknown error"}`);
        setLoading(false);
      }
    };

    fetchWorkoutDetails();
  }, [workoutId]);

  // Initialize exercise log for the current exercise
  const initializeExerciseLog = async (workoutLogId, exercise) => {
    try {
      const exerciseLog = await exerciseLogsService.createExerciseLog(
        workoutLogId,
        {
          exerciseId: exercise.id || exercise.exerciseId,
          plannedSets: exercise.sets || 3,
          plannedReps: exercise.reps || 10,
        }
      );

      setCurrentExerciseLog(exerciseLog);
      return exerciseLog;
    } catch (err) {
      console.error("Error initializing exercise log:", err);
      showNotification("Failed to initialize exercise tracking", "error");
      return null;
    }
  };

  const handleSetComplete = async (setData) => {
    try {
      const exercises = workout?.exercises || [];
      const currentExercise = exercises[currentExerciseIndex];
      const totalSets = currentExercise?.sets || 3;

      // Save the set data to backend
      if (currentExerciseLog) {
        await exerciseLogsService.addSetToExerciseLog(
          workoutLog.id,
          currentExerciseLog.id,
          {
            weight: setData.weight,
            reps: setData.reps,
            setNumber: currentSetIndex + 1,
          }
        );
      }

      // If we have more sets to do for this exercise
      if (currentSetIndex < totalSets - 1) {
        setCurrentSetIndex(currentSetIndex + 1);
        showNotification("Set completed! Keep going!");
      } else {
        // All sets for this exercise are completed
        setCurrentSetIndex(0); // Reset set index for next exercise

        if (currentExerciseIndex < exercises.length - 1) {
          // Move to next exercise
          setCompletedExercises([...completedExercises, currentExerciseIndex]);
          setCurrentExerciseIndex(currentExerciseIndex + 1);

          // Initialize the next exercise log
          const nextExercise = exercises[currentExerciseIndex + 1];
          await initializeExerciseLog(workoutLog.id, nextExercise);

          showNotification("Exercise completed! Moving to next exercise.");
        } else {
          // Mark last exercise as completed
          setCompletedExercises([...completedExercises, currentExerciseIndex]);
          // All exercises completed
          handleCompleteWorkout();
        }
      }
    } catch (err) {
      console.error("Error recording set:", err);
      showNotification("Failed to save set data", "error");
    }
  };

  const handleCompleteWorkout = async () => {
    try {
      const endTime = new Date();
      const durationMinutes = Math.round((endTime - startTime) / 60000);

      await workoutLogsService.completeWorkout(workoutLog.id, {
        endTime,
        durationMinutes,
      });

      showNotification("Workout completed successfully!");
      setTimeout(() => {
        navigate("/workouts");
      }, 1500);
    } catch (err) {
      console.error("Error completing workout:", err);
      showNotification("Failed to save workout completion.", "error");
    }
  };

  const handleAbandonWorkout = async () => {
    if (window.confirm("Are you sure you want to abandon this workout?")) {
      try {
        await workoutLogsService.abandonWorkout(workoutLog.id);
        showNotification("Workout abandoned.");
        setTimeout(() => {
          navigate("/workouts");
        }, 1000);
      } catch (err) {
        console.error("Error abandoning workout:", err);
        showNotification("Failed to abandon workout.", "error");
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
    return <div className="p-4 text-center text-red-500">{error}</div>;
  }

  const exercises = workout?.exercises || [];
  const currentExercise = exercises[currentExerciseIndex];
  const totalSets = currentExercise?.sets || 3;

  return (
    <div className="p-4 max-w-lg mx-auto bg-midnight-green min-h-screen">
      {/* Notification */}
      {notification.show && (
        <div
          className={`fixed top-4 right-4 p-3 rounded-md shadow-md z-50 ${
            notification.type === "error" ? "bg-red-600" : "bg-dark-slate-gray"
          } text-goldenrod`}
        >
          {notification.message}
        </div>
      )}

      <h1 className="text-2xl font-bold mb-4 text-goldenrod">
        {workout?.name}
      </h1>

      {/* Timer */}
      <div className="mb-4">
        <Timer startTime={startTime} />
      </div>

      {/* Overall Progress indicator */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray mb-1">
          <span>
            Exercise {currentExerciseIndex + 1} of {exercises.length}
          </span>
          <span>
            {Math.round((completedExercises.length / exercises.length) * 100)}%
            complete
          </span>
        </div>
        <div className="w-full bg-midnight-green-darker rounded-full h-2.5">
          <div
            className="bg-medium-aquamarine h-2.5 rounded-full"
            style={{
              width: `${(completedExercises.length / exercises.length) * 100}%`,
            }}
          ></div>
        </div>
      </div>

      {/* Current exercise panel */}
      {currentExercise && (
        <CurrentExercisePanel
          exercise={currentExercise}
          currentSetIndex={currentSetIndex}
          totalSets={totalSets}
          onCompleteSet={handleSetComplete}
          isLastExercise={currentExerciseIndex === exercises.length - 1}
          isLastSet={currentSetIndex === totalSets - 1}
        />
      )}

      {/* Abandon workout button */}
      <button
        onClick={handleAbandonWorkout}
        className="w-full bg-sepia hover:bg-dark-goldenrod text-goldenrod py-2 rounded-md mt-6"
      >
        Abandon Workout
      </button>
    </div>
  );
};

export default WorkoutSession;
