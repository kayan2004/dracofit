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

        // Fetch available workouts
        const workoutsData = await workoutsService.getAllWorkouts();
        setWorkouts(workoutsData);

        // Fetch user's schedule
        const scheduleData = await scheduleService.getSchedule();
        setSchedule(scheduleData);

        console.log("Loaded schedule:", scheduleData); // For debugging
      } catch (err) {
        console.error("Error loading data:", err);
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
    // Clear any previous success messages
    setSuccess(null);
  };

  // Handle saving day changes
  const handleSaveDay = async (data) => {
    if (!editingDay) return;

    try {
      setSaving(true);
      setError(null);

      console.log(`Updating ${editingDay} with data:`, data); // For debugging

      // Call API to update the day
      await scheduleService.updateDay(editingDay, data);

      // Refresh schedule data
      const updatedSchedule = await scheduleService.getSchedule();
      setSchedule(updatedSchedule);

      // Show success message
      setSuccess(
        `${
          editingDay.charAt(0).toUpperCase() + editingDay.slice(1)
        } updated successfully`
      );

      // Close editor
      setEditingDay(null);

      // Clear success message after 3 seconds
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
      setLoading(true);
      setError(null);

      // Call API to clear the day
      await scheduleService.clearDay(day);

      // Refresh schedule data
      const updatedSchedule = await scheduleService.getSchedule();
      setSchedule(updatedSchedule);

      // Show success message
      setSuccess(
        `${day.charAt(0).toUpperCase() + day.slice(1)} set as rest day`
      );

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err) {
      console.error("Error clearing day:", err);
      setError(`Failed to clear ${day}. Please try again.`);
    } finally {
      setLoading(false);
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
      setLoading(true);
      setError(null);

      // Call API to reset schedule
      await scheduleService.resetSchedule();

      // Refresh schedule data
      const updatedSchedule = await scheduleService.getSchedule();
      setSchedule(updatedSchedule);

      // Show success message
      setSuccess("Schedule has been reset");

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err) {
      console.error("Error resetting schedule:", err);
      setError("Failed to reset schedule. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Find entry for a specific day
  const getDayEntry = (day) => {
    if (!schedule || !schedule.entries) return null;
    return schedule.entries.find((entry) => entry.dayOfWeek === day) || null;
  };

  // Format time for display
  const formatTime = (timeString) => {
    if (!timeString) return null;

    try {
      const timeDate = new Date(`2022-01-01T${timeString}`);
      return timeDate.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (err) {
      return timeString;
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
        <div className="flex items-center mb-2">
          <button
            onClick={() => navigate("/schedule")}
            className="text-goldenrod hover:text-dark-goldenrod transition-colors mr-3"
          >
            <FaArrowLeft />
          </button>
          <h1 className="text-heading-1 text-goldenrod">
            Edit Weekly Schedule
          </h1>
        </div>

        <p className="text-gray mb-6">
          Assign workouts to specific days or leave them as rest days
        </p>

        {/* Error Message */}
        {error && (
          <div className="bg-sepia/20 border border-sepia text-white p-4 rounded-lg mb-6">
            <p>{error}</p>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="bg-green-800/20 border border-green-700 text-white p-4 rounded-lg mb-6 flex items-center">
            <FaCheckCircle className="text-green-500 mr-2" />
            <p>{success}</p>
          </div>
        )}

        {/* If we're editing a day, show the edit form */}
        {editingDay && (
          <div className="mb-8">
            <EditScheduleDay
              day={editingDay}
              dayEntry={getDayEntry(editingDay)}
              workouts={workouts}
              onSave={handleSaveDay}
              onCancel={() => setEditingDay(null)}
              isLoading={saving}
            />
          </div>
        )}

        {/* Schedule Overview */}
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
                    className={`rounded-lg border ${
                      workout
                        ? "bg-dark-slate-gray border-goldenrod/30"
                        : "bg-gray-800 border-gray-700"
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
                      {workout ? (
                        <>
                          <h3 className="font-bold text-white mb-2">
                            {workout.name}
                          </h3>

                          <div className="flex flex-wrap gap-2 mb-3">
                            <span className="px-2 py-1 bg-midnight-green rounded-full text-xs">
                              {workout.type}
                            </span>
                            <span className="px-2 py-1 bg-midnight-green rounded-full text-xs">
                              {workout.durationMinutes} mins
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
                          {workout ? "Edit" : "Add"}
                        </button>

                        {workout && (
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

        {/* Reset Schedule Button */}
        <div className="flex justify-center mt-4">
          <SecondaryButton
            onClick={handleResetSchedule}
            styles="bg-sepia hover:bg-dark-sepia"
          >
            Reset Entire Schedule
          </SecondaryButton>
        </div>
      </div>
    </div>
  );
};

export default EditSchedule;
