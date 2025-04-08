import { useState, useEffect } from 'react';
import { Bookmark } from '@/lib/types';
import { useTestEmbedding } from '@/lib/hooks';
import { Loader2, ExternalLink, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
  
  // Render the component
  return (
    <div className="flex-1 overflow-hidden relative">
      {/* Quick controls for active frames */}
      {bookmark && canEmbed && (
        <div className="absolute bottom-4 right-4 z-20 flex space-x-2 opacity-70 hover:opacity-100 transition-opacity">
          <Button 
            size="sm" 
            variant="secondary" 
            className="bg-white shadow-md"
            onClick={handleRefresh}
            title="रीफ्रेश करें"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button 
            size="sm" 
            variant="secondary" 
            className="bg-white shadow-md"
            onClick={handleOpenInNewTab}
            title="नए टैब में खोलें"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Open
          </Button>
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
            <h2 className="text-2xl font-bold mb-2">Welcome to WebFramer</h2>
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
      
      {/* Iframe content */}
      {bookmark && canEmbed && (
        <iframe 
          key={`${bookmark?.id || 0}-${internalRefreshKey}-${refreshKey}`}
          src={bookmark.url} 
          className="w-full h-full border-0 iframe-container" 
          sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-storage-access-by-user-activation"
          allow="camera; microphone; clipboard-read; clipboard-write; display-capture"
          loading="lazy"
          title={bookmark.title}
          onLoad={handleIframeLoad}
          referrerPolicy="no-referrer"
        ></iframe>
      )}
    </div>
  );
}
