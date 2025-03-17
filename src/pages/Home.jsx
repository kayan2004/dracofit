import React from "react";

const Home = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-[#0d3b3b]">
      <div className="relative flex flex-col items-center justify-center w-72 h-48 border-2 border-[#d4a017] rounded-lg text-[#d4a017]">
        <div className="text-4xl mb-2">+</div>
        <div className="text-xl font-bold">CREATE WORKOUT</div>
        <div className="absolute inset-0 border-2 border-[#d4a017] rounded-lg transform translate-x-2 translate-y-2"></div>
      </div>
    </div>
  );
};

export default Home;
