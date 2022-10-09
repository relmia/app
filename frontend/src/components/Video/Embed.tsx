import React from 'react';

const YoutubeEmbed = ({}: {}) => (
  <div className="video-responsive">
    <iframe
      width="300"
      height="220"
      src="https://www.youtube.com/embed/jNQXAC9IVRw?loop=1&modestbranding=1&autoplay=1"
      frameBorder="0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
      title="Embedded youtube"
    />
  </div>
);

export default YoutubeEmbed;
