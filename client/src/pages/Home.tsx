import { useState, useEffect } from 'react';
import { Bookmark } from '@/lib/types';
import { useQuery } from '@tanstack/react-query';
import Sidebar from '@/components/Sidebar';
import AddBookmarkModal from '@/components/AddBookmarkModal';
import EmbedErrorModal from '@/components/EmbedErrorModal';
import MultiTabsContainer from '@/components/MultiTabsContainer';
import { useTestEmbedding } from '@/lib/hooks';
import { useMobile } from '@/lib/hooks';

export default function Home() {
  const [currentBookmark, setCurrentBookmark] = useState<Bookmark | undefined>(undefined);
  const [isAddBookmarkModalOpen, setIsAddBookmarkModalOpen] = useState(false);
  const [isEmbedErrorModalOpen, setIsEmbedErrorModalOpen] = useState(false);
  
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
          initialBookmark={currentBookmark}
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
