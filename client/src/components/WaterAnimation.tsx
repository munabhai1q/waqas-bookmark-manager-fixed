import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface WaterParticle {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  opacity: number;
  angle: number;
  speed: number;
}

export default function WaterAnimation() {
  const [particles, setParticles] = useState<WaterParticle[]>([]);
  const [isAnimating, setIsAnimating] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);
  const mousePositionRef = useRef({ x: 0, y: 0 });
  const isMouseDownRef = useRef(false);

  // Water-like blue colors
  const colors = [
    'rgba(0, 119, 190, 0.6)',
    'rgba(0, 150, 199, 0.5)',
    'rgba(0, 180, 216, 0.4)',
    'rgba(72, 202, 228, 0.3)',
    'rgba(144, 224, 239, 0.3)',
  ];

  const createParticle = (x: number, y: number): WaterParticle => {
    return {
      id: Math.random(),
      x,
      y,
      size: Math.random() * 20 + 10,
      color: colors[Math.floor(Math.random() * colors.length)],
      opacity: Math.random() * 0.5 + 0.3,
      angle: Math.random() * Math.PI * 2,
      speed: Math.random() * 0.5 + 0.1,
    };
  };

  const createParticles = (x: number, y: number, count: number) => {
    const newParticles = Array.from({ length: count }, () => createParticle(x, y));
    setParticles(prevParticles => [...prevParticles, ...newParticles]);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || !isMouseDownRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    mousePositionRef.current = { x, y };
    
    if (isMouseDownRef.current) {
      createParticles(x, y, 3);
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    
    isMouseDownRef.current = true;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    mousePositionRef.current = { x, y };
    createParticles(x, y, 10);
  };

  const handleMouseUp = () => {
    isMouseDownRef.current = false;
  };

  const animateParticles = (time: number) => {
    if (!containerRef.current) return;
    
    if (!lastTimeRef.current) {
      lastTimeRef.current = time;
    }
    
    const deltaTime = time - lastTimeRef.current;
    lastTimeRef.current = time;
    
    // Update particle positions based on their angles
    setParticles(prevParticles => 
      prevParticles
        .map(particle => {
          // Calculate new position based on angle and speed
          const newX = particle.x + Math.cos(particle.angle) * particle.speed * deltaTime * 0.05;
          const newY = particle.y + Math.sin(particle.angle) * particle.speed * deltaTime * 0.05;
          
          // Gradually reduce opacity for a fading effect
          const newOpacity = particle.opacity - 0.001;
          
          // Randomly adjust angle for a more organic movement
          const newAngle = particle.angle + (Math.random() - 0.5) * 0.2;
          
          return {
            ...particle,
            x: newX,
            y: newY,
            opacity: newOpacity,
            angle: newAngle,
          };
        })
        // Remove particles that are no longer visible
        .filter(particle => particle.opacity > 0)
    );
    
    if (isAnimating) {
      animationRef.current = requestAnimationFrame(animateParticles);
    }
  };

  const toggleAnimation = () => {
    setIsAnimating(prev => !prev);
  };

  useEffect(() => {
    if (isAnimating) {
      lastTimeRef.current = 0;
      animationRef.current = requestAnimationFrame(animateParticles);
      
      // Add some initial particles
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        const initialParticles = Array.from({ length: 20 }, () => 
          createParticle(
            Math.random() * width, 
            Math.random() * height
          )
        );
        setParticles(initialParticles);
      }
    } else if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isAnimating]);

  return (
    <div className="relative">
      <motion.div 
        ref={containerRef} 
        className="h-64 bg-blue-50 rounded-lg overflow-hidden cursor-pointer relative"
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        whileHover={{ scale: 1.01 }}
        transition={{ type: 'spring', damping: 15 }}
      >
        <div className="absolute inset-0 pointer-events-none">
          {particles.map(particle => (
            <motion.div 
              key={particle.id}
              className="absolute rounded-full"
              style={{
                left: `${particle.x}px`,
                top: `${particle.y}px`,
                width: `${particle.size}px`,
                height: `${particle.size}px`,
                backgroundColor: particle.color,
                opacity: particle.opacity,
              }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.2 }}
            />
          ))}
        </div>
        
        <div className="absolute inset-0 flex items-center justify-center text-blue-800 pointer-events-none">
          <p className="font-medium text-lg">Click and drag to create water ripples</p>
        </div>
      </motion.div>
      
      <div className="mt-2 flex justify-end">
        <button 
          onClick={toggleAnimation}
          className={`px-3 py-1 rounded text-sm ${
            isAnimating 
              ? 'bg-red-500 hover:bg-red-600 text-white' 
              : 'bg-blue-500 hover:bg-blue-600 text-white'
          }`}
        >
          {isAnimating ? 'Pause Animation' : 'Resume Animation'}
        </button>
      </div>
    </div>
  );
}