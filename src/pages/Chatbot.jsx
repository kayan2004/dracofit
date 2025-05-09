import React, { useState, useEffect, useRef } from "react";
import ChatInterface from "../components/chatbot/ChatInterface";

const Chatbot = () => {
  return (
    <div className="bg-dark-slate-gray text-white h-[85vh] container mx-auto px-4 pt-4 ">
      <ChatInterface />
    </div>
  );
};

export default Chatbot;
