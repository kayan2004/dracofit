import React from "react";
import SearchIcon from "../icons/SearchIcon";
import CancelIcon from "../icons/CancelIcon";

/**
 * A reusable search bar component with clear button and icon
 *
 * @param {Object} props
 * @param {string} props.value - Current search value
 * @param {Function} props.onChange - Function called when input changes
 * @param {Function} props.onClear - Function called when clear button is clicked
 * @param {string} [props.placeholder="Search..."] - Placeholder text
 * @param {React.ReactNode} [props.icon] - Custom icon component
 * @param {string} [props.className=""] - Additional CSS classes for the container
 * @param {string} [props.inputClassName=""] - Additional CSS classes for the input element
 */
const SearchBar = ({
  value,
  onChange,
  onClear,
  placeholder = "Search...",
  icon,
  className = "",
  inputClassName = "",
}) => {
  // Handle clearing the search input
  const handleClear = () => {
    if (onClear) {
      onClear();
    } else if (onChange) {
      // If no explicit onClear function is provided, simulate clearing via onChange
      const simulatedEvent = { target: { value: "" } };
      onChange(simulatedEvent);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={`w-full bg-midnight-green text-white rounded-lg py-3 px-4 pl-12 focus:outline-none focus:border-goldenrod ${inputClassName}`}
      />

      {/* Search Icon */}
      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
        <SearchIcon />
      </div>

      {/* Clear Button - only shown when there's a value */}
      {value && (
        <button
          onClick={handleClear}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
          aria-label="Clear search"
        >
          <CancelIcon />
        </button>
      )}
    </div>
  );
};

export default SearchBar;
