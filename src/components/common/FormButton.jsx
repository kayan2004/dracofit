import React from "react";
import SpinningIcon from "../icons/SpinningIcon";

const FormButton = ({
  children,
  type = "button",
  isLoading = false,
  fullWidth = false,
  onClick,
  ...props
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isLoading}
      className={`bg-goldenrod p-4 mt-5 rounded-md border-b-8 border-r-8 hover:brightness-75 border-dark-goldenrod
        ${isLoading ? "opacity-70 cursor-not-allowed" : ""} 
        ${fullWidth ? "w-full" : ""}`}
      {...props}
    >
      <div className="flex items-center justify-center gap-4 text-heading-4 text-midnight-green">
        {children}
        {isLoading ? <SpinningIcon styles="text-midnight-green" /> : null}
      </div>
    </button>
  );
};

export default FormButton;
