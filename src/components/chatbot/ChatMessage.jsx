import React from "react";
import PropTypes from "prop-types";
import ReactMarkdown from "react-markdown";
import dragonSprite from "/dragons/adult/idle/01.png";

const ChatMessage = ({ message }) => {
  const { text, sender, timestamp, isError, isTyping } = message;
  const isBot = sender === "bot";

  // Format time as HH:MM
  const formattedTime = timestamp
    ? new Date(timestamp).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  // Render typing animation if message is a typing indicator
  const renderMessageText = () => {
    if (isTyping) {
      return (
        <div className="flex space-x-1 items-center">
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
          <div
            className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"
            style={{ animationDelay: "0.2s" }}
          ></div>
          <div
            className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"
            style={{ animationDelay: "0.4s" }}
          ></div>
        </div>
      );
    }

    // Render markdown content
    return (
      <div className="text-body prose prose-invert max-w-none chat-input ">
        <ReactMarkdown>{text}</ReactMarkdown>
      </div>
    );
  };

  return (
    <div
      className={`flex ${
        isBot ? "justify-start" : "justify-end"
      } mb-4 items-start`}
    >
      {isBot && (
        <div className="mr-2 flex-shrink-0">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-midnight-green border-2 border-goldenrod">
            <img
              src={dragonSprite}
              alt="DracoBot"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      )}
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-2 ${
          isBot
            ? "bg-midnight-green text-white rounded-tl-none"
            : "bg-goldenrod text-midnight-green rounded-tr-none"
        } ${isError ? "border border-red-500" : ""}`}
      >
        {renderMessageText()}
        {!isTyping && (
          <div
            className={`text-xs mt-1 ${
              isBot ? "text-gray-400" : "text-gray-700"
            }`}
          >
            {formattedTime}
          </div>
        )}
      </div>
    </div>
  );
};

ChatMessage.propTypes = {
  message: PropTypes.shape({
    text: PropTypes.string.isRequired,
    sender: PropTypes.oneOf(["user", "bot"]).isRequired,
    timestamp: PropTypes.instanceOf(Date),
    isError: PropTypes.bool,
    isTyping: PropTypes.bool,
  }).isRequired,
};

export default ChatMessage;
