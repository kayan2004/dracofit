import React, { useState, useEffect, useCallback } from "react";
import ExerciseCard from "../components/exercises/ExerciseCard";
import exercisesService from "../services/exercisesService";

const Exercises = () => {
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalExercises, setTotalExercises] = useState(0);

  // Add filter states
  const [filters, setFilters] = useState({
    difficulty: "",
    targetMuscles: [],
    equipment: "",
    type: "",
  });

  // Filter options lists
  const difficultyOptions = ["beginner", "intermediate", "advanced"];
  const muscleGroupOptions = [
    "chest",
    "back",
    "shoulders",
    "biceps",
    "triceps",
    "quadriceps",
    "hamstrings",
    "calves",
    "glutes",
    "abs",
    "forearms",
  ];
  const equipmentOptions = [
    "barbell",
    "dumbbell",
    "machine",
    "cable",
    "kettlebell",
    "resistance band",
    "body only",
    "medicine ball",
    "exercise ball",
  ];
  const typeOptions = [
    "strength",
    "cardio",
    "stretching",
    "plyometrics",
    "powerlifting",
    "olympic weightlifting",
  ];

  // Show filter panel state
  const [showFilters, setShowFilters] = useState(false);

  // Fetch exercises on component mount or when filters change
  useEffect(() => {
    // Reset to page 1 when filters change
    fetchExercises(1);
  }, [filters]);

  // Function to fetch exercises with filters and pagination
  const fetchExercises = async (page = 1) => {
    try {
      setLoading(true);

      // Build filter query parameters
      const activeFilters = {};

      // Only add non-empty filters
      if (filters.difficulty) activeFilters.difficulty = filters.difficulty;
      if (filters.targetMuscles.length > 0)
        activeFilters.targetMuscles = filters.targetMuscles;
      if (filters.equipment) activeFilters.equipment = filters.equipment;
      if (filters.type) activeFilters.type = filters.type;

      // Check if we have active filters to determine which endpoint to use
      const hasActiveFilters = Object.keys(activeFilters).length > 0;

      let response;
      if (hasActiveFilters) {
        console.log("Fetching with filters:", activeFilters);
        response = await exercisesService.getFilteredExercises(
          activeFilters,
          page,
          20
        );
      } else {
        response = await exercisesService.getExercises(page, 20);
      }

      console.log("Exercises API response:", response);

      // Update pagination information
      setCurrentPage(page);

      // Handle different response formats
      if (Array.isArray(response)) {
        setExercises(response);
        setTotalPages(1); // Default if API doesn't return pagination info
        setTotalExercises(response.length);
      } else if (response.exercises && Array.isArray(response.exercises)) {
        setExercises(response.exercises);
        setTotalPages(response.totalPages || 1);
        setTotalExercises(response.total || response.exercises.length);
      } else if (response.data && Array.isArray(response.data)) {
        setExercises(response.data);
        setTotalPages(response.totalPages || 1);
        setTotalExercises(response.total || response.data.length);
      } else {
        console.error("Unexpected API response format:", response);
        setExercises([]);
        setTotalPages(1);
        setTotalExercises(0);
      }
    } catch (err) {
      console.error("Error fetching exercises:", err);
      setError(err.message || "Failed to load exercises");
    } finally {
      setLoading(false);
    }
  };

  // Add this function to your Exercises.jsx component
  const performSearch = useCallback(async (term, page = 1) => {
    if (!term) {
      // If search term is cleared, revert to regular pagination
      fetchExercises(1);
      return;
    }

    try {
      setLoading(true);

      // Use the search functionality with pagination
      const response = await exercisesService.searchExercises(term, page, 20);

      // Update state with search results
      setExercises(response.exercises || []);
      setCurrentPage(response.page || 1);
      setTotalPages(response.totalPages || 1);
      setTotalExercises(response.total || 0);
    } catch (err) {
      console.error("Error searching exercises:", err);
      setError(err.message || "Failed to search exercises");
      setExercises([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Update your handleSearchChange function
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);

    // Clear the previous timeout
    if (window.searchTimeout) {
      clearTimeout(window.searchTimeout);
    }

    // Set a new timeout for the search
    window.searchTimeout = setTimeout(() => {
      // Perform the search with the first page
      performSearch(value, 1);
    }, 300); // 300ms delay before searching
  };

  // Update your pagination handler to work with search
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage) {
      window.scrollTo({ top: 0, behavior: "smooth" });

      // If searching, use performSearch with the new page
      if (searchTerm) {
        performSearch(searchTerm, newPage);
      } else {
        // Otherwise use the regular fetch
        fetchExercises(newPage);
      }
    }
  };

  // Function to get primary muscle from targetMuscles array
  const getPrimaryMuscle = (exercise) => {
    if (!exercise) return null;

    if (exercise.primaryMuscleGroup) return exercise.primaryMuscleGroup;

    if (
      exercise.targetMuscles &&
      Array.isArray(exercise.targetMuscles) &&
      exercise.targetMuscles.length > 0
    ) {
      return exercise.targetMuscles[0];
    }

    return null;
  };

  // Handle filter changes
  const handleFilterChange = (filterType, value) => {
    setFilters((prev) => {
      // Special handling for muscle groups (array)
      if (filterType === "targetMuscles") {
        // If value is already in array, remove it; otherwise add it
        const updatedMuscles = prev.targetMuscles.includes(value)
          ? prev.targetMuscles.filter((muscle) => muscle !== value)
          : [...prev.targetMuscles, value];

        return { ...prev, targetMuscles: updatedMuscles };
      }

      // For other filters (single value)
      return { ...prev, [filterType]: value };
    });
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      difficulty: "",
      targetMuscles: [],
      equipment: "",
      type: "",
    });
    setSearchTerm("");
  };

  // When using server-side search, don't refilter the results
  const filteredExercises = exercises;

  // Map exercises to standardized format for ExerciseCard
  const normalizedExercises = filteredExercises.map((exercise) => ({
    ...exercise,
    primaryMuscleGroup: getPrimaryMuscle(exercise),
    id: exercise.id || Math.random().toString(36).substr(2, 9),
    difficulty: exercise.difficulty || "intermediate",
  }));

  // Count active filters
  const activeFilterCount =
    (filters.difficulty ? 1 : 0) +
    filters.targetMuscles.length +
    (filters.equipment ? 1 : 0) +
    (filters.type ? 1 : 0);

  return (
    <div className="min-h-screen bg-dark-slate-gray text-white p-6">
      {/* Simple Header */}
      <div className="mb-8">
        <h1 className="text-heading-2 text-goldenrod">Exercise Library</h1>
        <p className="text-gray mt-2">
          Browse through our collection of exercises
        </p>
      </div>

      {/* Search and Filter Section */}
      <div className="max-w-6xl mx-auto mb-8">
        {/* Search Bar */}
        <div className="mb-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search exercises by name, muscle, equipment..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg py-3 px-4 pl-12 focus:outline-none focus:border-goldenrod"
            />
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Filter Toggle Button */}
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center text-goldenrod hover:text-dark-goldenrod transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
              />
            </svg>
            {showFilters ? "Hide Filters" : "Show Filters"}
            {activeFilterCount > 0 && (
              <span className="ml-2 bg-goldenrod text-black rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                {activeFilterCount}
              </span>
            )}
          </button>

          {activeFilterCount > 0 && (
            <button
              onClick={clearFilters}
              className="text-sm text-gray-400 hover:text-dark-gray transition-colors"
            >
              Clear All Filters
            </button>
          )}
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="bg-gray-800 rounded-lg p-4 mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Difficulty Filter */}
            <div>
              <h3 className="font-medium mb-2 text-goldenrod">Difficulty</h3>
              <div className="flex flex-wrap gap-2">
                {difficultyOptions.map((option) => (
                  <button
                    key={option}
                    onClick={() =>
                      handleFilterChange(
                        "difficulty",
                        filters.difficulty === option ? "" : option
                      )
                    }
                    className={`px-3 py-1 rounded-full text-sm ${
                      filters.difficulty === option
                        ? "bg-goldenrod text-gray-900"
                        : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                    }`}
                  >
                    {option.charAt(0).toUpperCase() + option.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Equipment Filter */}
            <div>
              <h3 className="font-medium mb-2 text-goldenrod">Equipment</h3>
              <select
                value={filters.equipment}
                onChange={(e) =>
                  handleFilterChange("equipment", e.target.value)
                }
                className="w-full bg-gray-700 text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:border-goldenrod"
              >
                <option value="">Any Equipment</option>
                {equipmentOptions.map((option) => (
                  <option key={option} value={option}>
                    {option.charAt(0).toUpperCase() + option.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Exercise Type Filter */}
            <div>
              <h3 className="font-medium mb-2 text-goldenrod">Type</h3>
              <select
                value={filters.type}
                onChange={(e) => handleFilterChange("type", e.target.value)}
                className="w-full bg-gray-700 text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:border-goldenrod"
              >
                <option value="">Any Type</option>
                {typeOptions.map((option) => (
                  <option key={option} value={option}>
                    {option.charAt(0).toUpperCase() + option.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Muscle Group Filter - Multi-select */}
            <div>
              <h3 className="font-medium mb-2 text-goldenrod">
                Target Muscles
              </h3>
              <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto">
                {muscleGroupOptions.map((muscle) => (
                  <button
                    key={muscle}
                    onClick={() => handleFilterChange("targetMuscles", muscle)}
                    className={`px-3 py-1 rounded-full text-sm ${
                      filters.targetMuscles.includes(muscle)
                        ? "bg-goldenrod text-gray-900"
                        : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                    }`}
                  >
                    {muscle.charAt(0).toUpperCase() + muscle.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-goldenrod"></div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="bg-customDarkGold/20 border border-customGold text-goldenrod p-4 rounded-lg mb-8">
          Error loading exercises: {error}
        </div>
      )}

      {/* Exercise count */}
      {!loading && !error && normalizedExercises.length > 0 && (
        <p className="text-gray-400 mb-4 text-center">
          Showing {normalizedExercises.length} of {totalExercises} exercises
          {totalPages > 1 && ` (page ${currentPage} of ${totalPages})`}
          {(searchTerm || activeFilterCount > 0) && " matching your criteria"}
        </p>
      )}

      {/* Exercise cards grid */}
      {!loading && !error && normalizedExercises.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto">
          {normalizedExercises.map((exercise) => (
            <ExerciseCard
              key={exercise.id}
              exercise={exercise}
              onSelect={(exercise) => {
                console.log("Selected exercise:", exercise);
              }}
            />
          ))}
        </div>
      ) : (
        // Empty state - only show if not loading and no error
        !loading &&
        !error && (
          <div className="flex flex-col items-center justify-center h-64">
            <p className="text-xl text-gray-400">
              {searchTerm || activeFilterCount > 0
                ? "No exercises found matching your criteria"
                : "No exercises found"}
            </p>
            {(searchTerm || activeFilterCount > 0) && (
              <button
                onClick={clearFilters}
                className="mt-4 px-4 py-2 bg-goldenrod text-gray-900 rounded-lg hover:bg-yellow-500 transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        )
      )}

      {/* Pagination - Updated to work with search too */}
      {!loading && !error && totalPages > 1 && (
        <div className="flex justify-center mt-8 space-x-2">
          {/* Previous page button */}
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={`px-3 py-2 rounded-md ${
              currentPage === 1
                ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                : "bg-gray-700 text-white hover:bg-gray-600"
            }`}
            aria-label="Previous page"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </button>

          {/* Page number buttons - show max 5 pages */}
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            // Your existing page calculation logic
            let pageNum;
            if (totalPages <= 5) {
              // If 5 or fewer pages, show all pages
              pageNum = i + 1;
            } else if (currentPage <= 3) {
              // If near the start, show pages 1-5
              pageNum = i + 1;
            } else if (currentPage >= totalPages - 2) {
              // If near the end, show the last 5 pages
              pageNum = totalPages - 4 + i;
            } else {
              // Otherwise show 2 before and 2 after current page
              pageNum = currentPage - 2 + i;
            }

            return (
              <button
                key={pageNum}
                onClick={() => handlePageChange(pageNum)}
                className={`px-3 py-1 min-w-[2rem] rounded-md ${
                  currentPage === pageNum
                    ? "bg-goldenrod text-gray-900 font-medium"
                    : "bg-gray-700 text-white hover:bg-gray-600"
                }`}
              >
                {pageNum}
              </button>
            );
          })}

          {/* Next page button */}
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`px-3 py-2 rounded-md ${
              currentPage === totalPages
                ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                : "bg-gray-700 text-white hover:bg-gray-600"
            }`}
            aria-label="Next page"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};

export default Exercises;
