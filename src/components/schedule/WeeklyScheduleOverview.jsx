import React, { useState, useEffect, useRef } from "react"; // Removed useMemo
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import scheduleService from "../../services/scheduleService";
// Removed workoutLogsService import as skip check is now backend-driven
// import workoutLogsService from "../../services/workoutLogsService";
import FormButton from "../common/FormButton";
import {
  FaCalendarAlt,
  FaChevronLeft,
  FaChevronRight,
  FaCheckCircle,
  FaLock,
  FaEdit,
} from "react-icons/fa";

// --- Constants ---
const DAYS_OF_WEEK = [
  { id: "sunday", label: "Sun", fullName: "Sunday" },
  { id: "monday", label: "Mon", fullName: "Monday" },
  { id: "tuesday", label: "Tue", fullName: "Tuesday" },
  { id: "wednesday", label: "Wed", fullName: "Wednesday" },
  { id: "thursday", label: "Thu", fullName: "Thursday" },
  { id: "friday", label: "Fri", fullName: "Friday" },
  { id: "saturday", label: "Sat", fullName: "Saturday" },
];

// --- Helper Functions ---
const getDayIndex = (dayId) => {
  return DAYS_OF_WEEK.findIndex((day) => day.id === dayId);
};

const WeeklyScheduleOverview = () => {
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const scrollRef = useRef(null);

  // Renamed state to 'schedule' as it now represents the effective schedule from backend
  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(true); // For initial schedule load
  const [error, setError] = useState(null);

  const getCurrentDayId = () => {
    const today = new Date().getDay(); // 0 is Sunday, 1 is Monday, etc.
    const dayMap = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ];
    return dayMap[today];
  };
  const currentDayId = getCurrentDayId();

  const [selectedDay, setSelectedDay] = useState(currentDayId);

  // --- Fetch Schedule (Backend now handles rescheduling) ---
  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    const fetchSchedule = async () => {
      try {
        setLoading(true);
        setError(null);
        // Fetch the schedule - backend applies temporary reschedules
        const data = await scheduleService.getSchedule();
        console.log(
          "Fetched schedule data (with backend reschedules applied):",
          data
        );
        setSchedule(data); // Set the main schedule state
      } catch (err) {
        console.error("Error fetching schedule:", err);
        setError(
          err.message || "Failed to load your schedule. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };
    fetchSchedule();
  }, [isAuthenticated]); // Re-fetch if auth status changes

  // --- Scrolling Effect ---
  useEffect(() => {
    if (scrollRef.current) {
      const selectedElement = document.getElementById(`tab-${selectedDay}`);
      if (selectedElement) {
        const scrollContainer = scrollRef.current;
        const scrollLeft =
          selectedElement.offsetLeft -
          scrollContainer.offsetWidth / 2 +
          selectedElement.offsetWidth / 2;
        scrollContainer.scrollTo({ left: scrollLeft, behavior: "smooth" });
      }
    }
  }, [selectedDay]);

  // --- Render Logic ---

  // Updated loading state check
  const showLoading = loading || authLoading;

  if (showLoading) {
    return (
      <div className="bg-midnight-green p-4 rounded-lg shadow-md mb-6 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-goldenrod mx-auto"></div>
        <p className="mt-2 text-gray-400">Loading schedule...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="bg-midnight-green p-4 rounded-lg shadow-md mb-6 text-center">
        <p className="text-gray-400">Please log in to view your schedule.</p>
        <FormButton onClick={() => navigate("/login")} styles="mt-4">
          Login
        </FormButton>
      </div>
    );
  }

  // Use 'schedule' directly for checks and rendering
  const hasWorkouts = schedule?.entries?.some((entry) => entry.workoutPlan);
  const selectedEntry = schedule?.entries?.find(
    (entry) => entry.dayOfWeek === selectedDay
  );
  const selectedWorkout = selectedEntry?.workoutPlan;
  const isCurrentDaySelected = selectedDay === currentDayId;

  return (
    <div className="bg-midnight-green p-4 rounded-lg shadow-md mb-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-white flex items-center">
          <FaCalendarAlt className="mr-2 text-goldenrod" /> Weekly Schedule
        </h2>
        {/* Edit Schedule Button - Ensure route is correct */}
        <button
          onClick={() => navigate("/schedule/edit")} // Navigate to the edit page
          className="text-gray-400 hover:text-goldenrod transition-colors p-1 rounded"
          aria-label="Edit schedule"
        >
          <FaEdit size={18} />
        </button>
      </div>

      {error && (
        <div className="bg-red-800/30 border border-red-700 text-red-400 p-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {/* Check if schedule exists and has entries before showing setup button */}
      {!loading && (!schedule || !schedule.entries || !hasWorkouts) ? (
        <div className="text-center py-6">
          <p className="text-gray-400">No workouts scheduled for this week.</p>
          <FormButton onClick={() => navigate("/schedule/edit")} styles="mt-4">
            Set Up Schedule
          </FormButton>
        </div>
      ) : (
        // Render schedule only if schedule and entries exist
        schedule?.entries && (
          <>
            {/* Scrollable day tabs - Use 'schedule' */}
            <div
              ref={scrollRef}
              className="flex overflow-x-auto py-2 hide-scrollbar mb-4 border-b border-gray-700"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {DAYS_OF_WEEK.map((day) => {
                // Find entry in the fetched schedule
                const entry = schedule.entries.find(
                  (e) => e.dayOfWeek === day.id
                );
                const hasWorkout = !!entry?.workoutPlan;
                const isSelected = selectedDay === day.id;
                const isCurrentDay = currentDayId === day.id;

                return (
                  <div
                    id={`tab-${day.id}`}
                    key={day.id}
                    onClick={() => setSelectedDay(day.id)}
                    className={`
                      flex-shrink-0 px-4 py-2 mr-2 cursor-pointer rounded-t-lg
                      text-sm font-medium flex items-center transition-colors duration-200
                      ${
                        isSelected
                          ? "bg-goldenrod text-midnight-green shadow-inner"
                          : "text-gray-300 hover:bg-gray-700/50"
                      }
                      ${
                        isCurrentDay && !isSelected
                          ? "border-b-2 border-green-500"
                          : ""
                      }
                    `}
                  >
                    {day.label}
                    {hasWorkout && (
                      <span
                        className={`ml-1.5 w-2 h-2 rounded-full inline-block ${
                          isSelected ? "bg-midnight-green/70" : "bg-white/70"
                        }`}
                      ></span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Selected day content - Uses selectedEntry/selectedWorkout derived from 'schedule' */}
            <div
              className={`rounded-lg p-4 transition-colors duration-300 ${
                selectedWorkout
                  ? "bg-dark-slate-gray border border-goldenrod/30"
                  : "bg-gray-800/50"
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-lg flex items-center text-white">
                  {DAYS_OF_WEEK.find((d) => d.id === selectedDay)?.fullName}
                  {selectedDay === currentDayId && (
                    <span className="ml-2 text-xs bg-green-800 text-white px-2 py-1 rounded-full">
                      Today
                    </span>
                  )}
                </h3>
                {selectedEntry?.preferredTime && (
                  <span className="text-sm text-gray-400">
                    {selectedEntry.preferredTime}
                  </span>
                )}
              </div>

              {selectedWorkout ? (
                <div>
                  <p className="text-goldenrod font-semibold mb-1">
                    {selectedWorkout.name}
                  </p>
                  <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                    {selectedWorkout.description || "No description available."}
                  </p>
                  {/* Display reschedule note directly from backend data */}
                  {selectedEntry?.notes?.includes("(Rescheduled") && (
                    <p className="text-yellow-500 text-xs italic mb-3">
                      {selectedEntry.notes}
                    </p>
                  )}

                  <div className="mt-4">
                    {selectedDay === currentDayId ? (
                      <FormButton
                        onClick={() =>
                          navigate(`/workout-session/${selectedWorkout.id}`)
                        }
                        styles="px-3 py-1 text-sm w-full"
                      >
                        Start Today's Workout
                      </FormButton>
                    ) : (
                      <div className="text-center">
                        <button
                          disabled
                          className="px-3 py-1 text-sm w-full bg-gray-700 text-gray-400 rounded cursor-not-allowed flex items-center justify-center"
                        >
                          <FaLock className="mr-1" /> Available on{" "}
                          {
                            DAYS_OF_WEEK.find((d) => d.id === selectedDay)
                              ?.fullName
                          }
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-gray-400">Rest Day</p>
                  {/* Display note if this day became rest due to reschedule (comes from backend) */}
                  {selectedEntry?.notes?.includes("(Workout moved") && (
                    <p className="text-gray-500 text-sm mt-2">
                      {selectedEntry.notes}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Today's workout quick access - Use 'schedule' */}
            {selectedDay !== currentDayId &&
              schedule.entries.find((e) => e.dayOfWeek === currentDayId)
                ?.workoutPlan && (
                <div className="mt-4 p-3 bg-green-800/20 border border-green-700/30 rounded-lg">
                  <h3 className="font-bold text-white flex items-center mb-2">
                    <FaCheckCircle className="text-green-500 mr-2" /> Today's
                    Workout
                  </h3>
                  {(() => {
                    const todaysWorkout = schedule.entries.find(
                      (e) => e.dayOfWeek === currentDayId
                    )?.workoutPlan;
                    return (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300 text-sm">
                          {todaysWorkout.name}
                        </span>
                        <FormButton
                          onClick={() => {
                            setSelectedDay(currentDayId);
                            navigate(`/workout-session/${todaysWorkout.id}`);
                          }}
                          styles="px-3 py-1 text-xs"
                        >
                          Start Now
                        </FormButton>
                      </div>
                    );
                  })()}
                </div>
              )}
          </>
        )
      )}

      {/* Style tag for scrollbar */}
      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default WeeklyScheduleOverview;
