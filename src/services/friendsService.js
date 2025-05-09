import api from "./api"; // Import the configured axios instance

const BASE_URL = "/friendships"; // Base URL for friendship-related endpoints

/**
 * Sends a friend request to a user by their ID.
 * @param {number} friendId - The ID of the user to send the request to.
 * @returns {Promise<object>} The created friendship object.
 */
const sendFriendRequest = async (friendId) => {
  try {
    // Corresponds to POST /friendships/add-friend
    const response = await api.post(`${BASE_URL}/add-friend`, { friendId });
    console.log("Friend request sent:", response.data);
    return response.data;
  } catch (error) {
    console.error(
      "Error sending friend request:",
      error.response?.data || error.message
    );
    throw error.response?.data || new Error("Failed to send friend request");
  }
};

/**
 * Fetches friendships based on their status relative to the logged-in user.
 * @param {'pending_incoming' | 'pending_outgoing' | 'accepted' | 'all'} status - The status to filter by.
 * 'pending_incoming': Requests received by the current user.
 * 'pending_outgoing': Requests sent by the current user.
 * 'accepted': Current friends.
 * 'all': All friendships involving the current user.
 * @returns {Promise<Array<object>>} A list of friendship objects (potentially populated with user details).
 */
const getFriendships = async (status = "all") => {
  try {
    // Corresponds to GET /friendships?status=<status>
    const response = await api.get(BASE_URL, { params: { status } });
    console.log(`Fetched ${status} friendships:`, response.data);
    return response.data;
  } catch (error) {
    console.error(
      `Error fetching ${status} friendships:`,
      error.response?.data || error.message
    );
    throw (
      error.response?.data || new Error(`Failed to fetch ${status} friendships`)
    );
  }
};

/**
 * Accepts a pending friend request.
 * @param {number} friendshipId - The ID of the friendship record to accept.
 * @returns {Promise<object>} The updated friendship object.
 */
const acceptFriendRequest = async (friendshipId) => {
  try {
    // Corresponds to PATCH /friendships/:id
    const response = await api.patch(`${BASE_URL}/${friendshipId}`, {
      status: "accepted",
    });
    console.log("Friend request accepted:", response.data);
    return response.data;
  } catch (error) {
    console.error(
      "Error accepting friend request:",
      error.response?.data || error.message
    );
    throw error.response?.data || new Error("Failed to accept friend request");
  }
};

/**
 * Removes a friendship or rejects/cancels a pending request.
 * @param {number} friendshipId - The ID of the friendship record to remove/reject/cancel.
 * @returns {Promise<void>}
 */
const removeOrRejectFriendship = async (friendshipId) => {
  try {
    // Corresponds to DELETE /friendships/:id
    await api.delete(`${BASE_URL}/${friendshipId}`);
    console.log(`Friendship ${friendshipId} removed or rejected.`);
  } catch (error) {
    console.error(
      "Error removing/rejecting friendship:",
      error.response?.data || error.message
    );
    throw (
      error.response?.data || new Error("Failed to remove/reject friendship")
    );
  }
};

/**
 * Searches for users (potential friends).
 * Assumes a backend endpoint like GET /users/search?query=... exists.
 * @param {string} query - The search term (e.g., username, email).
 * @returns {Promise<Array<object>>} A list of user objects matching the query.
 */
const searchUsers = async (query) => {
  if (!query || query.trim().length < 2) {
    // Basic validation
    return []; // Don't search for very short queries
  }
  try {
    // Adjust '/users/search' if your backend endpoint is different
    const response = await api.get("/users/search", { params: { query } });
    console.log(`User search results for "${query}":`, response.data);
    return response.data;
  } catch (error) {
    console.error(
      "Error searching users:",
      error.response?.data || error.message
    );
    // Don't necessarily throw an error that breaks the UI, maybe return empty array
    // throw error.response?.data || new Error('Failed to search users');
    return []; // Return empty array on error to avoid breaking UI potentially
  }
};

const friendsService = {
  sendFriendRequest,
  getFriendships,
  acceptFriendRequest,
  removeOrRejectFriendship,
  searchUsers, // Include user search
};

export default friendsService;
