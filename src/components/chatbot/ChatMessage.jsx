import React, { useState, useEffect } from "react"; // Added useState and useEffect
import { FaUser, FaRobot } from "react-icons/fa";
import { format } from "date-fns";

// Assume userProfilePicUrl will be passed as a prop
const ChatMessage = ({ message, userProfilePicUrl }) => {
  const { sender, text, timestamp, isLoading, isError } = message;
  const isUser = sender === "user";
  const isSystem = sender === "system";

  // State to handle user profile image loading error
  const [profileImgError, setProfileImgError] = useState(false);

  // Reset error if URL changes (e.g., user logs out and logs in as someone else, or URL is updated)
  useEffect(() => {
    setProfileImgError(false);
  }, [userProfilePicUrl]);

  const renderContent = () => {
    if (isLoading) {
      if (text && text.trim().length > 0) {
        return (
          <p className="whitespace-pre-wrap input-case">{text.toLowerCase()}</p>
        );
      } else {
        return (
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            <span className="text-sm italic">Thinking...</span>
          </div>
        );
      }
    } else if (isError) {
      return (
        <span className="text-red-400 input-case">
          {text || "An error occurred."}
        </span>
      );
    } else {
      return <p className="whitespace-pre-wrap input-case">{text}</p>;
    }
  };

  return (
    <div
      className={`flex mb-4 ${
        isUser ? "justify-end" : isSystem ? "justify-center" : "justify-start"
      }`}
    >
      <div
        className={`flex items-start max-w-xs md:max-w-md lg:max-w-lg ${
          isUser ? "flex-row-reverse" : "flex-row"
        }`}
      >
        {!isSystem && (
          <div
            className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center overflow-hidden ${
              // Added overflow-hidden
              isUser ? "ml-3 " : "mr-3 bg-dark-aquamarine"
            }`}
          >
            {isUser ? (
              userProfilePicUrl && !profileImgError ? ( // Check for URL and no error
                <img
                  src={userProfilePicUrl}
                  alt="User"
                  className="h-full w-full object-cover" // Ensure image covers the area
                  onError={() => setProfileImgError(true)} // Set error on load failure
                />
              ) : (
                <FaUser className="text-midnight-green text-lg" /> // Fallback icon
              )
            ) : (
              <FaRobot className="text-midnight-green text-lg" />
            )}
          </div>
        )}

        <div
          className={`px-4 py-2 rounded-lg ${
            isUser
              ? "bg-goldenrod text-midnight-green"
              : isSystem
              ? "bg-gray-700 text-gray-300 italic"
              : "bg-midnight-green text-gray-300" // Ensured bot text is light on dark background
          } ${isSystem ? "max-w-full text-sm" : ""}`}
        >
          {renderContent()}
          {!isSystem && !isLoading && timestamp && (
            <div
              className={`text-xs mt-1 ${
                isUser
                  ? "text-midnight-green-darker/70 text-right"
                  : "text-gray-400 text-left"
              }`}
            >
              {format(new Date(timestamp), "p")}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
