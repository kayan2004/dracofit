import { useState, useEffect, useCallback } from "react";

// Get API URL from environment variables
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export function useFetch(endpoint, options = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false); // Start as false
  const [error, setError] = useState(null);

  // Get full URL from endpoint
  const url = `${API_URL}${endpoint}`;

  // Extract options with defaults
  const {
    method = "GET",
    body = null,
    headers = {},
    immediate = true, // Add immediate option
  } = options;

  // Create a fetch function that can be called manually
  const fetchData = useCallback(
    async (customBody = null) => {
      // Reset states
      setLoading(true);
      setError(null);

      // Get auth token if available
      const token = localStorage.getItem("token");

      // Set up headers with auth token if available
      const requestHeaders = {
        "Content-Type": "application/json",
        ...headers,
      };

      // Add auth token if available
      if (token) {
        requestHeaders.Authorization = `Bearer ${token}`;
      }

      // Set up fetch options
      const fetchOptions = {
        method,
        headers: requestHeaders,
      };

      // Add body for non-GET requests
      if (method !== "GET" && (customBody || body)) {
        fetchOptions.body = JSON.stringify(customBody || body);
      }

      try {
        // Execute fetch
        const response = await fetch(url, fetchOptions);

        // Handle non-OK responses
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || `Error ${response.status}`);
        }

        const result = await response.json();
        console.log("Fetch result:", result);
        setData(result);
        setLoading(false);
        return result;
      } catch (err) {
        console.error("Fetch error:", err);
        setError(err.message);
        setLoading(false);
        throw err;
      }
    },
    [url, method, body, headers]
  );

  // Only perform the fetch automatically if immediate is true
  useEffect(() => {
    let isMounted = true;

    // Skip the fetch if immediate is false or endpoint is empty
    if (!immediate || !endpoint) {
      return;
    }

    const doFetch = async () => {
      try {
        await fetchData();
      } catch (err) {
        // Error is already handled in fetchData
      }
    };

    doFetch();

    return () => {
      isMounted = false;
    };
  }, [fetchData, immediate, endpoint]);

  return { data, loading, error, fetchData };
}

export default useFetch;
