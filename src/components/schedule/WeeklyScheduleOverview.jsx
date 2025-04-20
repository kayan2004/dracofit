import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import scheduleService from "../../services/scheduleService";
import { useAuth } from "../../hooks/useAuth";
import FormButton from "../common/FormButton";
import {
  FaArrowRight,
  FaCalendarAlt,
  FaClock,
  FaDumbbell,
  FaLock,
  FaCheckCircle,
} from "react-icons/fa";

const DAYS_OF_WEEK = [
  { id: "monday", label: "MON", fullName: "Monday" },
  { id: "tuesday", label: "TUE", fullName: "Tuesday" },
  { id: "wednesday", label: "WED", fullName: "Wednesday" },
  { id: "thursday", label: "THU", fullName: "Thursday" },
  { id: "friday", label: "FRI", fullName: "Friday" },
  { id: "saturday", label: "SAT", fullName: "Saturday" },
  { id: "sunday", label: "SUN", fullName: "Sunday" },
];

const WeeklyScheduleOverview = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const scrollRef = useRef(null);

  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get current day of the week
  const getCurrentDayId = () => {
    const today = new Date().getDay(); // 0 is Sunday, 1 is Monday, etc.
    // Convert JS day (0-6) to our day format (monday, tuesday, etc.)
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

  // Determine current day
  const currentDayId = getCurrentDayId();

  // State to track the selected day (default to current day)
  const [selectedDay, setSelectedDay] = useState(currentDayId);

  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchSchedule = async () => {
      try {
        setLoading(true);
        const data = await scheduleService.getSchedule();
        setSchedule(data);
      } catch (err) {
        console.error("Error fetching schedule:", err);
        setError("Failed to load your schedule");
      } finally {
        setLoading(false);
      }
    };

    fetchSchedule();
  }, [isAuthenticated]);

  // Scroll selected day into view when tabs change or component loads
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

  if (!isAuthenticated) {
    return (
      <div className="bg-midnight-green p-4 rounded-lg shadow-md mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl text-goldenrod font-semibold">
            Weekly Schedule
          </h2>
          <Link
            to="/login"
            state={{ from: "/schedule" }}
            className="text-sm text-goldenrod hover:underline"
          >
            Log in to view your schedule
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-midnight-green p-4 rounded-lg shadow-md mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl text-goldenrod font-semibold">
            Weekly Schedule
          </h2>
        </div>
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-goldenrod"></div>
        </div>
      </div>
    );
  }

  // Check if there are any workouts assigned to any day
  const hasWorkouts = schedule?.entries?.some((entry) => entry.workoutPlan);

  // Get the currently selected day's entry
  const selectedEntry = schedule?.entries?.find(
    (entry) => entry.dayOfWeek === selectedDay
  );
  const selectedWorkout = selectedEntry?.workoutPlan;

  // Check if selected day is current day
  const isCurrentDaySelected = selectedDay === currentDayId;

  return (
    <div className="bg-midnight-green p-4 rounded-lg shadow-md mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl text-goldenrod font-semibold flex items-center">
          <FaCalendarAlt className="mr-2" /> Weekly Schedule
        </h2>
        <Link
          to="/schedule"
          className="text-sm text-goldenrod hover:underline flex items-center"
        >
          Manage Schedule <FaArrowRight className="ml-1" />
        </Link>
      </div>

      {error && (
        <div className="bg-sepia/20 text-white p-3 rounded-md mb-3">
          {error}
        </div>
      )}

      {!hasWorkouts ? (
        <div className="text-center py-4">
          <p className="text-gray-400 mb-3">
            You haven't set up your weekly workout schedule yet
          </p>
          <FormButton
            onClick={() => navigate("/schedule")}
            styles="px-4 py-2 text-sm"
          >
            Create Schedule
          </FormButton>
        </div>
      ) : (
        <>
          {/* Scrollable day tabs */}
          <div
            ref={scrollRef}
            className="flex overflow-x-auto py-2 hide-scrollbar mb-4"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {DAYS_OF_WEEK.map((day) => {
              const entry = schedule?.entries?.find(
                (e) => e.dayOfWeek === day.id
              );
              const hasWorkout = entry?.workoutPlan;
              const isSelected = selectedDay === day.id;
              const isCurrentDay = day.id === currentDayId;

              return (
                <div
                  id={`tab-${day.id}`}
                  key={day.id}
                  onClick={() => setSelectedDay(day.id)}
                  className={`flex-shrink-0 cursor-pointer mx-1 px-4 py-2 rounded-t-lg transition-colors duration-200 flex items-center ${
                    isSelected
                      ? hasWorkout
                        ? "bg-goldenrod text-midnight-green font-bold"
                        : "bg-gray-700 text-white font-bold"
                      : hasWorkout
                      ? "bg-dark-goldenrod/40 text-goldenrod hover:bg-dark-goldenrod/60"
                      : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                  }`}
                >
                  {day.label}
                  {/* Current day indicator */}
                  {isCurrentDay && (
                    <span className="ml-1 text-xs">
                      <FaCheckCircle
                        className={
                          isSelected ? "text-midnight-green" : "text-green-500"
                        }
                      />
                    </span>
                  )}
                  {/* Workout indicator */}
                  {hasWorkout && (
                    <span className="ml-1 w-2 h-2 bg-white rounded-full inline-block"></span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Selected day content */}
          <div
            className={`rounded-lg p-4 ${
              selectedWorkout
                ? "bg-dark-slate-gray border border-goldenrod/30"
                : "bg-gray-800"
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-bold text-lg flex items-center">
                {DAYS_OF_WEEK.find((d) => d.id === selectedDay)?.fullName}
                {selectedDay === currentDayId && (
                  <span className="ml-2 text-xs bg-green-800 text-white px-2 py-1 rounded-full">
                    Today
                  </span>
                )}
              </h3>
              {selectedEntry?.preferredTime && (
                <div className="text-goldenrod text-sm flex items-center">
                  <FaClock className="mr-1" />
                  {new Date(
                    `2022-01-01T${selectedEntry.preferredTime}`
                  ).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              )}
            </div>

            {selectedWorkout ? (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <FaDumbbell className="text-goldenrod" />
                  <h4 className="font-semibold text-white">
                    {selectedWorkout.name}
                  </h4>
                </div>

                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="px-2 py-1 bg-midnight-green rounded-full text-xs">
                    {selectedWorkout.type}
                  </span>
                  <span className="px-2 py-1 bg-midnight-green rounded-full text-xs">
                    {selectedWorkout.durationMinutes} minutes
                  </span>
                  {selectedWorkout.exercises?.length > 0 && (
                    <span className="px-2 py-1 bg-midnight-green rounded-full text-xs">
                      {selectedWorkout.exercises.length} exercises
                    </span>
                  )}
                </div>

                {selectedEntry.notes && (
                  <div className="mt-3 text-sm text-gray-300 italic">
                    {selectedEntry.notes}
                  </div>
                )}

                <div className="mt-4">
                  {isCurrentDaySelected ? (
                    <FormButton
                      onClick={() =>
                        navigate(`/workout-session/${selectedWorkout.id}`)
                      }
                      styles="px-3 py-1 text-xs w-full"
                    >
                      Start Today's Workout
                    </FormButton>
                  ) : (
                    <div className="text-center">
                      <button
                        disabled
                        className="px-3 py-1 text-xs w-full bg-gray-700 text-gray-400 rounded cursor-not-allowed flex items-center justify-center"
                      >
                        <FaLock className="mr-1" /> Available on{" "}
                        {
                          DAYS_OF_WEEK.find((d) => d.id === selectedDay)
                            ?.fullName
                        }{" "}
                        Only
                      </button>
                      <p className="text-gray-500 text-xs mt-2">
                        You can only start workouts scheduled for today
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-gray-400">Rest Day</p>
                <p className="text-gray-500 text-sm mt-2">
                  Recovery is important! Take time to let your muscles heal.
                </p>
              </div>
            )}
          </div>

          {/* Today's workout quick access (if not already showing today) */}
          {!isCurrentDaySelected && currentDayId && (
            <div className="mt-4 p-3 bg-green-800/20 border border-green-700/30 rounded-lg">
              <h3 className="font-bold text-white flex items-center mb-2">
                <FaCheckCircle className="text-green-500 mr-2" /> Today's
                Workout
              </h3>

              {schedule?.entries?.find((e) => e.dayOfWeek === currentDayId)
                ?.workoutPlan ? (
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-white">
                      {
                        schedule.entries.find(
                          (e) => e.dayOfWeek === currentDayId
                        ).workoutPlan.name
                      }
                    </p>
                    <span className="text-gray-300 text-xs">
                      {
                        schedule.entries.find(
                          (e) => e.dayOfWeek === currentDayId
                        ).workoutPlan.durationMinutes
                      }{" "}
                      minutes
                    </span>
                  </div>
                  <FormButton
                    onClick={() => {
                      setSelectedDay(currentDayId);
                      const workout = schedule.entries.find(
                        (e) => e.dayOfWeek === currentDayId
                      ).workoutPlan;
                      if (workout) {
                        navigate(`/workout-session/${workout.id}`);
                      }
                    }}
                    styles="px-3 py-1 text-xs"
                  >
                    Start Now
                  </FormButton>
                </div>
              ) : (
                <p className="text-gray-300">Today is a rest day.</p>
              )}
            </div>
          )}
        </>
      )}

      {/* Add custom CSS to hide scrollbar */}
      <style jsx="true">{`
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
