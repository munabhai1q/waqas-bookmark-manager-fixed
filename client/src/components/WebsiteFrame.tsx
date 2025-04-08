import { useState, useEffect, useRef } from 'react';
import { Bookmark } from '@/lib/types';
import { useTestEmbedding } from '@/lib/hooks';
import { Loader2, ExternalLink, RefreshCw, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ControlPanel from './ControlPanel';
import { motion } from 'framer-motion';

interface WebsiteFrameProps {
  bookmark?: Bookmark;
  showWelcome: boolean;
  onShowAddBookmark: () => void;
  refreshKey?: number;
}

export default function WebsiteFrame({ 
  bookmark, 
  showWelcome,
  onShowAddBookmark,
  refreshKey = 0
}: WebsiteFrameProps) {
  // Call hooks consistently - ALWAYS in the same order
  const [isLoading, setIsLoading] = useState(true);
  const [internalRefreshKey, setInternalRefreshKey] = useState(0);
  const [scale, setScale] = useState(1);
  const [borderColor, setBorderColor] = useState('#3498db');
  const [isDragging, setIsDragging] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  // Always call the hook with a URL (empty string if no bookmark)
  const { canEmbed } = useTestEmbedding(bookmark?.url || '');
  
  // Handle iframe loading
  useEffect(() => {
    if (bookmark) {
      setIsLoading(true);
    }
  }, [bookmark, internalRefreshKey, refreshKey]);
  
  const handleIframeLoad = () => {
    setIsLoading(false);
  };
  
  const handleOpenInNewTab = () => {
    if (bookmark) {
      window.open(bookmark.url, '_blank');
    }
  };
  
  const handleRefresh = () => {
    setInternalRefreshKey(prevKey => prevKey + 1);
    setIsLoading(true);
  };
  
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleResizeFrame = (newScale: number) => {
    setScale(newScale);
  };

  const handleChangeColor = (color: string) => {
    setBorderColor(color);
  };
  
  // Render the component
  return (
    <div className={`flex-1 overflow-hidden relative ${isFullscreen ? 'fixed inset-0 z-50 bg-white' : ''}`}>
      {/* Control panel for bookmarks */}
      {bookmark && (
        <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-r from-gray-900 to-gray-800 shadow-md">
          <div className="flex justify-between items-center px-2 py-1">
            <ControlPanel 
              currentBookmark={bookmark} 
              onResizeFrame={handleResizeFrame}
              onChangeColor={handleChangeColor}
            />
            <div className="flex space-x-2">
              <Button 
                size="sm" 
                variant="ghost"
                className="text-white"
                onClick={handleRefresh} 
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
              <Button 
                size="sm" 
                variant="ghost"
                className="text-white"
                onClick={toggleFullscreen}
              >
                {isFullscreen ? 
                  <Minimize2 className="h-4 w-4" /> : 
                  <Maximize2 className="h-4 w-4" />
                }
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Loading spinner */}
      {isLoading && bookmark && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 z-10">
          <Loader2 className="h-12 w-12 text-primary animate-spin" />
        </div>
      )}
      
      {/* Welcome message for first-time users */}
      {showWelcome && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
          <div className="text-center p-6 max-w-md">
            <div className="text-5xl mb-4 text-primary">
              <i className="fas fa-bookmark"></i>
            </div>
            <h2 className="text-2xl font-bold mb-2">Welcome to WAQAS BOOKMARK</h2>
            <p className="mb-4 text-gray-600">
              Start by adding your favorite websites to access them directly from here, without switching tabs.
            </p>
            <Button onClick={onShowAddBookmark}>
              <i className="fas fa-plus mr-2"></i> Add Your First Bookmark
            </Button>
          </div>
        </div>
      )}
      
      {/* Show error for websites that can't be embedded */}
      {bookmark && !canEmbed && (
        <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
          <div className="text-center p-6 max-w-md">
            <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-4 flex items-center">
              <i className="fas fa-exclamation-circle mr-2 text-red-500 text-xl"></i>
              <span>This website cannot be embedded due to security restrictions.</span>
            </div>
            <p className="mb-4 text-gray-600">
              Some websites prevent embedding in iframes. You can try opening it in a new tab instead.
            </p>
            <Button onClick={handleOpenInNewTab}>
              Open in New Tab
            </Button>
          </div>
        </div>
      )}
      
      {/* Iframe content with motion for dragging and scaling */}
      <div className="pt-12 h-full overflow-hidden relative">
        {bookmark && canEmbed && (
          <motion.div
            className="w-full h-full bg-white rounded-lg shadow-lg overflow-hidden m-auto"
            style={{ 
              borderColor,
              borderWidth: '4px',
              borderStyle: 'solid',
              boxSizing: 'border-box'
            }}
            initial={{ scale: 1 }}
            animate={{ 
              scale, 
              translateX: isDragging ? undefined : 0,
              translateY: isDragging ? undefined : 0
            }}
            transition={{ 
              type: 'spring', 
              damping: 15, 
              stiffness: 100 
            }}
            drag={!isFullscreen}
            dragConstraints={{ 
              left: -200 * scale, 
              right: 200 * scale, 
              top: -50 * scale, 
              bottom: 200 * scale 
            }}
            dragElastic={0.1}
            dragMomentum={true}
            whileDrag={{ scale: scale * 1.02 }}
            onDragStart={() => setIsDragging(true)}
            onDragEnd={() => setIsDragging(false)}
          >
            <iframe 
              ref={iframeRef}
              key={`${bookmark?.id || 0}-${internalRefreshKey}-${refreshKey}`}
              src={bookmark.url} 
              className="w-full h-full border-0" 
              sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-storage-access-by-user-activation"
              allow="camera; microphone; clipboard-read; clipboard-write; display-capture"
              loading="lazy"
              title={bookmark.title}
              onLoad={handleIframeLoad}
              referrerPolicy="no-referrer"
            />
          </motion.div>
        )}
      </div>
    </div>
  );
}
