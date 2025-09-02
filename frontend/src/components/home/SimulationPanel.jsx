import React from "react";
import { FaFlask } from "react-icons/fa";

const MAX_HEALTH_DEFAULT = 100;

const simulations = [
  {
    id: "reset",
    name: "Reset to Default (Lvl 1 Baby)",
    handler: () => ({
      petData: {
        name: "Dragon",
        level: 1,
        stage: "baby",
        animation: "idle",
        healthPoints: MAX_HEALTH_DEFAULT,
      },
      userData: {
        level: 1,
        xp: 0,
        xpToNextLevel: 100,
        health: MAX_HEALTH_DEFAULT,
        streak: 0,
      },
    }),
  },
  {
    id: "teen_idle",
    name: "Teen Dragon (Idle, Lvl 15)",
    handler: () => ({
      petData: {
        name: "DracoTeen",
        level: 15,
        stage: "teen",
        animation: "idle",
        healthPoints: MAX_HEALTH_DEFAULT,
      },
      userData: {
        level: 15,
        xp: 0,
        xpToNextLevel: 15 * 100,
        health: MAX_HEALTH_DEFAULT,
        streak: 5,
      },
    }),
  },
  {
    id: "adult_idle",
    name: "Adult Dragon (Idle, Lvl 30)",
    handler: () => ({
      petData: {
        name: "DracoMax",
        level: 30,
        stage: "adult",
        animation: "idle",
        healthPoints: MAX_HEALTH_DEFAULT,
      },
      userData: {
        level: 30,
        xp: 0,
        xpToNextLevel: 30 * 100,
        health: MAX_HEALTH_DEFAULT,
        streak: 10,
      },
    }),
  },
  {
    id: "adult_dead",
    name: "Adult Dragon (Dead, Lvl 30)",
    handler: () => ({
      petData: {
        name: "DracoGhost",
        level: 30,
        stage: "adult",
        animation: "dead",
        healthPoints: 0,
      },
      userData: {
        level: 30,
        xp: 0,
        xpToNextLevel: 30 * 100,
        health: 0,
        streak: 0,
      },
    }),
  },
  {
    id: "high_streak_happy",
    name: "High Streak (Happy Adult, Lvl 25)",
    handler: () => ({
      petData: {
        name: "JoyfulDraco",
        level: 25,
        stage: "adult",
        animation: "happy",
        healthPoints: MAX_HEALTH_DEFAULT,
      },
      userData: {
        level: 25,
        xp: 0,
        xpToNextLevel: 25 * 100,
        health: MAX_HEALTH_DEFAULT,
        streak: 50,
      },
    }),
  },
];

const SimulationPanel = ({
  isVisible,
  onClose,
  onSimulate,
  activeSimulation,
}) => {
  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 p-5 rounded-xl shadow-2xl w-full max-w-xs md:max-w-sm border border-goldenrod">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-goldenrod flex items-center">
            <FaFlask className="mr-2" /> Simulation Panel
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl leading-none"
            aria-label="Close simulation panel"
          >
            &times;
          </button>
        </div>
        <ul className="space-y-2 max-h-[70vh] overflow-y-auto">
          {simulations.map((sim) => (
            <li key={sim.id}>
              <button
                onClick={() => {
                  const { petData, userData } = sim.handler();
                  onSimulate(sim.id, petData, userData);
                }}
                className={`w-full text-left p-3 rounded transition-colors duration-150 ease-in-out
                            ${
                              activeSimulation === sim.id
                                ? "bg-goldenrod text-midnight-green font-semibold ring-2 ring-yellow-300"
                                : "bg-gray-700 hover:bg-gray-600 text-gray-200"
                            }`}
              >
                {sim.name}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default SimulationPanel;
