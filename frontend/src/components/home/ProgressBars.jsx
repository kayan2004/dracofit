import React from "react";

const ProgressBars = ({
  level,
  xp,
  xpToNextLevel,
  health,
  maxHealth,
  streak,
}) => {
  // Calculate percentages for progress bars
  const xpPercentage = Math.min(100, Math.round((xp / xpToNextLevel) * 100));
  const healthPercentage = Math.min(
    100,
    Math.round((health / maxHealth) * 100)
  );

  return (
    <div className="space-y-6 py-2">
      {/* Level and Streak Indicators */}
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center">
          <div className="bg-gray-700 p-2 rounded-full mr-2">
            <span className="text-yellow-400 text-xl">✨</span>
          </div>
          <div>
            <span className="text-gray-300 text-xs block">LEVEL</span>
            <span className="text-goldenrod font-bold text-lg">{level}</span>
          </div>
        </div>

        <div className="flex items-center">
          <div className="bg-gray-700 p-2 rounded-full mr-2">
            <span className="text-orange-400 text-xl">🔥</span>
          </div>
          <div>
            <span className="text-gray-300 text-xs block">STREAK</span>
            <span className="text-goldenrod font-bold text-lg">
              {streak} days
            </span>
          </div>
        </div>
      </div>

      {/* XP Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-1">
          <div className="flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-yellow-400 mr-1"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="text-gray-300 text-xs">XP</span>
          </div>
          <span className="text-xs text-gray-300">
            {xp}/{xpToNextLevel}
          </span>
        </div>
        <div className="w-full h-3 bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-yellow-400 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${xpPercentage}%` }}
          ></div>
        </div>
      </div>

      {/* Health Progress Bar */}
      <div>
        <div className="flex justify-between items-center mb-1">
          <div className="flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-red-500 mr-1"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-gray-300 text-xs">HEALTH</span>
          </div>
          <span className="text-xs text-gray-300">
            {health}/{maxHealth}
          </span>
        </div>
        <div className="w-full h-3 bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-red-500 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${healthPercentage}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default ProgressBars;
