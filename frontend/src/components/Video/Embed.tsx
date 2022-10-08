import React from 'react';
import PropTypes from 'prop-types';

const YoutubeEmbed = () => (
  <div className="video-responsive">
    <iframe
      width="853"
      height="480"
      src="https://www.youtube.com/embed/jNQXAC9IVRw?loop=1&modestbranding=1&autoplay=1"
      frameBorder="0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
      title="Embedded youtube"
    />
  </div>
);

YoutubeEmbed.propTypes = {
  embedId: PropTypes.string.isRequired
};

export default YoutubeEmbed;