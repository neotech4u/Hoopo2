import React, { useEffect, useRef, useState } from 'react';

interface BootAnimationProps {
  onComplete: () => void;
  videoSrc?: string;
}

export const BootAnimation: React.FC<BootAnimationProps> = ({
  onComplete,
  videoSrc = '/assets/boot/hoopoe_boot.mp4',
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isFading, setIsFading] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  const handleFinish = () => {
    if (isFading) return;
    setIsFading(true);
    setTimeout(() => {
      onComplete();
    }, 400);
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Start video playback cleanly as native automotive splash
    const startPlay = async () => {
      try {
        video.muted = false;
        await video.play();
        setHasStarted(true);
      } catch {
        // Fallback to muted autoplay if Android audio policy restricts initial sound
        video.muted = true;
        try {
          await video.play();
          setHasStarted(true);
        } catch (e) {
          console.warn('Boot video fallback, proceeding to cockpit:', e);
          handleFinish();
        }
      }
    };

    startPlay();

    // Safety timeout in case video stalls or fails to trigger onEnded
    const fallbackTimeout = setTimeout(() => {
      handleFinish();
    }, 12000);

    return () => clearTimeout(fallbackTimeout);
  }, []);

  return (
    <div
      className={`fixed inset-0 z-[100] w-screen h-screen bg-black flex items-center justify-center overflow-hidden transition-opacity duration-400 select-none ${
        isFading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      onClick={handleFinish}
      role="presentation"
    >
      {/* Native-style Fullscreen Automotive Boot Video */}
      <video
        ref={videoRef}
        src={videoSrc}
        autoPlay
        playsInline
        // @ts-ignore
        webkit-playsinline="true"
        // @ts-ignore
        x5-playsinline="true"
        controls={false}
        disablePictureInPicture
        disableRemotePlayback
        preload="auto"
        onEnded={handleFinish}
        onError={() => {
          console.warn('Boot video error, proceeding to cockpit');
          handleFinish();
        }}
        className="w-full h-full object-cover pointer-events-none"
      />

      {/* Discreet, minimal Skip indicator */}
      {hasStarted && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleFinish();
          }}
          className="absolute bottom-6 right-6 z-20 px-3 py-1 rounded-full bg-black/40 hover:bg-black/70 border border-white/20 text-white/70 hover:text-white text-xs tracking-wider uppercase backdrop-blur-sm transition-all"
        >
          Skip &rarr;
        </button>
      )}
    </div>
  );
};
