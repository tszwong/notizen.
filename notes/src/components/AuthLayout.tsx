import React, { useRef, useState } from 'react';

// Update the path if your image is named differently or in a different folder
// @ts-ignore
import noteEditor3D from '../assets/note-editor-3d.png';
// @ts-ignore
import noteEditor3DBlack from '../assets/note-editor-3d-black.png';
// @ts-ignore
import PandaKeyCaps from '../assets/panda_keycaps.png';

interface AuthLayoutProps {
  children: React.ReactNode;
}

const retroFont = {
  fontFamily: `'IBM Plex Mono', 'Share Tech Mono', 'VT323', monospace`,
};
const cleanFont = {
  fontFamily: "'Nunito Sans', sans-serif",
};

const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  const imageRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = imageRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    // Max tilt: 12deg
    const maxTilt = 12;
    const tiltX = ((y - centerY) / centerY) * maxTilt;
    const tiltY = ((x - centerX) / centerX) * maxTilt;
    setTilt({ x: tiltX, y: tiltY });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        height: '100vh',
        width: '100vw',
        background: 'linear-gradient(to bottom right, #606c38 0%, #b0c4b1 70%, #e9edc9 100%)',
        ...retroFont,
        overflow: 'hidden',
      }}
    >
      {/* Left Side: Animated Image */}
      <div
        style={{
          flex: '0 0 55%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          minHeight: '100vh',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          ref={imageRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{
            // make the image container responsive and centered inside the left column
            width: 'min(1000px, 80%)',
            height: 'min(1000px, 80%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            perspective: 900,
            borderRadius: 32,
            // overflow: 'hidden', // clip the rotated content
            // transition: 'box-shadow 0.3s',
            // subtle horizontal offset so the image doesn't sit flush to the very left edge
            marginLeft: '2.5rem',
            // boxShadow: '0 8px 24px rgba(122,108,77,0.12)',
          }}
        >
          <div
            style={{
              // center the rotated content inside the rounded container
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transform: `rotateX(${-tilt.x}deg) rotateY(${tilt.y}deg)`,
              transition: 'transform 0.25s cubic-bezier(.25,.46,.45,.94)',
              transformStyle: 'preserve-3d',
              willChange: 'transform',
            }}
          >
            <img
              src={PandaKeyCaps}
              alt="Note Editor 3D"
              style={{
                width: '800px',
                height: '1000px',
                display: 'block',
                objectFit: 'cover',
                borderRadius: 24,
                backfaceVisibility: 'hidden',
              }}
              draggable={false}
              // className='upper-layer'
            />
          </div>
        </div>
        {/* Optional: Add a subtle mechanical overlay or grid */}
        {/* <div
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            background: 'radial-gradient(circle at 60% 40%, rgba(122,108,77,0.08) 0%, transparent 80%)',
            zIndex: 1,
          }}
        /> */}
      </div>
      {/* Right Side: Form */}
      <div
        style={{
          flex: '0 0 35%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          minHeight: '100vh',
          width: '100%',
          background: 'transparent',
          padding: 0,
        }}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 0,
            boxShadow: 'none',
            border: 'none',
            background: 'transparent',
            ...cleanFont,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;