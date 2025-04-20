import React, { useState, useEffect, useRef } from "react";
import ChatInterface from "../components/chatbot/ChatInterface";

const Chatbot = () => {
  return (
    <div className="min-h-screen bg-dark-slate-gray text-white pb-24">
      <div className="container mx-auto px-4 pt-4 pb-20">
        <ChatInterface />
      </div>
    </div>
  );
};

export default Chatbot;
