import React from 'react';

export const PressableButton: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    children: React.ReactNode;
  }
> = ({ children, ...rest }) => (
  <button type="button" {...rest}>
    {children}
  </button>
);

export default PressableButton; 