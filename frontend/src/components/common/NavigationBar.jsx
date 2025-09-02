import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import PropTypes from "prop-types";
import dragon from "/dragons/adult/happy/01.png";
import {
  FaRobot,
  FaDumbbell,
  // FaClipboardList, // Can remove if no longer used
  FaUserFriends,
  FaHome,
} from "react-icons/fa";
import { IoFitness } from "react-icons/io5"; // Import IoFitness

// Icons for navigation tabs
const HomeIcon = (
  { active } // Keeping SVG for now, can be changed to FaHome
) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-6 w-6"
    fill="none"
    viewBox="0 0 24 24"
    stroke={active ? "currentColor" : "#9CA3AF"} // current color for active will be text-goldenrod from Link
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
    />
  </svg>
);

const ExercisesIcon = ({ active }) => (
  <IoFitness // Changed from FaClipboardList
    className={`h-6 w-6 ${active ? "text-red-600" : "text-gray-400"}`}
  />
);

const WorkoutsIcon = ({ active }) => (
  <FaDumbbell
    className={`h-6 w-6 ${
      active ? "text-dark-slate-gray brightness-150" : "text-gray-400"
    }`}
  />
);

const FriendsIcon = ({ active }) => (
  <FaUserFriends
    className={`h-6 w-6 ${active ? "text-blue-400" : "text-gray-400"}`}
  />
);

const ChatbotIcon = ({ active }) => (
  <FaRobot
    className={`h-6 w-6 ${active ? "text-medium-aquamarine" : "text-gray-400"}`}
  />
);

const DragonHomeIcon = ({ active }) => (
  <img src={dragon} alt="Home" className="h-8 w-8" /> // Using the imported dragon image
);
/**
 * Navigation Bar component with 5 tabs
 * Only two tabs (Home and Exercises) are currently functional
 */
const NavigationBar = ({ className = "" }) => {
  const location = useLocation();
  const [showTooltip, setShowTooltip] = useState(null);

  // Define navigation items
  const navItems = [
    {
      name: "Workouts",
      path: "/workouts",
      icon: WorkoutsIcon, // Updated
      active: location.pathname.includes("/workouts"),
      enabled: true,
    },
    {
      name: "Exercises",
      path: "/exercises",
      icon: ExercisesIcon, // Updated
      active: location.pathname.includes("/exercises"),
      enabled: true,
    },
    {
      name: "Home",
      path: "/",
      icon: DragonHomeIcon, // Keeping custom dragon icon for Home
      active: location.pathname === "/" || location.pathname === "/home",
      enabled: true,
    },
    {
      name: "Friends",
      path: "/feed",
      icon: FriendsIcon, // Updated
      active: location.pathname.includes("/feed"),
      enabled: true,
    },
    {
      name: "Chatbot",
      path: "/chatbot",
      icon: ChatbotIcon,
      active: location.pathname.includes("/chatbot"),
      enabled: true,
    },
  ];

  const handleMouseEnter = (name) => {
    if (!navItems.find((item) => item.name === name).enabled) {
      setShowTooltip(name);
    }
  };

  const handleMouseLeave = () => {
    setShowTooltip(null);
  };

  return (
    <nav
      className={`fixed bottom-0 left-0 right-0 bg-midnight-green shadow-lg px-2 py-3 sm:py-3 z-10 ${className}`}
    >
      <div className="max-w-screen-xl mx-auto">
        <ul className="flex justify-around items-center">
          {navItems.map((item) => (
            <li
              key={item.name}
              className={`relative ${item.name === "Home" ? "pb-2" : ""}`} // Special padding for Home icon if needed
            >
              <Link
                to={item.path}
                className={`flex flex-col items-center py-2 rounded-lg transition-colors ${
                  item.active
                    ? "text-goldenrod" // Active color for the whole Link (icon + text)
                    : "text-gray-400 hover:text-goldenrod/80"
                }`}
              >
                {/* The icon component itself handles its internal active color based on the prop */}
                <item.icon active={item.active} />
                <span className="text-xs mt-1">{item.name}</span>
              </Link>
              {showTooltip === item.name && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-700 text-white text-xs rounded shadow-lg whitespace-nowrap">
                  Coming Soon!
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
};

NavigationBar.propTypes = {
  className: PropTypes.string,
};

export default NavigationBar;
