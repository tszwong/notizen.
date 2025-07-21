import React, { useRef, useState } from 'react';

// Update the path if your image is named differently or in a different folder
import noteEditor3D from '../assets/note-editor-3d.png';

interface AuthLayoutProps {
  children: React.ReactNode;
}

const retroFont = {
  fontFamily: `'IBM Plex Mono', 'Share Tech Mono', 'VT323', monospace`,
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
        background: 'linear-gradient(120deg, #f4f1eb 0%, #e0d8c3 100%)',
        ...retroFont,
        overflow: 'hidden',
      }}
    >
      {/* Left Side: Animated Image */}
      <div
        style={{
          flex: '0 0 60%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          minHeight: '100vh',
          // background intentionally left blank for user customization
          borderRight: '4px solid #7A6C4D',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          ref={imageRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{
            width: 1040,
            height: 1040,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            perspective: 900,
            borderRadius: 32,
            // boxShadow: '0 8px 32px rgba(50,50,50,0.12)',
            // background: 'rgba(255,255,255,0.7)',
            // border: '3px solid #7A6C4D',
            transition: 'box-shadow 0.3s',
          }}
        >
          <img
            src={noteEditor3D}
            alt="Note Editor 3D"
            style={{
              width: '90%',
              height: '90%',
              objectFit: 'contain',
              transform: `rotateX(${-tilt.x}deg) rotateY(${tilt.y}deg)`,
              transition: 'transform 0.25s cubic-bezier(.25,.46,.45,.94)',
              filter: 'drop-shadow(0 8px 24px #7A6C4D55)',
            }}
            draggable={false}
          />
        </div>
        {/* Optional: Add a subtle mechanical overlay or grid */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            background: 'radial-gradient(circle at 60% 40%, rgba(122,108,77,0.08) 0%, transparent 80%)',
            zIndex: 1,
          }}
        />
      </div>
      {/* Right Side: Form */}
      <div
        style={{
          flex: '0 0 40%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          minHeight: '100vh',
          width: '100%',
          background: 'linear-gradient(120deg, #e0d8c3 0%, #b7b1a3 100%)',
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
            ...retroFont,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

export default AuthLayout; 