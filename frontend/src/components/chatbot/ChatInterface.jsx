import React, { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";
import chatbotApi from "../../services/ChatbotService";
import interactionApi from "../../services/interactionApi";
import userDetailsService from "../../services/userDetailsService"; // Import userDetailsService
import { useAuth } from "../../hooks/useAuth";
import { FaSpinner } from "react-icons/fa"; // Import FaSpinner for loading indicators

const ChatInterface = () => {
  const { isAuthenticated, currentUser, loading: authLoading } = useAuth(); // Get currentUser
  const [messages, setMessages] = useState([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(authLoading);
  const [historyError, setHistoryError] = useState(null);
  const [loading, setLoading] = useState(false); // For bot response loading
  const [modelStatus, setModelStatus] = useState({
    status: "unknown",
    lastChecked: null,
    details: null,
    error: null,
  });
  const [apiError, setApiError] = useState(null);
  const messagesEndRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  const [pendingPrefillMessage, setPendingPrefillMessage] = useState(null);

  // --- State for user's profile picture ---
  const [userProfilePicUrl, setUserProfilePicUrl] = useState(null);
  const [profilePicLoading, setProfilePicLoading] = useState(false); // Initialize to false, set true when fetching

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // --- Fetch User Profile Picture ---
  useEffect(() => {
    const fetchUserProfilePic = async () => {
      if (isAuthenticated && currentUser && currentUser.id) {
        setProfilePicLoading(true); // Set loading true before fetch
        try {
          const details = await userDetailsService.getUserDetails();
          if (details && details.profilePictureUrl) {
            setUserProfilePicUrl(details.profilePictureUrl);
          } else {
            setUserProfilePicUrl(null); // Explicitly set to null if not found
          }
        } catch (error) {
          console.error(
            "ChatInterface: Failed to fetch user details for profile pic:",
            error
          );
          setUserProfilePicUrl(null); // Ensure it's null on error
        } finally {
          setProfilePicLoading(false); // Set loading false after fetch
        }
      } else if (!authLoading) {
        // If not authenticated and auth is done
        setUserProfilePicUrl(null); // Clear if not authenticated
        setProfilePicLoading(false); // Ensure loading is false
      }
    };

    if (!authLoading) {
      // Only attempt to fetch if auth loading is complete
      fetchUserProfilePic();
    }
  }, [isAuthenticated, currentUser, authLoading]); // Add authLoading as dependency

  // --- Fetch chat history effect ---
  useEffect(() => {
    const fetchHistory = async () => {
      if (authLoading) {
        setIsHistoryLoading(true);
        return;
      }

      if (isAuthenticated && messages.length === 0) {
        setIsHistoryLoading(true);
        setHistoryError(null);
        try {
          const historyData = await interactionApi.getChatHistory();

          if (Array.isArray(historyData)) {
            const validInteractions = historyData.filter(
              (interaction) => interaction != null
            );
            const formattedMessages = validInteractions.flatMap(
              (interaction, index) => [
                {
                  id: `db-q-${interaction.id || index}`,
                  text: interaction.question,
                  sender: "user",
                  timestamp: new Date(interaction.timestamp),
                  isLoading: false,
                  isError: false,
                },
                {
                  id: `db-a-${interaction.id || index}`,
                  text: interaction.answer,
                  sender: "bot",
                  timestamp: new Date(interaction.timestamp),
                  isLoading: false,
                  isError: false,
                },
              ]
            );
            setMessages(formattedMessages);
          } else {
            console.warn("History data is not a valid array:", historyData);
            setMessages([]);
          }
        } catch (error) {
          console.error("Error fetching chat history:", error);
          setHistoryError("Failed to load chat history.");
          setMessages([]);
        } finally {
          setIsHistoryLoading(false);
        }
      } else if (isAuthenticated && messages.length > 0) {
        // If history is already loaded (messages.length > 0), no need to set loading false again
        // unless it was true for some other reason.
        setIsHistoryLoading(false);
      } else if (!isAuthenticated && !authLoading) {
        // Ensure history loading stops if not authenticated
        setMessages([]);
        setHistoryError(null);
        setIsHistoryLoading(false);
      }
    };

    fetchHistory();
  }, [isAuthenticated, authLoading]); // messages.length removed as dependency to prevent re-fetch on new message

  // --- Health Check Effect ---
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const health = await chatbotApi.checkHealth();
        setModelStatus({
          status: health.online ? "online" : "offline",
          lastChecked: new Date(),
          details: health.details,
          error: health.error || null,
        });
      } catch (error) {
        console.error("Health check failed (in component):", error);
        setModelStatus({
          status: "error",
          lastChecked: new Date(),
          error: error.message,
          details: null,
        });
      }
    };

    checkStatus();
    const intervalId = setInterval(checkStatus, 60000);
    return () => clearInterval(intervalId);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // --- handleSendMessage ---
  const handleSendMessage = useCallback(
    async (text) => {
      if (!text?.trim() || loading || modelStatus.status !== "online") {
        console.warn("[handleSendMessage] Skipping send. Reason:", {
          textExists: !!text?.trim(),
          loading,
          status: modelStatus.status,
        });
        return;
      }

      setLoading(true);
      setApiError(null);

      const newUserMessage = {
        id: `user-${Date.now()}`,
        text,
        sender: "user",
        timestamp: new Date(),
        isLoading: false,
        isError: false,
      };
      setMessages((prevMessages) => [...prevMessages, newUserMessage]);

      const botMessageId = `bot-${Date.now()}`;
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          id: botMessageId,
          text: "",
          sender: "bot",
          timestamp: new Date(),
          isLoading: true,
          isError: false,
        },
      ]);

      let finalBotResponse = "";

      try {
        const apiUrl = "http://localhost:5000/chat";
        const response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "text/event-stream",
          },
          body: JSON.stringify({ message: text }),
          credentials: "include",
        });

        if (!response.ok || !response.body) {
          const errorText = await response
            .text()
            .catch(() => `HTTP error ${response.status}`);
          throw new Error(
            `Failed to connect to stream: ${response.status} ${errorText}`
          );
        }

        const reader = response.body
          .pipeThrough(new TextDecoderStream())
          .getReader();
        let buffer = "";
        let receivedText = "";

        while (true) {
          const { value, done } = await reader.read();
          if (done) {
            finalBotResponse = receivedText;
            setMessages((prevMessages) => {
              const updated = prevMessages.map((msg) =>
                msg.id === botMessageId
                  ? { ...msg, text: finalBotResponse, isLoading: false }
                  : msg
              );
              return updated;
            });
            break;
          }

          buffer += value;
          let boundary = buffer.indexOf("\n\n");
          while (boundary !== -1) {
            const messageLine = buffer.substring(0, boundary);
            buffer = buffer.substring(boundary + 2);

            if (messageLine.startsWith("data: ")) {
              const jsonData = messageLine.substring(6);
              try {
                const parsedData = JSON.parse(jsonData);

                if (parsedData.status === "streaming" && parsedData.chunk) {
                  const chunk = parsedData.chunk;
                  receivedText += chunk;
                  setMessages((prevMessages) => {
                    const updatedMessages = prevMessages.map((msg) =>
                      msg.id === botMessageId
                        ? { ...msg, text: receivedText, isLoading: true }
                        : msg
                    );
                    return updatedMessages;
                  });
                } else if (parsedData.status === "success") {
                  finalBotResponse = parsedData.full_response || receivedText;
                  setMessages((prevMessages) => {
                    const updated = prevMessages.map((msg) =>
                      msg.id === botMessageId
                        ? { ...msg, text: finalBotResponse, isLoading: false }
                        : msg
                    );
                    return updated;
                  });
                } else if (
                  parsedData.status === "error" ||
                  parsedData.status === "aborted"
                ) {
                  console.error("Stream error/aborted by server:", parsedData);
                  finalBotResponse =
                    receivedText +
                    (parsedData.error
                      ? ` [Error: ${parsedData.error}]`
                      : " [Stream aborted]");
                  setMessages((prevMessages) =>
                    prevMessages.map((msg) =>
                      msg.id === botMessageId
                        ? {
                            ...msg,
                            text: finalBotResponse,
                            isLoading: false,
                            isError: true,
                          }
                        : msg
                    )
                  );
                }
              } catch (e) {
                console.warn(
                  "Error parsing stream data JSON:",
                  e,
                  "Data:",
                  jsonData
                );
              }
            }
            boundary = buffer.indexOf("\n\n");
          }
        }

        if (finalBotResponse && isAuthenticated) {
          try {
            await interactionApi.saveInteraction(text, finalBotResponse);
          } catch (saveError) {
            console.warn("Could not save interaction:", saveError);
            setApiError("Failed to save chat history.");
          }
        }
      } catch (error) {
        console.error("Error sending/streaming message:", error);
        setApiError(`Error: ${error.message}`);
        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            msg.id === botMessageId
              ? {
                  ...msg,
                  isLoading: false,
                  isError: true,
                  text: `[Failed to get response: ${error.message}]`,
                }
              : msg
          )
        );
      } finally {
        setLoading(false);
        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            msg.id === botMessageId ? { ...msg, isLoading: false } : msg
          )
        );
      }
    },
    [loading, modelStatus.status, isAuthenticated, interactionApi]
  );

  // --- Effect to CAPTURE incoming message from navigation state ---
  useEffect(() => {
    if (location.state?.prefillMessage) {
      const messageToSet = location.state.prefillMessage;
      setPendingPrefillMessage(messageToSet);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate]);

  // --- Effect to SEND pending message WHEN model is online ---
  useEffect(() => {
    if (
      pendingPrefillMessage &&
      modelStatus.status === "online" &&
      !authLoading &&
      !isHistoryLoading &&
      !profilePicLoading
    ) {
      console.log(
        "[ChatInterface] Model online, auth/history/profile loaded, and message pending. Sending:",
        pendingPrefillMessage
      );
      handleSendMessage(pendingPrefillMessage);
      setPendingPrefillMessage(null);
    } else if (pendingPrefillMessage && modelStatus.status !== "unknown") {
      console.warn(
        `[ChatInterface] Message pending ("${pendingPrefillMessage}") but model status is ${modelStatus.status} or still loading. Waiting...`
      );
    }
  }, [
    pendingPrefillMessage,
    modelStatus.status,
    handleSendMessage,
    authLoading,
    isHistoryLoading,
    profilePicLoading,
  ]);

  const getStatusBadge = () => {
    let bgColor = "bg-gray-500";
    let textColor = "text-white";
    let text = modelStatus.status.toUpperCase();

    if (modelStatus.status === "online") {
      bgColor = "bg-green-500";
    } else if (modelStatus.status === "offline") {
      bgColor = "bg-yellow-500";
      textColor = "text-black";
    } else if (modelStatus.status === "error") {
      bgColor = "bg-red-500";
    } else if (modelStatus.status === "unknown") {
      text = "CHECKING...";
    }

    return (
      <span
        className={`px-3 py-1 text-xs font-semibold rounded-full ${bgColor} ${textColor}`}
      >
        {text}
      </span>
    );
  };

  // Combined initial loading state
  const initialScreenLoading =
    authLoading ||
    profilePicLoading ||
    (isAuthenticated && isHistoryLoading && messages.length === 0);

  return (
    <div className="flex flex-col h-[100%] bg-dark-slate-gray">
      <div className="flex justify-between items-center mb-4 px-4 pt-4">
        <h2 className="text-xl font-bold text-white">DracoBot Chat</h2>
        {getStatusBadge()}
      </div>
      <div className="flex-1 overflow-y-auto pb-4 px-4 space-y-4">
        {initialScreenLoading && (
          <div className="text-center text-gray-400 p-4 flex flex-col items-center justify-center h-full">
            <FaSpinner className="animate-spin text-2xl mb-2 text-goldenrod" />
            {authLoading && <p>Authenticating...</p>}
            {profilePicLoading && !authLoading && (
              <p>Loading user profile...</p>
            )}
            {isHistoryLoading &&
              !authLoading &&
              !profilePicLoading &&
              messages.length === 0 &&
              isAuthenticated && <p>Loading chat history...</p>}
          </div>
        )}
        {!initialScreenLoading && historyError && messages.length === 0 && (
          <div className="text-center text-red-400 p-4">{historyError}</div>
        )}
        {!initialScreenLoading &&
          messages.map((message) => (
            <ChatMessage
              key={message.id}
              message={message}
              userProfilePicUrl={userProfilePicUrl} // Pass the URL
            />
          ))}
        <div ref={messagesEndRef} />
      </div>
      {apiError && (
        <div className="p-2 text-center text-red-400 bg-red-900/50 text-sm mx-4 mb-2 rounded">
          {apiError}
        </div>
      )}
      <div className="p-4 border-t border-gray-700">
        <ChatInput
          onSendMessage={handleSendMessage}
          isLoading={loading} // Bot response loading
          isDisabled={
            initialScreenLoading || // Disable if any initial loading is true
            modelStatus.status !== "online"
          }
        />
      </div>
    </div>
  );
};

export default ChatInterface;
