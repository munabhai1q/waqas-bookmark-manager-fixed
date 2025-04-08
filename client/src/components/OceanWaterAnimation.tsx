import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface OceanWave {
  id: number;
  x: number;
  y: number;
  opacity: number;
  radius: number;
  speed: number;
  height: number;
}

interface DroppedItem {
  id: number;
  type: 'image' | 'video' | 'audio' | 'text';
  content: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export default function OceanWaterAnimation() {
  const [waves, setWaves] = useState<OceanWave[]>([]);
  const [droppedItems, setDroppedItems] = useState<DroppedItem[]>([]);
  const [isAnimating, setIsAnimating] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);
  const isPointerDownRef = useRef(false);
  
  // Generate initial waves
  useEffect(() => {
    if (containerRef.current) {
      const { width, height } = containerRef.current.getBoundingClientRect();
      const initialWaves = Array.from({ length: 15 }, (_, i) => createWave(
        Math.random() * width, 
        height - (Math.random() * 100)
      ));
      setWaves(initialWaves);
    }
    
    // Start animation
    if (isAnimating) {
      animationRef.current = requestAnimationFrame(animateWaves);
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);
  
  const createWave = (x: number, y: number): OceanWave => {
    return {
      id: Math.random(),
      x,
      y,
      opacity: Math.random() * 0.5 + 0.3,
      radius: Math.random() * 50 + 20,
      speed: Math.random() * 2 + 0.5,
      height: Math.random() * 10 + 5,
    };
  };
  
  const animateWaves = (time: number) => {
    if (!containerRef.current) return;
    
    if (!lastTimeRef.current) {
      lastTimeRef.current = time;
    }
    
    const deltaTime = time - lastTimeRef.current;
    lastTimeRef.current = time;
    
    const { width, height } = containerRef.current.getBoundingClientRect();
    
    // Update waves positions
    setWaves(prevWaves => {
      return prevWaves.map(wave => {
        // Move wave back and forth with a sine wave pattern
        const newX = wave.x + Math.sin(time / 1000) * wave.speed;
        let newY = wave.y - (wave.speed * 0.2);
        
        // Reset wave if it goes out of bounds
        if (newY < -wave.radius * 2) {
          newY = height + wave.radius;
          wave.x = Math.random() * width;
        }
        
        return {
          ...wave,
          x: newX,
          y: newY,
        };
      });
    });
    
    // Add new waves occasionally
    if (time % 500 < 20 && waves.length < 30) {
      setWaves(prev => [...prev, createWave(
        Math.random() * width,
        height + 20
      )]);
    }
    
    if (isAnimating) {
      animationRef.current = requestAnimationFrame(animateWaves);
    }
  };
  
  const handlePointerDown = (e: React.PointerEvent) => {
    if (!containerRef.current) return;
    isPointerDownRef.current = true;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Create ripple effect waves
    const newWaves = Array.from({ length: 5 }, () => createWave(x, y));
    setWaves(prev => [...prev, ...newWaves]);
  };
  
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!containerRef.current || !isPointerDownRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Add occasional waves while dragging
    if (Math.random() > 0.7) {
      const newWave = createWave(x, y);
      setWaves(prev => [...prev, newWave]);
    }
  };
  
  const handlePointerUp = () => {
    isPointerDownRef.current = false;
  };
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  };
  
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Check for files (images, videos, etc.)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      const reader = new FileReader();
      
      reader.onload = (event) => {
        const result = event.target?.result as string;
        
        if (file.type.startsWith('image/')) {
          addDroppedItem('image', result, x, y);
        } else if (file.type.startsWith('video/')) {
          addDroppedItem('video', result, x, y);
        } else if (file.type.startsWith('audio/')) {
          addDroppedItem('audio', result, x, y);
        } else {
          // Handle as text
          reader.readAsText(file);
          reader.onload = (e) => {
            const text = e.target?.result as string;
            addDroppedItem('text', text, x, y);
          };
        }
      };
      
      if (file.type.startsWith('image/') || file.type.startsWith('video/') || file.type.startsWith('audio/')) {
        reader.readAsDataURL(file);
      } else {
        reader.readAsText(file);
      }
    } else {
      // Handle text drops (like dragging text from a page)
      const text = e.dataTransfer.getData('text');
      if (text) {
        addDroppedItem('text', text, x, y);
      }
    }
    
    // Create ripple effect at drop point
    const newWaves = Array.from({ length: 10 }, () => createWave(x, y));
    setWaves(prev => [...prev, ...newWaves]);
  };
  
  const addDroppedItem = (type: 'image' | 'video' | 'audio' | 'text', content: string, x: number, y: number) => {
    const newItem: DroppedItem = {
      id: Date.now(),
      type,
      content,
      x,
      y,
      width: type === 'image' ? 200 : type === 'video' ? 320 : type === 'audio' ? 300 : 200,
      height: type === 'image' ? 150 : type === 'video' ? 240 : type === 'audio' ? 50 : 100,
    };
    
    setDroppedItems(prev => [...prev, newItem]);
  };
  
  const removeDroppedItem = (id: number) => {
    setDroppedItems(prev => prev.filter(item => item.id !== id));
  };
  
  return (
    <div className="relative w-full h-full rounded-lg overflow-hidden">
      <div 
        ref={containerRef}
        className="absolute inset-0 bg-gradient-to-b from-blue-400 to-blue-600 cursor-pointer"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {/* Render ocean waves */}
        {waves.map(wave => (
          <motion.div
            key={wave.id}
            className="absolute rounded-full bg-blue-200 mix-blend-screen pointer-events-none"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ 
              scale: 1,
              opacity: wave.opacity,
              x: wave.x,
              y: wave.y,
              height: wave.height,
            }}
            transition={{ duration: 0.8 }}
            style={{
              width: wave.radius * 2,
              height: wave.radius + wave.height,
              borderRadius: '100% 100% 0 0',
              backgroundColor: `rgba(220, 240, 255, ${wave.opacity})`,
              filter: 'blur(4px)',
              transform: `translate(-50%, -50%) scale(${wave.radius / 50})`,
              boxShadow: '0 0 10px rgba(255, 255, 255, 0.3)',
            }}
          />
        ))}
        
        {/* Instructions overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="bg-white bg-opacity-20 backdrop-blur-sm p-4 rounded-lg text-white text-center max-w-md">
            <h3 className="text-xl font-bold mb-2">Interactive Ocean Water</h3>
            <p>Click and drag to create waves. Drag and drop any file here to display it on the water.</p>
          </div>
        </div>
        
        {/* Render dropped items */}
        {droppedItems.map(item => (
          <motion.div
            key={item.id}
            className="absolute bg-white rounded-lg shadow-lg overflow-hidden"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ 
              opacity: 1, 
              scale: 1,
              x: item.x - item.width / 2,
              y: item.y - item.height / 2,
            }}
            drag
            dragMomentum={false}
            style={{
              width: item.width,
              height: item.height,
            }}
          >
            <button 
              className="absolute top-1 right-1 z-10 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center"
              onClick={() => removeDroppedItem(item.id)}
            >
              ×
            </button>
            
            {item.type === 'image' && (
              <img 
                src={item.content} 
                alt="Dropped image" 
                className="w-full h-full object-cover"
              />
            )}
            
            {item.type === 'video' && (
              <video 
                src={item.content} 
                controls 
                className="w-full h-full"
              />
            )}
            
            {item.type === 'audio' && (
              <audio 
                src={item.content} 
                controls 
                className="w-full h-full"
              />
            )}
            
            {item.type === 'text' && (
              <div className="p-3 bg-white text-black overflow-auto h-full">
                <p className="text-sm">{item.content}</p>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}