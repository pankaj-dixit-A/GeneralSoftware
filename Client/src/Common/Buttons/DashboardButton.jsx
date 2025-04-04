import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const DashboardButton = ({ label, icon: Icon, path }) => {
  const navigate = useNavigate();

  const [isHovered, setIsHovered] = useState(false);

  const buttonStyle = {
    display: 'flex',
    alignItems: 'center',
    padding: '10px',
    width: '288px',
    height: '112px',
    backgroundColor: isHovered ? '#F9F9F9' : 'white',
    borderRadius: '8px',
    boxShadow: isHovered ? '0 6px 16px rgba(0, 0, 0, 0.15)' : '0 4px 12px rgba(0, 0, 0, 0.1)',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    transform: isHovered ? 'scale(1.05)' : 'scale(1)',
  };

  const iconContainerStyle = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    background: isHovered
      ? 'linear-gradient(to right, #F9A825, #66BB6A)'
      : 'linear-gradient(to right, #F9C97C, #A2E9C1)',
    boxShadow: isHovered ? '0 6px 12px rgba(0, 0, 0, 0.2)' : '0 4px 8px rgba(0, 0, 0, 0.2)',
    transition: 'background 0.3s ease, transform 0.3s ease',
    transform: isHovered ? 'scale(1.1)' : 'scale(1)',
  };

  const iconStyle = {
    fontSize: '28px',
    fill: '#4B5563',
    transition: 'fill 0.3s ease',
    ...(isHovered && { fill: '#1F2937' }),
  };

  const labelStyle = {
    marginLeft: '16px',
    fontSize: '18px',
    fontWeight: 'bold',
    color: isHovered ? '#1F2937' : '#4B5563',
    textTransform: 'capitalize',
    transition: 'color 0.3s ease',
  };

  const handleButtonClick = () => {
    navigate(path);
  };

  return (
    <button
      onClick={handleButtonClick}
      style={buttonStyle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <section
        style={iconContainerStyle}
      >
        <Icon style={iconStyle} />
      </section>
      <span style={labelStyle}>{label}</span>
    </button>
  );
};

export default DashboardButton;
