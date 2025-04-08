import { useState, useEffect } from 'react';
import { Bookmark } from '@/lib/types';
import { useQuery } from '@tanstack/react-query';
import Sidebar from '@/components/Sidebar';
import AddBookmarkModal from '@/components/AddBookmarkModal';
import EmbedErrorModal from '@/components/EmbedErrorModal';
import WebsiteFrame from '@/components/WebsiteFrame';
import { useTestEmbedding } from '@/lib/hooks';
import { useMobile } from '@/lib/hooks';
import { ExternalLink, RefreshCw, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function Home() {
  const [currentBookmark, setCurrentBookmark] = useState<Bookmark | undefined>(undefined);
  const [isAddBookmarkModalOpen, setIsAddBookmarkModalOpen] = useState(false);
  const [isEmbedErrorModalOpen, setIsEmbedErrorModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  
  const isMobile = useMobile();
  
  // Get all bookmarks to find initial bookmark to display
  const { data: bookmarks, isLoading } = useQuery<Bookmark[]>({
    queryKey: ['/api/bookmarks'],
    retry: 1
  });
  
  // Always call hooks, but only use the result if currentBookmark exists
  const { canEmbed } = useTestEmbedding(currentBookmark?.url || '');
  
  // Set initial bookmark on first load
  useEffect(() => {
    if (!isLoading && bookmarks && bookmarks.length > 0 && !currentBookmark) {
      // Find the ElevenLabs bookmark to display first
      const elevenLabsBookmark = bookmarks.find(b => 
        b.url.includes('elevenlabs.io') || b.title.toLowerCase().includes('elevenlabs')
      );
      
      setCurrentBookmark(elevenLabsBookmark || bookmarks[0]);
    }
  }, [bookmarks, isLoading, currentBookmark]);
  
  // Show embed error modal when a non-embeddable site is selected
  useEffect(() => {
    if (currentBookmark && !canEmbed) {
      setIsEmbedErrorModalOpen(true);
    }
  }, [currentBookmark, canEmbed]);
  
  const handleSelectBookmark = (bookmark: Bookmark) => {
    setCurrentBookmark(bookmark);
    setRefreshKey(prevKey => prevKey + 1);
  };
  
  const handleOpenInNewTab = () => {
    if (currentBookmark) {
      window.open(currentBookmark.url, '_blank');
    }
  };
  
  const handleRefresh = () => {
    setRefreshKey(prevKey => prevKey + 1);
  };
  
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar 
        onSelectBookmark={handleSelectBookmark} 
        onAddBookmark={() => setIsAddBookmarkModalOpen(true)}
        currentBookmarkId={currentBookmark?.id}
      />
      
      <main className="flex-1 flex flex-col overflow-hidden bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 py-3 px-4 flex items-center justify-between">
          <div className="flex items-center">
            {isMobile && (
              <div className="w-6 mr-4"></div> // Spacer for mobile menu button
            )}
            {currentBookmark && (
              <div className="flex items-center max-w-full overflow-hidden">
                <span className="font-medium truncate">{currentBookmark.title}</span>
                <span className="mx-2 text-gray-400 shrink-0">|</span>
                <span className="text-sm text-gray-500 truncate">{currentBookmark.url}</span>
              </div>
            )}
          </div>
          
          {currentBookmark && (
            <div className="flex items-center space-x-2">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={handleRefresh}
                title="Reload iframe"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={handleOpenInNewTab}
                title="Open in new tab"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    title="More options"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setIsAddBookmarkModalOpen(true)}>
                    Add New Bookmark
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleRefresh}>
                    Refresh Current Page
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleOpenInNewTab}>
                    Open in New Tab
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </header>
        
        {/* Content */}
        <WebsiteFrame 
          bookmark={currentBookmark} 
          showWelcome={!isLoading && (!bookmarks || bookmarks.length === 0)}
          onShowAddBookmark={() => setIsAddBookmarkModalOpen(true)}
        />
      </main>
      
      {/* Modals */}
      <AddBookmarkModal 
        isOpen={isAddBookmarkModalOpen} 
        onClose={() => setIsAddBookmarkModalOpen(false)} 
      />
      
      <EmbedErrorModal 
        isOpen={isEmbedErrorModalOpen} 
        onClose={() => setIsEmbedErrorModalOpen(false)}
        url={currentBookmark?.url || ""}
      />
    </div>
  );
}
