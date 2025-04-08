import { useState, useEffect, useRef } from 'react';
import { Bookmark } from '@/lib/types';
import { useQuery } from '@tanstack/react-query';
import Sidebar from '@/components/Sidebar';
import AddBookmarkModal from '@/components/AddBookmarkModal';
import EmbedErrorModal from '@/components/EmbedErrorModal';
import MultiTabsContainer from '../components/MultiTabsContainer';
import { useTestEmbedding } from '@/lib/hooks';
import { useMobile } from '@/lib/hooks';
import { useToast } from '@/hooks/use-toast';

export default function Home() {
  const [currentBookmark, setCurrentBookmark] = useState<Bookmark | undefined>(undefined);
  const [isAddBookmarkModalOpen, setIsAddBookmarkModalOpen] = useState(false);
  const [isEmbedErrorModalOpen, setIsEmbedErrorModalOpen] = useState(false);
  
  // Reference to the MultiTabsContainer component
  const tabsContainerRef = useRef<{ addTab: (bookmark: Bookmark) => void } | null>(null);
  
  const isMobile = useMobile();
  const { toast } = useToast();
  
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
    // Set the current bookmark
    setCurrentBookmark(bookmark);
    
    // Also add it to the tabs container if reference exists
    if (tabsContainerRef.current) {
      tabsContainerRef.current.addTab(bookmark);
      
      toast({
        title: "बुकमार्क जोड़ा गया",
        description: `"${bookmark.title}" अब खुल रहा है।`
      });
    }
  };
  
  const handleAddBookmarkModalClose = () => {
    setIsAddBookmarkModalOpen(false);
    
    // Refresh the bookmark list to show newly added bookmark
    if (tabsContainerRef.current && bookmarks && bookmarks.length > 0) {
      // Check if we have a new bookmark that wasn't shown before
      const latestBookmark = bookmarks[bookmarks.length - 1];
      if (latestBookmark && latestBookmark.id !== currentBookmark?.id) {
        setCurrentBookmark(latestBookmark);
      }
    }
  };
  
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar 
        onSelectBookmark={handleSelectBookmark} 
        onAddBookmark={() => setIsAddBookmarkModalOpen(true)}
        currentBookmarkId={currentBookmark?.id}
      />
      
      <main className="flex-1 flex flex-col overflow-hidden bg-gray-50">
        {/* Content with Multi-Tabs */}
        <MultiTabsContainer
          ref={tabsContainerRef}
          initialBookmark={currentBookmark}
          showWelcome={!isLoading && (!bookmarks || bookmarks.length === 0)}
          onShowAddBookmark={() => setIsAddBookmarkModalOpen(true)}
        />
      </main>
      
      {/* Modals */}
      <AddBookmarkModal 
        isOpen={isAddBookmarkModalOpen} 
        onClose={handleAddBookmarkModalClose} 
      />
      
      <EmbedErrorModal 
        isOpen={isEmbedErrorModalOpen} 
        onClose={() => setIsEmbedErrorModalOpen(false)}
        url={currentBookmark?.url || ""}
      />
    </div>
  );
}
