import React, { useState } from "react";
import { FaDumbbell } from "react-icons/fa";

/**
 * Component that displays the current exercise in a workout session
 * and allows the user to track sets with weight and reps
 */
const CurrentExercisePanel = ({
  exercise,
  currentSetIndex,
  totalSets,
  onCompleteSet,
  isLastExercise,
  isLastSet,
}) => {
  const [setData, setSetData] = useState({
    weight: "",
    reps: exercise.reps || 10,
  });

  // Handle weight input change
  const handleWeightChange = (e) => {
    setSetData({
      ...setData,
      weight: e.target.value,
    });
  };

  // Handle reps input change
  const handleRepsChange = (e) => {
    setSetData({
      ...setData,
      reps: e.target.value,
    });
  };

  // Submit set data
  const handleSubmitSet = () => {
    const weightValue = setData.weight === "" ? 0 : parseFloat(setData.weight);

    // Basic validation
    if (isNaN(weightValue) || weightValue < 0) {
      alert("Please enter a valid weight");
      return;
    }

    const repsValue = parseInt(setData.reps);
    if (isNaN(repsValue) || repsValue <= 0) {
      alert("Please enter a valid number of reps");
      return;
    }

    // Pass data to parent component
    onCompleteSet({
      weight: weightValue,
      reps: repsValue,
    });
  };

  // Get button text based on current progress
  const getButtonText = () => {
    if (isLastSet) {
      return isLastExercise ? "Complete Workout" : "Next Exercise";
    }
    return "Next Set";
  };

  console.log("Rendering exercise:", exercise);

  return (
    <div className="bg-midnight-green-darker rounded-lg p-4 shadow-lg">
      {/* Exercise header */}
      <div className="flex items-center mb-4">
        <div className="bg-dark-slate-gray p-2 rounded-full mr-3">
          <FaDumbbell className="text-medium-aquamarine text-xl" />
        </div>
        <h2 className="text-xl font-bold text-goldenrod">
          {exercise.name || exercise.exerciseName || "Unknown Exercise"}
        </h2>
      </div>

      {/* Exercise details */}
      <div className="grid grid-cols-3 gap-2 mb-4 bg-dark-slate-gray bg-opacity-30 p-3 rounded">
        <div className="text-center">
          <p className="text-xs text-gray">Target</p>
          <p className="text-goldenrod">{exercise.target || "Muscle"}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray">Sets</p>
          <p className="text-goldenrod">{totalSets}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray">Rest</p>
          <p className="text-goldenrod">{exercise.restTimeSeconds || 60}s</p>
        </div>
      </div>

      {/* Current set progress */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-medium-aquamarine">
            SET {currentSetIndex + 1} OF {totalSets}
          </h3>
          <span className="text-sm text-gray">
            {Math.round((currentSetIndex / totalSets) * 100)}% Complete
          </span>
        </div>
        <div className="w-full bg-midnight-green rounded-full h-2">
          <div
            className="bg-medium-aquamarine h-2 rounded-full"
            style={{
              width: `${(currentSetIndex / totalSets) * 100}%`,
            }}
          ></div>
        </div>
      </div>

      {/* Weight and reps input */}
      <div className="bg-midnight-green p-4 rounded-lg mb-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray mb-1">Weight (kg)</label>
            <input
              type="number"
              value={setData.weight}
              onChange={handleWeightChange}
              className="w-full p-2 rounded bg-midnight-green-darker border border-dark-slate-gray text-goldenrod input-case"
              placeholder="0"
            />
          </div>
          <div>
            <label className="block text-sm text-gray mb-1">Reps</label>
            <input
              type="number"
              value={setData.reps}
              onChange={handleRepsChange}
              className="w-full p-2 rounded bg-midnight-green-darker border border-dark-slate-gray text-goldenrod input-case"
              placeholder={exercise.reps || "10"}
            />
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <button
        onClick={handleSubmitSet}
        className="w-full flex items-center justify-center bg-goldenrod hover:bg-dark-goldenrod text-midnight-green py-3 px-4 rounded transition duration-300"
      >
        <span className="mr-2">{getButtonText()}</span>
      </button>
    </div>
  );
};

export default CurrentExercisePanel;
