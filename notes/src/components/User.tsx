import React from 'react';
import { Avatar } from '@mui/material';
import { useAuth } from './auth/AuthProvider';

interface UserAvatarProps {
  size?: number;
  className?: string;
}

const UserAvatar: React.FC<UserAvatarProps> = ({ size = 40, className = '' }) => {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  // Check if user has a photo URL (Google/GitHub)
  if (user.photoURL) {
    return (
      <Avatar
        src={user.photoURL}
        alt={user.displayName || user.email || 'User'}
        sx={{
          width: size,
          height: size
        }}
        className={className}
      />
    );
  }

  // For email login, create letter avatar
  const getInitials = (email: string) => {
    return email.charAt(0).toUpperCase();
  };

  const getRandomColor = (email: string) => {
    // Generate consistent color based on email
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

  return (
    <Avatar
      sx={{
        width: size,
        height: size,
        backgroundColor: getRandomColor(user.email || ''),
        fontSize: size * 0.4,
        fontWeight: 'bold'
      }}
      className={className}
    >
      {getInitials(user.email || 'User')}
    </Avatar>
  );
};

export default UserAvatar;
