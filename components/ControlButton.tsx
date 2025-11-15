import React from 'react';

interface ControlButtonProps {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  variant?: 'primary' | 'danger';
}

const ControlButton: React.FC<ControlButtonProps> = ({
  onClick,
  disabled = false,
  children,
  variant = 'primary',
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`control-button ${variant}`}
    >
      {children}
    </button>
  );
};

export default ControlButton;
