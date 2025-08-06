import React, { useRef, useState } from 'react';

// Update the path if your image is named differently or in a different folder
// @ts-ignore
import noteEditor3D from '../assets/note-editor-3d.png';
// @ts-ignore
import noteEditor3DBlack from '../assets/note-editor-3d-black.png';

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
        backgroundImage: "linear-gradient(to right bottom, #fefae0, #fdf8dc, #fcf5d9, #fcf3d5, #fbf0d2, #faebc7, #f9e7bc, #f8e2b1, #f7d99c, #f6d088, #f6c774, #f6bd60)",
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
            width: '1140px',
            height: '1140px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            perspective: 900,
            borderRadius: 32,

            transition: 'box-shadow 0.3s',
          }}
        >
          <img
            src={noteEditor3DBlack}
            alt="Note Editor 3D"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              transform: `rotateX(${-tilt.x}deg) rotateY(${tilt.y}deg)`,
              transition: 'transform 0.25s cubic-bezier(.25,.46,.45,.94)',
              filter: 'drop-shadow(0 8px 24px #7A6C4D55)',
            }}
            draggable={false}
          />
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
          flex: '0 0 40%',
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