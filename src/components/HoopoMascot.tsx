import React from 'react';

export type HoopoMood = 'normal' | 'alert_speed' | 'alert_rain' | 'alert_prayer' | 'greeting' | 'happy';

interface HoopoMascotProps {
  mood?: HoopoMood;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  isFlapping?: boolean;
}

/**
 * Hoopoe AI - Futuristic In-Cabin Autonomous AI Companion Core
 * Sleek, simple, and ultra-futuristic holographic nexus with concentric orbital rings,
 * audio-reactive waveform iris, and state-based HUD telemetry illumination.
 */
export const HoopoMascot: React.FC<HoopoMascotProps> = ({
  mood = 'normal',
  size = 'md',
  className = '',
  isFlapping = false,
}) => {
  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-20 h-20',
    lg: 'w-28 h-28',
    xl: 'w-36 h-36',
  }[size];

  // Futuristic Holographic Theme Configuration
  const theme = {
    normal: {
      primary: '#06b6d4',      // Electric Cyan
      secondary: '#3b82f6',    // Cyber Blue
      accent: '#22d3ee',       // Bright Neon Cyan
      glow: 'rgba(6, 182, 212, 0.45)',
      dropGlow: 'drop-shadow(0 0 14px rgba(6, 182, 212, 0.6)) drop-shadow(0 0 24px rgba(59, 130, 246, 0.35))',
    },
    alert_speed: {
      primary: '#ef4444',      // Tactical Crimson
      secondary: '#dc2626',
      accent: '#f87171',
      glow: 'rgba(239, 68, 68, 0.65)',
      dropGlow: 'drop-shadow(0 0 16px rgba(239, 68, 68, 0.9)) drop-shadow(0 0 28px rgba(185, 28, 28, 0.6))',
    },
    alert_rain: {
      primary: '#38bdf8',      // Sky Radar Blue
      secondary: '#0284c7',
      accent: '#7dd3fc',
      glow: 'rgba(56, 189, 248, 0.55)',
      dropGlow: 'drop-shadow(0 0 14px rgba(56, 189, 248, 0.75)) drop-shadow(0 0 22px rgba(2, 132, 199, 0.4))',
    },
    alert_prayer: {
      primary: '#10b981',      // Sacred Emerald
      secondary: '#059669',
      accent: '#34d399',
      glow: 'rgba(16, 185, 129, 0.55)',
      dropGlow: 'drop-shadow(0 0 16px rgba(16, 185, 129, 0.8)) drop-shadow(0 0 24px rgba(5, 150, 105, 0.4))',
    },
    greeting: {
      primary: '#f59e0b',      // Solar Amber
      secondary: '#d97706',
      accent: '#fbbf24',
      glow: 'rgba(245, 158, 11, 0.55)',
      dropGlow: 'drop-shadow(0 0 14px rgba(245, 158, 11, 0.8)) drop-shadow(0 0 22px rgba(217, 119, 6, 0.4))',
    },
    happy: {
      primary: '#10b981',
      secondary: '#14b8a6',
      accent: '#2dd4bf',
      glow: 'rgba(16, 185, 129, 0.55)',
      dropGlow: 'drop-shadow(0 0 14px rgba(16, 185, 129, 0.8))',
    },
  }[mood];

  const isActive = isFlapping || mood === 'alert_speed' || mood === 'greeting';

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none ${sizeClasses} ${className}`}
      style={{ filter: theme.dropGlow }}
      aria-label="Hoopoe AI Futuristic Companion Nexus"
      role="img"
    >
      <svg
        viewBox="0 0 140 140"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        <defs>
          {/* Radial Gradient for Inner Pulsing AI Orb */}
          <radialGradient id="aiCoreGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="35%" stopColor={theme.accent} stopOpacity="0.85" />
            <stop offset="70%" stopColor={theme.primary} stopOpacity="0.45" />
            <stop offset="100%" stopColor={theme.secondary} stopOpacity="0.05" />
          </radialGradient>

          {/* Ambient Glow Gradient */}
          <radialGradient id="ambientAura" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={theme.primary} stopOpacity={isActive ? '0.5' : '0.25'} />
            <stop offset="100%" stopColor={theme.primary} stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* 1. Ambient Background Halo */}
        <circle cx="70" cy="70" r="62" fill="url(#ambientAura)" />

        {/* 2. Outer HUD Precision Reticle Brackets (Clockwise slow spin) */}
        <g
          className="transition-transform duration-700"
          style={{
            transformOrigin: '70px 70px',
            animation: isActive ? 'spin 5s linear infinite' : 'spin 18s linear infinite',
          }}
        >
          {/* 4 Corner Arc Reticles */}
          <circle
            cx="70"
            cy="70"
            r="56"
            stroke={theme.primary}
            strokeWidth="1.5"
            strokeDasharray="16 28"
            strokeOpacity="0.7"
            strokeLinecap="round"
          />
          {/* Precision Sensor Nodes on Orbit */}
          <circle cx="70" cy="14" r="2.2" fill={theme.accent} />
          <circle cx="126" cy="70" r="2.2" fill={theme.accent} />
          <circle cx="70" cy="126" r="2.2" fill={theme.accent} />
          <circle cx="14" cy="70" r="2.2" fill={theme.accent} />
        </g>

        {/* 3. Middle Counter-Rotating Telemetry Ring (Counter-Clockwise) */}
        <g
          style={{
            transformOrigin: '70px 70px',
            animation: isActive ? 'spin 4s linear infinite reverse' : 'spin 14s linear infinite reverse',
          }}
        >
          <circle
            cx="70"
            cy="70"
            r="44"
            stroke={theme.secondary}
            strokeWidth="1.2"
            strokeDasharray="4 8"
            strokeOpacity="0.55"
          />
          <circle cx="95" cy="45" r="1.8" fill="#ffffff" />
          <circle cx="45" cy="95" r="1.8" fill="#ffffff" />
        </g>

        {/* 4. Dynamic Audio / AI Pulse Waves (Expands when talking or active) */}
        {isActive && (
          <circle
            cx="70"
            cy="70"
            r="38"
            stroke={theme.accent}
            strokeWidth="1.8"
            strokeOpacity="0.8"
            fill="none"
            className="animate-ping"
            style={{ transformOrigin: '70px 70px', animationDuration: '1.4s' }}
          />
        )}

        {/* 5. Inner Concentric Geometric Brackets (Breathing scale) */}
        <g
          className="transition-transform duration-300"
          style={{
            transformOrigin: '70px 70px',
            animation: isActive ? 'pulse 1.1s ease-in-out infinite' : 'pulse 2.8s ease-in-out infinite',
          }}
        >
          <circle
            cx="70"
            cy="70"
            r="32"
            stroke={theme.primary}
            strokeWidth="2"
            strokeDasharray="24 10"
            strokeOpacity="0.85"
            strokeLinecap="round"
          />
        </g>

        {/* 6. Central Holographic Core Orb */}
        <circle
          cx="70"
          cy="70"
          r={isActive ? '25' : '22'}
          fill="url(#aiCoreGradient)"
          className="transition-all duration-300"
        />

        {/* 7. Central AI Neural Eye / Waveform Iris */}
        <g style={{ transformOrigin: '70px 70px' }}>
          {/* Inner Core Bright Dot */}
          <circle cx="70" cy="70" r={isActive ? '8' : '6'} fill="#ffffff" />

          {/* Futuristic Audio Waveform Bars (Vertical Equilateral Nodes) */}
          <rect
            x="58"
            y={isActive ? '64' : '66'}
            width="2.5"
            height={isActive ? '12' : '8'}
            rx="1.2"
            fill={theme.primary}
          />
          <rect
            x="64"
            y={isActive ? '60' : '63'}
            width="2.5"
            height={isActive ? '20' : '14'}
            rx="1.2"
            fill="#ffffff"
          />
          <rect
            x="70"
            y={isActive ? '58' : '61'}
            width="2.5"
            height={isActive ? '24' : '18'}
            rx="1.2"
            fill={theme.accent}
          />
          <rect
            x="76"
            y={isActive ? '60' : '63'}
            width="2.5"
            height={isActive ? '20' : '14'}
            rx="1.2"
            fill="#ffffff"
          />
          <rect
            x="82"
            y={isActive ? '64' : '66'}
            width="2.5"
            height={isActive ? '12' : '8'}
            rx="1.2"
            fill={theme.primary}
          />
        </g>
      </svg>
    </div>
  );
};
