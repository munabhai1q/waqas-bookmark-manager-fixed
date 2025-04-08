import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Play, Pause, Settings, X } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  speedX: number;
  speedY: number;
  opacity: number;
  rotation: number;
  rotationSpeed: number;
}

type EffectType = 'bubbles' | 'chocolates' | 'raindrops' | 'leaves' | 'snowflakes' | 'spray' | 'stars';

const effectColors: Record<EffectType, string[]> = {
  bubbles: ['#8ecae6', '#219ebc', '#023047', '#ffb703', '#fb8500'],
  chocolates: ['#7b3f00', '#5d3200', '#3c2100', '#2d1700', '#1a0d00'],
  raindrops: ['#a7c5eb', '#c9d8e7', '#8ab6f9', '#6da5e3', '#5390d9'],
  leaves: ['#a3b18a', '#588157', '#3a5a40', '#344e41', '#dad7cd'],
  snowflakes: ['#f8f9fa', '#e9ecef', '#dee2e6', '#ced4da', '#adb5bd'],
  spray: ['#ff595e', '#ffca3a', '#8ac926', '#1982c4', '#6a4c93'],
  stars: ['#ffe8df', '#ffcab9', '#ffa88c', '#ff8c69', '#ff7347']
};

const effectShapes: Record<EffectType, string> = {
  bubbles: 'circle',
  chocolates: 'squircle', // rounded square
  raindrops: 'drop',
  leaves: 'leaf',
  snowflakes: 'star',
  spray: 'circle',
  stars: 'star'
};

export default function BackgroundEffects() {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [isPlaying, setIsPlaying] = useState(true);
  const [effectType, setEffectType] = useState<EffectType>('bubbles');
  const [density, setDensity] = useState(50); // 0 to 100
  const [speed, setSpeed] = useState(50); // 0 to 100
  const [size, setSize] = useState(50); // 0 to 100
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);
  
  const getParticleProps = (type: EffectType, baseSize: number): Partial<Particle> => {
    const props: Partial<Particle> = {
      color: effectColors[type][Math.floor(Math.random() * effectColors[type].length)],
      size: baseSize * (Math.random() * 0.5 + 0.75),
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 2
    };
    
    switch(type) {
      case 'bubbles':
        return {
          ...props,
          speedX: (Math.random() - 0.5) * 1.5,
          speedY: -Math.random() * 2 - 1, // Upward movement
          opacity: Math.random() * 0.6 + 0.2
        };
      case 'chocolates':
        return {
          ...props,
          speedX: (Math.random() - 0.5) * 1,
          speedY: Math.random() * 2 + 1, // Downward movement
          opacity: 0.8
        };
      case 'raindrops':
        return {
          ...props,
          speedX: (Math.random() - 0.5) * 0.5,
          speedY: Math.random() * 5 + 5, // Fast downward
          opacity: Math.random() * 0.7 + 0.3,
          size: baseSize * (Math.random() * 0.3 + 0.7) // Thinner
        };
      case 'leaves':
        return {
          ...props,
          speedX: (Math.random() - 0.5) * 2,
          speedY: Math.random() * 1 + 0.5, // Slow falling
          rotationSpeed: (Math.random() - 0.5) * 5, // More rotation
          opacity: 0.9
        };
      case 'snowflakes':
        return {
          ...props,
          speedX: (Math.random() - 0.5) * 1.5,
          speedY: Math.random() * 1 + 0.2, // Very slow falling
          rotationSpeed: (Math.random() - 0.5) * 1,
          opacity: Math.random() * 0.4 + 0.6
        };
      case 'spray':
        return {
          ...props,
          speedX: (Math.random() - 0.5) * 6,
          speedY: (Math.random() - 0.5) * 6, // Random direction
          opacity: Math.random() * 0.5 + 0.5,
          size: baseSize * (Math.random() * 0.6 + 0.4) // Varied sizes
        };
      case 'stars':
        return {
          ...props,
          speedX: (Math.random() - 0.5) * 0.2,
          speedY: (Math.random() - 0.5) * 0.2, // Almost stationary
          opacity: Math.random() * 0.7 + 0.3,
          size: baseSize * (Math.random() * 1.5 + 0.5) // Very varied sizes
        };
      default:
        return props;
    }
  };
  
  const createParticle = (x: number, y: number): Particle => {
    const baseSize = 5 + (size / 10); // 5-15px base size
    
    return {
      id: Math.random(),
      x,
      y,
      ...getParticleProps(effectType, baseSize) as Particle
    };
  };
  
  const createParticles = (count: number) => {
    if (!containerRef.current) return;
    
    const { width, height } = containerRef.current.getBoundingClientRect();
    const newParticles: Particle[] = [];
    
    for (let i = 0; i < count; i++) {
      let x, y;
      
      switch(effectType) {
        case 'bubbles':
          x = Math.random() * width;
          y = height + Math.random() * 100; // Start below
          break;
        case 'raindrops':
        case 'snowflakes':
        case 'leaves':
          x = Math.random() * width;
          y = -Math.random() * 100; // Start above
          break;
        case 'spray':
          x = width / 2;
          y = height / 2; // Start in center
          break;
        case 'stars':
          x = Math.random() * width;
          y = Math.random() * height; // Start anywhere
          break;
        default:
          x = Math.random() * width;
          y = Math.random() * height;
      }
      
      newParticles.push(createParticle(x, y));
    }
    
    setParticles(prev => [...prev, ...newParticles]);
  };
  
  // Initialize particles based on current effect
  useEffect(() => {
    if (containerRef.current) {
      // Clear existing particles
      setParticles([]);
      
      // Calculate new particle count based on density
      const baseCount = 30; // Base count at density 50
      const particleCount = Math.round(baseCount * (density / 50));
      
      // Create initial particles
      createParticles(particleCount);
    }
  }, [effectType, density]);
  
  // Animation loop
  useEffect(() => {
    if (!isPlaying) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      return;
    }
    
    const animate = (time: number) => {
      if (!containerRef.current) return;
      
      if (!lastTimeRef.current) {
        lastTimeRef.current = time;
      }
      
      const deltaTime = time - lastTimeRef.current;
      lastTimeRef.current = time;
      
      const { width, height } = containerRef.current.getBoundingClientRect();
      
      // Calculate speed factor
      const speedFactor = speed / 50; // 1.0 at default speed
      
      // Update particle positions
      setParticles(prevParticles => {
        return prevParticles
          .map(particle => {
            // Apply speed factor to movement
            const newX = particle.x + particle.speedX * deltaTime * 0.05 * speedFactor;
            const newY = particle.y + particle.speedY * deltaTime * 0.05 * speedFactor;
            const newOpacity = effectType === 'bubbles' ? 
              particle.opacity - 0.0005 * speedFactor : particle.opacity;
            const newRotation = particle.rotation + particle.rotationSpeed * deltaTime * 0.01 * speedFactor;
            
            // Check if particle is out of bounds
            const isOutOfBounds = 
              (newX < -particle.size * 2 || 
               newX > width + particle.size * 2 ||
               newY < -particle.size * 2 || 
               newY > height + particle.size * 2);
            
            // For effects that shouldn't fade out
            if (effectType !== 'bubbles' && isOutOfBounds) {
              // Reset particle position based on effect type
              let resetX, resetY;
              
              switch(effectType) {
                case 'raindrops':
                case 'snowflakes':
                case 'leaves':
                case 'chocolates':
                  resetX = Math.random() * width;
                  resetY = -particle.size * 2;
                  break;
                case 'spray':
                  resetX = width / 2;
                  resetY = height / 2;
                  break;
                case 'stars':
                  if (Math.random() > 0.98) { // Only occasionally reset stars
                    resetX = Math.random() * width;
                    resetY = Math.random() * height;
                  } else {
                    resetX = newX;
                    resetY = newY;
                  }
                  break;
                default:
                  resetX = Math.random() * width;
                  resetY = Math.random() * height;
              }
              
              return {
                ...particle,
                x: resetX,
                y: resetY,
                ...getParticleProps(effectType, particle.size) as Particle
              };
            }
            
            return {
              ...particle,
              x: newX,
              y: newY,
              opacity: newOpacity,
              rotation: newRotation
            };
          })
          // Remove completely faded bubbles
          .filter(particle => !(effectType === 'bubbles' && particle.opacity <= 0));
      });
      
      // Add new particles occasionally, based on density
      const addFrequency = Math.max(1, 100 - density); // Higher density = more frequent
      if (time % addFrequency < 20 && particles.length < (density * 2)) {
        const addCount = Math.ceil(density / 20); // Add more at higher densities
        createParticles(addCount);
      }
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, effectType, speed, density, particles.length]);
  
  const togglePlayPause = () => {
    setIsPlaying(prev => !prev);
  };
  
  const renderParticleShape = (particle: Particle) => {
    const shape = effectShapes[effectType];
    
    switch (shape) {
      case 'circle':
        return (
          <div 
            className="absolute rounded-full"
            style={{
              left: `${particle.x}px`,
              top: `${particle.y}px`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              backgroundColor: particle.color,
              opacity: particle.opacity,
              transform: `translate(-50%, -50%)`,
            }}
          />
        );
      case 'squircle':
        return (
          <div 
            className="absolute rounded-lg"
            style={{
              left: `${particle.x}px`,
              top: `${particle.y}px`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              backgroundColor: particle.color,
              opacity: particle.opacity,
              transform: `translate(-50%, -50%) rotate(${particle.rotation}deg)`,
            }}
          />
        );
      case 'drop':
        return (
          <div 
            className="absolute"
            style={{
              left: `${particle.x}px`,
              top: `${particle.y}px`,
              width: `${particle.size * 0.6}px`,
              height: `${particle.size}px`,
              backgroundColor: particle.color,
              opacity: particle.opacity,
              borderRadius: '50% 50% 50% 0',
              transform: `translate(-50%, -50%) rotate(45deg)`,
            }}
          />
        );
      case 'leaf':
        return (
          <div 
            className="absolute"
            style={{
              left: `${particle.x}px`,
              top: `${particle.y}px`,
              width: `${particle.size * 0.8}px`,
              height: `${particle.size}px`,
              backgroundColor: 'transparent',
              opacity: particle.opacity,
              backgroundImage: `radial-gradient(ellipse at center, ${particle.color} 0%, transparent 70%)`,
              clipPath: 'polygon(50% 0%, 80% 50%, 50% 100%, 20% 50%)',
              transform: `translate(-50%, -50%) rotate(${particle.rotation}deg)`,
            }}
          />
        );
      case 'star':
        const starSize = particle.size;
        return (
          <div 
            className="absolute"
            style={{
              left: `${particle.x}px`,
              top: `${particle.y}px`,
              width: `${starSize}px`,
              height: `${starSize}px`,
              backgroundColor: 'transparent',
              opacity: particle.opacity,
              transform: `translate(-50%, -50%) rotate(${particle.rotation}deg)`,
            }}
          >
            <div 
              style={{
                width: '100%',
                height: '100%',
                clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
                backgroundColor: particle.color,
              }}
            />
          </div>
        );
      default:
        return (
          <div 
            className="absolute rounded-full"
            style={{
              left: `${particle.x}px`,
              top: `${particle.y}px`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              backgroundColor: particle.color,
              opacity: particle.opacity,
              transform: `translate(-50%, -50%)`,
            }}
          />
        );
    }
  };
  
  return (
    <div className="relative w-full h-full">
      <div 
        ref={containerRef}
        className="absolute inset-0 overflow-hidden pointer-events-none z-0"
      >
        {particles.map(particle => renderParticleShape(particle))}
      </div>
      
      <div className="absolute bottom-4 right-4 z-10 flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          className="bg-white bg-opacity-50 backdrop-blur-sm"
          onClick={togglePlayPause}
        >
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>
        
        <Popover open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
          <PopoverTrigger asChild>
            <Button
              size="sm"
              variant="outline"
              className="bg-white bg-opacity-50 backdrop-blur-sm"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-4" align="end">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Background Effects</h3>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsSettingsOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="space-y-2">
                <Label>Effect Type</Label>
                <Select
                  value={effectType}
                  onValueChange={(value) => setEffectType(value as EffectType)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select effect type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bubbles">Bubbles</SelectItem>
                    <SelectItem value="chocolates">Chocolates</SelectItem>
                    <SelectItem value="raindrops">Raindrops</SelectItem>
                    <SelectItem value="leaves">Leaves</SelectItem>
                    <SelectItem value="snowflakes">Snowflakes</SelectItem>
                    <SelectItem value="spray">Spray Paint</SelectItem>
                    <SelectItem value="stars">Stars</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Density</Label>
                  <span className="text-xs text-gray-500">{density}%</span>
                </div>
                <Slider
                  value={[density]}
                  min={10}
                  max={100}
                  step={5}
                  onValueChange={(values) => setDensity(values[0])}
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Speed</Label>
                  <span className="text-xs text-gray-500">{speed}%</span>
                </div>
                <Slider
                  value={[speed]}
                  min={10}
                  max={100}
                  step={5}
                  onValueChange={(values) => setSpeed(values[0])}
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Size</Label>
                  <span className="text-xs text-gray-500">{size}%</span>
                </div>
                <Slider
                  value={[size]}
                  min={10}
                  max={100}
                  step={5}
                  onValueChange={(values) => setSize(values[0])}
                />
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}