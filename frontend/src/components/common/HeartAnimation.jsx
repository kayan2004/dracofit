import React from "react";
import "./HeartAnimation.css"; // We'll create this CSS file next

const HeartAnimation = ({ size = "20px" }) => {
  return (
    <div
      className="heart-animation-container"
      style={{ width: size, height: size }}
    >
      <div className="heart"></div>
    </div>
  );
};

export default HeartAnimation;
