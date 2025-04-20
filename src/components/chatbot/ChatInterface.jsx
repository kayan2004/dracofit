import React, { useState, useEffect, useRef } from "react";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";
import chatbotService from "../../services/chatbotService";

const ChatInterface = () => {
  // Store both displayed messages and conversation context
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello! I'm DracoBot, your fitness assistant. How can I help you today?",
      sender: "bot",
      timestamp: new Date(),
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [modelStatus, setModelStatus] = useState({
    status: "unknown",
    lastChecked: null,
  });
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom when messages update
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Check model health on component mount
  useEffect(() => {
    checkModelStatus();

    // Check status every 60 seconds
    const intervalId = setInterval(checkModelStatus, 60000);

    return () => clearInterval(intervalId);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const checkModelStatus = async () => {
    try {
      const health = await chatbotService.checkHealth();
      setModelStatus({
        status: health.online ? "online" : "offline",
        lastChecked: new Date(),
        details: health.details,
      });
    } catch (error) {
      setModelStatus({
        status: "error",
        lastChecked: new Date(),
        error: error.message,
      });
    }
  };

  const handleSendMessage = async (text) => {
    if (!text.trim()) return;

    // Add user message to UI
    const newUserMessage = {
      id: messages.length + 1,
      text,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prevMessages) => [...prevMessages, newUserMessage]);
    setLoading(true);

    try {
      // Show typing indicator
      const typingIndicatorId = messages.length + 2;
      setMessages((prev) => [
        ...prev,
        {
          id: typingIndicatorId,
          text: "...",
          sender: "bot",
          timestamp: new Date(),
          isTyping: true,
        },
      ]);

      // Send to backend (which now has conversation context)
      const response = await chatbotService.sendMessage(text);

      // Update UI with response
      setMessages((prev) =>
        prev
          .filter((msg) => msg.id !== typingIndicatorId)
          .concat({
            id: typingIndicatorId,
            text: response,
            sender: "bot",
            timestamp: new Date(),
          })
      );
    } catch (error) {
      console.error("Error getting chatbot response:", error);

      // Add error message
      const errorMessage = {
        id: messages.length + 2,
        text: `Sorry, I encountered an error: ${
          error.message || "Unknown error"
        }. Please try again later.`,
        sender: "bot",
        timestamp: new Date(),
        isError: true,
      };

      setMessages((prevMessages) => [...prevMessages, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = () => {
    if (modelStatus.status === "unknown") {
      return null;
    }

    if (modelStatus.status === "offline") {
      return (
        <div className="bg-red-900 text-white text-xs px-3 py-1 rounded-full mb-4">
          ⚠️ DracoBot is offline
        </div>
      );
    }

    if (modelStatus.status === "error") {
      return (
        <div className="bg-yellow-900 text-white text-xs px-3 py-1 rounded-full mb-4">
          ⚠️ Connection issues
        </div>
      );
    }

    return (
      <div className="bg-green-900 text-white text-xs px-3 py-1 rounded-full mb-4">
        ✓ DracoBot is online
      </div>
    );
  };

  return (
    <div className="flex flex-col h-[calc(100vh-180px)]">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-white">DracoBot Chat</h2>
        {getStatusBadge()}
      </div>

      <div className="flex-1 overflow-y-auto pb-4">
        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      <ChatInput
        onSendMessage={handleSendMessage}
        isLoading={loading}
        isDisabled={modelStatus.status === "offline"}
      />
    </div>
  );
};

export default ChatInterface;
