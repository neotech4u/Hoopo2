import React from 'react';

export type HoopoMood = 'normal' | 'alert_speed' | 'alert_rain' | 'alert_prayer' | 'greeting' | 'happy';

interface HoopoMascotProps {
  mood?: HoopoMood;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  isFlapping?: boolean;
}

/**
 * Hoopo Autonomous Drone Mascot - Redesigned as Redwing from Marvel Avengers
 * (Falcon/Sam Wilson's sleek crimson & titanium combat reconnaissance drone).
 * Features variable-geometry swept delta wings, glowing tactical HUD scanner eye,
 * dual underslung ion thrusters, and responsive state-based combat telemetry.
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
    xl: 'w-40 h-40',
  }[size];

  // Tactical drone glow aura based on state
  const auraGlow = {
    normal: 'drop-shadow(0 0 10px rgba(220, 38, 38, 0.45)) drop-shadow(0 0 6px rgba(6, 182, 212, 0.4))',
    alert_speed: 'drop-shadow(0 0 18px rgba(239, 68, 68, 0.95)) drop-shadow(0 0 26px rgba(185, 28, 28, 0.6))',
    alert_rain: 'drop-shadow(0 0 14px rgba(56, 189, 248, 0.9)) drop-shadow(0 0 20px rgba(14, 165, 233, 0.5))',
    alert_prayer: 'drop-shadow(0 0 16px rgba(16, 185, 129, 0.9)) drop-shadow(0 0 22px rgba(5, 150, 105, 0.5))',
    greeting: 'drop-shadow(0 0 14px rgba(245, 158, 11, 0.85)) drop-shadow(0 0 20px rgba(239, 68, 68, 0.5))',
    happy: 'drop-shadow(0 0 14px rgba(16, 185, 129, 0.8))',
  }[mood];

  // Tactical optic scanner HUD color
  const scannerColor = {
    normal: '#06b6d4', // Stark cyan tracking optic
    alert_speed: '#ef4444', // Red alert combat mode
    alert_rain: '#38bdf8', // Atmospheric radar blue
    alert_prayer: '#10b981', // Sacred emerald beacon
    greeting: '#f59e0b', // Warm amber telemetry
    happy: '#10b981',
  }[mood];

  // Thruster flame plasma color
  const thrusterColor = mood === 'alert_speed' ? '#ef4444' : '#06b6d4';

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none transition-all duration-300 ${sizeClasses} ${className}`}
      style={{ filter: auraGlow }}
      aria-label="Redwing Autonomous Avionics Drone Mascot"
      role="img"
    >
      {/* Redwing Drone SVG */}
      <svg
        viewBox="0 0 180 180"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`w-full h-full transition-transform duration-500 ${
          isFlapping || mood === 'alert_speed'
            ? 'animate-bounce'
            : 'animate-[pulse_2.8s_ease-in-out_infinite]'
        }`}
      >
        <defs>
          {/* Avengers Redwing Crimson Red Plating Gradient */}
          <linearGradient id="redwingCrimson" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f87171" />
            <stop offset="25%" stopColor="#ef4444" />
            <stop offset="60%" stopColor="#dc2626" />
            <stop offset="90%" stopColor="#991b1b" />
            <stop offset="100%" stopColor="#7f1d1d" />
          </linearGradient>

          {/* Secondary Crimson Shadow Gradient */}
          <linearGradient id="redwingCrimsonDark" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#dc2626" />
            <stop offset="70%" stopColor="#991b1b" />
            <stop offset="100%" stopColor="#450a0a" />
          </linearGradient>

          {/* Titanium Silver Wing Blade Edge Gradient */}
          <linearGradient id="redwingTitaniumBlade" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="30%" stopColor="#e2e8f0" />
            <stop offset="70%" stopColor="#94a3b8" />
            <stop offset="100%" stopColor="#475569" />
          </linearGradient>

          {/* Stealth Carbon Gunmetal Chassis Gradient */}
          <linearGradient id="redwingCarbon" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#334155" />
            <stop offset="50%" stopColor="#1e293b" />
            <stop offset="85%" stopColor="#0f172a" />
            <stop offset="100%" stopColor="#020617" />
          </linearGradient>

          {/* High-Tech Optic Scanner Glow */}
          <radialGradient id="scannerCoreGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
            <stop offset="45%" stopColor={scannerColor} stopOpacity="0.9" />
            <stop offset="85%" stopColor={scannerColor} stopOpacity="0.3" />
            <stop offset="100%" stopColor={scannerColor} stopOpacity="0" />
          </radialGradient>

          {/* Ion Repulsor Thruster Plume */}
          <radialGradient id="ionRepulsorGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
            <stop offset="35%" stopColor={thrusterColor} stopOpacity="0.85" />
            <stop offset="75%" stopColor={thrusterColor} stopOpacity="0.3" />
            <stop offset="100%" stopColor={thrusterColor} stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* 1. Underslung Ion Micro-Thruster Exhaust Plumes */}
        <g className="origin-[90px_130px]">
          {/* Left Thruster Jet */}
          <ellipse cx="68" cy="144" rx="8" ry="14" fill="url(#ionRepulsorGlow)" className="animate-pulse" />
          <line x1="68" y1="138" x2="68" y2="156" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
          
          {/* Right Thruster Jet */}
          <ellipse cx="112" cy="144" rx="8" ry="14" fill="url(#ionRepulsorGlow)" className="animate-pulse" />
          <line x1="112" y1="138" x2="112" y2="156" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
        </g>

        {/* 2. Redwing Variable-Geometry Swept Delta Wings (Left Wing) */}
        <g
          className="origin-[75px_85px] transition-transform duration-300"
          transform={isFlapping ? 'rotate(-9 75 85)' : 'rotate(0)'}
        >
          {/* Primary Swept Titanium Blade Feather */}
          <path
            d="M 75 75 L 22 28 C 16 38 28 64 48 86 L 68 95 Z"
            fill="url(#redwingTitaniumBlade)"
            stroke="#64748b"
            strokeWidth="1.2"
          />

          {/* Secondary Forward Crimson Armor Cowling */}
          <path
            d="M 72 70 L 16 32 C 14 36 18 48 28 58 L 74 88 Z"
            fill="url(#redwingCrimson)"
            stroke="#991b1b"
            strokeWidth="1.2"
          />

          {/* Tertiary Lower Kinetic Flap */}
          <path
            d="M 72 92 L 40 84 C 36 94 48 106 60 110 L 74 98 Z"
            fill="url(#redwingCrimsonDark)"
            stroke="#475569"
            strokeWidth="1"
          />

          {/* Wing Armor Panel Seams & Rivets */}
          <line x1="60" y1="65" x2="35" y2="48" stroke="#fecaca" strokeWidth="1" opacity="0.7" />
          <circle cx="28" cy="42" r="1.5" fill={scannerColor} opacity="0.9" />
          <circle cx="17" cy="34" r="1.8" fill="#ffffff" />
        </g>

        {/* 3. Redwing Variable-Geometry Swept Delta Wings (Right Wing) */}
        <g
          className="origin-[105px_85px] transition-transform duration-300"
          transform={isFlapping ? 'rotate(9 105 85)' : 'rotate(0)'}
        >
          {/* Primary Swept Titanium Blade Feather */}
          <path
            d="M 105 75 L 158 28 C 164 38 152 64 132 86 L 112 95 Z"
            fill="url(#redwingTitaniumBlade)"
            stroke="#64748b"
            strokeWidth="1.2"
          />

          {/* Secondary Forward Crimson Armor Cowling */}
          <path
            d="M 108 70 L 164 32 C 166 36 162 48 152 58 L 106 88 Z"
            fill="url(#redwingCrimson)"
            stroke="#991b1b"
            strokeWidth="1.2"
          />

          {/* Tertiary Lower Kinetic Flap */}
          <path
            d="M 108 92 L 140 84 C 144 94 132 106 120 110 L 106 98 Z"
            fill="url(#redwingCrimsonDark)"
            stroke="#475569"
            strokeWidth="1"
          />

          {/* Wing Armor Panel Seams & Rivets */}
          <line x1="120" y1="65" x2="145" y2="48" stroke="#fecaca" strokeWidth="1" opacity="0.7" />
          <circle cx="152" cy="42" r="1.5" fill={scannerColor} opacity="0.9" />
          <circle cx="163" cy="34" r="1.8" fill="#ffffff" />
        </g>

        {/* 4. Aerodynamic Tail & Anti-Torque Fin Assembly */}
        <g>
          {/* Central Stealth Fin */}
          <polygon
            points="90,105 82,142 90,150 98,142"
            fill="url(#redwingCarbon)"
            stroke="#475569"
            strokeWidth="1.5"
          />
          {/* Left Carbon Stabilizer */}
          <polygon
            points="82,118 64,136 78,136"
            fill="url(#redwingCrimsonDark)"
            stroke="#334155"
            strokeWidth="1"
          />
          {/* Right Carbon Stabilizer */}
          <polygon
            points="98,118 116,136 102,136"
            fill="url(#redwingCrimsonDark)"
            stroke="#334155"
            strokeWidth="1"
          />
          {/* Tail Keel Heat Dissipation Vents */}
          <line x1="86" y1="130" x2="94" y2="130" stroke="#64748b" strokeWidth="1" />
          <line x1="88" y1="136" x2="92" y2="136" stroke="#64748b" strokeWidth="1" />
        </g>

        {/* 5. Underslung Thruster Pod Casings */}
        <g>
          {/* Left Thruster Nozzle */}
          <rect x="63" y="132" width="10" height="7" rx="3" fill="#0f172a" stroke="#475569" strokeWidth="1" />
          <line x1="64" y1="135" x2="72" y2="135" stroke={scannerColor} strokeWidth="1" />
          {/* Right Thruster Nozzle */}
          <rect x="107" y="132" width="10" height="7" rx="3" fill="#0f172a" stroke="#475569" strokeWidth="1" />
          <line x1="108" y1="135" x2="116" y2="135" stroke={scannerColor} strokeWidth="1" />
        </g>

        {/* 6. Redwing Central Combat Fuselage & Stealth Cockpit */}
        <g>
          {/* Main Diamond Armor Shell */}
          <path
            d="M 90 44 L 112 68 L 108 106 L 90 122 L 72 106 L 68 68 Z"
            fill="url(#redwingCrimson)"
            stroke="#7f1d1d"
            strokeWidth="1.5"
          />

          {/* Carbon Fiber Inlay Spine */}
          <path
            d="M 90 48 L 102 68 L 98 100 L 90 110 L 82 100 L 78 68 Z"
            fill="url(#redwingCarbon)"
            stroke="#334155"
            strokeWidth="1"
          />

          {/* Forward Recon Probe / Titanium Stinger Beak */}
          <polygon
            points="90,32 94,48 86,48"
            fill="url(#redwingTitaniumBlade)"
            stroke="#475569"
            strokeWidth="1"
          />
          <line x1="90" y1="33" x2="90" y2="46" stroke="#ffffff" strokeWidth="1" />

          {/* EXO-7 Military Technical Marking */}
          <text
            x="90"
            y="96"
            textAnchor="middle"
            fill="#cbd5e1"
            fontSize="6"
            fontWeight="bold"
            letterSpacing="0.8"
            fontFamily="monospace"
            opacity="0.8"
          >
            EXO-7
          </text>
        </g>

        {/* 7. Redwing Cyclopean Optical HUD Scanner Pod (Eye) */}
        <g>
          {/* Optical Pod Housing */}
          <rect
            x="76"
            y="58"
            width="28"
            height="16"
            rx="8"
            fill="#090d16"
            stroke="#475569"
            strokeWidth="1.5"
          />

          {/* Scanner Lens Recess */}
          <rect
            x="79"
            y="61"
            width="22"
            height="10"
            rx="5"
            fill={scannerColor}
            opacity="0.3"
          />

          {/* Glowing Optical Core */}
          <circle cx="90" cy="66" r="6" fill="url(#scannerCoreGlow)" />
          <circle cx="90" cy="66" r="2.5" fill="#ffffff" />

          {/* Tactical Targeting Crosshairs Brackets [ + ] */}
          <line x1="84" y1="66" x2="87" y2="66" stroke="#ffffff" strokeWidth="1" opacity="0.9" />
          <line x1="93" y1="66" x2="96" y2="66" stroke="#ffffff" strokeWidth="1" opacity="0.9" />
          <line x1="90" y1="62" x2="90" y2="64" stroke="#ffffff" strokeWidth="1" opacity="0.9" />
          <line x1="90" y1="68" x2="90" y2="70" stroke="#ffffff" strokeWidth="1" opacity="0.9" />

          {/* Optical Laser Sweeper Line */}
          <line
            x1="81"
            y1="66"
            x2="99"
            y2="66"
            stroke={scannerColor}
            strokeWidth="1"
            strokeDasharray="2, 2"
            opacity="0.8"
          />

          {/* Micro Telemetry Indicator Lights */}
          <circle cx="81" cy="61" r="1" fill={scannerColor} />
          <circle cx="99" cy="61" r="1" fill={scannerColor} />
        </g>

        {/* 8. Tactical Alert Overlays */}
        {mood === 'alert_speed' && (
          <g transform="translate(114, 46)" className="animate-bounce">
            <polygon points="0,0 16,0 8,-14" fill="#ef4444" stroke="#ffffff" strokeWidth="1.2" />
            <text x="8" y="-3" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="bold">!</text>
          </g>
        )}

        {mood === 'alert_rain' && (
          <g transform="translate(114, 46)" className="animate-pulse">
            <circle cx="7" cy="-7" r="7" fill="#0284c7" stroke="#38bdf8" strokeWidth="1.2" />
            <path d="M 7 -12 L 4 -7 L 10 -7 Z" fill="#ffffff" />
          </g>
        )}

        {mood === 'alert_prayer' && (
          <g transform="translate(114, 46)">
            <circle cx="7" cy="-7" r="7" fill="#059669" stroke="#34d399" strokeWidth="1.2" />
            {/* Crescent moon */}
            <circle cx="7.8" cy="-7.5" r="4.2" fill="#ffffff" />
            <circle cx="9.2" cy="-8" r="3.6" fill="#059669" />
          </g>
        )}
      </svg>
    </div>
  );
};
