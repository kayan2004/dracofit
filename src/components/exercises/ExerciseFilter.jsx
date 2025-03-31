import React from "react";

const ExerciseFilter = ({
  searchTerm,
  onSearchChange,
  selectedMuscle,
  onMuscleChange,
  searchInputRef,
}) => {
  const muscleGroups = [
    "All",
    "Chest",
    "Back",
    "Shoulders",
    "Arms",
    "Legs",
    "Core",
  ];

  return (
    <div className="space-y-4">
      {/* Search */}
      <div>
        <label
          htmlFor="exerciseSearch"
          className="block text-sm font-medium text-gray-300 mb-1"
        >
          Search Exercises
        </label>
        <div className="relative">
          <input
            ref={searchInputRef}
            type="text"
            id="exerciseSearch"
            value={searchTerm}
            onChange={onSearchChange}
            placeholder="Search by name, muscle group..."
            className="w-full bg-gray-700 border border-gray-600 rounded-lg pl-10 pr-3 py-2 text-white focus:outline-none focus:border-goldenrod"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-400">🔍</span>
          </div>
        </div>
      </div>

      {/* Muscle Groups */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Filter by Muscle Group
        </label>
        <div className="flex flex-wrap gap-2">
          {muscleGroups.map((muscle) => (
            <button
              key={muscle}
              type="button"
              onClick={() => onMuscleChange(muscle)}
              className={`px-3 py-1 rounded-md text-sm ${
                selectedMuscle ===
                (muscle === "All" ? "" : muscle.toLowerCase())
                  ? "bg-goldenrod text-midnight-green"
                  : "bg-gray-600 text-white hover:bg-gray-500"
              }`}
            >
              {muscle}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ExerciseFilter;
