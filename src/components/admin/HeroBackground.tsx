import { useEffect, useState } from 'react';

const HeroBackground = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Main radiant background */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-400/20 via-green-500/10 to-green-600/20" />
      
      {/* Animated light rays */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-full bg-gradient-to-b from-green-300/30 via-transparent to-transparent transform -skew-x-12 animate-pulse" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-full bg-gradient-to-b from-green-300/20 via-transparent to-transparent transform skew-x-12 animate-pulse delay-1000" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-full bg-gradient-to-b from-yellow-300/20 via-transparent to-transparent transform -skew-x-6 animate-pulse delay-500" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-full bg-gradient-to-b from-yellow-300/15 via-transparent to-transparent transform skew-x-6 animate-pulse delay-1500" />
      </div>
      
      {/* Floating sparkles */}
      <div className="absolute inset-0">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full opacity-60 animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default HeroBackground;