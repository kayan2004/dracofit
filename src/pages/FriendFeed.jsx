import React, { useState, useEffect } from "react";
import {
  // FaRunning, // Icons removed in previous step, ensure they are not needed
  // FaTrophy,
  FaUserPlus,
  FaRegNewspaper,
  FaSpinner,
  FaExclamationTriangle,
  FaUserCircle,
} from "react-icons/fa";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import FeedItem from "../components/friends/FeedItem";

// --- Mock Data ---
// Pass current userId to distinguish 'self' posts
const fetchMockFeed = async (currentUserId) => {
  console.log("[fetchMockFeed] Fetching mock feed for user:", currentUserId); // Log start
  await new Promise((resolve) => setTimeout(resolve, 800));
  console.log("[fetchMockFeed] Mock delay finished."); // Log after delay

  // Example: Assume currentUserId is 62 for this mock data
  const selfUserId = currentUserId || 62;

  const mockData = [
    // --- Friend's Posts (Left Aligned) ---
    {
      id: "feed1",
      timestamp: new Date(Date.now() - 3600 * 1000).toISOString(),
      friend: {
        id: 61,
        username: "kayan",
        profilePictureUrl: `http://localhost:3000/api/users/61/avatar`,
      },
      actionType: "WORKOUT_COMPLETED",
      details: { workoutName: "Morning Run", duration: "30 mins" },
    },
    {
      id: "feed3",
      timestamp: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
      friend: {
        id: 61,
        username: "kayan",
        profilePictureUrl: `http://localhost:3000/api/users/61/avatar`,
      },
      actionType: "NEW_FRIEND",
      details: { newFriendUsername: "testuser" },
    },
    {
      id: "feed5",
      timestamp: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
      friend: {
        id: 63,
        username: "NoPicUser",
        profilePictureUrl: null,
      },
      actionType: "LEVEL_UP",
      details: { level: 2 },
    },
    // --- Current User's Posts (Right Aligned) ---
    {
      id: "feed2",
      timestamp: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
      friend: {
        id: selfUserId,
        username: "You",
        profilePictureUrl: `http://localhost:3000/api/users/${selfUserId}/avatar`,
      },
      actionType: "LEVEL_UP",
      details: { level: 5 },
    },
    {
      id: "feed4",
      timestamp: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
      friend: {
        id: selfUserId,
        username: "You",
        profilePictureUrl: `http://localhost:3000/api/users/${selfUserId}/avatar`,
      },
      actionType: "WORKOUT_COMPLETED",
      details: { workoutName: "Leg Day Annihilation" },
    },
    {
      id: "feed6",
      timestamp: new Date(Date.now() - 72 * 3600 * 1000).toISOString(),
      friend: {
        id: selfUserId,
        username: "You",
        profilePictureUrl: `http://localhost:3000/api/users/${selfUserId}/avatar`,
      },
      actionType: "NEW_FRIEND",
      details: { newFriendUsername: "kayan" },
    },
  ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  console.log("[fetchMockFeed] Returning mock data."); // Log before return
  return mockData;
};
// --- End Mock Data ---

const FriendFeed = () => {
  const { currentUser, isAuthenticated, loading: authLoading } = useAuth();
  const [feedItems, setFeedItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true); // Start loading true
  const [error, setError] = useState(null);

  // Log initial state and props
  console.log("[FriendFeed Render] Initial State:", {
    isLoading,
    error,
    feedItemsCount: feedItems.length,
  });
  console.log("[FriendFeed Render] Auth State:", {
    authLoading,
    isAuthenticated,
    currentUser: !!currentUser,
  });

  useEffect(() => {
    // Log when the effect runs and the state values at that time
    console.log("[FriendFeed useEffect] Running effect. Deps:", {
      authLoading,
      isAuthenticated,
      currentUser: !!currentUser,
    });

    const loadFeed = async () => {
      console.log("[FriendFeed loadFeed] Checking auth state...");
      // Check if auth is finished AND user is logged in
      if (!authLoading && isAuthenticated && currentUser) {
        console.log("[FriendFeed loadFeed] Auth OK. Setting loading true.");
        // Ensure loading is true before fetching
        // Note: It might already be true from initial state, this ensures it if the effect re-runs
        setIsLoading(true);
        setError(null);
        try {
          console.log("[FriendFeed loadFeed] Calling fetchMockFeed...");
          const data = await fetchMockFeed(currentUser.id);
          console.log(
            "[FriendFeed loadFeed] fetchMockFeed returned, setting feed items."
          );
          setFeedItems(data);
        } catch (err) {
          console.error("[FriendFeed loadFeed] Error fetching feed:", err);
          setError(err.message || "Failed to load feed.");
        } finally {
          console.log("[FriendFeed loadFeed] Setting loading false.");
          setIsLoading(false); // Set loading false after fetch attempt (success or fail)
        }
      } else if (!authLoading && !isAuthenticated) {
        // If auth is finished but user is not logged in
        console.log(
          "[FriendFeed loadFeed] Not authenticated. Clearing state and setting loading false."
        );
        setFeedItems([]);
        setError(null); // Clear any previous errors
        setIsLoading(false); // Ensure loading is false
      } else {
        // If auth is still loading
        console.log(
          "[FriendFeed loadFeed] Auth still loading or currentUser missing. Waiting..."
        );
        // Don't set isLoading to false here, wait for auth state to resolve
      }
    };

    loadFeed();
    // Dependency array: re-run effect if auth state changes
  }, [authLoading, isAuthenticated, currentUser]);

  // --- Render Logic ---

  // 1. Show loading spinner if authentication is in progress
  if (authLoading) {
    console.log("[FriendFeed Render] Rendering Auth Loading state.");
    return (
      <div className="flex justify-center items-center min-h-screen bg-dark-slate-gray text-gray">
        <FaSpinner className="animate-spin mr-3" size={24} /> Loading user...
      </div>
    );
  }

  // 2. Show login message if authentication is done but user is not logged in
  if (!isAuthenticated) {
    console.log("[FriendFeed Render] Rendering Not Authenticated state.");
    return (
      <div className="flex justify-center items-center min-h-screen bg-dark-slate-gray text-gray">
        Please log in to view your friend feed.
      </div>
    );
  }

  // 3. If authenticated, render the main feed page content
  console.log("[FriendFeed Render] Rendering main feed content area.");
  return (
    <div className="p-4 md:p-6 pt-4 md:pt-6 bg-dark-slate-gray min-h-screen text-gray">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center">
          <FaRegNewspaper className="mr-3 text-goldenrod" /> Friend Activity
        </h1>
        <Link
          to="/friends"
          className="bg-goldenrod hover:bg-dark-goldenrod text-dark-slate-gray font-semibold py-2 px-4 rounded inline-flex items-center transition duration-150 ease-in-out"
          title="Add or Manage Friends"
        >
          <FaUserPlus className="mr-2" />
          Add Friends
        </Link>
      </div>

      {/* Conditional Content: Loading, Error, Feed, or Empty */}
      {isLoading ? ( // Check isLoading state for feed data
        <div className="flex justify-center items-center text-gray mt-10">
          <FaSpinner className="animate-spin mr-3" size={24} /> Loading feed...
        </div>
      ) : error ? ( // Check for errors after loading attempt
        <div className="bg-red-800/50 text-red-200 p-3 rounded mb-4 flex items-center justify-center mt-10">
          <FaExclamationTriangle className="mr-2" /> {error}
        </div>
      ) : (
        // If not loading and no error, show feed or empty message
        <div className="space-y-4 max-w-2xl mx-auto">
          {feedItems.length > 0 ? (
            feedItems.map((item) => (
              <FeedItem key={item.id} item={item} currentUser={currentUser} />
            ))
          ) : (
            <p className="text-center text-gray-400 italic mt-10">
              Your feed is empty. Complete a workout or add some friends!
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default FriendFeed;
