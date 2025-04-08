import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';

interface Bubble {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  speedX: number;
  speedY: number;
  opacity: number;
}

export default function BubblesButton() {
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);

  const colors = [
    '#FF5733', '#33FF57', '#3357FF', '#FF33A8', 
    '#33FFF5', '#F5FF33', '#FF8333', '#7B33FF'
  ];

  const createRandomBubble = (x: number, y: number): Bubble => {
    return {
      id: Math.random(),
      x,
      y,
      size: Math.random() * 40 + 10,
      color: colors[Math.floor(Math.random() * colors.length)],
      speedX: (Math.random() - 0.5) * 4,
      speedY: -Math.random() * 4 - 2, // Always moving upward
      opacity: 1,
    };
  };

  const createBubbles = (count: number, x: number, y: number) => {
    const newBubbles: Bubble[] = [];
    for (let i = 0; i < count; i++) {
      newBubbles.push(createRandomBubble(x, y));
    }
    setBubbles(prevBubbles => [...prevBubbles, ...newBubbles]);
  };

  const animateBubbles = (time: number) => {
    if (!lastTimeRef.current) {
      lastTimeRef.current = time;
    }
    
    const deltaTime = time - lastTimeRef.current;
    lastTimeRef.current = time;

    setBubbles(prevBubbles => 
      prevBubbles
        .map(bubble => ({
          ...bubble,
          x: bubble.x + bubble.speedX,
          y: bubble.y + bubble.speedY,
          opacity: bubble.opacity - 0.005, // Gradually fade out
        }))
        .filter(bubble => bubble.opacity > 0) // Remove fully transparent bubbles
    );

    if (isPlaying) {
      requestRef.current = requestAnimationFrame(animateBubbles);
    }
  };

  const toggleBubbles = () => {
    setIsPlaying(prev => !prev);
  };

  useEffect(() => {
    if (isPlaying) {
      lastTimeRef.current = 0;
      requestRef.current = requestAnimationFrame(animateBubbles);
      
      // Create new bubbles periodically
      const interval = setInterval(() => {
        if (containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          const x = Math.random() * rect.width;
          const y = rect.height;
          createBubbles(5, x, y);
        }
      }, 500);
      
      return () => {
        if (requestRef.current) {
          cancelAnimationFrame(requestRef.current);
        }
        clearInterval(interval);
      };
    }
  }, [isPlaying]);

  return (
    <div className="relative">
      <Button 
        onClick={toggleBubbles} 
        className={`relative z-10 ${isPlaying ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}`}
      >
        <Sparkles className="h-4 w-4 mr-2" />
        {isPlaying ? 'Stop Bubbles' : 'Start Bubbles'} 
      </Button>
      
      <div 
        ref={containerRef} 
        className="fixed inset-0 pointer-events-none z-0" 
        style={{ overflow: 'hidden' }}
      >
        {bubbles.map(bubble => (
          <div 
            key={bubble.id}
            className="absolute rounded-full"
            style={{
              left: `${bubble.x}px`,
              top: `${bubble.y}px`,
              width: `${bubble.size}px`,
              height: `${bubble.size}px`,
              backgroundColor: bubble.color,
              opacity: bubble.opacity,
              transition: 'opacity 0.3s ease-out',
            }}
          />
        ))}
      </div>
    </div>
  );
}