import React, { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";
import chatbotApi from "../../services/ChatbotService"; // Corrected import path
import interactionApi from "../../services/interactionApi";
import { useAuth } from "../../hooks/useAuth";

const ChatInterface = () => {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [messages, setMessages] = useState([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(authLoading);
  const [historyError, setHistoryError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [modelStatus, setModelStatus] = useState({
    status: "unknown", // Start as unknown
    lastChecked: null,
    details: null,
    error: null,
  });
  const [apiError, setApiError] = useState(null);
  const messagesEndRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  // --- State to hold a message waiting to be sent ---
  const [pendingPrefillMessage, setPendingPrefillMessage] = useState(null);

  // --- Scroll to bottom effect ---
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // --- Fetch chat history effect (remains the same) ---
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
                  // Remove type if not needed elsewhere
                  // type: 'text',
                },
                {
                  id: `db-a-${interaction.id || index}`,
                  text: interaction.answer,
                  sender: "bot",
                  timestamp: new Date(interaction.timestamp),
                  isLoading: false,
                  isError: false,
                  // Remove type if not needed elsewhere
                  // type: 'text',
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
        setIsHistoryLoading(false);
      } else {
        setMessages([]);
        setHistoryError(null);
        setIsHistoryLoading(false);
      }
    };

    fetchHistory();
  }, [isAuthenticated, authLoading]);

  // --- Health Check Effect (remains the same) ---
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

  // --- handleSendMessage (remains the same) ---
  const handleSendMessage = useCallback(
    async (text) => {
      // The existing guard clause handles the online check here
      if (!text?.trim() || loading || modelStatus.status !== "online") {
        console.warn("[handleSendMessage] Skipping send. Reason:", {
          textExists: !!text?.trim(),
          loading,
          status: modelStatus.status,
        });
        // Optionally clear pending message if status is bad? Or let it wait? For now, just skip.
        return;
      }

      setLoading(true);
      setApiError(null);

      // --- Always add user message ---
      const newUserMessage = {
        id: `user-${Date.now()}`,
        text,
        sender: "user",
        timestamp: new Date(),
        isLoading: false,
        isError: false,
        // Remove type if not needed elsewhere
        // type: 'text',
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
          // Remove type if not needed elsewhere
          // type: 'text',
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
            console.log(
              "[Streaming] Stream finished (done=true). Final received text:",
              receivedText
            );
            finalBotResponse = receivedText;
            // --- Log before final setMessages ---
            console.log(
              "[Streaming] Setting final message state (isLoading: false)"
            );
            setMessages((prevMessages) => {
              const updated = prevMessages.map((msg) =>
                msg.id === botMessageId
                  ? { ...msg, text: finalBotResponse, isLoading: false }
                  : msg
              );
              // --- Log the state that WILL be set ---
              console.log("[Streaming] State after final update:", updated);
              return updated;
            });
            break; // Exit loop
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
                  // --- Log chunk received and text update ---
                  console.log(
                    `[Streaming] Chunk received: "${chunk}". New receivedText: "${receivedText}"`
                  );
                  // --- Log right before the streaming setMessages call ---
                  console.log(
                    "[Streaming] Calling setMessages for streaming update (isLoading: true)"
                  );
                  setMessages((prevMessages) => {
                    // --- Log the previous state inside the updater ---
                    // console.log("[Streaming] prevMessages inside updater:", prevMessages);
                    const updatedMessages = prevMessages.map((msg) =>
                      msg.id === botMessageId
                        ? { ...msg, text: receivedText, isLoading: true } // Ensure isLoading stays true
                        : msg
                    );
                    // --- Log the state that WILL be set ---
                    console.log(
                      "[Streaming] State after streaming update:",
                      updatedMessages
                    );
                    return updatedMessages;
                  });
                  // --- Log immediately after the setMessages call ---
                  console.log(
                    "[Streaming] setMessages for streaming update called."
                  );
                } else if (parsedData.status === "success") {
                  console.log(
                    "[Streaming] Received 'success' status. Full response:",
                    parsedData.full_response
                  );
                  finalBotResponse = parsedData.full_response || receivedText;
                  // --- Log before success setMessages ---
                  console.log(
                    "[Streaming] Setting success message state (isLoading: false)"
                  );
                  setMessages((prevMessages) => {
                    const updated = prevMessages.map((msg) =>
                      msg.id === botMessageId
                        ? { ...msg, text: finalBotResponse, isLoading: false }
                        : msg
                    );
                    // --- Log the state that WILL be set ---
                    console.log(
                      "[Streaming] State after success update:",
                      updated
                    );
                    return updated;
                  });
                }
                // ... error/aborted handling ...
              } catch (e) {
                /* ... */
              }
            }
            boundary = buffer.indexOf("\n\n");
          }
        } // end while reader

        // --- Save interaction (reverted question logic) ---
        if (finalBotResponse && isAuthenticated) {
          try {
            // --- Use the original text directly ---
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
    [loading, modelStatus.status, isAuthenticated, interactionApi] // Ensure modelStatus.status is a dependency
  );

  // --- Effect to CAPTURE incoming message from navigation state ---
  useEffect(() => {
    if (location.state?.prefillMessage) {
      const messageToSet = location.state.prefillMessage;
      console.log(
        "[ChatInterface] Received prefill message, setting as pending:",
        messageToSet
      );
      setPendingPrefillMessage(messageToSet); // Store the message
      // Clear the location state immediately
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate]); // Only depends on location state and navigate

  // --- Effect to SEND pending message WHEN model is online ---
  useEffect(() => {
    // Check if there's a pending message AND the model is online
    if (pendingPrefillMessage && modelStatus.status === "online") {
      console.log(
        "[ChatInterface] Model online and message pending. Sending:",
        pendingPrefillMessage
      );
      handleSendMessage(pendingPrefillMessage);
      setPendingPrefillMessage(null); // Clear the pending message after attempting to send
    } else if (pendingPrefillMessage && modelStatus.status !== "unknown") {
      // Optional: Log if message is pending but model is not online (and not just 'unknown')
      console.warn(
        `[ChatInterface] Message pending ("${pendingPrefillMessage}") but model status is ${modelStatus.status}. Waiting...`
      );
    }
  }, [pendingPrefillMessage, modelStatus.status, handleSendMessage]); // Depends on the pending message and model status

  const getStatusBadge = () => {
    /* ... */
  };

  return (
    <div className="flex flex-col h-[100%] bg-dark-slate-gray">
      <div className="flex justify-between items-center mb-4 px-4 pt-4">
        <h2 className="text-xl font-bold text-white">DracoBot Chat</h2>
        {getStatusBadge()}
      </div>
      <div className="flex-1 overflow-y-auto pb-4 px-4 space-y-4">
        {isHistoryLoading && messages.length === 0 && (
          <div className="text-center text-gray-400 p-4">
            Loading history...
          </div>
        )}
        {historyError && messages.length === 0 && (
          <div className="text-center text-red-400 p-4">{historyError}</div>
        )}
        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
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
          isLoading={loading}
          isDisabled={
            authLoading ||
            modelStatus.status !== "online" ||
            (isHistoryLoading && messages.length === 0)
          }
        />
      </div>
    </div>
  );
};

export default ChatInterface;
