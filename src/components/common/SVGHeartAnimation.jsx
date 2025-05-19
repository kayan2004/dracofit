import React from "react";

const SvgHeartAnimation = ({ size = "24px", color = "#ff4757" }) => {
  // Standard material design heart path, fits within a 24x24 viewBox
  const heartPath =
    "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z";
  const centerX = 12;
  const centerY = 12;

  // Values for the transform attribute to scale the heart from its center
  // Format: "translate(cx cy) scale(s) translate(-cx -cy)"
  const transformValues = [
    `translate(${centerX} ${centerY}) scale(1) translate(${-centerX} ${-centerY})`,
    `translate(${centerX} ${centerY}) scale(1.15) translate(${-centerX} ${-centerY})`, // Pulse out
    `translate(${centerX} ${centerY}) scale(1) translate(${-centerX} ${-centerY})`, // Back to normal
  ].join("; ");

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      // The style here is for layout, not for the animation itself.
      style={{ display: "inline-block", verticalAlign: "middle" }}
    >
      <path d={heartPath} fill={color}>
        <animate
          attributeName="transform"
          attributeType="XML"
          values={transformValues}
          dur="1.2s" // Duration of one pulse cycle
          repeatCount="indefinite" // Loop indefinitely
          calcMode="linear" // Smooth transition between states
        />
      </path>
    </svg>
  );
};

export default SvgHeartAnimation;
