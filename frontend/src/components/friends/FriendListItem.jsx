import React, { useState } from "react";
import { FaCheck, FaTimes, FaSpinner } from "react-icons/fa";

const FriendListItem = ({
  item,
  type,
  currentUser,
  onAccept,
  onRemoveOrReject,
}) => {
  const [isAccepting, setIsAccepting] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  // --- MODIFIED LOGIC ---
  // Determine which user object (user1 or user2) represents the *other* person
  let otherUser = null;
  if (currentUser && item.user1 && item.user2) {
    if (item.user1.id === currentUser.id) {
      otherUser = item.user2;
    } else if (item.user2.id === currentUser.id) {
      otherUser = item.user1;
    } else {
      // This case should ideally not happen if the backend query is correct,
      // but handle it defensively. Maybe display both or an error?
      // For now, let's log a warning and potentially pick one if needed.
      console.warn(
        "Current user ID not found in friendship item users:",
        currentUser.id,
        item
      );
      // Fallback: maybe pick user1 if type is outgoing/accepted, user2 if incoming? Needs thought.
      // Or just let it be null and trigger the warning below.
    }
  }
  // --- END MODIFIED LOGIC ---

  if (!otherUser) {
    // This warning might still trigger if currentUser is null or item structure is wrong
    console.warn("Could not determine other user for friendship item:", {
      item,
      currentUser,
    });
    return null; // Avoid rendering if data is incomplete
  }

  const handleAccept = async () => {
    if (!onAccept || isAccepting || isRemoving) return;
    setIsAccepting(true);
    try {
      await onAccept(item.id);
    } finally {
      // No need to setIsAccepting(false) here if the component unmounts on success due to list refresh
      // If optimistic UI is used, set it back to false in case of error
    }
  };

  const handleRemove = async () => {
    if (!onRemoveOrReject || isAccepting || isRemoving) return;
    setIsRemoving(true);
    try {
      await onRemoveOrReject(item.id);
    } finally {
      // Similar logic as handleAccept regarding state reset
    }
  };

  const isLoading = isAccepting || isRemoving;

  return (
    <div className="flex items-center justify-between p-3 bg-dark-slate-gray-lighter rounded mb-2">
      <span
        className="text-gray truncate"
        title={otherUser.username || otherUser.email}
      >
        {otherUser.username || otherUser.email}
      </span>
      <div className="flex space-x-2 flex-shrink-0">
        {/* ... (buttons remain the same) ... */}
        {/* Incoming Request Buttons */}
        {type === "incoming" && (
          <>
            <button
              onClick={handleAccept}
              className={`p-1 rounded transition-colors duration-150 ${
                isLoading
                  ? "text-gray-500 cursor-not-allowed"
                  : "text-green-400 hover:text-green-300 hover:bg-gray-600"
              }`}
              title="Accept Request"
              disabled={isLoading}
              aria-label={`Accept friend request from ${
                otherUser.username || otherUser.email
              }`}
            >
              {isAccepting ? (
                <FaSpinner className="animate-spin" />
              ) : (
                <FaCheck />
              )}
            </button>
            <button
              onClick={handleRemove}
              className={`p-1 rounded transition-colors duration-150 ${
                isLoading
                  ? "text-gray-500 cursor-not-allowed"
                  : "text-red-400 hover:text-red-300 hover:bg-gray-600"
              }`}
              title="Reject Request"
              disabled={isLoading}
              aria-label={`Reject friend request from ${
                otherUser.username || otherUser.email
              }`}
            >
              {isRemoving ? (
                <FaSpinner className="animate-spin" />
              ) : (
                <FaTimes />
              )}
            </button>
          </>
        )}
        {/* Outgoing Request Button */}
        {type === "outgoing" && (
          <button
            onClick={handleRemove}
            className={`p-1 rounded transition-colors duration-150 ${
              isLoading
                ? "text-gray-500 cursor-not-allowed"
                : "text-yellow-400 hover:text-yellow-300 hover:bg-gray-600" // Yellow for cancel?
            }`}
            title="Cancel Request"
            disabled={isLoading}
            aria-label={`Cancel friend request sent to ${
              otherUser.username || otherUser.email
            }`}
          >
            {isRemoving ? <FaSpinner className="animate-spin" /> : <FaTimes />}
          </button>
        )}
        {/* Accepted Friend Button */}
        {type === "accepted" && (
          <button
            onClick={handleRemove}
            className={`p-1 rounded transition-colors duration-150 ${
              isLoading
                ? "text-gray-500 cursor-not-allowed"
                : "text-red-400 hover:text-red-300 hover:bg-gray-600"
            }`}
            title="Remove Friend"
            disabled={isLoading}
            aria-label={`Remove ${
              otherUser.username || otherUser.email
            } as friend`}
          >
            {isRemoving ? <FaSpinner className="animate-spin" /> : <FaTimes />}
          </button>
        )}
      </div>
    </div>
  );
};

export default FriendListItem;
