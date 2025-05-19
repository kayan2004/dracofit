/* eslint-disable react/no-unescaped-entities */
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import userPetService from "../services/userPetService";
import scheduleService from "../services/scheduleService";
import workoutLogsService from "../services/workoutLogsService";
import userDetailsService from "../services/userDetailsService";
import DragonDisplay from "../components/home/DragonDisplay";
import StreakAnimation from "../components/common/StreakAnimation";
import targetLevelIcon from "../assets/target-level-icon.png";
import HeartAnimation from "../components/common/HeartAnimation";
import SimulationPanel from "../components/home/SimulationPanel"; // Import the SimulationPanel component
import {
  FaRunning,
  FaBed,
  FaSpinner,
  FaExclamationTriangle,
  FaCheckCircle,
  FaRedo,
  FaUserCircle,
  FaFlask, // Import FaFlask for the simulation button
} from "react-icons/fa";

const MAX_HEALTH_DEFAULT = 100;

const Home = () => {
  const {
    currentUser: user,
    isAuthenticated,
    loading: authLoading,
    refreshAuthStatus,
  } = useAuth();
  const navigate = useNavigate();

  const [userData, setUserData] = useState({
    username: "User",
    level: 1,
    xp: 0,
    xpToNextLevel: 100,
    health: MAX_HEALTH_DEFAULT, // Corrected initial health
    streak: 0,
  });

  const [petData, setPetData] = useState({
    name: "Dragon",
    level: 1,
    stage: "baby",
    animation: "idle",
    healthPoints: MAX_HEALTH_DEFAULT,
  });

  const [profilePictureUrl, setProfilePictureUrl] = useState(null);
  const [profilePicLoading, setProfilePicLoading] = useState(true);
  const [profileImageError, setProfileImageError] = useState(false);

  const [petLoading, setPetLoading] = useState(true);
  const [activeTooltip, setActiveTooltip] = useState(null);
  const [todaysActivity, setTodaysActivity] = useState(null);
  const [isTodayWorkoutCompleted, setIsTodayWorkoutCompleted] = useState(false);
  const [scheduleLoading, setScheduleLoading] = useState(true);
  const [scheduleError, setScheduleError] = useState(null);
  const [showRestartModal, setShowRestartModal] = useState(false);
  const [isRestarting, setIsRestarting] = useState(false);

  // --- Simulation Panel State ---
  const [showSimPanel, setShowSimPanel] = useState(false);
  const [activeSimulation, setActiveSimulation] = useState(null);

  // Effect to fetch user details (including profile picture)
  useEffect(() => {
    const fetchUserDetails = async () => {
      if (user && user.id && !activeSimulation) {
        // Don't fetch if simulation is active
        setProfilePicLoading(true);
        setProfileImageError(false);
        try {
          console.log("Home.jsx: Fetching user details for user ID:", user.id);
          const details = await userDetailsService.getUserDetails();
          if (details && details.profilePictureUrl) {
            setProfilePictureUrl(details.profilePictureUrl);
            console.log(
              "Home.jsx: Profile picture URL set:",
              details.profilePictureUrl
            );
          } else {
            setProfilePictureUrl(null);
            console.log(
              "Home.jsx: No profile picture URL found in user details."
            );
          }
        } catch (error) {
          console.error("Home.jsx: Failed to fetch user details:", error);
          setProfilePictureUrl(null);
        } finally {
          setProfilePicLoading(false);
        }
      } else if (!authLoading && !activeSimulation) {
        setProfilePicLoading(false);
        setProfilePictureUrl(null);
      } else if (activeSimulation) {
        setProfilePicLoading(false); // Ensure loading is off during simulation
      }
    };

    fetchUserDetails();
  }, [user, authLoading, activeSimulation]);

  // Reset image error state if the URL changes (e.g. after a successful fetch)
  useEffect(() => {
    setProfileImageError(false);
  }, [profilePictureUrl]);

  useEffect(() => {
    if (user && !activeSimulation) {
      // Only update username from user if not simulating
      setUserData((prevData) => ({
        ...prevData,
        username: user.username || "User",
      }));
    }
  }, [user, activeSimulation]);

  useEffect(() => {
    const fetchPet = async () => {
      if (isAuthenticated && user && user.id && !activeSimulation) {
        // Don't fetch if simulation is active
        setPetLoading(true);
        try {
          const data = await userPetService.getUserPet();
          if (data) {
            setPetData({
              name: data.name || "Dragon",
              level: data.level || 1,
              stage: data.stage || "baby",
              animation: data.currentAnimation || "idle",
              healthPoints:
                data.healthPoints !== undefined
                  ? data.healthPoints
                  : MAX_HEALTH_DEFAULT,
            });
            setUserData((prev) => ({
              ...prev,
              health:
                data.healthPoints !== undefined
                  ? data.healthPoints
                  : prev.health,
              xp: data.xp !== undefined ? data.xp : prev.xp,
              xpToNextLevel: data.level ? parseInt(data.level) * 100 : 100,
              level: data.level !== undefined ? data.level : prev.level,
              streak:
                data.currentStreak !== undefined
                  ? data.currentStreak
                  : user.streak !== undefined
                  ? user.streak
                  : prev.streak,
            }));
          }
        } catch (error) {
          console.error("Failed to fetch pet data in Home.jsx:", error);
        } finally {
          setPetLoading(false);
        }
      } else if (!authLoading && !activeSimulation) {
        setPetLoading(false);
        setUserData((prev) => ({ ...prev, streak: 0 }));
      } else if (activeSimulation) {
        setPetLoading(false); // Ensure loading is off during simulation
      }
    };
    fetchPet();
  }, [isAuthenticated, user, authLoading, activeSimulation]);

  useEffect(() => {
    if (authLoading) {
      setScheduleLoading(true);
      return;
    }
    if ((!isAuthenticated || !user || !user.id) && !activeSimulation) {
      setScheduleLoading(false);
      setTodaysActivity({
        type: "none",
        message: "Login to see your schedule.",
      });
      return;
    }

    if (activeSimulation && activeSimulation !== "reset") {
      setScheduleLoading(false);
      setTodaysActivity({ type: "simulation_active" });
      return;
    }

    const fetchTodaysScheduleAndLogStatus = async () => {
      setScheduleLoading(true);
      setScheduleError(null);
      setIsTodayWorkoutCompleted(false);
      try {
        const scheduleData = await scheduleService.getSchedule();
        const currentDay = getCurrentDayId();
        const todayScheduleDay = scheduleData?.days?.find(
          (d) => d.dayOfWeek === currentDay
        );
        const todayEntry = todayScheduleDay?.entries?.[0];

        if (todayEntry) {
          if (
            todayEntry.workoutPlan &&
            todayEntry.workoutPlan.id &&
            todayEntry.workoutPlan.name
          ) {
            setTodaysActivity({
              type: "workout",
              details: {
                id: todayEntry.workoutPlan.id,
                name: todayEntry.workoutPlan.name,
                notes: todayEntry.notes,
              },
            });

            const todayStartDate = new Date();
            todayStartDate.setHours(0, 0, 0, 0);
            const todayEndDate = new Date();
            todayEndDate.setHours(23, 59, 59, 999);

            try {
              const logs = await workoutLogsService.getLogsByDateRange(
                todayStartDate,
                todayEndDate
              );
              const completed =
                logs &&
                logs.some(
                  (log) =>
                    log.workoutPlan.id === todayEntry.workoutPlan.id &&
                    log.endTime
                );
              setIsTodayWorkoutCompleted(completed);
            } catch (logError) {
              console.error("Error fetching workout logs:", logError);
              setIsTodayWorkoutCompleted(false);
            }
          } else {
            setTodaysActivity({
              type: "rest",
              details: {
                notes: todayEntry.notes,
              },
            });
          }
        } else {
          setTodaysActivity({
            type: "none",
            message: "No schedule found for today. Consider setting one up!",
          });
        }
      } catch (err) {
        console.error("Failed to fetch schedule or log status:", err);
        setScheduleError("Could not load today's plan.");
        setTodaysActivity({ type: "error" });
      } finally {
        setScheduleLoading(false);
      }
    };

    fetchTodaysScheduleAndLogStatus();
  }, [isAuthenticated, user, authLoading, activeSimulation]);

  const toggleTooltip = (tooltipId) => {
    setActiveTooltip((prev) => (prev === tooltipId ? null : tooltipId));
  };

  const getCurrentDayId = () => {
    const dayMap = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ];
    return dayMap[new Date().getDay()];
  };

  const DAYS_OF_WEEK_FULL_NAMES = {
    sunday: "Sunday",
    monday: "Monday",
    tuesday: "Tuesday",
    wednesday: "Wednesday",
    thursday: "Thursday",
    friday: "Friday",
    saturday: "Saturday",
  };

  const xpPercentage = Math.min(
    100,
    userData.xpToNextLevel > 0
      ? Math.round((userData.xp / userData.xpToNextLevel) * 100)
      : 0
  );
  const healthPercentage = Math.min(
    100,
    MAX_HEALTH_DEFAULT > 0
      ? Math.round((userData.health / MAX_HEALTH_DEFAULT) * 100)
      : 0
  );

  const handleDragonClick = () => {
    if (petData.healthPoints <= 0 || petData.animation === "dead") {
      setShowRestartModal(true);
    } else {
      console.log("Dragon clicked, but it's alive!");
    }
  };

  const handleStartWorkout = () => {
    if (
      todaysActivity?.type === "workout" &&
      todaysActivity.details?.id &&
      !isTodayWorkoutCompleted
    ) {
      navigate(`/workout-session/${todaysActivity.details.id}`);
    }
  };

  const handleRestartJourneyClick = async () => {
    setIsRestarting(true);
    setActiveSimulation(null); // Clear any active simulation
    try {
      const newPetData = await userPetService.restartJourney();
      setPetData({
        name: newPetData.name || "Dragon",
        level: newPetData.level || 1,
        stage: newPetData.stage || "baby",
        animation: newPetData.currentAnimation || "idle",
        healthPoints:
          newPetData.healthPoints !== undefined
            ? newPetData.healthPoints
            : MAX_HEALTH_DEFAULT,
      });
      setUserData((prev) => ({
        ...prev,
        username: user?.username || "User", // Reset username from auth
        health:
          newPetData.healthPoints !== undefined
            ? newPetData.healthPoints
            : MAX_HEALTH_DEFAULT,
        xp: newPetData.xp !== undefined ? newPetData.xp : 0,
        xpToNextLevel: newPetData.level
          ? parseInt(newPetData.level) * 100
          : 100,
        level: newPetData.level !== undefined ? newPetData.level : 1,
        streak:
          newPetData.currentStreak !== undefined ? newPetData.currentStreak : 0,
      }));
      setShowRestartModal(false);
      if (user && user.id) {
        const details = await userDetailsService.getUserDetails();
        setProfilePictureUrl(details?.profilePictureUrl || null);
      }
    } catch (error) {
      console.error("Error during restart journey:", error);
    } finally {
      setIsRestarting(false);
    }
  };

  // --- Simulation Handler ---
  const handleSimulate = (simId, newPetData, newUserData) => {
    setPetData((prevPet) => ({ ...prevPet, ...newPetData }));
    setUserData((prevUser) => ({
      ...prevUser, // Keep existing username unless simulation changes it
      username: newUserData.username || prevUser.username, // Allow simulation to override username if needed
      ...newUserData,
    }));
    setActiveSimulation(simId);
    // Ensure loading states are off
    setPetLoading(false);
    setProfilePicLoading(false);
    setScheduleLoading(false);
  };

  const pageLoading =
    authLoading || (!activeSimulation && (petLoading || profilePicLoading));

  if (pageLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-dark-slate-gray">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-goldenrod"></div>
      </div>
    );
  }

  const tooltipBaseClass =
    "absolute left-1/2 transform -translate-x-1/2 p-2 w-max max-w-xs bg-gray-700 text-white text-xs rounded shadow-lg z-10";

  const renderTodaysActivitySection = () => {
    if (scheduleLoading && !activeSimulation) {
      return (
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg text-center">
          <FaSpinner className="animate-spin text-goldenrod text-2xl mx-auto mb-2" />
          <p className="text-gray-400">Loading today's plan...</p>
        </div>
      );
    }
    if (scheduleError && !activeSimulation) {
      return (
        <div className="bg-red-800/30 p-6 rounded-lg shadow-lg text-center border border-red-700">
          <FaExclamationTriangle className="text-red-400 text-2xl mx-auto mb-2" />
          <p className="text-red-400">{scheduleError}</p>
        </div>
      );
    }

    if (todaysActivity?.type === "simulation_active") {
      return (
        <div className="bg-midnight-green p-6 rounded-lg shadow-lg text-center">
          <FaFlask className="text-purple-400 text-3xl mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-goldenrod mb-2">
            Simulation Mode Active
          </h2>
          <p className="text-gray-400">Today's schedule is paused.</p>
        </div>
      );
    }

    const currentDayFullName = DAYS_OF_WEEK_FULL_NAMES[getCurrentDayId()];

    if (todaysActivity?.type === "workout") {
      if (isTodayWorkoutCompleted) {
        return (
          <div className="bg-midnight-green p-6 rounded-lg shadow-lg text-center">
            <h2 className="text-lg font-semibold text-goldenrod mb-1">
              Today's Workout: {currentDayFullName}
            </h2>
            <p className="text-gray mb-1 text-xl">
              {todaysActivity.details.name}
            </p>
            <p className="text-dark-aquamarine font-semibold mt-2">
              Completed!
            </p>
            {todaysActivity.details.notes && (
              <p className="text-xs text-yellow-400 italic mt-2">
                Original Note: {todaysActivity.details.notes}
              </p>
            )}
          </div>
        );
      }
      return (
        <div className="bg-midnight-green-darker p-6 rounded-lg shadow-lg text-center">
          <h2 className="text-lg font-semibold text-goldenrod mb-1">
            Today's Workout: {currentDayFullName}
          </h2>
          <p className="text-gray mb-1 text-xl">
            {todaysActivity.details.name}
          </p>
          {todaysActivity.details.notes && (
            <p className="text-xs text-yellow-400 italic mb-3">
              Note: {todaysActivity.details.notes}
            </p>
          )}
          <button
            onClick={handleStartWorkout}
            className="w-full mt-3 bg-midnight-green from-green-500 to-teal-500 text-white font-bold py-3 px-4 rounded-lg shadow-md hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-75"
          >
            Start Workout
          </button>
        </div>
      );
    }

    if (todaysActivity?.type === "rest") {
      return (
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg text-center">
          <FaBed className="text-blue-500 text-3xl mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-goldenrod mb-2">
            {currentDayFullName}: Rest Day
          </h2>
          <p className="text-gray-300">Enjoy your recovery!</p>
          {todaysActivity.details.notes && (
            <p className="text-xs text-yellow-400 italic mt-2">
              Note: {todaysActivity.details.notes}
            </p>
          )}
        </div>
      );
    }
    return (
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg text-center">
        <h2 className="text-lg font-semibold text-goldenrod mb-2">
          Today's Plan
        </h2>
        <p className="text-gray-400">
          {todaysActivity?.message ||
            "No specific activity scheduled for today."}
        </p>
        <Link
          to="/schedule/edit"
          className="inline-block mt-4 bg-goldenrod text-midnight-green font-semibold py-2 px-4 rounded-lg hover:opacity-90"
        >
          View/Edit Schedule
        </Link>
      </div>
    );
  };

  const renderRestartModal = () => {
    if (!showRestartModal) return null;
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
        <div className="bg-gray-800 p-6 md:p-8 rounded-xl shadow-2xl max-w-md w-full text-center border-2 border-goldenrod">
          <FaExclamationTriangle className="text-red-500 text-5xl mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-goldenrod mb-3">Oh No!</h2>
          <p className="text-gray-300 mb-6 text-lg">
            Your DracoFit companion has fainted. It's time for a fresh start!
          </p>
          <p className="text-gray-400 mb-8">
            Would you like to begin a new journey from Level 1 with a new
            companion?
          </p>
          <button
            onClick={handleRestartJourneyClick}
            disabled={isRestarting}
            className="w-full bg-gradient-to-r from-goldenrod to-yellow-600 text-gray-900 font-bold py-3 px-6 rounded-lg shadow-lg hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-opacity-75 disabled:opacity-50 flex items-center justify-center"
          >
            {isRestarting ? (
              <FaSpinner className="animate-spin mr-2" />
            ) : (
              <FaRedo className="mr-2" />
            )}
            {isRestarting ? "Restarting..." : "Restart Journey"}
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      {renderRestartModal()}
      <div className="min-h-screen homepage-radial-gradient-dark-subtle text-white mb-4">
        <header className="flex justify-between items-center p-6 max-w-md mx-auto">
          <div className="flex items-center">
            <div className="mr-3">
              {profilePictureUrl && !profileImageError ? (
                <img
                  src={profilePictureUrl}
                  alt="Profile"
                  className="w-12 h-12 rounded-full object-cover border-2 border-goldenrod"
                  onError={() => {
                    console.warn(
                      "Home.jsx: Failed to load profile image from fetched URL:",
                      profilePictureUrl
                    );
                    setProfileImageError(true);
                  }}
                />
              ) : profilePicLoading && !activeSimulation ? (
                <div className="w-12 h-12 flex items-center justify-center">
                  <FaSpinner className="animate-spin text-goldenrod" />
                </div>
              ) : (
                <FaUserCircle className="w-12 h-12 text-gray-500" />
              )}
            </div>
            <div>
              <h1 className="text-xl font-semibold text-goldenrod">
                {userData.username}
              </h1>
              <p className="text-xs text-gray-400">Welcome back!</p>
            </div>
          </div>
          <Link to="/settings" className="text-gray-400 hover:text-goldenrod">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              ></path>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              ></path>
            </svg>
          </Link>
        </header>

        <div className="flex justify-center items-center ">
          <DragonDisplay
            level={petData.level}
            stage={petData.stage} // Pass stage to DragonDisplay
            animation={petData.animation}
            onClick={handleDragonClick}
          />
        </div>

        <div className="max-w-md mx-auto pt-6 px-6">
          <div className="space-y-6 py-2">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-start flex-grow mr-4">
                <div className="flex items-center mr-4">
                  <div className="relative">
                    <div
                      onClick={() => toggleTooltip("level")}
                      title="Your current level."
                      className="cursor-pointer rounded-full mr-2 flex items-center justify-center"
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) =>
                        e.key === "Enter" && toggleTooltip("level")
                      }
                    >
                      <img
                        src={targetLevelIcon}
                        alt="Level"
                        className="h-10 w-10"
                        aria-label="Level icon"
                      />
                    </div>
                    {activeTooltip === "level" && (
                      <div className={`${tooltipBaseClass} bottom-full mb-2`}>
                        Your current level.
                      </div>
                    )}
                  </div>
                </div>
                <div
                  className="flex-grow relative"
                  style={{ minWidth: "100px" }}
                >
                  <div
                    onClick={() => toggleTooltip("xp")}
                    title="Experience Points: Gain XP to level up."
                    className="cursor-pointer"
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === "Enter" && toggleTooltip("xp")}
                  >
                    <div className="flex justify-between mb-1">
                      <span className="text-xs font-medium text-goldenrod">
                        XP
                      </span>
                      <span className="text-xs font-medium text-gray-400">
                        {userData.xp} / {userData.xpToNextLevel}
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2.5">
                      <div
                        className="bg-gradient-to-r from-yellow-400 to-orange-500 h-2.5 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${xpPercentage}%` }}
                      ></div>
                    </div>
                  </div>
                  {activeTooltip === "xp" && (
                    <div className={`${tooltipBaseClass} bottom-full mb-2`}>
                      Experience Points: Gain XP to level up.
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-center flex-shrink-0 relative">
                <div
                  onClick={() => toggleTooltip("streak")}
                  title="Daily Streak: Consecutive days you've been active."
                  className="cursor-pointer"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) =>
                    e.key === "Enter" && toggleTooltip("streak")
                  }
                >
                  <div
                    className="p-1 rounded-full mr-1 flex items-center justify-center"
                    style={{ width: "50px", height: "50px" }}
                  >
                    <StreakAnimation
                      targetSize="36px"
                      lottieScaleFactor={1.8}
                      streakCount={userData.streak}
                    />
                  </div>
                </div>
                {activeTooltip === "streak" && (
                  <div className={`${tooltipBaseClass} bottom-full mb-2`}>
                    Daily Streak: Consecutive days you've been active.
                  </div>
                )}
              </div>
            </div>
            <div className="relative">
              <div
                className="flex items-center space-x-2 cursor-pointer"
                onClick={() => toggleTooltip("health")}
                title="Health: Your pet's current well-being."
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && toggleTooltip("health")}
              >
                <div className="flex items-center flex-shrink-0">
                  <div className="pl-2.5 mr-3">
                    <HeartAnimation size="20px" />
                  </div>
                </div>
                <div className="flex-grow" style={{ minWidth: "100px" }}>
                  <div className="flex justify-between mb-1">
                    <span className="text-xs font-medium text-red-500">
                      Health
                    </span>
                    <span className="text-xs font-medium text-gray-400">
                      {userData.health} / {MAX_HEALTH_DEFAULT}
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2.5">
                    <div
                      className={`${
                        healthPercentage === 100
                          ? "bg-red-500"
                          : "bg-gradient-to-r from-red-600 to-pink-900"
                      } h-2.5 rounded-full transition-all duration-500 ease-out`}
                      style={{ width: `${healthPercentage}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              {activeTooltip === "health" && (
                <div className={`${tooltipBaseClass} bottom-full mb-2`}>
                  Health: Your pet's current well-being.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-md mx-auto px-6 py-4">
          {renderTodaysActivitySection()}
        </div>

        <footer className="max-w-md mx-auto px-6 py-4 text-center text-gray-500 text-xs">
          DracoFit - Level up your life.
        </footer>
      </div>

      {/* --- Simulation Panel Button --- */}
      <button
        onClick={() => setShowSimPanel(true)}
        className="fixed bottom-4 right-4 bg-purple-600 hover:bg-purple-700 text-white p-3 rounded-full shadow-lg z-40 focus:outline-none focus:ring-2 focus:ring-purple-400"
        aria-label="Open Simulation Panel"
        title="Simulation Panel"
      >
        <FaFlask size={24} />
      </button>

      {/* --- Simulation Panel Component --- */}
      <SimulationPanel
        isVisible={showSimPanel}
        onClose={() => setShowSimPanel(false)}
        onSimulate={handleSimulate}
        activeSimulation={activeSimulation}
      />
    </>
  );
};

export default Home;
