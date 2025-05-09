import React, { useState, useCallback } from "react";
import friendsService from "../../services/friendsService";
import { FaSearch, FaUserPlus, FaSpinner } from "react-icons/fa";
import { useAuth } from "../../hooks/useAuth"; // To get current user ID

const FriendSearch = ({ onFriendRequestSent }) => {
  const { user } = useAuth(); // Get current logged-in user info
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [sendingRequestId, setSendingRequestId] = useState(null); // Track which request is being sent

  // --- Handle Search Input Change ---
  const handleSearchChange = (event) => {
    const query = event.target.value;
    setSearchQuery(query);
    setSearchError(null); // Clear previous errors
    if (query.trim().length >= 2) {
      handleSearchUsers(query);
    } else {
      setSearchResults([]); // Clear results if query is too short
    }
  };

  // --- Handle User Search ---
  const handleSearchUsers = useCallback(
    async (query) => {
      if (!query || query.trim().length < 2) {
        setSearchResults([]);
        return;
      }
      setIsSearching(true);
      setSearchError(null);
      try {
        const results = await friendsService.searchUsers(query);
        // Filter out the current user from search results
        const filteredResults = results.filter(
          (resultUser) => resultUser.id !== user?.id
        );
        setSearchResults(filteredResults);
        if (filteredResults.length === 0) {
          setSearchError(`No users found matching "${query}".`);
        }
      } catch (err) {
        console.error("Search error:", err);
        setSearchError("Failed to perform search.");
      } finally {
        setIsSearching(false);
      }
    },
    [user?.id]
  ); // Depend on user.id

  // --- Handle Sending Friend Request ---
  const handleSendRequest = async (friendId) => {
    setSendingRequestId(friendId); // Set loading state for this specific button
    setSearchError(null);
    try {
      await friendsService.sendFriendRequest(friendId);
      console.log(`Friend request sent to user ID: ${friendId}`);
      setSearchQuery(""); // Clear search after sending
      setSearchResults([]);
      if (onFriendRequestSent) {
        onFriendRequestSent(); // Notify parent to refetch data
      }
    } catch (err) {
      console.error("Failed to send friend request:", err);
      setSearchError(err.message || "Failed to send request."); // Show error
    } finally {
      setSendingRequestId(null); // Clear loading state
    }
  };

  return (
    <div className="mb-8 p-4 bg-midnight-green rounded-lg shadow">
      <h2 className="text-xl font-semibold text-goldenrod mb-3">Add Friend</h2>
      <div className="relative mb-3">
        <input
          type="text"
          placeholder="Search by username or email..."
          value={searchQuery}
          onChange={handleSearchChange}
          className="w-full p-2 pr-10 bg-dark-slate-gray rounded border border-gray-600 focus:border-goldenrod focus:ring-goldenrod focus:outline-none text-gray input-case"
          aria-label="Search for users"
        />
        <FaSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
      </div>

      {isSearching && (
        <div className="flex items-center text-sm text-gray-400 mt-2">
          <FaSpinner className="animate-spin mr-2" /> Searching...
        </div>
      )}

      {searchError && !isSearching && (
        <p className="text-sm text-red-400 mt-2">{searchError}</p>
      )}

      {!isSearching && searchResults.length > 0 && (
        <div className="mt-1 max-h-48 overflow-y-auto space-y-1">
          {searchResults.map((resultUser) => (
            <div
              key={resultUser.id}
              className="flex items-center justify-between p-2 bg-dark-slate-gray-lighter rounded"
            >
              <span className="text-gray">
                {resultUser.username || resultUser.email}
              </span>
              <button
                onClick={() => handleSendRequest(resultUser.id)}
                className={`p-1 rounded transition-colors duration-150 ${
                  sendingRequestId === resultUser.id
                    ? "text-gray-500 cursor-not-allowed"
                    : "text-blue-400 hover:text-blue-300 hover:bg-gray-600"
                }`}
                title="Send Friend Request"
                disabled={sendingRequestId === resultUser.id}
                aria-label={`Send friend request to ${
                  resultUser.username || resultUser.email
                }`}
              >
                {sendingRequestId === resultUser.id ? (
                  <FaSpinner className="animate-spin" />
                ) : (
                  <FaUserPlus />
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FriendSearch;
