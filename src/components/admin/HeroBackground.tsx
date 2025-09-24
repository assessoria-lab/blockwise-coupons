import { useEffect, useState } from 'react';

const HeroBackground = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Fundo branco puro */}
      <div className="absolute inset-0 bg-white" />
      
      {/* Sutil gradiente de luzes apenas nas bordas */}
      <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-green-50/30 to-transparent" />
      <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-green-50/30 to-transparent" />
    </div>
  );
};

export default HeroBackground;