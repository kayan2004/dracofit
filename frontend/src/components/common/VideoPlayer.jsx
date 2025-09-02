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
  url = null,
  title = "Exercise Video",
  className = "",
  fallbackImage = null,
  videoUrl = null,
}) => {
  // Function to extract Vimeo ID
  // const getVimeoId = (url) => {
  //   if (!url) return null;

  //   // If it's just a number, assume it's already a Vimeo ID
  //   if (/^\d+$/.test(url)) {
  //     return url;
  //   }

  //   // Vimeo URL patterns
  //   const vimeoRegex =
  //     /(?:vimeo\.com\/(?:manage\/videos\/|video\/|))(\d+)(?:$|\/|\?)/;
  //   const match = url.match(vimeoRegex);

  //   return match ? match[1] : null;
  // };

  const vimeoId = videoUrl;

  return (
    <div
      className={`bg-midnight-green rounded-xl overflow-hidden ${className}`}
    >
      <div className="aspect-video relative">
        <iframe
          src={`https://player.vimeo.com/video/${vimeoId}?badge=0&amp;autopause=0&amp;player_id=0&amp;app_id=58479}`}
          frameBorder="0"
          allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media"
          // Add classes to make iframe fill the relative parent
          className="absolute top-0 left-0 w-full h-full"
        ></iframe>
      </div>
      {/* <script src="https://player.vimeo.com/api/player.js"></script> */}
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
