import React from 'react';

const SmartSplitterLogo = ({ size = 40, className = "" }) => {
  return (
    <div className={`smart-splitter-logo ${className}`} style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Background Circle with Glow */}
        <circle
          cx="50"
          cy="50"
          r="48"
          fill="url(#mainGradient)"
          stroke="url(#borderGradient)"
          strokeWidth="2"
        />
        
        {/* Brain/Smart Element */}
        <path
          d="M35 25 C30 25, 25 30, 25 35 C25 40, 30 45, 35 45 L40 45 C42 45, 44 43, 44 41 L44 35 C44 30, 40 25, 35 25 Z"
          fill="#FFD700"
          opacity="0.9"
        />
        <path
          d="M65 25 C70 25, 75 30, 75 35 C75 40, 70 45, 65 45 L60 45 C58 45, 56 43, 56 41 L56 35 C56 30, 60 25, 65 25 Z"
          fill="#FFD700"
          opacity="0.9"
        />
        
        {/* Neural Network Lines */}
        <path
          d="M35 35 L50 35 M50 35 L65 35 M40 30 L50 35 L60 30 M40 40 L50 35 L60 40"
          stroke="#FFD700"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.8"
        />
        
        {/* Central Split Symbol */}
        <circle cx="50" cy="50" r="12" fill="url(#centerGradient)" />
        <path
          d="M42 50 L58 50 M54 46 L58 50 L54 54"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Money Bills - Split Design */}
        <rect
          x="15"
          y="65"
          width="20"
          height="12"
          rx="2"
          fill="#25d366"
          opacity="0.9"
          transform="rotate(-10 25 71)"
        />
        <rect
          x="65"
          y="65"
          width="20"
          height="12"
          rx="2"
          fill="#25d366"
          opacity="0.9"
          transform="rotate(10 75 71)"
        />
        
        {/* Dollar Signs */}
        <text
          x="25"
          y="74"
          fill="white"
          fontSize="8"
          fontWeight="bold"
          textAnchor="middle"
          transform="rotate(-10 25 74)"
        >
          $
        </text>
        <text
          x="75"
          y="74"
          fill="white"
          fontSize="8"
          fontWeight="bold"
          textAnchor="middle"
          transform="rotate(10 75 74)"
        >
          $
        </text>
        
        {/* Smart Dots/Particles */}
        <circle cx="20" cy="20" r="2" fill="#FFD700" opacity="0.7">
          <animate attributeName="opacity" values="0.7;1;0.7" dur="2s" repeatCount="indefinite" />
        </circle>
        <circle cx="80" cy="20" r="2" fill="#FFD700" opacity="0.7">
          <animate attributeName="opacity" values="1;0.7;1" dur="2s" repeatCount="indefinite" />
        </circle>
        <circle cx="20" cy="80" r="2" fill="#25d366" opacity="0.7">
          <animate attributeName="opacity" values="0.7;1;0.7" dur="1.5s" repeatCount="indefinite" />
        </circle>
        <circle cx="80" cy="80" r="2" fill="#25d366" opacity="0.7">
          <animate attributeName="opacity" values="1;0.7;1" dur="1.5s" repeatCount="indefinite" />
        </circle>
        
        {/* Gradients */}
        <defs>
          <linearGradient id="mainGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#667eea" />
            <stop offset="50%" stopColor="#764ba2" />
            <stop offset="100%" stopColor="#667eea" />
          </linearGradient>
          <linearGradient id="borderGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFD700" />
            <stop offset="50%" stopColor="#25d366" />
            <stop offset="100%" stopColor="#FFD700" />
          </linearGradient>
          <radialGradient id="centerGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFD700" />
            <stop offset="100%" stopColor="#FFA500" />
          </radialGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/> 
            </feMerge>
          </filter>
        </defs>
      </svg>
    </div>
  );
};

export default SmartSplitterLogo;