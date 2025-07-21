import React, { useState, useRef, useEffect } from 'react';
import { Avatar } from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import { useAuth } from './auth/AuthProvider';
import { Tooltip as ReactTooltip } from 'react-tooltip';

interface LogoutButtonProps {
  size?: number;
  className?: string;
}

const LogoutButton: React.FC<LogoutButtonProps> = ({ size = 50, className = '' }) => {
  const { user, signOut } = useAuth();
  const [isHovered, setIsHovered] = useState(false);
  const [isHolding, setIsHolding] = useState(false);
  const [progress, setProgress] = useState(0);
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const holdDuration = 1500; 
  const progressStep = 100 / (holdDuration / 16); // 60fps

  useEffect(() => {
    if (isHolding) {
      progressIntervalRef.current = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            // Complete the logout
            handleLogout();
            return 100;
          }
          return prev + progressStep;
        });
      }, 16); // ~60fps
    } else {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      setProgress(0);
    }

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [isHolding]);

  const handleMouseDown = () => {
    setIsHolding(true);
  };

  const handleMouseUp = () => {
    setIsHolding(false);
  };

  const handleMouseLeave = () => {
    setIsHolding(false);
    setIsHovered(false);
  };

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (!user) {
    return null;
  }

  const strokeWidth = 3;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <>
      <div
        style={{
          position: 'relative',
          display: 'inline-flex',
          cursor: isHovered ? 'pointer' : 'default',
          width: size,
          height: size,
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={handleMouseLeave}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        data-tooltip-id="logout-tooltip"
        data-tooltip-content="Logout"
      >
        {/* Circular progress indicator */}
        {isHolding && (
          <svg
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: size,
              height: size,
              transform: 'rotate(-90deg)',
              zIndex: 2,
            }}
          >
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="rgba(255, 255, 255, 0.3)"
              strokeWidth={strokeWidth}
            />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="#e57373"
              strokeWidth={strokeWidth}
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 0.016s linear' }}
            />
          </svg>
        )}
        
        {/* Avatar/Icon */}
        <div
          style={{
            width: size,
            height: size,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: isHovered ? 'rgba(229, 115, 115, 0.1)' : 'transparent',
            transition: 'background-color 0.2s ease',
            position: 'relative',
            zIndex: 1,
          }}
        >
          {isHovered ? (
            <LogoutIcon
              style={{
                fontSize: size * 0.6,
                color: '#e57373',
              }}
            />
          ) : (
            <Avatar
              src={user.photoURL || undefined}
              alt={user.displayName || user.email || 'User'}
              sx={{
                width: size,
                height: size,
                backgroundColor: user.photoURL ? undefined : getRandomColor(user.email || ''),
                fontSize: size * 0.4,
                fontWeight: 'bold',
              }}
              className={className}
            >
              {!user.photoURL && getInitials(user.email || 'User')}
            </Avatar>
          )}
        </div>
      </div>
      
      <ReactTooltip id="logout-tooltip" anchorSelect="[data-tooltip-id='logout-tooltip']" />
    </>
  );
};

// Helper functions (copied from UserAvatar)
const getInitials = (email: string) => {
  return email.charAt(0).toUpperCase();
};

const getRandomColor = (email: string) => {
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    hash = email.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const colors = ['#FF6B6B', '#4ECDC4', '#457B96CEB4', 
   '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
    '#BB8FCE', '#85E9F87182E0AA'
  ];
  
  return colors[Math.abs(hash) % colors.length];
};

export default LogoutButton; 