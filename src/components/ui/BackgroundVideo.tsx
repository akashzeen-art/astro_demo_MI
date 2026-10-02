import React, { useRef, useEffect } from "react";

interface BackgroundVideoProps {
  src?: string;
  className?: string;
  style?: React.CSSProperties;
}

const BackgroundVideo: React.FC<BackgroundVideoProps> = ({
  src = "https://vz-8af39f0e-519.b-cdn.net/5c0c8c84-eb47-47c4-bcb5-484792933da7/play_480p.mp4",
  className = "fixed inset-0 w-full h-full object-cover z-[-1]",
  style = {},
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Optimize video for performance
    video.preload = "metadata"; // Only load metadata initially
    video.playsInline = true;
    
    // Ensure video plays smoothly
    video.play().catch(() => {
      // Auto-play might be blocked, but that's okay
    });
  }, []);

  return (
    <video
      ref={videoRef}
      src={src}
      autoPlay
      loop
      muted
      playsInline
      preload="metadata"
      className={className}
      style={{
        pointerEvents: "none",
        // GPU acceleration for smooth scrolling
        transform: "translateZ(0)",
        willChange: "transform",
        // Optimize rendering
        contain: "layout style paint",
        // Prevent video from causing layout shifts
        objectFit: "cover",
        ...style,
      }}
      // Performance attributes
      data-playsinline="true"
    />
  );
};

export default BackgroundVideo; 