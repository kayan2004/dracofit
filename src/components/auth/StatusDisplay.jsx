import React from "react";
import SecondaryButton from "../common/SecondaryButton";

/**
 * A reusable component for displaying status messages with an icon and action button
 *
 * @param {Object} props
 * @param {React.ReactNode} props.icon - The icon component to display
 * @param {string} props.message - The message to display
 * @param {string} props.buttonText - Text for the action button
 * @param {Function} props.onButtonClick - Click handler for the button
 * @param {string} [props.messageClassName] - Additional class names for the message text
 * @param {Object} [props.buttonProps] - Additional props for the button
 */
const StatusDisplay = ({
  icon,
  message,
  buttonText,
  onButtonClick,
  messageClassName = "text-caption",
  buttonProps = {},
}) => {
  return (
    <div className="flex flex-col items-center">
      {icon}
      <p className={`mt-4 text-center text-goldenrod ${messageClassName}`}>
        {message}
      </p>
      <div className="mt-6 w-full">
        <SecondaryButton onClick={onButtonClick} fullWidth {...buttonProps}>
          {buttonText}
        </SecondaryButton>
      </div>
    </div>
  );
};

export default StatusDisplay;
