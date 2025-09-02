import React, { useState, useEffect } from "react";

const Timer = ({ startTime }) => {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      if (startTime) {
        const elapsedSeconds = Math.floor((new Date() - startTime) / 1000);
        setSeconds(elapsedSeconds);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  // Format time as HH:MM:SS
  const formatTime = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    return [
      hours.toString().padStart(2, "0"),
      minutes.toString().padStart(2, "0"),
      secs.toString().padStart(2, "0"),
    ].join(":");
  };

  return (
    <div className="text-center p-3 bg-gray-800 rounded-lg">
      <p className="text-sm text-gray-400">Workout Time</p>
      <p className="text-2xl font-bold">{formatTime(seconds)}</p>
    </div>
  );
};

export default Timer;
