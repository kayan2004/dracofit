import React, { useState, useEffect } from "react";
import FormButton from "../common/FormButton";
import SecondaryButton from "../common/SecondaryButton";
import {
  FaRegClock,
  FaRegStickyNote,
  FaDumbbell,
  FaRegCalendarAlt,
} from "react-icons/fa";

const DAYS_FULL = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};

const EditScheduleDay = ({
  day,
  dayEntry,
  workouts,
  onSave,
  onCancel,
  isLoading,
}) => {
  // Initialize form with correct values from dayEntry
  const [form, setForm] = useState({
    workoutPlanId: dayEntry?.workoutPlanId || "",
    preferredTime: dayEntry?.preferredTime
      ? dayEntry.preferredTime.substring(0, 5)
      : "09:00",
    notes: dayEntry?.notes || "",
  });

  // Update form when dayEntry changes
  useEffect(() => {
    if (dayEntry) {
      setForm({
        workoutPlanId: dayEntry.workoutPlanId || "",
        preferredTime: dayEntry.preferredTime
          ? dayEntry.preferredTime.substring(0, 5)
          : "09:00",
        notes: dayEntry.notes || "",
      });
    }
  }, [dayEntry]);

  const [selectedWorkout, setSelectedWorkout] = useState(null);
  const [errors, setErrors] = useState({});

  // Update selected workout when workout ID changes
  useEffect(() => {
    if (form.workoutPlanId) {
      const workout = workouts.find(
        (w) => w.id === parseInt(form.workoutPlanId)
      );
      setSelectedWorkout(workout);
    } else {
      setSelectedWorkout(null);
    }
  }, [form.workoutPlanId, workouts]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error for the field being changed
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: null,
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Prepare the data to send to the API
    const data = {
      workoutPlanId: form.workoutPlanId ? parseInt(form.workoutPlanId) : null,
      preferredTime: form.workoutPlanId ? `${form.preferredTime}:00` : null,
      notes: form.notes || null,
    };

    // Call the save handler with the form data
    onSave(data);
  };

  return (
    <div className="bg-midnight-green rounded-lg overflow-hidden shadow-lg">
      <div className="bg-goldenrod text-midnight-green font-bold p-3 flex items-center">
        <FaRegCalendarAlt className="mr-2" />
        Edit {DAYS_FULL[day]} Schedule
      </div>

      <form onSubmit={handleSubmit} className="p-5 space-y-4">
        {/* Workout Selection */}
        <div>
          <label
            htmlFor="workoutPlanId"
            className=" text-goldenrod mb-2 flex items-center"
          >
            <FaDumbbell className="mr-2" /> Select Workout
          </label>
          <select
            id="workoutPlanId"
            name="workoutPlanId"
            value={form.workoutPlanId}
            onChange={handleChange}
            className="w-full bg-dark-slate-gray border border-gray-600 rounded-lg p-3 text-white focus:outline-none focus:border-goldenrod transition-colors"
          >
            <option value="">Rest Day (No Workout)</option>
            {workouts.map((workout) => (
              <option key={workout.id} value={workout.id}>
                {workout.name} ({workout.durationMinutes} min)
              </option>
            ))}
          </select>
          {errors.workoutPlanId && (
            <p className="text-sepia text-sm mt-1">{errors.workoutPlanId}</p>
          )}
        </div>

        {/* Selected Workout Preview */}
        {selectedWorkout && (
          <div className="bg-dark-slate-gray p-3 rounded-lg border border-goldenrod/30">
            <h3 className="font-semibold text-goldenrod mb-2">
              {selectedWorkout.name}
            </h3>
            <div className="flex flex-wrap gap-2 mb-2">
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
            {selectedWorkout.description && (
              <p className="text-gray-300 text-sm">
                {selectedWorkout.description}
              </p>
            )}
          </div>
        )}

        {/* Time Selection - only show if a workout is selected */}
        {form.workoutPlanId && (
          <div>
            <label
              htmlFor="preferredTime"
              className=" text-goldenrod mb-2 flex items-center"
            >
              <FaRegClock className="mr-2" /> Preferred Time
            </label>
            <input
              type="time"
              id="preferredTime"
              name="preferredTime"
              value={form.preferredTime}
              onChange={handleChange}
              className="w-full bg-dark-slate-gray border border-gray-600 rounded-lg p-3 text-white focus:outline-none focus:border-goldenrod transition-colors"
            />
            {errors.preferredTime && (
              <p className="text-sepia text-sm mt-1">{errors.preferredTime}</p>
            )}
          </div>
        )}

        {/* Notes */}
        <div>
          <label
            htmlFor="notes"
            className=" text-goldenrod mb-2 flex items-center"
          >
            <FaRegStickyNote className="mr-2" /> Notes (Optional)
          </label>
          <textarea
            id="notes"
            name="notes"
            value={form.notes}
            onChange={handleChange}
            rows="3"
            placeholder="Add any notes about this workout day..."
            className="w-full bg-dark-slate-gray border border-gray-600 rounded-lg p-3 text-white focus:outline-none focus:border-goldenrod transition-colors resize-none"
          ></textarea>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between pt-2">
          <SecondaryButton
            type="button"
            onClick={onCancel}
            styles="px-4 py-2"
            disabled={isLoading}
          >
            Cancel
          </SecondaryButton>

          <FormButton type="submit" styles="px-4 py-2" disabled={isLoading}>
            {isLoading ? (
              <>
                <span className="animate-spin mr-2">⟳</span> Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </FormButton>
        </div>
      </form>
    </div>
  );
};

export default EditScheduleDay;
