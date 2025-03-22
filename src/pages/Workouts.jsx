import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import workoutsService from "../services/workoutsService";
import WorkoutCard from "../components/workouts/WorkoutCard";
import { useAuth } from "../hooks/useAuth";

const Workouts = () => {
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

  return (
    <div className="min-h-screen bg-midnight-green text-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header with authenticated create button */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-heading-1 text-goldenrod mb-2">Workouts</h1>
            <p className="text-gray">
              Browse workout plans or create your own fitness routine
            </p>
          </div>

          <div className="mt-4 md:mt-0">
            <button
              onClick={handleCreateWorkout}
              className="bg-goldenrod text-midnight-green px-5 py-2.5 rounded-lg font-bold hover:bg-dark-goldenrod transition-colors"
            >
              Create Workout
            </button>
          </div>
        </div>

        {/* Auth-dependent messaging */}
        {!isAuthenticated && !authLoading && (
          <div className="bg-gray-800 border border-gray-700 p-4 rounded-lg mb-6">
            <p className="flex items-center">
              <span className="mr-2">👋</span>
              <span>
                <Link to="/login" className="text-goldenrod hover:underline">
                  Log in
                </Link>{" "}
                or{" "}
                <Link to="/register" className="text-goldenrod hover:underline">
                  register
                </Link>{" "}
                to create your own workouts and track your progress.
              </span>
            </p>
          </div>
        )}

        {/* Simple "My Workouts" toggle */}
        {isAuthenticated && (
          <div className="bg-gray-800 rounded-lg p-4 mb-8">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="myWorkouts"
                checked={showUserWorkoutsOnly}
                onChange={() => setShowUserWorkoutsOnly((prev) => !prev)}
                className="mr-2 accent-goldenrod"
              />
              <label htmlFor="myWorkouts" className="text-white cursor-pointer">
                Show my workouts only
              </label>
            </div>
          </div>
        )}

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

        {/* No results state with auth-context */}
        {!loading &&
          !authLoading &&
          !error &&
          filteredWorkouts.length === 0 && (
            <div className="bg-gray-800 rounded-lg p-8 text-center">
              <div className="text-5xl mb-4">🏋️</div>
              <h3 className="text-heading-3 text-goldenrod mb-2">
                No Workouts Found
              </h3>
              <p className="text-gray mb-6">
                {showUserWorkoutsOnly
                  ? "You haven't created any workouts yet."
                  : "There are currently no workouts available."}
              </p>
              <button
                onClick={handleCreateWorkout}
                className="bg-goldenrod text-midnight-green px-5 py-2.5 rounded-lg font-bold hover:bg-dark-goldenrod transition-colors inline-block"
              >
                {isAuthenticated
                  ? "Create Your First Workout"
                  : "Log In to Create Workouts"}
              </button>
            </div>
          )}
      </div>
    </div>
  );
};

export default Workouts;
