export default function CandleStickLogo({ size = 40 }: { size?: number }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Flame */}
      <path 
        d="M50 10 C45 15, 40 20, 40 28 C40 35, 45 40, 50 40 C55 40, 60 35, 60 28 C60 20, 55 15, 50 10 Z" 
        fill="url(#flameGradient)"
      />
      
      {/* Candle body */}
      <rect 
        x="35" 
        y="35" 
        width="30" 
        height="45" 
        rx="3" 
        fill="url(#candleGradient)"
        stroke="#00d4ff"
        strokeWidth="2"
      />
      
      {/* Eyes */}
      <circle cx="42" cy="52" r="3" fill="#00d4ff">
        <animate 
          attributeName="r" 
          values="3;2.5;3" 
          dur="3s" 
          repeatCount="indefinite"
        />
      </circle>
      <circle cx="58" cy="52" r="3" fill="#00d4ff">
        <animate 
          attributeName="r" 
          values="3;2.5;3" 
          dur="3s" 
          repeatCount="indefinite"
        />
      </circle>
      
      {/* Smile */}
      <path 
        d="M 42 62 Q 50 68, 58 62" 
        stroke="#00d4ff" 
        strokeWidth="2" 
        fill="none"
        strokeLinecap="round"
      />
      
      {/* Tech lines */}
      <line x1="35" y1="45" x2="30" y2="45" stroke="#00d4ff" strokeWidth="1" opacity="0.6" />
      <line x1="65" y1="50" x2="70" y2="50" stroke="#00d4ff" strokeWidth="1" opacity="0.6" />
      <line x1="35" y1="70" x2="30" y2="70" stroke="#00d4ff" strokeWidth="1" opacity="0.6" />
      
      {/* Base */}
      <ellipse 
        cx="50" 
        cy="85" 
        rx="20" 
        ry="5" 
        fill="url(#baseGradient)"
        stroke="#00d4ff"
        strokeWidth="1"
      />
      
      {/* Gradients */}
      <defs>
        <linearGradient id="flameGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ff6b00" />
          <stop offset="50%" stopColor="#ff0080" />
          <stop offset="100%" stopColor="#8000ff" />
        </linearGradient>
        
        <linearGradient id="candleGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#1a1a2e" />
          <stop offset="100%" stopColor="#0f0f1e" />
        </linearGradient>
        
        <linearGradient id="baseGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#2a2a3e" />
          <stop offset="100%" stopColor="#1a1a2e" />
        </linearGradient>
      </defs>
    </svg>
  );
}
