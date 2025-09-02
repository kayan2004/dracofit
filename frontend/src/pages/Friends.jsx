import React, { useState, useEffect, useCallback } from "react";
import friendsService from "../services/friendsService";
import { useAuth } from "../hooks/useAuth";
import FriendSearch from "../components/friends/FriendSearch";
import FriendList from "../components/friends/FriendList";
import {
  FaUserClock,
  FaUserCheck,
  FaUserFriends,
  FaExclamationTriangle,
  FaSpinner,
} from "react-icons/fa";

const Friends = () => {
  // --- Use currentUser, isAuthenticated and authLoading ---
  const { currentUser, isAuthenticated, loading: authLoading } = useAuth(); // Correctly destructured
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [outgoingRequests, setOutgoingRequests] = useState([]);
  const [acceptedFriends, setAcceptedFriends] = useState([]);
  const [listLoading, setListLoading] = useState(false);
  const [error, setError] = useState(null);

  // --- Fix console log to use currentUser ---
  console.log(
    "[Friends Component] Rendering. isAuthenticated:",
    isAuthenticated,
    "authLoading:",
    authLoading,
    "currentUser:", // Changed label
    currentUser // Use currentUser variable
  );

  // --- Fetch initial data ---
  const fetchFriendData = useCallback(async () => {
    // --- Check if authenticated AND currentUser object is available ---
    if (!isAuthenticated || !currentUser) {
      // Check currentUser here too
      console.log(
        "[fetchFriendData] Exiting because user is not authenticated or currentUser object not ready."
      );
      setIncomingRequests([]);
      setOutgoingRequests([]);
      setAcceptedFriends([]);
      return;
    }

    console.log("[fetchFriendData] Proceeding to fetch...");
    setListLoading(true);
    setError(null);
    try {
      const [incoming, outgoing, accepted] = await Promise.all([
        friendsService.getFriendships("pending_incoming"),
        friendsService.getFriendships("pending_outgoing"),
        friendsService.getFriendships("accepted"),
      ]);
      setIncomingRequests(incoming);
      setOutgoingRequests(outgoing);
      setAcceptedFriends(accepted);
    } catch (err) {
      console.error("Failed to fetch friend data:", err);
      setError(err.message || "Failed to load friend data.");
    } finally {
      setListLoading(false);
    }
    // --- Depend on isAuthenticated AND currentUser object ---
  }, [isAuthenticated, currentUser]); // Add currentUser as dependency

  useEffect(() => {
    // --- Wait for auth loading AND currentUser object to be ready ---
    if (!authLoading && isAuthenticated && currentUser) {
      // Check currentUser here
      fetchFriendData();
    } else if (!authLoading && !isAuthenticated) {
      setIncomingRequests([]);
      setOutgoingRequests([]);
      setAcceptedFriends([]);
      setListLoading(false);
      console.log(
        "[Friends useEffect] User not authenticated, clearing lists."
      );
    } else {
      console.log(
        "[Friends useEffect] Waiting for auth loading or currentUser object."
      );
      setListLoading(true);
    }
    // --- Depend on fetchFriendData, authLoading, isAuthenticated, currentUser ---
  }, [fetchFriendData, authLoading, isAuthenticated, currentUser]); // Add currentUser

  // --- Action Handlers (remain the same) ---
  const handleAcceptRequest = async (friendshipId) => {
    if (!isAuthenticated) return; // Add guard if necessary
    setError(null);
    try {
      await friendsService.acceptFriendRequest(friendshipId);
      fetchFriendData();
    } catch (err) {
      console.error("Failed to accept friend request:", err);
      setError(err.message || "Failed to accept request.");
    }
  };

  const handleRemoveOrReject = async (friendshipId) => {
    if (!isAuthenticated) return; // Add guard if necessary
    setError(null);
    try {
      await friendsService.removeOrRejectFriendship(friendshipId);
      fetchFriendData();
    } catch (err) {
      console.error("Failed to remove/reject friendship:", err);
      setError(err.message || "Failed to remove/reject.");
    }
  };

  const handleFriendRequestSent = () => {
    if (!isAuthenticated) return; // Add guard if necessary
    fetchFriendData();
  };

  // --- Render loading state ---
  // Check authLoading OR (isAuthenticated is true BUT currentUser is still null/undefined)
  if (authLoading || (isAuthenticated && !currentUser)) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-dark-slate-gray text-gray">
        <FaSpinner className="animate-spin mr-3" size={24} /> Loading user
        data...
      </div>
    );
  }

  // --- Render message if not authenticated ---
  if (!isAuthenticated) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-dark-slate-gray text-gray">
        Please log in to view your friends.
      </div>
    );
  }

  // --- Render main content ---
  return (
    <div className="p-4 md:p-6 pt-20 md:pt-24 bg-dark-slate-gray min-h-screen text-gray">
      <h1 className="text-2xl md:text-3xl font-bold text-white mb-6">
        Friends
      </h1>

      {error && (
        <div className="bg-red-800/50 text-red-200 p-3 rounded mb-4 flex items-center">
          <FaExclamationTriangle className="mr-2" /> {error}
        </div>
      )}

      {/* Pass currentUser to FriendSearch if needed */}
      <FriendSearch onFriendRequestSent={handleFriendRequestSent} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* --- Fix prop passing to use currentUser --- */}
        <FriendList
          title="Incoming Requests"
          titleIcon={<FaUserClock />}
          items={incomingRequests}
          type="incoming"
          isLoading={listLoading}
          currentUser={currentUser} // Use currentUser
          onAccept={handleAcceptRequest}
          onRemoveOrReject={handleRemoveOrReject}
          emptyMessage="No incoming friend requests."
        />
        <FriendList
          title="Friends"
          titleIcon={<FaUserFriends />}
          items={acceptedFriends}
          type="accepted"
          isLoading={listLoading}
          currentUser={currentUser} // Use currentUser
          onRemoveOrReject={handleRemoveOrReject}
          emptyMessage="You haven't added any friends yet."
        />
        <FriendList
          title="Sent Requests"
          titleIcon={<FaUserCheck />}
          items={outgoingRequests}
          type="outgoing"
          isLoading={listLoading}
          currentUser={currentUser} // Use currentUser
          onRemoveOrReject={handleRemoveOrReject}
          emptyMessage="No pending outgoing requests."
        />
      </div>
    </div>
  );
};

export default Friends;
