import React from "react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";

/**
 * Renders a Lottie animation with a streak count overlay.
 * @param {object} props - The component's props.
 * @param {string} props.targetSize - The final desired display size (e.g., "36px").
 * @param {number} props.lottieScaleFactor - How much to scale the Lottie animation.
 * @param {number} props.streakCount - The number to display on the animation.
 */
const StreakAnimation = ({
  targetSize = "60px",
  lottieScaleFactor = 1.5,
  streakCount = 1, // Add streakCount prop
}) => {
  const numericTargetSize = parseFloat(targetSize);
  const lottieCanvasDimension = numericTargetSize * lottieScaleFactor;
  const translateOffset = (numericTargetSize - lottieCanvasDimension) / 2;

  const wrapperStyle = {
    width: targetSize,
    height: targetSize,
    overflow: "hidden",
    position: "relative",
    display: "flex", // To help center the text if needed, or use absolute positioning for text
    alignItems: "center",
    justifyContent: "center",
  };

  const lottiePlayerStyle = {
    width: `${lottieCanvasDimension}px`,
    height: `${lottieCanvasDimension}px`,
    position: "absolute",
    left: `${translateOffset}px`,
    top: `${translateOffset}px`,
  };

  const streakTextStyle = {
    position: "absolute", // Position text over the animation
    // Center the text - you might need to adjust these based on font size and animation
    top: "70%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    fontWeight: "bold",
    fontSize: `${numericTargetSize * 0.5}px`, // Adjust font size relative to targetSize
    zIndex: 1, // Ensure text is above the Lottie animation
  };

  return (
    <div style={wrapperStyle}>
      <DotLottieReact
        src="https://lottie.host/ca8efc74-8a25-4281-86c2-fc22db2ed063/2nB6GCUhM7.lottie"
        loop
        autoplay
        style={lottiePlayerStyle}
      />
      {streakCount > 0 && ( // Optionally, only show text if streak is greater than 0
        <span className="text-midnight-green-darker" style={streakTextStyle}>
          {streakCount}
        </span>
      )}
    </div>
  );
};

export default StreakAnimation;
