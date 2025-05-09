import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import userDetailsService from "../services/userDetailsService";
import { FaCamera, FaSpinner } from "react-icons/fa"; // Import icons
import { toast } from "react-hot-toast"; // Assuming you use react-hot-toast

// --- DEBUG LOGGING ---
const log = (...args) => console.log("[Settings]", ...args);
// --- END DEBUG LOGGING ---

const Settings = () => {
  log("Component Rendered"); // Log component render
  const navigate = useNavigate();
  // Assuming useAuth provides refreshAuthStatus or similar to update global user state
  const { user, isAuthenticated, logout, refreshAuthStatus } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [hasDetails, setHasDetails] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  const [formData, setFormData] = useState({
    gender: "male",
    birthdate: "",
    weight: 70,
    height: 170,
    // Removed fitness fields
  });

  // Save original data for cancel functionality
  const [originalData, setOriginalData] = useState({});

  // --- State for profile picture ---
  const [profilePictureFile, setProfilePictureFile] = useState(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState(null);
  const [currentProfilePictureUrl, setCurrentProfilePictureUrl] = useState(""); // Store initial/current saved URL
  const [isUploadingPicture, setIsUploadingPicture] = useState(false); // Separate loading state for picture
  // --- End State ---

  // Fetch user details on component mount
  useEffect(() => {
    log("useEffect [isAuthenticated, navigate, user] triggered");
    if (!isAuthenticated) {
      log("Not authenticated, navigating to login");
      navigate("/login");
      return;
    }

    const fetchUserDetails = async () => {
      log("fetchUserDetails started");
      try {
        setLoading(true);
        setError(null); // Clear previous errors
        log("Calling userDetailsService.getUserDetails()");
        const details = await userDetailsService.getUserDetails();
        log("Received details:", details); // Log the raw details object

        if (details) {
          const formattedBirthdate = details.birthdate
            ? new Date(details.birthdate).toISOString().split("T")[0]
            : "";

          const formattedDetails = {
            gender: details.gender || "male",
            birthdate: formattedBirthdate,
            weight: details.weight || 70,
            height: details.height || 170,
            // Removed fitness fields
          };

          setFormData(formattedDetails);
          setOriginalData(formattedDetails);
          setHasDetails(true);
          log("Set formData, originalData, hasDetails=true");

          // --- Set initial picture state ---
          log(
            "Setting picture state from fetched details. URL:",
            details.profilePictureUrl
          );
          setCurrentProfilePictureUrl(details.profilePictureUrl || "");
          setProfilePicturePreview(details.profilePictureUrl || null);
          log(
            "State after set: currentProfilePictureUrl=",
            details.profilePictureUrl || "",
            ", profilePicturePreview=",
            details.profilePictureUrl || null
          );
          // --- End Set ---
        } else {
          log("No details received (details object is falsy)");
          // This case might not happen if the service throws 404 instead
        }
      } catch (err) {
        log("Error in fetchUserDetails:", err); // Log the full error
        if (err.response && err.response.status === 404) {
          log("Caught 404 error, user details not found.");
          setHasDetails(false);
          setIsEditMode(true);
          // Even if no details, check if user object has a default avatar URL
          const fallbackUrl = user?.details?.profilePictureUrl || "";
          log(
            "Setting picture state from user context fallback. URL:",
            fallbackUrl
          );
          setCurrentProfilePictureUrl(fallbackUrl);
          setProfilePicturePreview(fallbackUrl || null);
          log(
            "State after fallback set: currentProfilePictureUrl=",
            fallbackUrl,
            ", profilePicturePreview=",
            fallbackUrl || null
          );
        } else {
          setError("Failed to load user details. Please try again.");
          console.error("Error loading user details:", err); // Keep console.error for visibility
          toast.error("Failed to load profile details.");
          // Set states to null/empty on other errors
          log("Setting picture state to empty/null due to other error");
          setCurrentProfilePictureUrl("");
          setProfilePicturePreview(null);
        }
      } finally {
        log("fetchUserDetails finished, setLoading(false)");
        setLoading(false);
      }
    };

    fetchUserDetails();
  }, [isAuthenticated, navigate, user]); // Add user dependency if using it for fallback avatar

  // --- Cleanup effect for preview URL ---
  useEffect(() => {
    log("useEffect [profilePicturePreview] triggered for cleanup");
    const currentPreview = profilePicturePreview; // Capture value for cleanup function
    // Only revoke if the preview is an object URL (starts with 'blob:')
    return () => {
      if (currentPreview && currentPreview.startsWith("blob:")) {
        log("Revoking Object URL:", currentPreview);
        URL.revokeObjectURL(currentPreview);
      } else {
        log("No blob URL to revoke or preview changed:", currentPreview);
      }
    };
  }, [profilePicturePreview]);
  // --- End Cleanup ---

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    log(`handleChange: name=${name}, value=${value}`);
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // --- Handler for file input change ---
  const handleFileChange = (e) => {
    log("handleFileChange triggered");
    const file = e.target.files[0];
    log("Selected file:", file); // Log file object (might show name, size, type)
    if (file) {
      setProfilePictureFile(file); // Store the file object
      // Create a temporary preview URL
      const previewUrl = URL.createObjectURL(file);
      log("Created blob preview URL:", previewUrl);
      // Revoke previous temporary preview URL if exists
      if (profilePicturePreview && profilePicturePreview.startsWith("blob:")) {
        log("Revoking previous blob URL:", profilePicturePreview);
        URL.revokeObjectURL(profilePicturePreview);
      }
      setProfilePicturePreview(previewUrl); // Set the temporary preview
      log("Set profilePicturePreview to new blob URL");
    } else {
      log("No file selected or selection cancelled");
      // If user cancels, revert preview to the original URL (or null if none)
      setProfilePictureFile(null);
      if (profilePicturePreview && profilePicturePreview.startsWith("blob:")) {
        log("Revoking previous blob URL on cancel:", profilePicturePreview);
        URL.revokeObjectURL(profilePicturePreview);
      }
      log(
        "Reverting profilePicturePreview to currentProfilePictureUrl:",
        currentProfilePictureUrl || null
      );
      setProfilePicturePreview(currentProfilePictureUrl || null);
    }
  };
  // --- End Handler ---

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    log("handleSubmit started");
    setError(null);
    setSuccess(null);
    setSaving(true);
    let detailsUpdateSuccess = false;
    let pictureUpdateSuccess = false;

    // --- Upload Picture First (if selected) ---
    let uploadedPictureUrl = currentProfilePictureUrl; // Start with current URL
    log(
      "Initial uploadedPictureUrl (before potential upload):",
      uploadedPictureUrl
    );
    if (profilePictureFile) {
      log("New profile picture file selected, attempting upload.");
      setIsUploadingPicture(true);
      try {
        log("Creating FormData for picture upload");
        const pictureFormData = new FormData();
        pictureFormData.append("profilePicture", profilePictureFile);

        log("Calling userDetailsService.uploadProfilePicture");
        const pictureResponse = await userDetailsService.uploadProfilePicture(
          pictureFormData
        );
        log("Picture upload successful, response:", pictureResponse);
        uploadedPictureUrl = pictureResponse.profilePictureUrl; // Get the new URL
        log("New uploadedPictureUrl:", uploadedPictureUrl);
        setCurrentProfilePictureUrl(uploadedPictureUrl); // Update state immediately
        pictureUpdateSuccess = true;
        toast.success("Profile picture updated!");
      } catch (picErr) {
        log("Error during picture upload:", picErr); // Log full error
        console.error("Error uploading profile picture:", picErr); // Keep console.error
        setError(
          picErr.response?.data?.message || "Failed to upload profile picture."
        );
        toast.error(
          `Picture upload failed: ${
            picErr.response?.data?.message || "Server error"
          }`
        );
        // Stop the whole save process if picture upload fails? Or continue saving details?
        // Let's stop here for now:
        setSaving(false);
        setIsUploadingPicture(false);
        log("Exiting handleSubmit due to picture upload error.");
        return; // Exit handleSubmit
      } finally {
        log("Picture upload block finished, setIsUploadingPicture(false)");
        setIsUploadingPicture(false);
      }
    } else {
      log("No new profile picture file selected, skipping upload.");
      // No new picture selected, so picture part is trivially successful
      pictureUpdateSuccess = true;
    }
    // --- End Picture Upload ---

    // --- Save Profile Details ---
    log("Proceeding to save profile details.");
    try {
      // Format data for API
      const apiData = {
        ...formData,
        weight: Number(formData.weight),
        height: Number(formData.height),
        // Removed fitness fields
      };
      log("Formatted apiData for details save/update:", apiData);

      let result;
      if (hasDetails) {
        log("Calling userDetailsService.updateUserDetails");
        result = await userDetailsService.updateUserDetails(apiData);
        log("Update details result:", result);
      } else {
        log("Calling userDetailsService.createUserDetails");
        result = await userDetailsService.createUserDetails(apiData);
        log("Create details result:", result);
        setHasDetails(true);
        log("Set hasDetails=true after creation");
      }

      // Update original data after successful save
      setOriginalData({ ...formData });
      detailsUpdateSuccess = true;
      log("Details save/update successful. Updated originalData.");

      setSuccess("Profile details saved successfully!");
      toast.success("Profile details saved!");
      setTimeout(() => setSuccess(null), 3000);
      setIsEditMode(false); // Exit edit mode after save
      log("Set success message, exiting edit mode.");

      // Refresh global user state if function exists
      if (refreshAuthStatus) {
        log("Calling refreshAuthStatus");
        await refreshAuthStatus();
        log("refreshAuthStatus finished");
      } else {
        log("refreshAuthStatus function not available.");
      }
    } catch (err) {
      log("Error saving user details:", err); // Log full error
      console.error("Error saving user details:", err); // Keep console.error
      setError(
        err.response?.data?.message ||
          "Failed to save profile information. Please try again."
      );
      toast.error(
        `Details save failed: ${err.response?.data?.message || "Server error"}`
      );
    } finally {
      log("Details save block finished, setSaving(false)");
      setSaving(false);
      // Clear file state regardless of success/failure of details save
      log("Clearing profilePictureFile state.");
      setProfilePictureFile(null);
      // Ensure preview reflects the latest known saved state
      log(
        "Setting profilePicturePreview to final uploadedPictureUrl:",
        uploadedPictureUrl || null
      );
      setProfilePicturePreview(uploadedPictureUrl || null);
    }
    // --- End Details Save ---
    log("handleSubmit finished.");
  };

  // Cancel edit and revert changes
  const handleCancel = () => {
    log("handleCancel triggered");
    setFormData({ ...originalData });
    log("Reverted formData to originalData:", originalData);
    // --- Reset picture state on cancel ---
    log("Resetting picture state on cancel.");
    setProfilePictureFile(null);
    log(
      "Reverting profilePicturePreview to currentProfilePictureUrl:",
      currentProfilePictureUrl || null
    );
    setProfilePicturePreview(currentProfilePictureUrl || null);
    // --- End Reset ---
    setIsEditMode(false);
    setError(null);
    log("Exited edit mode, cleared error.");
  };

  const handleLogout = () => {
    log("handleLogout triggered");
    logout();
    navigate("/login");
  };

  if (loading) {
    log("Rendering loading indicator");
    // ... (existing loading indicator) ...
    return (
      <div className="min-h-screen bg-dark-slate-gray text-white p-6 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-goldenrod"></div>
      </div>
    );
  }

  // --- Helper to display profile picture ---
  const renderProfilePicture = (sizeClass = "w-24 h-24") => {
    // Log inside the helper to see what URL it's trying to render
    log(
      `renderProfilePicture called. Preview URL: ${profilePicturePreview}, Uploading: ${isUploadingPicture}`
    );
    return (
      <div
        className={`relative ${sizeClass} rounded-full bg-gray-700 border border-gray-600 flex items-center justify-center text-gray-400 overflow-hidden mb-2 mx-auto`}
      >
        {profilePicturePreview ? (
          <img
            src={profilePicturePreview}
            alt="Profile"
            className="w-full h-full object-cover"
            // Add onError logging
            onError={(e) => {
              log(`ERROR loading image with src: ${profilePicturePreview}`, e);
              e.target.onerror = null; // Prevent infinite loop if fallback also fails
              // Optionally set to a known fallback or hide
              // e.target.style.display = 'none'; // Example: hide broken image
            }}
          />
        ) : (
          <FaCamera size={30} /> // Placeholder icon
        )}
        {/* Show spinner during picture upload */}
        {isUploadingPicture && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <FaSpinner className="animate-spin text-white" size={24} />
          </div>
        )}
      </div>
    );
  };
  // --- End Helper ---

  log(
    `Rendering main component. isEditMode: ${isEditMode}, hasDetails: ${hasDetails}`
  );
  return (
    <div className="min-h-screen bg-dark-slate-gray text-white p-6">
      <div className="max-w-3xl mx-auto">
        {/* ... (existing header navigation) ... */}
        <div className="flex items-center mb-6">
          <button
            onClick={() => navigate(-1)}
            className="mr-4 text-goldenrod hover:text-dark-goldenrod transition-colors"
          >
            <span className="text-xl">←</span>
          </button>
          <h1 className="text-2xl font-bold text-goldenrod">
            Profile Settings
          </h1>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
          {error && (
            // ... (existing error display) ...
            <div className="mb-4 p-3 bg-red-900/30 border border-red-500 text-red-200 rounded-md">
              {error}
            </div>
          )}

          {success && (
            // ... (existing success display) ...
            <div className="mb-4 p-3 bg-green-900/30 border border-green-500 text-green-200 rounded-md">
              {success}
            </div>
          )}

          {!isEditMode ? (
            // Read-only view
            <div>
              <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                {/* --- Profile Picture Display (Read Only) --- */}
                <div className="flex-shrink-0">
                  {renderProfilePicture("w-20 h-20")}
                </div>
                {/* --- End Picture Display --- */}
                <div className="flex-grow text-center md:text-left">
                  <h2 className="text-xl text-goldenrod">
                    {user?.username || "User"}
                  </h2>
                  <p className="text-gray-400">{user?.email || ""}</p>
                </div>
                <button
                  onClick={() => {
                    log("Edit Profile button clicked");
                    setIsEditMode(true);
                  }}
                  className="px-4 py-2 bg-goldenrod text-midnight-green rounded-lg font-medium hover:bg-dark-goldenrod transition-colors w-full md:w-auto"
                >
                  Edit Profile
                </button>
              </div>

              {/* Personal Information Read-Only */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* Gender */}
                <div className="mb-4">
                  <h3 className="text-gray-300 font-medium">Gender</h3>
                  <p className="text-white mt-1 capitalize">
                    {formData.gender || "N/A"}
                  </p>
                </div>
                {/* Birthdate */}
                <div className="mb-4">
                  <h3 className="text-gray-300 font-medium">Date of Birth</h3>
                  <p className="text-white mt-1">
                    {formData.birthdate || "Not provided"}
                  </p>
                </div>
                {/* Weight */}
                <div className="mb-4">
                  <h3 className="text-gray-300 font-medium">Weight</h3>
                  <p className="text-white mt-1">
                    {formData.weight ? `${formData.weight} kg` : "N/A"}
                  </p>
                </div>
                {/* Height */}
                <div className="mb-4">
                  <h3 className="text-gray-300 font-medium">Height</h3>
                  <p className="text-white mt-1">
                    {formData.height ? `${formData.height} cm` : "N/A"}
                  </p>
                </div>
              </div>
              {/* Removed Fitness Information Read-Only Section */}

              <div className="flex justify-end mt-6">
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          ) : (
            // Edit form
            <form onSubmit={handleSubmit}>
              {/* --- Profile Picture Upload Section (Edit Mode) --- */}
              <div className="mb-6 flex flex-col items-center">
                {renderProfilePicture()} {/* Use the helper */}
                <label
                  htmlFor="profilePictureInput"
                  className="mt-2 text-sm text-goldenrod hover:underline cursor-pointer"
                >
                  {profilePictureFile
                    ? "Change Picture"
                    : currentProfilePictureUrl
                    ? "Change Picture"
                    : "Upload Picture"}
                </label>
                <input
                  id="profilePictureInput"
                  type="file"
                  accept="image/png, image/jpeg, image/gif"
                  onChange={handleFileChange}
                  className="sr-only" // Visually hidden, triggered by label
                  disabled={saving || isUploadingPicture} // Disable while saving/uploading
                />
              </div>
              {/* --- End Profile Picture Upload Section --- */}

              {/* Personal Information Edit Section */}
              <div className="mb-6">
                <h2 className="text-xl text-goldenrod mb-3">
                  Personal Information
                </h2>
                {/* Gender */}
                <div className="mb-4">
                  <label className="block text-gray-300 mb-2">Gender</label>
                  <div className="flex space-x-4">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="gender"
                        value="male"
                        checked={formData.gender === "male"}
                        onChange={handleChange}
                        className="mr-2 text-goldenrod focus:ring-goldenrod"
                      />
                      Male
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="gender"
                        value="female"
                        checked={formData.gender === "female"}
                        onChange={handleChange}
                        className="mr-2 text-goldenrod focus:ring-goldenrod"
                      />
                      Female
                    </label>
                  </div>
                </div>
                {/* Birthdate */}
                <div className="mb-4">
                  <label className="block text-gray-300 mb-2">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    name="birthdate"
                    value={formData.birthdate}
                    onChange={handleChange}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                    required
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Weight */}
                  <div className="mb-4">
                    <label className="block text-gray-300 mb-2">
                      Weight (kg)
                    </label>
                    <input
                      type="number"
                      name="weight"
                      value={formData.weight}
                      onChange={handleChange}
                      min="30"
                      max="300"
                      step="0.1"
                      className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                      required
                    />
                  </div>
                  {/* Height */}
                  <div className="mb-4">
                    <label className="block text-gray-300 mb-2">
                      Height (cm)
                    </label>
                    <input
                      type="number"
                      name="height"
                      value={formData.height}
                      onChange={handleChange}
                      min="100"
                      max="250"
                      className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                      required
                    />
                  </div>
                </div>
              </div>
              {/* Removed Fitness Information Edit Section */}

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={saving || isUploadingPicture} // Disable cancel while saving
                  className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-bold transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || isUploadingPicture} // Disable save while saving/uploading
                  className={`px-6 py-3 bg-goldenrod text-midnight-green rounded-lg font-bold transition-colors flex items-center justify-center ${
                    saving || isUploadingPicture
                      ? "opacity-75 cursor-not-allowed"
                      : "hover:bg-dark-goldenrod"
                  }`}
                >
                  {(saving || isUploadingPicture) && (
                    <FaSpinner className="animate-spin mr-2" />
                  )}
                  {saving || isUploadingPicture ? "Saving..." : "Save Profile"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
