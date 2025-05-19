import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import workoutsService from "../services/workoutsService";
import WorkoutCard from "../components/workouts/WorkoutCard";
import { useAuth } from "../hooks/useAuth";
import WorkoutDetails from "../components/workouts/WorkoutDetails";
// FormButton will be removed
// import FormButton from "../components/common/FormButton";
import WeeklyScheduleOverview from "../components/schedule/WeeklyScheduleOverview";

// A simple PlusIcon component for the create card
const PlusIcon = ({ className = "w-12 h-12" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className={className}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 4.5v15m7.5-7.5h-15"
    />
  </svg>
);

const Workouts = () => {
  const { id } = useParams();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [workouts, setWorkouts] = useState([]);
  const [filteredWorkouts, setFilteredWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showUserWorkoutsOnly, setShowUserWorkoutsOnly] = useState(false);

  const fetchWorkouts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await workoutsService.getAllWorkouts();
      setWorkouts(result);
    } catch (err) {
      console.error("Error fetching workouts:", err);
      setError(err.message || "Failed to load workouts");
      setWorkouts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWorkouts();
  }, [fetchWorkouts]);

  useEffect(() => {
    if (authLoading) return;
    let result = [...workouts];
    if (showUserWorkoutsOnly) {
      if (!isAuthenticated) {
        navigate("/login", {
          state: {
            from: "/workouts",
            message: "Please log in to view your workouts",
          },
        });
        return;
      }
      result = result.filter((workout) => workout.userId === user?.id);
    }
    setFilteredWorkouts(result);
  }, [
    workouts,
    showUserWorkoutsOnly,
    user,
    isAuthenticated,
    authLoading,
    navigate,
  ]);

  const handleDeleteWorkout = async (workoutId) => {
    if (!isAuthenticated) {
      navigate("/login", {
        state: {
          from: "/workouts",
          message: "Please log in to delete workouts",
        },
      });
      return;
    }
    if (!window.confirm("Are you sure you want to delete this workout?")) {
      return;
    }
    try {
      await workoutsService.deleteWorkout(workoutId);
      fetchWorkouts();
    } catch (err) {
      console.error("Error deleting workout:", err);
      setError(err.message || "Failed to delete workout");
    }
  };

  const handleEditWorkout = (workout) => {
    if (!isAuthenticated) {
      navigate("/login", {
        state: { from: "/workouts", message: "Please log in to edit workouts" },
      });
      return;
    }
    navigate(`/workouts/edit/${workout.id}`);
  };

  const handleCreateWorkout = () => {
    if (!isAuthenticated) {
      navigate("/login", {
        state: {
          from: "/workouts",
          message: "Please log in to create workouts",
        },
      });
      return;
    }
    navigate("/workouts/create");
  };

  if (id) {
    return <WorkoutDetails workoutId={id} />;
  }

  return (
    <div className="min-h-screen bg-dark-slate-gray text-white p-6 ">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-heading-2 text-white mb-6">Workouts & Schedule</h1>
        <WeeklyScheduleOverview />
        {error && (
          <div className="bg-customDarkGold/20 border border-customGold text-goldenrod p-4 rounded-lg mb-8">
            <p>{error}</p>
          </div>
        )}
        {!loading && !error && (
          <p className="text-gray mb-4">
            {filteredWorkouts.length === 0 && !showUserWorkoutsOnly
              ? "No public workouts found. "
              : ""}
            {filteredWorkouts.length === 0 && showUserWorkoutsOnly
              ? "You haven't created any workouts yet. "
              : ""}
            {filteredWorkouts.length > 0
              ? `Showing ${filteredWorkouts.length} workout${
                  filteredWorkouts.length === 1 ? "" : "s"
                }. `
              : ""}
            {isAuthenticated && "You can create a new one!"}
          </p>
        )}
        {(loading || authLoading) && (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-goldenrod"></div>
          </div>
        )}

        {!loading && !authLoading && !error && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {filteredWorkouts.map((workout) => (
              <WorkoutCard
                key={workout.id}
                workout={workout}
                onDelete={
                  isAuthenticated && user?.id === workout.userId
                    ? handleDeleteWorkout
                    : null
                }
                onEdit={
                  isAuthenticated && user?.id === workout.userId
                    ? handleEditWorkout
                    : null
                }
                isOwner={isAuthenticated && user?.id === workout.userId}
              />
            ))}
            {/* Add Create Workout Card if authenticated */}
            {isAuthenticated && (
              <div
                key="create-workout-card"
                onClick={handleCreateWorkout}
                className="bg-midnight-green-darker rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 
                           flex flex-col items-center justify-center p-5 min-h-[280px]  cursor-pointer
                           border-2 border-dashed border-goldenrod/50 hover:border-goldenrod"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") handleCreateWorkout();
                }}
                aria-label="Create new workout"
              >
                <PlusIcon className="w-16 h-16 text-goldenrod/70 mb-3" />
                <p className="text-goldenrod text-lg font-semibold">
                  Create New Workout
                </p>
                <p className="text-gray text-sm mt-1">
                  Click here to start building
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Workouts;
