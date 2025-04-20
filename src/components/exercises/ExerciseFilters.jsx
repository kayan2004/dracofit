import React from "react";
import FilterIcon from "../icons/FilterIcon";

const ExerciseFilters = ({
  filters,
  onFilterChange,
  onClearFilters,
  showFilters,
  onToggleFilters,
}) => {
  // Filter options lists
  const difficultyOptions = ["beginner", "intermediate", "advanced"];
  const muscleGroupOptions = [
    "chest",
    "lats",
    "shoulders",
    "biceps",
    "triceps",
    "quadriceps",
    "hamstrings",
    "calves",
    "glutes",
    "abdominals",
    "forearms",
  ];
  const equipmentOptions = [
    "barbell",
    "dumbbell",
    "machine",
    "cable",
    "body only",
  ];
  const typeOptions = [
    "strength",
    "cardio",
    "stretching",
    "plyometrics",
    "powerlifting",
  ];

  // Count active filters
  const activeFilterCount =
    (filters.difficulty ? 1 : 0) +
    filters.targetMuscles.length +
    (filters.equipment ? 1 : 0) +
    (filters.type ? 1 : 0);

  return (
    <div className="mb-8">
      {/* Filter Toggle Button */}
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={onToggleFilters}
          className="flex items-center text-goldenrod hover:text-dark-goldenrod transition-colors"
        >
          <FilterIcon />
          <span className="ml-2">
            {showFilters ? "Hide Filters" : "Show Filters"}
          </span>
          {activeFilterCount > 0 && (
            <span className="ml-2 bg-goldenrod text-black rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
              {activeFilterCount}
            </span>
          )}
        </button>

        {activeFilterCount > 0 && (
          <button
            onClick={onClearFilters}
            className="text-sm text-gray-400 hover:text-dark-gray transition-colors"
          >
            Clear All Filters
          </button>
        )}
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="bg-midnight-green rounded-lg p-4 mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Difficulty Filter */}
          <div>
            <h3 className="font-medium mb-2 text-goldenrod">Difficulty</h3>
            <div className="flex flex-wrap gap-2">
              {difficultyOptions.map((option) => (
                <button
                  key={option}
                  onClick={() =>
                    onFilterChange(
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
              onChange={(e) => onFilterChange("equipment", e.target.value)}
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
              onChange={(e) => onFilterChange("type", e.target.value)}
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
            <h3 className="font-medium mb-2 text-goldenrod">Target Muscles</h3>
            <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto">
              {muscleGroupOptions.map((muscle) => (
                <button
                  key={muscle}
                  onClick={() => onFilterChange("targetMuscles", muscle)}
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
  );
};

export default ExerciseFilters;
