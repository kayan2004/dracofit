import SpinningIcon from "../icons/SpinningIcon";
const SecondaryButton = ({
  className = "",
  children,
  isLoading = false,
  fullWidth = false,
  loadingText = "Loading...",
  onClick,
  disabled = false,
  type = "button",
  styles = "",
  ...rest
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`flex items-center justify-center rounded-md ${styles}
      shadow-sm bg-midnight-green border-midnight-green-darker 
       text-goldenrod hover:opacity-75 focus:outline-none 
       disabled:opacity-50 transition-colors ${
         fullWidth ? "w-full" : ""
       } ${className}`}
      {...rest}
    >
      {isLoading ? (
        <>
          <SpinningIcon className="mr-2" />
          <span>{loadingText}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
};

export default SecondaryButton;
