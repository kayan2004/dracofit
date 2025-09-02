import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import scheduleService from "../../services/scheduleService";
import workoutLogsService from "../../services/workoutLogsService";
import FormButton from "../common/FormButton";
import {
  FaCalendarAlt,
  FaChevronLeft,
  FaChevronRight,
  FaCheckCircle,
  FaLock,
  FaEdit,
  FaSpinner,
  FaEye, // Added FaEye for the summary button
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

const WeeklyScheduleOverview = () => {
  console.log("WeeklyScheduleOverview: Component rendering/re-rendering.");
  const {
    isAuthenticated,
    currentUser: user,
    loading: authLoading,
  } = useAuth();
  const navigate = useNavigate();
  const scrollRef = useRef(null);

  const [scheduleDataFromBackend, setScheduleDataFromBackend] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [todaysCompletedLogsMap, setTodaysCompletedLogsMap] = useState(
    new Map()
  );
  const [isCheckingLogs, setIsCheckingLogs] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);

  const fetchData = useCallback(async () => {
    if (
      authLoading ||
      !isAuthenticated ||
      !user ||
      typeof user.id === "undefined"
    ) {
      console.log(
        "WeeklyScheduleOverview: fetchData - Pre-condition not met (auth/user). Bailing out."
      );
      if (!authLoading) {
        setLoading(false);
        setIsCheckingLogs(false);
      }
      return;
    }

    console.log("WeeklyScheduleOverview: fetchData called.");
    setLoading(true);
    setIsCheckingLogs(true);
    setError(null);

    try {
      console.log("WeeklyScheduleOverview: Fetching schedule...");
      const fetchedSchedule = await scheduleService.getSchedule();
      console.log(
        "WeeklyScheduleOverview: Fetched schedule data:",
        fetchedSchedule
          ? JSON.parse(JSON.stringify(fetchedSchedule))
          : fetchedSchedule
      );
      setScheduleDataFromBackend(fetchedSchedule);

      // --- MODIFIED SECTION FOR DETERMINING DATE RANGE FOR LOG QUERY ---
      // Always use the ACTUAL CURRENT DATE to fetch logs for `todaysCompletedLogsMap`.
      // This map is used to check if the workout plan associated with the schedule's 'isToday' entry
      // has been completed on the actual current day.
      const actualCurrentDateForLogQuery = new Date();
      const startOfDayForLogQuery = new Date(
        actualCurrentDateForLogQuery.getFullYear(),
        actualCurrentDateForLogQuery.getMonth(),
        actualCurrentDateForLogQuery.getDate(),
        0,
        0,
        0,
        0
      );
      const endOfDayForLogQuery = new Date(
        actualCurrentDateForLogQuery.getFullYear(),
        actualCurrentDateForLogQuery.getMonth(),
        actualCurrentDateForLogQuery.getDate(),
        23,
        59,
        59,
        999
      );

      console.log(
        "WeeklyScheduleOverview: Fetching logs for ACTUAL current day to check completions:", // Updated log message
        actualCurrentDateForLogQuery.toISOString().split("T")[0]
      );
      const todaysLogs = await workoutLogsService.getLogsByDateRange(
        startOfDayForLogQuery, // Use actual current day's start
        endOfDayForLogQuery // Use actual current day's end
      );
      // --- END OF MODIFIED SECTION ---

      console.log(
        "WeeklyScheduleOverview: Fetched logs for actual current day (raw):", // Updated log message
        todaysLogs ? JSON.parse(JSON.stringify(todaysLogs)) : todaysLogs
      );

      const newCompletedLogsMap = new Map();
      if (Array.isArray(todaysLogs)) {
        console.log(
          `WeeklyScheduleOverview: Processing ${todaysLogs.length} logs from actual current day.` // Updated log message
        );
        todaysLogs.forEach((log) => {
          console.log("WeeklyScheduleOverview: Processing log:", log);
          if (
            log.workoutPlan &&
            typeof log.workoutPlan.id === "number" &&
            log.endTime &&
            typeof log.id === "number"
          ) {
            console.log(
              `WeeklyScheduleOverview: Adding to map - Plan ID: ${log.workoutPlan.id}, Log ID: ${log.id}`
            );
            newCompletedLogsMap.set(log.workoutPlan.id, log.id);
          } else {
            console.log(
              "WeeklyScheduleOverview: Log skipped (missing plan, plan.id, endTime, or log.id):",
              log
            );
          }
        });
      } else {
        console.log(
          "WeeklyScheduleOverview: todaysLogs (for actual current day) is not an array or is empty." // Updated log message
        );
      }
      setTodaysCompletedLogsMap(newCompletedLogsMap);
      console.log(
        "WeeklyScheduleOverview: Set todaysCompletedLogsMap (based on actual current day's logs):", // Updated log message
        newCompletedLogsMap
      );

      // For setting the initially selected day tab, we still use backend's idea of today
      const todayInfoFromBackendSchedule = fetchedSchedule?.days?.find(
        (d) => d.isToday
      );
      if (!selectedDay && todayInfoFromBackendSchedule?.dayOfWeek) {
        setSelectedDay(todayInfoFromBackendSchedule.dayOfWeek);
        console.log(
          "WeeklyScheduleOverview: Initial selectedDay tab set based on backend schedule's 'isToday':",
          todayInfoFromBackendSchedule.dayOfWeek
        );
      }
    } catch (err) {
      console.error("WeeklyScheduleOverview: Error fetching data:", err);
      setError(err.message || "Failed to load data.");
    } finally {
      console.log("WeeklyScheduleOverview: fetchData finally block.");
      setLoading(false);
      setIsCheckingLogs(false);
    }
  }, [authLoading, isAuthenticated, user, selectedDay]);

  // Effect for initial data load and when auth/user changes
  useEffect(() => {
    console.log(
      "WeeklyScheduleOverview: Initial data fetch effect (component mount/auth change)."
    );
    fetchData();
  }, [fetchData]); // fetchData is memoized, this effect runs when fetchData identity changes

  // Effect for refreshing data on window focus or visibility change
  useEffect(() => {
    const handleDataRefreshOnFocus = () => {
      console.log(
        "WeeklyScheduleOverview: Window focused or became visible, calling fetchData."
      );
      fetchData(); // Call the memoized fetchData
    };

    window.addEventListener("focus", handleDataRefreshOnFocus);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        handleDataRefreshOnFocus();
      }
    });

    return () => {
      window.removeEventListener("focus", handleDataRefreshOnFocus);
      document.removeEventListener(
        "visibilitychange",
        handleDataRefreshOnFocus
      );
    };
  }, [fetchData]); // Re-attach listener if fetchData identity changes

  // --- Scrolling Effect ---
  useEffect(() => {
    if (scrollRef.current && selectedDay) {
      // Ensure selectedDay is not null
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
  const showLoadingSpinner = loading || authLoading; // Combined loading state for spinner
  console.log(
    "WeeklyScheduleOverview: Render - Combined loading state (showLoadingSpinner):",
    showLoadingSpinner,
    "Individual states: loading:",
    loading,
    "authLoading:",
    authLoading
  );

  if (showLoadingSpinner && !scheduleDataFromBackend) {
    // Show full page loader only if no data yet
    console.log(
      "WeeklyScheduleOverview: Render - Displaying main loading spinner (initial)."
    );
    return (
      <div className="bg-midnight-green p-4 rounded-lg shadow-md mb-6 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-goldenrod mx-auto"></div>
        <p className="mt-2 text-gray-400">Loading schedule...</p>
      </div>
    );
  }

  if (!isAuthenticated && !authLoading) {
    console.log("WeeklyScheduleOverview: Render - User not authenticated.");
    return (
      <div className="bg-midnight-green p-4 rounded-lg shadow-md mb-6 text-center">
        <p className="text-gray-400">Please log in to view your schedule.</p>
        <FormButton onClick={() => navigate("/login")} styles="mt-4">
          Login
        </FormButton>
      </div>
    );
  }

  const scheduleDays = scheduleDataFromBackend?.days;
  const hasWorkouts = scheduleDays?.some((day) =>
    day.entries?.some((entry) => entry.workoutPlan)
  );

  console.log(
    "WeeklyScheduleOverview: Render - Current selectedDay state:",
    selectedDay
  );
  const selectedDayObject = scheduleDays?.find(
    (day) => day.dayOfWeek === selectedDay
  );
  console.log(
    "WeeklyScheduleOverview: Render - selectedDayObject:",
    selectedDayObject
      ? JSON.parse(JSON.stringify(selectedDayObject))
      : selectedDayObject
  );

  const selectedEntry = selectedDayObject?.entries?.[0];
  console.log(
    "WeeklyScheduleOverview: Render - selectedEntry:",
    selectedEntry ? JSON.parse(JSON.stringify(selectedEntry)) : selectedEntry
  );

  const selectedWorkout = selectedEntry?.workoutPlan;
  console.log(
    "WeeklyScheduleOverview: Render - selectedWorkout:",
    selectedWorkout
      ? JSON.parse(JSON.stringify(selectedWorkout))
      : selectedWorkout
  );

  let workoutLogIdForSelectedToday = null;
  if (
    selectedDayObject?.isToday &&
    selectedWorkout &&
    selectedWorkout.id // Ensure selectedWorkout.id exists
  ) {
    console.log(
      `WeeklyScheduleOverview: Render - Checking map for Plan ID: ${selectedWorkout.id}. Map has key?`,
      todaysCompletedLogsMap.has(selectedWorkout.id)
    );
    if (todaysCompletedLogsMap.has(selectedWorkout.id)) {
      workoutLogIdForSelectedToday = todaysCompletedLogsMap.get(
        selectedWorkout.id
      );
    }
  }

  console.log(
    "WeeklyScheduleOverview: Render - Final workoutLogIdForSelectedToday:",
    workoutLogIdForSelectedToday
  );
  console.log(
    "WeeklyScheduleOverview: Render - Conditions for button switch: isToday:",
    selectedDayObject?.isToday,
    "workoutLogIdForSelectedToday (truthy?):",
    !!workoutLogIdForSelectedToday
  );

  const noWorkoutsCondition = !loading && (!scheduleDays || !hasWorkouts);

  return (
    <div className="bg-midnight-green p-4 rounded-lg shadow-md mb-6 md:w-min">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-400 flex items-center">
          <FaCalendarAlt className="mr-2 text-goldenrod" /> Weekly Schedule
        </h2>
        <button
          onClick={() => navigate("/schedule/")}
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

      {noWorkoutsCondition && !showLoadingSpinner ? (
        <div className="text-center py-6">
          <p className="text-gray-400">No workouts scheduled for this week.</p>
          <FormButton onClick={() => navigate("/schedule/edit")} styles="mt-4">
            Set Up Schedule
          </FormButton>
        </div>
      ) : (
        scheduleDays && (
          <>
            <div
              ref={scrollRef}
              className="flex overflow-x-auto py-2 hide-scrollbar mb-4 border-b border-gray-700"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {scheduleDays.map((day) => {
                const hasWorkoutOnTab = !!day.entries?.some(
                  (e) => e.workoutPlan
                );
                const isSelectedTab = selectedDay === day.dayOfWeek;
                const isCurrentDayTab = day.isToday;

                let isLoggedForTab = false;
                if (
                  isCurrentDayTab &&
                  hasWorkoutOnTab &&
                  day.entries?.[0]?.workoutPlan?.id
                ) {
                  isLoggedForTab = todaysCompletedLogsMap.has(
                    day.entries[0].workoutPlan.id
                  );
                }

                return (
                  <div
                    id={`tab-${day.dayOfWeek}`}
                    key={day.dayOfWeek}
                    onClick={() => {
                      console.log(
                        "WeeklyScheduleOverview: Day tab clicked:",
                        day.dayOfWeek
                      );
                      setSelectedDay(day.dayOfWeek);
                    }}
                    className={`
                      flex-shrink-0 px-4 py-2 mr-2 cursor-pointer rounded-t-lg
                      text-sm font-medium flex items-center transition-colors duration-200
                      ${
                        isSelectedTab
                          ? "bg-goldenrod text-midnight-green shadow-inner"
                          : "text-gray-300 hover:bg-gray-700/50"
                      }
                      ${
                        isCurrentDayTab && !isSelectedTab
                          ? "border-b-2 border-green-500"
                          : ""
                      }
                    `}
                  >
                    {DAYS_OF_WEEK.find((d) => d.id === day.dayOfWeek)?.label ||
                      day.dayOfWeek.substring(0, 3)}{" "}
                    {hasWorkoutOnTab &&
                      (isLoggedForTab ? (
                        <FaCheckCircle className="ml-1.5 text-blue-400" />
                      ) : (
                        <span
                          className={`ml-1.5 w-2 h-2 rounded-full inline-block ${
                            isSelectedTab
                              ? "bg-midnight-green/70"
                              : "bg-white/70"
                          }`}
                        ></span>
                      ))}
                  </div>
                );
              })}
            </div>
            {selectedDayObject && (
              <div
                className={`rounded-lg p-4 transition-colors duration-300 ${
                  selectedWorkout
                    ? "bg-dark-slate-gray"
                    : "bg-midnight-green-darker"
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-lg flex items-center text-white">
                    {
                      DAYS_OF_WEEK.find(
                        (d) => d.id === selectedDayObject.dayOfWeek
                      )?.fullName
                    }
                    {selectedDayObject.isToday && (
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
                      {selectedWorkout.description ||
                        "No description available."}
                    </p>
                    {selectedEntry?.notes?.includes("(Rescheduled") && (
                      <p className="text-yellow-500 text-xs italic mb-3">
                        {selectedEntry.notes}
                      </p>
                    )}

                    <div className="mt-4">
                      {selectedDayObject.isToday ? (
                        workoutLogIdForSelectedToday ? (
                          <FormButton
                            onClick={() => {
                              if (workoutLogIdForSelectedToday) {
                                console.log(
                                  "WeeklyScheduleOverview: Navigating to Workout Summary for log ID:",
                                  workoutLogIdForSelectedToday
                                );
                                navigate(
                                  `/workout-summary/${workoutLogIdForSelectedToday}`
                                );
                              }
                            }}
                            styles="px-3 py-1 text-sm w-full bg-blue-600 hover:bg-blue-700"
                            disabled={isCheckingLogs}
                          >
                            {isCheckingLogs ? (
                              <FaSpinner className="animate-spin mr-2" />
                            ) : (
                              <>
                                <FaEye className="mr-2" /> See Workout Summary
                              </>
                            )}
                          </FormButton>
                        ) : (
                          <FormButton
                            onClick={() => {
                              if (selectedWorkout?.id) {
                                console.log(
                                  "WeeklyScheduleOverview: Navigating to Start Today's Workout for workout ID:",
                                  selectedWorkout.id
                                );
                                navigate(
                                  `/workout-session/${selectedWorkout.id}`
                                );
                              } else {
                                console.error(
                                  "WeeklyScheduleOverview: Cannot start workout - selectedWorkout.id is missing."
                                );
                              }
                            }}
                            styles="px-3 py-1 text-sm w-full"
                            disabled={isCheckingLogs || !selectedWorkout}
                          >
                            {isCheckingLogs || loading ? (
                              <FaSpinner className="animate-spin mr-2" />
                            ) : (
                              "Start Today's Workout"
                            )}
                          </FormButton>
                        )
                      ) : (
                        <div className="text-center">
                          <button
                            disabled
                            className="px-3 py-1 text-sm w-full bg-gray-700 text-gray-400 rounded cursor-not-allowed flex items-center justify-center"
                          >
                            <FaLock className="mr-1" /> Available on{" "}
                            {
                              DAYS_OF_WEEK.find(
                                (d) => d.id === selectedDayObject.dayOfWeek
                              )?.fullName
                            }
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-gray-400">Rest Day</p>
                    {selectedEntry?.notes?.includes("(Workout moved") && (
                      <p className="text-gray-500 text-sm mt-2">
                        {selectedEntry.notes}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        )
      )}
      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default WeeklyScheduleOverview;
