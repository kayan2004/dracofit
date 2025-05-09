import React from "react";
import { FaUser, FaRobot } from "react-icons/fa";
import { format } from "date-fns";

const ChatMessage = ({ message }) => {
  // --- Log the received message prop on every render ---
  // console.log(`[ChatMessage Render] ID: ${message.id}, Message Prop:`, message);

  const { sender, text, timestamp, isLoading, isError } = message;
  const isUser = sender === "user";
  const isSystem = sender === "system"; // Keep track of system messages

  const renderContent = () => {
    // --- Log decision variables ---
    // console.log(
    //   `[ChatMessage RenderContent] ID: ${message.id}, isLoading: ${isLoading}, isError: ${isError}, text: "${text}"`
    // );

    // --- Original Logic ---
    if (isLoading) {
      // --- MODIFICATION: Render text EVEN IF loading, if text exists ---
      // This allows progressive display while the spinner might still be needed conceptually
      if (text && text.trim().length > 0) {
        return (
          <p className="whitespace-pre-wrap input-case">{text.toLowerCase()}</p>
        );
      } else {
        // Only show spinner if loading AND no text yet
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
    // --- Revert: Apply justify-end for user, justify-start for bot, justify-center for system ---
    <div
      className={`flex mb-4 ${
        isUser ? "justify-end" : isSystem ? "justify-center" : "justify-start"
      }`}
    >
      {/* --- Revert: Add back flex-row-reverse for user messages --- */}
      <div
        className={`flex items-start max-w-xs md:max-w-md lg:max-w-lg ${
          isUser ? "flex-row-reverse" : "flex-row" // Added back conditional flex-row-reverse
        }`}
      >
        {/* Icon */}
        {!isSystem && (
          <div
            // --- Revert: Conditional margin based on user/bot ---
            className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
              isUser ? "ml-3 bg-goldenrod" : "mr-3 bg-dark-aquamarine" // Added back conditional margin
            }`}
          >
            {isUser ? (
              <FaUser className="text-midnight-green text-lg" />
            ) : (
              <FaRobot className="text-midnight-green text-lg" />
            )}
          </div>
        )}

        {/* Message Bubble */}
        <div
          className={`px-4 py-2 rounded-lg ${
            isUser
              ? "bg-goldenrod text-midnight-green" // User bubble style
              : isSystem
              ? "bg-gray-700 text-gray-300 italic" // System bubble style
              : "bg-midnight-green text-gray" // Bot bubble style
          } ${isSystem ? "max-w-full text-sm" : ""}`}
        >
          {/* Render content */}
          {renderContent()}

          {/* Timestamp */}
          {!isSystem && !isLoading && timestamp && (
            // --- Revert: Conditional text alignment for timestamp ---
            <div
              className={`text-xs mt-1 ${
                isUser
                  ? "text-midnight-green-darker/70 text-right" // User timestamp color and alignment
                  : "text-gray-400 text-left" // Bot timestamp color and alignment
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
