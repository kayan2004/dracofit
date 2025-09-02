import React from "react";
import { FaUserCircle } from "react-icons/fa"; // Placeholder icon

// Helper function to format time difference (basic example)
const timeAgo = (isoTimestamp) => {
  const date = new Date(isoTimestamp);
  const seconds = Math.floor((new Date() - date) / 1000);

  let interval = seconds / 31536000; // years
  if (interval > 1) return Math.floor(interval) + "y ago";
  interval = seconds / 2592000; // months
  if (interval > 1) return Math.floor(interval) + "mo ago";
  interval = seconds / 86400; // days
  if (interval > 1) return Math.floor(interval) + "d ago";
  interval = seconds / 3600; // hours
  if (interval > 1) return Math.floor(interval) + "h ago";
  interval = seconds / 60; // minutes
  if (interval > 1) return Math.floor(interval) + "m ago";
  return Math.floor(seconds) + "s ago";
};

// Helper to get text based on action type, using "I" for current user
const getActionText = (item, isCurrentUser) => {
  // Use "I" or the friend's name based on who performed the action
  const actorName = isCurrentUser ? "I" : item.friend?.username || "A friend";
  const verbSuffix = isCurrentUser ? "" : "s"; // for verbs like 'complete' vs 'completes' (if needed, not used here)

  switch (item.actionType) {
    case "WORKOUT_COMPLETED":
      return (
        <>
          {/* Use actorName directly */}
          {actorName} completed the workout{" "}
          <span className="italic">
            '{item.details?.workoutName || "Unknown Workout"}'
          </span>
          .{item.details?.duration && ` (${item.details.duration})`}
        </>
      );
    case "LEVEL_UP":
      return (
        <>
          {actorName} reached{" "}
          <span className="font-semibold">
            Level {item.details?.level || "?"}
          </span>
          ! 🎉
        </>
      );
    case "NEW_FRIEND":
      // Phrasing needs adjustment for "I"
      if (isCurrentUser) {
        return (
          <>
            {actorName} became friends with{" "}
            <span className="font-semibold">
              {item.details?.newFriendUsername || "someone"}
            </span>
            . 👋
          </>
        );
      } else {
        return (
          <>
            <span className="font-semibold">{actorName}</span> became friends
            with{" "}
            <span className="font-semibold">
              {item.details?.newFriendUsername || "someone"}
            </span>
            . 👋
          </>
        );
      }
    case "PET_EVOLVED":
      if (isCurrentUser) {
        return (
          <>
            My dragon evolved to the{" "}
            <span className="font-semibold">
              {item.details?.newStage || "next"}
            </span>{" "}
            stage! 🐉
          </>
        );
      } else {
        return (
          <>
            {actorName}'s dragon evolved to the{" "}
            <span className="font-semibold">
              {item.details?.newStage || "next"}
            </span>{" "}
            stage! 🐉
          </>
        );
      }
    case "STREAK_ACHIEVED":
      return (
        <>
          {actorName} reached a{" "}
          <span className="font-semibold">
            {item.details?.streakCount || "new"} day streak
          </span>
          ! 🔥
        </>
      );
    default:
      // Adjust default message for "I"
      return isCurrentUser
        ? `I performed an unknown action.`
        : `Unknown action by ${actorName}.`;
  }
};

// --- Fallback for broken images ---
const handleImageError = (e) => {
  console.error("Failed to load profile picture:", e.target.src);
  e.target.style.display = "none"; // Hide broken image link
  // Show the sibling placeholder
  const placeholder = e.target.nextElementSibling;
  if (placeholder) {
    placeholder.style.display = "flex";
  }
};
// --- End Fallback ---

const FeedItem = ({ item, currentUser }) => {
  const isCurrentUser = currentUser && item.friend?.id === currentUser.id;
  const actionText = getActionText(item, isCurrentUser);
  const formattedTime = timeAgo(item.timestamp);
  const profilePicUrl = item.friend?.profilePictureUrl;
  // Display name for near the PFP
  const displayName = isCurrentUser ? "You" : item.friend?.username || "Friend";

  // --- Define styles based on ChatMessage conventions ---
  const alignmentClasses = isCurrentUser ? "justify-end" : "justify-start";
  const orderClasses = isCurrentUser ? "flex-row-reverse" : "flex-row";
  // Use margin on the bubble container instead of icon for better name placement
  const bubbleMargin = isCurrentUser ? "mr-3" : "ml-3";
  const iconBg = "bg-gray-700";
  const bubbleStyles = isCurrentUser
    ? "bg-goldenrod text-midnight-green"
    : "bg-midnight-green text-gray";
  const timestampStyles = isCurrentUser
    ? "text-midnight-green/70 text-right"
    : "text-gray-400 text-left";
  // Styles for the username near the PFP
  const usernameAlignment = isCurrentUser ? "text-right" : "text-left";
  const usernameColor = "text-gray-400"; // Subtle color for username

  return (
    // Apply alignment for the whole row
    <div className={`flex mb-4 ${alignmentClasses}`}>
      {/* Apply row order */}
      <div
        className={`flex items-start max-w-xs md:max-w-md lg:max-w-lg ${orderClasses}`}
      >
        {/* Container for Icon and Username */}
        <div
          className={`flex-shrink-0 flex flex-col items-center ${
            isCurrentUser ? "items-end" : "items-start"
          }`}
        >
          {" "}
          {/* Align username */}
          {/* Icon/Profile Picture */}
          <div
            className={`h-10 w-10 rounded-full flex items-center justify-center overflow-hidden ${iconBg}`}
          >
            {profilePicUrl ? (
              <>
                <img
                  src={profilePicUrl}
                  alt={`${displayName}'s profile`}
                  className="w-full h-full object-cover"
                  onError={handleImageError}
                />
                <FaUserCircle
                  style={{ display: "none" }}
                  className="text-gray-500 w-6 h-6"
                />
              </>
            ) : (
              <FaUserCircle className="text-gray-400 w-6 h-6" />
            )}
          </div>
          {/* Username Display */}
          <p className={`text-xs mt-1 ${usernameColor} ${usernameAlignment}`}>
            {displayName}
          </p>
        </div>

        {/* Message Bubble - Apply margin here */}
        <div
          className={`px-4 py-2 rounded-lg shadow ${bubbleStyles} ${bubbleMargin}`}
        >
          {/* Action Text (Now uses "I" for current user) */}
          <p className="text-sm mb-1">{actionText}</p>

          {/* Timestamp */}
          <div className={`text-xs mt-1 ${timestampStyles}`}>
            {formattedTime}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeedItem;
