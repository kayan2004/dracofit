import React from "react";
import PropTypes from "prop-types";

/**
 * A reusable component for displaying Vimeo videos
 *
 * @param {Object} props
 * @param {string} props.url - The Vimeo video ID
 * @param {string} [props.title="Exercise Video"] - Title for the video (for accessibility)
 * @param {string} [props.className=""] - Additional CSS classes
 * @param {Object} [props.fallbackImage] - Image to display if video can't be loaded
 */
const VideoPlayer = ({
  url,
  title = "Exercise Video",
  className = "",
  fallbackImage = null,
}) => {
  // Function to extract Vimeo ID
  const getVimeoId = (url) => {
    if (!url) return null;

    // If it's just a number, assume it's already a Vimeo ID
    if (/^\d+$/.test(url)) {
      return url;
    }

    // Vimeo URL patterns
    const vimeoRegex =
      /(?:vimeo\.com\/(?:manage\/videos\/|video\/|))(\d+)(?:$|\/|\?)/;
    const match = url.match(vimeoRegex);

    return match ? match[1] : null;
  };

  const vimeoId = getVimeoId(url);

  // If we couldn't parse the URL or there's no URL
  if (!vimeoId) {
    return (
      <div
        className={`bg-gray-800 rounded-xl flex items-center justify-center h-64 ${className}`}
      >
        {fallbackImage ? (
          <img
            src={fallbackImage.src}
            alt={fallbackImage.alt || "Exercise illustration"}
            className="max-h-full max-w-full object-contain"
          />
        ) : (
          <div className="text-center p-4">
            <span className="text-gray-600 text-5xl block mb-2">🏋️</span>
            <p className="text-gray-400">No video available</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`bg-gray-800 rounded-xl overflow-hidden ${className}`}>
      <div style={{ padding: "56.25% 0 0 0", position: "relative" }}>
        <iframe
          src={`https://player.vimeo.com/video/${vimeoId}?badge=0&autopause=0&player_id=0&app_id=58479&title=0&byline=0&portrait=0&sidedock=0&transparent=0`}
          frameBorder="0"
          allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
          }}
          title={title}
        ></iframe>
      </div>
    </div>
  );
};

VideoPlayer.propTypes = {
  url: PropTypes.string,
  title: PropTypes.string,
  className: PropTypes.string,
  fallbackImage: PropTypes.shape({
    src: PropTypes.string.isRequired,
    alt: PropTypes.string,
  }),
};

export default VideoPlayer;
