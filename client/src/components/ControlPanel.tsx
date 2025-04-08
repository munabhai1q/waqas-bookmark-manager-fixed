import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sliders, Move, Maximize2, Minimize2 } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import BubblesButton from './BubblesButton';
import ColorPicker from './ColorPicker';
import { Separator } from '@/components/ui/separator';
import { Bookmark } from '@/lib/types';

interface ControlPanelProps {
  currentBookmark?: Bookmark;
  onResizeFrame?: (scale: number) => void;
  onChangeColor?: (color: string) => void;
}

export default function ControlPanel({ 
  currentBookmark, 
  onResizeFrame,
  onChangeColor
}: ControlPanelProps) {
  const [frameScale, setFrameScale] = useState(100);
  
  const handleResize = (newScale: number) => {
    setFrameScale(newScale);
    if (onResizeFrame) {
      onResizeFrame(newScale / 100);
    }
  };

  const handleColorChange = (color: string) => {
    if (onChangeColor) {
      onChangeColor(color);
    }
  };

  return (
    <div className="flex items-center gap-2 p-2 bg-gradient-to-r from-gray-900 to-gray-800 text-white rounded-lg shadow-lg">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="bg-gray-800 text-white border-gray-700">
            <Sliders className="h-4 w-4 mr-2" />
            Controls
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80">
          <div className="space-y-4 p-2">
            <h3 className="font-medium text-lg">Frame Controls</h3>
            <Separator />
            
            <div className="space-y-2">
              <p className="text-sm text-gray-500">Resize Frame</p>
              <div className="flex items-center gap-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleResize(Math.max(50, frameScale - 10))}
                >
                  <Minimize2 className="h-4 w-4" />
                </Button>
                <div className="flex-1 text-center">
                  {frameScale}%
                </div>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleResize(Math.min(150, frameScale + 10))}
                >
                  <Maximize2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <Separator />
            
            <div className="space-y-2">
              <p className="text-sm text-gray-500">Change Frame Color</p>
              <ColorPicker onSelectColor={handleColorChange} />
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <p className="text-sm text-gray-500">Special Effects</p>
              <BubblesButton />
            </div>
          </div>
        </PopoverContent>
      </Popover>
      
      <div className="flex-1 overflow-hidden">
        {currentBookmark && (
          <div className="truncate font-medium">
            {currentBookmark.title}
          </div>
        )}
      </div>
    </div>
  );
}