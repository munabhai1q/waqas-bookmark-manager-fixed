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
  
  // Get an embed link for sites that typically block iframes
  const getEmbedLink = (url: string): string => {
    try {
      // Extract the domain from the URL
      const urlObj = new URL(url);
      const domain = urlObj.hostname.toLowerCase();
      
      // Format-specific embeds for known services
      if (domain.includes('youtube.com') || domain.includes('youtu.be')) {
        // YouTube embed
        const videoId = url.includes('watch?v=') 
          ? new URLSearchParams(urlObj.search).get('v')
          : url.split('/').pop();
        return `https://www.youtube.com/embed/${videoId}`;
      } else if (domain.includes('vimeo.com')) {
        // Vimeo embed
        const videoId = url.split('/').pop();
        return `https://player.vimeo.com/video/${videoId}`;
      } else if (domain.includes('google.com') && url.includes('/maps/')) {
        // Google Maps embed
        return `https://www.google.com/maps/embed?pb=${url.split('!3d')[1]}`;
      } else if (domain.includes('twitter.com') || domain.includes('x.com')) {
        // Twitter/X embed via publish.twitter.com
        return `https://twitframe.com/show?url=${encodeURIComponent(url)}`;
      } else if (domain.includes('linkedin.com')) {
        // LinkedIn uses a special embed code - we can't directly iframe it
        return url;
      } else if (domain.includes('temp-mail.org') || domain.includes('tempmail')) {
        // For TempMail sites, we need to create a special one-time iframe embedding
        // Since direct embedding is not possible for security reasons, we recommend the 
        // "new tab" approach for these services
        
        // Just return the original URL - WebsiteFrame will show the "can't embed" message
        // and offer to open in a new tab
        return "";
      }
    } catch (e) {
      console.error("URL parsing error:", e);
    }
    
    // Default: return the original URL
    return url;
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
            {/* Conditional rendering based on domain type */}
            {bookmark.url.includes("youtube.com") || bookmark.url.includes("youtu.be") ? (
              <iframe 
                ref={iframeRef}
                key={`${bookmark?.id || 0}-${internalRefreshKey}-${refreshKey}-yt`}
                src={getEmbedLink(bookmark.url)} 
                className="w-full h-full border-0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                loading="eager"
                title={`YouTube: ${bookmark.title}`}
                onLoad={handleIframeLoad}
                style={{width: "100%", height: "100%"}}
              />
            ) : bookmark.url.includes("google.com") ? (
              <iframe 
                ref={iframeRef}
                key={`${bookmark?.id || 0}-${internalRefreshKey}-${refreshKey}-google`}
                src={bookmark.url} 
                className="w-full h-full border-0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                loading="eager"
                title={`Google: ${bookmark.title}`}
                onLoad={handleIframeLoad}
                referrerPolicy="no-referrer"
                style={{width: "100%", height: "100%"}}
              />
            ) : (
              <iframe 
                ref={iframeRef}
                key={`${bookmark?.id || 0}-${internalRefreshKey}-${refreshKey}`}
                src={getEmbedLink(bookmark.url)} 
                className="w-full h-full border-0" 
                sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-storage-access-by-user-activation allow-downloads allow-modals allow-orientation-lock allow-pointer-lock allow-presentation"
                allow="camera; microphone; clipboard-read; clipboard-write; display-capture; fullscreen; autoplay; payment"
                loading="eager"
                title={bookmark.title}
                onLoad={handleIframeLoad}
                referrerPolicy="no-referrer"
                style={{width: "100%", height: "100%"}}
              />
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
