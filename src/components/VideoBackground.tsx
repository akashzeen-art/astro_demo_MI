import React, { useRef, useEffect } from "react";

interface VideoBackgroundProps {
  src?: string;
  className?: string;
  overlay?: boolean;
}

const VideoBackground: React.FC<VideoBackgroundProps> = ({
  src = "https://vz-8af39f0e-519.b-cdn.net/5c0c8c84-eb47-47c4-bcb5-484792933da7/play_480p.mp4",
  className = "",
  overlay = true,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.preload = "auto";
    video.playsInline = true;
    video.muted = true;
    
    const playVideo = async () => {
      try {
        await video.play();
        console.log("Video playing successfully");
      } catch (error) {
        console.log("Video autoplay failed:", error);
      }
    };

    playVideo();
  }, []);

  return (
    <>
      {/* Video Background */}
      <video
        ref={videoRef}
        src={src}
        autoPlay
        loop
        muted
        playsInline
        className={`fixed inset-0 w-full h-full object-cover ${className}`}
        style={{
          zIndex: -1,
          pointerEvents: "none",
        }}
      />
      
      {/* Light Overlay */}
      {overlay && (
        <div className="fixed inset-0 pointer-events-none bg-black/20" style={{ zIndex: 0 }} />
      )}
    </>
  );
};

export default VideoBackground;