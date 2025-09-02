import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import scheduleService from "../services/scheduleService";
import workoutsService from "../services/workoutsService";
import { useAuth } from "../hooks/useAuth";
import FormButton from "../components/common/FormButton";
import SecondaryButton from "../components/common/SecondaryButton";
import EditScheduleDay from "../components/schedule/EditScheduleDay";
import {
  FaEdit,
  FaTrash,
  FaArrowLeft,
  FaCheckCircle,
  FaClock,
  FaUndo, // Import the FaUndo icon
} from "react-icons/fa";

const DAYS_OF_WEEK = [
  { id: "monday", label: "Monday", shortLabel: "MON" },
  { id: "tuesday", label: "Tuesday", shortLabel: "TUE" },
  { id: "wednesday", label: "Wednesday", shortLabel: "WED" },
  { id: "thursday", label: "Thursday", shortLabel: "THU" },
  { id: "friday", label: "Friday", shortLabel: "FRI" },
  { id: "saturday", label: "Saturday", shortLabel: "SAT" },
  { id: "sunday", label: "Sunday", shortLabel: "SUN" },
];

// Helper function to enrich schedule entries with full workoutPlan objects
const enrichScheduleEntries = (scheduleData, availableWorkouts) => {
  if (
    !scheduleData ||
    !scheduleData.days || // Check for scheduleData.days
    !Array.isArray(scheduleData.days) ||
    !Array.isArray(availableWorkouts) ||
    !availableWorkouts.length
  ) {
    console.log(
      "Enrichment skipped: Invalid scheduleData, days array, or availableWorkouts",
      { scheduleData, availableWorkouts }
    );
    return scheduleData;
  }

  const enrichedDays = scheduleData.days.map((day) => {
    if (
      !day.entries ||
      !Array.isArray(day.entries) ||
      day.entries.length === 0
    ) {
      return day; // Return day as is if no entries or invalid entries
    }
    const enrichedDayEntries = day.entries.map((entry) => {
      if (
        entry.workoutPlanId &&
        (!entry.workoutPlan || !entry.workoutPlan.name) // Check if workoutPlan is missing or incomplete
      ) {
        const fullWorkoutPlan = availableWorkouts.find(
          (w) => w.id === entry.workoutPlanId
        );
        if (fullWorkoutPlan) {
          console.log(
            `Enriching entry for day ${entry.dayOfWeek}, workoutPlanId ${entry.workoutPlanId} with:`,
            fullWorkoutPlan
          );
          return { ...entry, workoutPlan: fullWorkoutPlan };
        } else {
          console.warn(
            `Enrichment failed: Workout plan with ID ${entry.workoutPlanId} not found in availableWorkouts for day ${entry.dayOfWeek}.`
          );
        }
      }
      return entry;
    });
    return { ...day, entries: enrichedDayEntries };
  });
  return { ...scheduleData, days: enrichedDays };
};

const EditSchedule = () => {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [schedule, setSchedule] = useState(null);
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingDay, setEditingDay] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Load schedule and workouts data
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/login", {
        state: {
          from: "/schedule",
          message: "Please log in to edit your workout schedule",
        },
      });
      return;
    }

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        const workoutsData = await workoutsService.getAllWorkouts();
        setWorkouts(workoutsData);
        console.log(
          "EditSchedule.jsx - Loaded workouts:",
          JSON.parse(JSON.stringify(workoutsData))
        );

        const rawScheduleData = await scheduleService.getSchedule();
        console.log(
          "EditSchedule.jsx - Loaded schedule (RAW from service, direct object):",
          rawScheduleData
        );
        const enrichedScheduleData = enrichScheduleEntries(
          rawScheduleData,
          workoutsData
        );
        setSchedule(enrichedScheduleData);
      } catch (err) {
        console.error("EditSchedule.jsx - Error loading data:", err);
        setError("Failed to load schedule data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated, authLoading, navigate]);

  // Handle editing a day
  const handleEditDay = (day) => {
    setEditingDay(day);
    setSuccess(null);
  };

  // Handle saving day changes
  const handleSaveDay = async (data) => {
    if (!editingDay) return;

    try {
      setSaving(true);
      setError(null);
      console.log(`Updating ${editingDay} with data:`, data);

      await scheduleService.updateDay(editingDay, data);

      const rawUpdatedSchedule = await scheduleService.getSchedule();
      console.log(
        "EditSchedule.jsx - Refreshed schedule after save (RAW from service, direct object):",
        rawUpdatedSchedule
      );
      const enrichedUpdatedSchedule = enrichScheduleEntries(
        rawUpdatedSchedule,
        workouts
      );
      setSchedule(enrichedUpdatedSchedule);

      setSuccess(
        `${
          editingDay.charAt(0).toUpperCase() + editingDay.slice(1)
        } updated successfully`
      );
      setEditingDay(null);
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err) {
      console.error("Error saving schedule:", err);
      setError(`Failed to update ${editingDay}. Please try again.`);
    } finally {
      setSaving(false);
    }
  };

  // Handle clearing a day (setting to rest)
  const handleClearDay = async (day) => {
    if (!window.confirm(`Are you sure you want to set ${day} as a rest day?`)) {
      return;
    }

    try {
      setLoading(true); // Or setSaving(true) for consistency
      setError(null);
      await scheduleService.clearDay(day);

      let updatedSchedule = await scheduleService.getSchedule();
      console.log(
        "Refreshed schedule after clear (raw):",
        JSON.parse(JSON.stringify(updatedSchedule))
      );
      updatedSchedule = enrichScheduleEntries(updatedSchedule, workouts); // Enrich here
      console.log(
        "Refreshed schedule after clear (enriched):",
        JSON.parse(JSON.stringify(updatedSchedule))
      );
      setSchedule(updatedSchedule);

      setSuccess(
        `${day.charAt(0).toUpperCase() + day.slice(1)} set as rest day`
      );
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err) {
      console.error("Error clearing day:", err);
      setError(`Failed to clear ${day}. Please try again.`);
    } finally {
      setLoading(false); // Or setSaving(false)
    }
  };

  // Handle resetting entire schedule
  const handleResetSchedule = async () => {
    if (
      !window.confirm(
        "Are you sure you want to reset your entire schedule? This will clear all workout assignments."
      )
    ) {
      return;
    }

    try {
      setLoading(true); // Or setSaving(true)
      setError(null);
      await scheduleService.resetSchedule();

      let updatedSchedule = await scheduleService.getSchedule();
      console.log(
        "Refreshed schedule after reset (raw):",
        JSON.parse(JSON.stringify(updatedSchedule))
      );
      // After a full reset, entries might not have workoutPlanId,
      // so enrichment might not do much, but it's safe to call.
      updatedSchedule = enrichScheduleEntries(updatedSchedule, workouts); // Enrich here
      console.log(
        "Refreshed schedule after reset (enriched):",
        JSON.parse(JSON.stringify(updatedSchedule))
      );
      setSchedule(updatedSchedule);

      setSuccess("Schedule has been reset");
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err) {
      console.error("Error resetting schedule:", err);
      setError("Failed to reset schedule. Please try again.");
    } finally {
      setLoading(false); // Or setSaving(false)
    }
  };

  // Find entry for a specific day
  const getDayEntry = (dayIdString) => {
    // e.g., dayIdString = "monday" from DAYS_OF_WEEK.map
    if (!schedule || !schedule.days || !Array.isArray(schedule.days)) {
      // console.log("getDayEntry: schedule or schedule.days is invalid", schedule);
      return null;
    }
    // Find the day object that matches the dayIdString (e.g., 'monday')
    const dayObject = schedule.days.find((d) => d.dayOfWeek === dayIdString);
    if (!dayObject) {
      // console.log(`getDayEntry: No dayObject found for dayIdString: ${dayIdString}`);
      return null;
    }
    if (
      !dayObject.entries ||
      !Array.isArray(dayObject.entries) ||
      dayObject.entries.length === 0
    ) {
      // console.log(`getDayEntry: No entries found for day: ${dayIdString}`, dayObject);
      return null;
    }
    // Assuming each day in schedule.days has an 'entries' array,
    // and we are interested in the first entry for that day.
    // If a day can have multiple schedule entries and you need specific logic, adjust here.
    // console.log(`getDayEntry: Found entry for ${dayIdString}:`, dayObject.entries[0]);
    return dayObject.entries[0]; // Return the first entry object
  };

  // Format time for display
  const formatTime = (timeString) => {
    if (!timeString) return null;
    try {
      const [hours, minutes] = timeString.split(":");
      const date = new Date();
      date.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true, // Or false depending on preference
      });
    } catch (err) {
      console.error("Error formatting time:", timeString, err);
      return timeString; // Fallback
    }
  };

  if (loading && !schedule) {
    return (
      <div className="min-h-screen bg-dark-slate-gray text-white p-6">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-heading-1 text-goldenrod mb-6">Edit Schedule</h1>
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-goldenrod"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-slate-gray text-white p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-2">
          {" "}
          {/* Changed to justify-between */}
          <div className="flex items-center">
            {" "}
            {/* Group for back button and title */}
            <button
              onClick={() => navigate("/schedule")}
              className="text-goldenrod hover:text-dark-goldenrod transition-colors mr-3 text-xl" // Made icon slightly larger
            >
              <FaArrowLeft />
            </button>
            <h1 className="text-heading-1 text-goldenrod">
              Edit Weekly Schedule
            </h1>
          </div>
          <button
            onClick={handleResetSchedule}
            title="Reset Entire Schedule"
            className="text-midnight-green hover:text-midnight-green-darker transition-colors p-2 rounded-full"
          >
            <FaUndo size={20} /> {/* Added Reset Icon Button */}
          </button>
        </div>

        <p className="text-gray mb-6">
          Assign workouts to specific days or leave them as rest days
        </p>

        {error && (
          <div className="bg-sepia/20 border border-sepia text-white p-4 rounded-lg mb-6">
            <p>{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-800/20 border border-green-700 text-white p-4 rounded-lg mb-6 flex items-center">
            <FaCheckCircle className="text-green-500 mr-2" />
            <p>{success}</p>
          </div>
        )}

        {editingDay && (
          <div className="mb-8">
            <EditScheduleDay
              day={editingDay}
              dayEntry={getDayEntry(editingDay)} // This will now pass the enriched entry
              workouts={workouts}
              onSave={handleSaveDay}
              onCancel={() => setEditingDay(null)}
              isLoading={saving}
            />
          </div>
        )}

        <div className="bg-midnight-green rounded-lg overflow-hidden shadow-lg mb-8">
          <div className="bg-goldenrod text-midnight-green font-bold p-4">
            Weekly Schedule Overview
          </div>
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {DAYS_OF_WEEK.map((day) => {
                const entry = getDayEntry(day.id);
                const workout = entry?.workoutPlan;

                return (
                  <div
                    key={day.id}
                    className={`rounded-lg  ${
                      workout
                        ? "bg-dark-slate-gray "
                        : "bg-midnight-green-darker"
                    } overflow-hidden shadow-md`}
                  >
                    <div
                      className={`p-3 font-semibold ${
                        workout ? "text-goldenrod" : "text-gray-300"
                      }`}
                    >
                      {day.label}
                    </div>
                    <div className="p-4">
                      {workout && workout.name ? (
                        <>
                          <h3 className="font-bold text-white mb-2">
                            {workout.name}
                          </h3>
                          <div className="flex flex-wrap gap-2 mb-3">
                            <span className="px-2 py-1 bg-midnight-green rounded-full text-xs">
                              {workout.type || "N/A"}
                            </span>
                            <span className="px-2 py-1 bg-midnight-green rounded-full text-xs">
                              {workout.durationMinutes || "N/A"} mins
                            </span>
                          </div>
                          {entry.preferredTime && (
                            <div className="text-goldenrod text-sm flex items-center mb-3">
                              <FaClock className="mr-1" />
                              {formatTime(entry.preferredTime)}
                            </div>
                          )}
                          {entry.notes && (
                            <p className="text-gray-300 text-sm italic mb-3">
                              {entry.notes}
                            </p>
                          )}
                        </>
                      ) : (
                        <p className="text-gray-400 italic mb-4">Rest Day</p>
                      )}
                      <div className="flex space-x-2 mt-2">
                        <button
                          onClick={() => handleEditDay(day.id)}
                          className="flex items-center px-2 py-1 bg-goldenrod text-midnight-green rounded hover:bg-dark-goldenrod text-sm"
                        >
                          <FaEdit className="mr-1" />
                          {workout && workout.name ? "Edit" : "Add"}
                        </button>
                        {workout && workout.name && (
                          <button
                            onClick={() => handleClearDay(day.id)}
                            className="flex items-center px-2 py-1 bg-sepia text-white rounded hover:bg-dark-sepia text-sm"
                          >
                            <FaTrash className="mr-1" /> Clear
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditSchedule;
