import React, { useState, useEffect } from "react";
import {
  FaUserPlus,
  FaRegNewspaper,
  FaSpinner,
  FaExclamationTriangle,
  // FaUserCircle, // Not explicitly used in the JSX, can be removed if not needed elsewhere
} from "react-icons/fa";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import FeedItem from "../components/friends/FeedItem";

// --- Mock Data ---
// Pass current userId to distinguish 'self' posts
const fetchMockFeed = async (currentUserId) => {
  console.log("[fetchMockFeed] Fetching mock feed for user:", currentUserId);
  await new Promise((resolve) => setTimeout(resolve, 800));
  console.log("[fetchMockFeed] Mock delay finished.");

  // Example: Assume currentUserId is 'currentUser123' for this mock data if not provided
  const selfUserId = currentUserId || "currentUser123"; // Use a placeholder if currentUser.id is not available yet

  const mockData = [
    {
      id: "feed_fadi_workout",
      timestamp: new Date(Date.now() - 1 * 3600 * 1000).toISOString(), // 1 hour ago
      friend: {
        id: "fadiUser123", // A unique ID for Fadi
        username: "Fadi",
        profilePictureUrl: `https://ui-avatars.com/api/?name=Fadi&background=0D8ABC&color=fff`, // Placeholder avatar
      },
      actionType: "WORKOUT_COMPLETED",
      details: { workoutName: "Push", duration: "30 mins" },
    },
    {
      id: "feed_you_workout",
      timestamp: new Date(Date.now() - 3 * 3600 * 1000).toISOString(), // 3 hours ago
      friend: {
        id: selfUserId,
        username: "You", // Username will be replaced by FeedItem if it's the current user
        profilePictureUrl: `http://localhost:3000/api/users/${selfUserId}/avatar`,
      },
      actionType: "WORKOUT_COMPLETED",
      details: { workoutName: "Pull" }, // Duration can be optional
    },
    {
      id: "feed_you_levelup",
      timestamp: new Date(Date.now() - 5 * 3600 * 1000).toISOString(), // 5 hours ago
      friend: {
        id: selfUserId,
        username: "You",
        profilePictureUrl: `http://localhost:3000/api/users/${selfUserId}/avatar`,
      },
      actionType: "LEVEL_UP",
      details: { level: 5 },
    },
    {
      id: "feed_you_evolution",
      timestamp: new Date(Date.now() - 24 * 3600 * 1000).toISOString(), // 1 day ago
      friend: {
        id: selfUserId,
        username: "You",
        profilePictureUrl: `http://localhost:3000/api/users/${selfUserId}/avatar`,
      },
      actionType: "PET_EVOLVED", // Assuming a new actionType or re-using an existing one
      details: { newStage: "teen" },
    },
    {
      id: "feed_sam_streak", // Changed ID
      timestamp: new Date(Date.now() - 48 * 3600 * 1000).toISOString(), // 2 days ago
      friend: {
        id: "samUser789", // A unique ID for Sam
        username: "Sam", // Changed username
        profilePictureUrl: `https://ui-avatars.com/api/?name=Sam&background=28A745&color=fff`, // Placeholder avatar for Sam
      },
      actionType: "STREAK_ACHIEVED", // Changed actionType
      details: { streakCount: 10 }, // Changed details
    },
  ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)); // Keep sorting
  console.log("[fetchMockFeed] Returning updated mock data.");
  return mockData;
};
// --- End Mock Data ---

const FriendFeed = () => {
  const { currentUser, isAuthenticated, loading: authLoading } = useAuth();
  const [feedItems, setFeedItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

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
    console.log("[FriendFeed useEffect] Running effect. Deps:", {
      authLoading,
      isAuthenticated,
      currentUser: !!currentUser,
    });

    const loadFeed = async () => {
      console.log("[FriendFeed loadFeed] Checking auth state...");
      if (!authLoading && isAuthenticated && currentUser) {
        console.log("[FriendFeed loadFeed] Auth OK. Setting loading true.");
        setIsLoading(true);
        setError(null);
        try {
          console.log(
            "[FriendFeed loadFeed] Calling fetchMockFeed with user ID:",
            currentUser.id
          );
          const data = await fetchMockFeed(currentUser.id); // Pass currentUser.id
          console.log(
            "[FriendFeed loadFeed] fetchMockFeed returned, setting feed items."
          );
          setFeedItems(data);
        } catch (err) {
          console.error("[FriendFeed loadFeed] Error fetching feed:", err);
          setError(err.message || "Failed to load feed.");
        } finally {
          console.log("[FriendFeed loadFeed] Setting loading false.");
          setIsLoading(false);
        }
      } else if (!authLoading && !isAuthenticated) {
        console.log(
          "[FriendFeed loadFeed] Not authenticated. Clearing state and setting loading false."
        );
        setFeedItems([]);
        setError(null);
        setIsLoading(false);
      } else {
        console.log(
          "[FriendFeed loadFeed] Auth still loading or currentUser missing. Waiting..."
        );
      }
    };

    loadFeed();
  }, [authLoading, isAuthenticated, currentUser]);

  if (authLoading) {
    console.log("[FriendFeed Render] Rendering Auth Loading state.");
    return (
      <div className="flex justify-center items-center min-h-screen bg-dark-slate-gray text-gray">
        <FaSpinner className="animate-spin mr-3" size={24} /> Loading user...
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log("[FriendFeed Render] Rendering Not Authenticated state.");
    return (
      <div className="flex justify-center items-center min-h-screen bg-dark-slate-gray text-gray">
        Please log in to view your friend feed.
      </div>
    );
  }

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
