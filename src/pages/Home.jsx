import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import userPetService from "../services/userPetService";
import DragonDisplay from "../components/home/DragonDisplay";

const Home = () => {
  const { user, isAuthenticated, loading } = useAuth();

  // Mock data - replace with actual data from your backend
  const [userData, setUserData] = useState({
    username: "User",
    level: 1,
    xp: 0,
    xpToNextLevel: 100,
    health: 100,
    maxHealth: 100,
    streak: 0,
  });

  // Pet data state
  const [petData, setPetData] = useState({
    name: "Dragon",
    level: 1,
    stage: "baby",
    animation: "idle",
  });

  // Loading state for pet data
  const [petLoading, setPetLoading] = useState(false);

  // Update username when user data is loaded
  useEffect(() => {
    if (user && user.username) {
      setUserData((prev) => ({
        ...prev,
        username: user.username,
      }));
    }
  }, [user]);

  // Fetch pet data if user is authenticated
  useEffect(() => {
    const fetchPetData = async () => {
      if (!isAuthenticated) return;

      try {
        setPetLoading(true);
        const pet = await userPetService.getUserPet();

        // Update pet data state
        setPetData({
          name: pet.name || "Dragon",
          level: pet.level || 1,
          stage: pet.stage || "baby",
          animation: pet.currentAnimation || "idle",
        });

        // Also update user data with pet-related stats
        setUserData((prev) => ({
          ...prev,
          level: pet.level || prev.level,
          health: pet.healthPoints || prev.health,
          maxHealth: 100,
          streak: pet.currentStreak || prev.streak,
          xp: pet.xp || 0,
          xpToNextLevel: pet.level * 100 || 100,
        }));
      } catch (error) {
        console.error("Error fetching pet data:", error);
        // Keep default data if there's an error
      } finally {
        setPetLoading(false);
      }
    };

    fetchPetData();
  }, [isAuthenticated]);

  // Calculate percentages for progress bars
  const xpPercentage = Math.min(
    100,
    Math.round((userData.xp / userData.xpToNextLevel) * 100)
  );
  const healthPercentage = Math.min(
    100,
    Math.round((userData.health / userData.maxHealth) * 100)
  );

  if (loading || petLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-dark-slate-gray">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-goldenrod"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-slate-gray text-white">
      {/* Profile Header with Username and Settings */}
      <header className="bg-gray-800 py-4 px-6 flex justify-between items-center shadow-md">
        <div className="flex items-center">
          <span className="text-lg font-semibold text-goldenrod">
            Hi, {userData.username}!
          </span>
        </div>
        <div>
          <Link
            to="/settings"
            className="text-white hover:text-goldenrod transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </Link>
        </div>
      </header>

      {/* Progress Bars Section */}
      <div className="max-w-md mx-auto pt-6 px-6">
        <div className="space-y-6 py-2">
          {/* Level and Streak Indicators */}
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center">
              <div className="bg-gray-700 p-2 rounded-full mr-2">
                <span className="text-yellow-400 text-xl">✨</span>
              </div>
              <div>
                <span className="text-gray-300 text-xs block">LEVEL</span>
                <span className="text-goldenrod font-bold text-lg">
                  {userData.level}
                </span>
              </div>
            </div>

            <div className="flex items-center">
              <div className="bg-gray-700 p-2 rounded-full mr-2">
                <span className="text-orange-400 text-xl">🔥</span>
              </div>
              <div>
                <span className="text-gray-300 text-xs block">STREAK</span>
                <span className="text-goldenrod font-bold text-lg">
                  {userData.streak} days
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
                {userData.xp}/{userData.xpToNextLevel}
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
                {userData.health}/{userData.maxHealth}
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
      </div>

      {/* Dragon Display Area */}
      <div className="flex justify-center items-center mt-12">
        <DragonDisplay
        // level={petData.level}
        // stage={petData.stage}
        // animation={petData.animation}
        // name={petData.name}
        />
      </div>

      {/* Quick Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-800 py-4 mb-16 sm:mb-0">
        <div className="max-w-md mx-auto px-4 flex justify-around">
          <Link
            to="/workouts/create"
            className="bg-goldenrod text-midnight-green px-6 py-3 rounded-lg font-bold hover:bg-dark-goldenrod transition-colors"
          >
            Create Workout
          </Link>
          <Link
            to="/workouts"
            className="bg-gray-700 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-colors"
          >
            View Workouts
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Home;
