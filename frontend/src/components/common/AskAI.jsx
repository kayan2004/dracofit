import React, { useState, useRef, useEffect } from "react";
import { FaRobot, FaPaperPlane, FaCopy, FaCheck } from "react-icons/fa";

/**
 * AskAI Component - Allows users to ask questions about exercises to an AI assistant
 * @param {Object} props
 * @param {Object} props.context - Context information (like exercise details) to send to the AI
 * @param {string} props.placeholder - Placeholder text for the input field
 */
const AskAI = ({ context, placeholder = "Ask about this exercise..." }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom of chat when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Reset copied state after 2 seconds
  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => {
        setCopied(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  // Send message to AI API
  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput("");

    // Add user message to chat
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);

    setLoading(true);

    try {
      // This would be your actual API call to your backend that connects to an AI service
      // const response = await fetch('/api/ask-ai', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({
      //     message: userMessage,
      //     context: context // Send the exercise context along with the user question
      //   }),
      // });

      // const data = await response.json();

      // Simulate AI response for demo purposes
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Example response format that would come from your AI service
      const aiResponse = generateDemoResponse(userMessage, context);

      // Add AI response to chat
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: aiResponse },
      ]);
    } catch (error) {
      console.error("Error getting AI response:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Sorry, I encountered an error while processing your question. Please try again later.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage();
  };

  // Copy message to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
  };

  // Format message with markdown-like syntax (simple version)
  const formatMessage = (text) => {
    // Split by new lines to handle paragraphs
    const paragraphs = text.split("\n");

    return paragraphs.map((paragraph, i) => {
      if (paragraph.trim() === "") return <br key={i} />;

      // Check if this is a list item
      if (paragraph.trim().startsWith("- ")) {
        return (
          <li key={i} className="ml-4">
            {paragraph.trim().substring(2)}
          </li>
        );
      }

      // Check if this is a heading
      if (paragraph.trim().startsWith("# ")) {
        return (
          <h4 key={i} className="font-bold text-lg text-goldenrod mt-2 mb-1">
            {paragraph.trim().substring(2)}
          </h4>
        );
      }

      return (
        <p key={i} className="mb-2">
          {paragraph}
        </p>
      );
    });
  };

  // Generate a demo response based on the exercise and question
  const generateDemoResponse = (question, exerciseContext) => {
    const exercise = exerciseContext;

    if (!exercise) {
      return "I don't have information about this exercise. Please try asking about a different exercise.";
    }

    // Simplified demo responses based on keywords in the question
    if (question.toLowerCase().includes("how to")) {
      return `# How to perform ${exercise.name}\n\nHere's how to perform ${
        exercise.name
      } correctly:\n\n- Start with proper form: ${
        exercise.instructions?.split("\n")[0] ||
        "Keep your back straight and core engaged."
      }\n- Focus on the target muscles: ${
        exercise.targetMuscles?.join(", ") || "the primary muscle groups"
      }\n- Control the movement and avoid using momentum\n- Breathe out during the effort phase of the exercise`;
    }

    if (
      question.toLowerCase().includes("benefit") ||
      question.toLowerCase().includes("good for")
    ) {
      return `# Benefits of ${exercise.name}\n\nThe ${
        exercise.name
      } exercise offers several benefits:\n\n- Targets ${
        exercise.targetMuscles?.join(", ") || "multiple muscle groups"
      }\n- Improves strength and muscle definition\n- Enhances overall functional fitness\n- Can help with posture and muscle balance\n\nIt's particularly good for ${
        exercise.difficulty || "all"
      } fitness levels.`;
    }

    if (
      question.toLowerCase().includes("alternative") ||
      question.toLowerCase().includes("similar")
    ) {
      return `# Alternatives to ${
        exercise.name
      }\n\nIf you're looking for alternatives to ${
        exercise.name
      }, consider these exercises that target similar muscle groups:\n\n- ${
        exercise.targetMuscles?.[0] || "Upper body"
      } variation exercises\n- Modified versions with different equipment\n- Similar movements that target the ${
        exercise.targetMuscles?.[0] || "same"
      } muscles\n\nAlways choose alternatives that match your fitness level (${
        exercise.difficulty || "appropriate difficulty"
      }).`;
    }

    // Default response
    return `The ${exercise.name} is a ${
      exercise.difficulty || ""
    } level exercise that targets ${
      exercise.targetMuscles?.join(", ") || "various muscle groups"
    }. ${
      exercise.description || ""
    }\n\nIs there something specific about this exercise you'd like to know?`;
  };

  return (
    <div className="bg-midnight-green-darker rounded-xl overflow-hidden">
      {/* Header */}
      <div className="bg-dark-slate-gray p-4 flex items-center">
        <FaRobot className="text-medium-aquamarine text-xl mr-3" />
        <h3 className="text-xl text-goldenrod">Ask AI About This Exercise</h3>
      </div>

      {/* Chat messages */}
      <div className="p-4 max-h-80 overflow-y-auto bg-midnight-green">
        {messages.length === 0 ? (
          <div className="text-center py-8 text-gray-400 italic">
            <p>Ask me anything about this exercise!</p>
            <p className="text-sm mt-2">
              Examples: "How do I perform this correctly?", "What muscles does
              this work?", "Is this good for beginners?"
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-xl p-3 ${
                    msg.role === "user"
                      ? "bg-goldenrod text-black"
                      : "bg-dark-slate-gray text-white"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="prose">
                      {msg.role === "user" ? (
                        <p>{msg.content}</p>
                      ) : (
                        <div className="text-white">
                          {formatMessage(msg.content)}
                        </div>
                      )}
                    </div>
                    {msg.role === "assistant" && (
                      <button
                        className="ml-2 text-gray-400 hover:text-white transition-colors"
                        onClick={() => copyToClipboard(msg.content)}
                        title="Copy to clipboard"
                      >
                        {copied ? <FaCheck /> : <FaCopy />}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-dark-slate-gray text-white max-w-[80%] rounded-xl p-3">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 rounded-full bg-gray-500 animate-pulse"></div>
                    <div className="w-2 h-2 rounded-full bg-gray-500 animate-pulse delay-100"></div>
                    <div className="w-2 h-2 rounded-full bg-gray-500 animate-pulse delay-200"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input form */}
      <form onSubmit={handleSubmit} className="border-t border-gray-700 p-3">
        <div className="flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={placeholder}
            className="flex-1 bg-dark-slate-gray border border-gray-700 rounded-l-lg py-2 px-3 text-white focus:outline-none focus:border-goldenrod"
            disabled={loading}
          />
          <button
            type="submit"
            className={`bg-goldenrod hover:bg-dark-goldenrod text-midnight-green-darker p-2 rounded-r-lg flex items-center justify-center transition-colors ${
              loading ? "opacity-50 cursor-not-allowed" : ""
            }`}
            disabled={loading}
          >
            <FaPaperPlane />
          </button>
        </div>
      </form>
    </div>
  );
};

export default AskAI;
