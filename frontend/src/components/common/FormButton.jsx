import React from "react";
import SpinningIcon from "../icons/SpinningIcon";

const FormButton = ({
  children,
  type = "button",
  isLoading = false,
  fullWidth = false,
  styles = "",
  fontsize = "text-heading-4",
  onClick,
  ...props
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isLoading}
      className={`bg-goldenrod   rounded-md hover:brightness-75 border-dark-goldenrod ${styles}
        ${isLoading ? "opacity-70 cursor-not-allowed" : ""} 
        ${fullWidth ? "w-full" : ""}`}
      {...props}
    >
      <div
        className={`flex items-center justify-center gap-4 ${fontsize} text-midnight-green`}
      >
        {children}
        {isLoading ? <SpinningIcon styles="text-midnight-green" /> : null}
      </div>
    </button>
  );
};

export default FormButton;
