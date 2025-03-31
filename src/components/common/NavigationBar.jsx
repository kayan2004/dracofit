import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import PropTypes from "prop-types";

// Icons for navigation tabs
const HomeIcon = ({ active }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-6 w-6"
    fill="none"
    viewBox="0 0 24 24"
    stroke={active ? "currentColor" : "#9CA3AF"}
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
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-6 w-6"
    fill="none"
    viewBox="0 0 24 24"
    stroke={active ? "currentColor" : "#9CA3AF"}
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
    />
  </svg>
);

const WorkoutsIcon = ({ active }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-6 w-6"
    fill="none"
    viewBox="0 0 24 24"
    stroke={active ? "currentColor" : "#9CA3AF"}
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
    />
  </svg>
);

const FriendsIcon = ({ active }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-6 w-6"
    fill="none"
    viewBox="0 0 24 24"
    stroke={active ? "currentColor" : "#9CA3AF"}
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
    />
  </svg>
);

const ChatbotIcon = ({ active }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-6 w-6"
    fill="none"
    viewBox="0 0 24 24"
    stroke={active ? "currentColor" : "#9CA3AF"}
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
    />
  </svg>
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
      name: "Home",
      path: "/", // Assuming '/' is home
      icon: HomeIcon,
      active: location.pathname === "/" || location.pathname === "/home",
      enabled: true,
    },
    {
      name: "Exercises",
      path: "/exercises",
      icon: ExercisesIcon,
      active: location.pathname.includes("/exercises"),
      enabled: true,
    },
    {
      name: "Workouts",
      path: "/workouts",
      icon: WorkoutsIcon,
      active: location.pathname.includes("/workouts"),
      enabled: true, // Not yet functional
    },
    {
      name: "Friends",
      path: "/friends",
      icon: FriendsIcon,
      active: location.pathname.includes("/friends"),
      enabled: false, // Not yet functional
    },
    {
      name: "Chatbot",
      path: "/chatbot",
      icon: ChatbotIcon,
      active: location.pathname.includes("/chatbot"),
      enabled: false, // Not yet functional
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
            <li key={item.name} className="relative">
              <Link
                to={item.path}
                className={`flex flex-col items-center py-2 rounded-lg transition-colors ${
                  item.active
                    ? "text-goldenrod"
                    : "text-gray-400 hover:text-goldenrod/80"
                }`}
              >
                <item.icon active={item.active} />
                <span className="text-xs mt-1">{item.name}</span>
              </Link>
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
