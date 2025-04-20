import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import workoutsService from "../services/workoutsService";
import WorkoutCard from "../components/workouts/WorkoutCard";
import { useAuth } from "../hooks/useAuth";
import WorkoutDetails from "../components/workouts/WorkoutDetails";
import FormButton from "../components/common/FormButton";
// Import the WeeklyScheduleOverview component
import WeeklyScheduleOverview from "../components/schedule/WeeklyScheduleOverview";

const Workouts = () => {
  const { id } = useParams();
  // Get authentication data from useAuth hook
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [workouts, setWorkouts] = useState([]);
  const [filteredWorkouts, setFilteredWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showUserWorkoutsOnly, setShowUserWorkoutsOnly] = useState(false);

  // Fetch all workouts
  const fetchWorkouts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Get all workouts
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

  // Load workouts on component mount
  useEffect(() => {
    fetchWorkouts();
  }, [fetchWorkouts]);

  // Apply basic filtering when workouts change
  useEffect(() => {
    // Wait for authentication to complete before filtering
    if (authLoading) return;

    let result = [...workouts];

    // Filter by user if showUserWorkoutsOnly is true
    if (showUserWorkoutsOnly) {
      if (!isAuthenticated) {
        // Redirect to login if trying to view "my workouts" while not logged in
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

  // Handle workout deletion with authentication check
  const handleDeleteWorkout = async (id) => {
    // Check if user is authenticated
    if (!isAuthenticated) {
      navigate("/login", {
        state: {
          from: "/workouts",
          message: "Please log in to delete workouts",
        },
      });
      return;
    }

    // Confirm deletion
    if (!window.confirm("Are you sure you want to delete this workout?")) {
      return;
    }

    try {
      await workoutsService.deleteWorkout(id);
      // Refresh the workouts list
      fetchWorkouts();
    } catch (err) {
      console.error("Error deleting workout:", err);
      setError(err.message || "Failed to delete workout");
    }
  };

  // Handle editing a workout with authentication check
  const handleEditWorkout = (workout) => {
    // Check if user is authenticated
    if (!isAuthenticated) {
      navigate("/login", {
        state: { from: "/workouts", message: "Please log in to edit workouts" },
      });
      return;
    }

    // Navigate to edit page
    navigate(`/workouts/edit/${workout.id}`);
  };

  // Create new workout with authentication check
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
    <div className="min-h-screen bg-dark-slate-gray text-white p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-heading-1 text-goldenrod mb-6">Workouts</h1>

        {/* Add the WeeklyScheduleOverview component */}
        <WeeklyScheduleOverview />

        {/* Error Message */}
        {error && (
          <div className="bg-customDarkGold/20 border border-customGold text-goldenrod p-4 rounded-lg mb-8">
            <p>{error}</p>
          </div>
        )}

        {/* Workout Count */}
        {!loading && !error && (
          <p className="text-gray mb-4">
            {filteredWorkouts.length === 0
              ? "No workouts found."
              : `Showing ${filteredWorkouts.length} workouts`}
          </p>
        )}

        {/* Loading state with auth-awareness */}
        {(loading || authLoading) && (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-goldenrod"></div>
          </div>
        )}

        {/* Workouts Grid with authenticated actions */}
        {!loading && !authLoading && !error && filteredWorkouts.length > 0 && (
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
          </div>
        )}

        <div className="mt-4 md:mt-0">
          <FormButton
            styles="p-4 border-b-8 border-r-8 w-full "
            fontsize="text-heading-4"
            onClick={handleCreateWorkout}
          >
            Create New Workout
          </FormButton>
        </div>
      </div>
    </div>
  );
};

export default Workouts;
