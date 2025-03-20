import React from "react";

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
        {isLoading ? (
          <svg
            className="animate-spin  h-4 w-4 text-white"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        ) : null}
      </div>
    </button>
  );
};

export default FormButton;
