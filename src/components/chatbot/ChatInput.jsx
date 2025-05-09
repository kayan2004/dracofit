import React, { useState } from "react";
import PropTypes from "prop-types";

const ChatInput = ({ onSendMessage, isLoading, isDisabled }) => {
  const [message, setMessage] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() && !isLoading && !isDisabled) {
      onSendMessage(message);
      setMessage("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-midnight-green p-4 rounded-lg ">
      <div className="flex items-center">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={
            isDisabled
              ? "DracoBot is currently offline..."
              : "Ask DracoBot about fitness..."
          }
          className={`flex-1 bg-gray-700 text-white rounded-l-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-goldenrod ${
            isDisabled ? "opacity-50 cursor-not-allowed" : ""
          }`}
          disabled={isLoading || isDisabled}
        />
        <button
          type="submit"
          className={`bg-goldenrod text-midnight-green rounded-r-lg px-4 py-3 font-bold ${
            isLoading || !message.trim() || isDisabled
              ? "opacity-50 cursor-not-allowed"
              : "hover:bg-dark-goldenrod"
          }`}
          disabled={isLoading || !message.trim() || isDisabled}
        >
          {isLoading ? (
            <span className="inline-block w-5 h-5 border-2 border-midnight-green border-t-transparent rounded-full animate-spin"></span>
          ) : (
            "Send"
          )}
        </button>
      </div>
      {isDisabled && (
        <div className="text-xs text-red-400 mt-1">
          DracoBot is currently offline. Please try again later.
        </div>
      )}
    </form>
  );
};

ChatInput.propTypes = {
  onSendMessage: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
  isDisabled: PropTypes.bool,
};

ChatInput.defaultProps = {
  isLoading: false,
  isDisabled: false,
};

export default ChatInput;
