import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Palette } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface ColorPickerProps {
  onSelectColor: (color: string) => void;
}

export default function ColorPicker({ onSelectColor }: ColorPickerProps) {
  const [selectedColor, setSelectedColor] = useState<string>('#3498db');
  
  const colors = [
    '#3498db', // Blue
    '#2ecc71', // Green
    '#e74c3c', // Red
    '#f39c12', // Orange
    '#9b59b6', // Purple
    '#1abc9c', // Turquoise
    '#34495e', // Dark Blue
    '#e67e22', // Dark Orange
    '#95a5a6', // Gray
    '#16a085', // Green Sea
    '#d35400', // Pumpkin
    '#c0392b', // Pomegranate
    '#8e44ad', // Wisteria
    '#2c3e50', // Midnight Blue
    '#27ae60', // Nephritis
    '#f1c40f', // Sunflower
  ];

  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
    onSelectColor(color);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          className="flex items-center gap-2"
          style={{ backgroundColor: selectedColor }}
        >
          <Palette className="h-4 w-4" />
          <span>Change Color</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2">
        <div className="grid grid-cols-4 gap-2">
          {colors.map((color) => (
            <button
              key={color}
              className="w-full h-10 rounded-md transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2"
              style={{ backgroundColor: color }}
              onClick={() => handleColorSelect(color)}
              aria-label={`Select color ${color}`}
            />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}