import React from "react";
import FriendListItem from "./FriendListItem";
import { FaSpinner } from "react-icons/fa";

const FriendList = ({
  titleIcon,
  title,
  items,
  type,
  isLoading,
  currentUser,
  onAccept,
  onRemoveOrReject,
  emptyMessage,
}) => {
  return (
    <div className="bg-midnight-green p-4 rounded-lg shadow h-full flex flex-col">
      {" "}
      {/* Ensure full height for flex */}
      <h3 className="text-lg font-semibold text-goldenrod mb-3 flex items-center">
        {titleIcon && React.cloneElement(titleIcon, { className: "mr-2" })}
        {title}
      </h3>
      <div className="flex-grow overflow-y-auto">
        {" "}
        {/* Allow content to scroll */}
        {isLoading ? (
          <div className="flex items-center justify-center text-gray-400 h-20">
            <FaSpinner className="animate-spin mr-2" /> Loading...
          </div>
        ) : items.length > 0 ? (
          <div className="space-y-1">
            {items.map((item) => (
              <FriendListItem
                key={item.id}
                item={item}
                type={type}
                currentUser={currentUser}
                onAccept={onAccept}
                onRemoveOrReject={onRemoveOrReject}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400 italic">
            {emptyMessage || `No ${title.toLowerCase()}.`}
          </p>
        )}
      </div>
    </div>
  );
};

export default FriendList;
