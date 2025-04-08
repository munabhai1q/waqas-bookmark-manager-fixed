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
import { Sparkles, Droplets, Palette } from 'lucide-react';
import WaterAnimation from '@/components/WaterAnimation';
import BubblesButton from '@/components/BubblesButton';
import ColorPicker from '@/components/ColorPicker';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

export default function Home() {
  const [currentBookmark, setCurrentBookmark] = useState<Bookmark | undefined>(undefined);
  const [isAddBookmarkModalOpen, setIsAddBookmarkModalOpen] = useState(false);
  const [isEmbedErrorModalOpen, setIsEmbedErrorModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("bookmarks");
  const [demoColor, setDemoColor] = useState<string>("#3498db");
  
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
        title: "Bookmark added",
        description: `"${bookmark.title}" is now opening.`
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
  
  const handleColorChange = (color: string) => {
    setDemoColor(color);
    toast({
      title: "Color updated",
      description: "Your bookmark frame color has been updated.",
      duration: 2000,
    });
  };
  
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar 
        onSelectBookmark={handleSelectBookmark} 
        onAddBookmark={() => setIsAddBookmarkModalOpen(true)}
        currentBookmarkId={currentBookmark?.id}
      />
      
      <main className="flex-1 flex flex-col overflow-hidden bg-gray-50">
        <div className="p-2 bg-white border-b">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="bookmarks">Bookmarks</TabsTrigger>
              <TabsTrigger value="features">Interactive Features</TabsTrigger>
            </TabsList>
            
            <TabsContent value="bookmarks" className="h-full">
              <MultiTabsContainer
                ref={tabsContainerRef}
                initialBookmark={currentBookmark}
                showWelcome={!isLoading && (!bookmarks || bookmarks.length === 0)}
                onShowAddBookmark={() => setIsAddBookmarkModalOpen(true)}
              />
            </TabsContent>
            
            <TabsContent value="features" className="p-4 h-full overflow-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-xl font-bold mb-4 flex items-center">
                    <Sparkles className="h-5 w-5 mr-2 text-blue-500" />
                    Bubbles Animation
                  </h2>
                  <p className="text-gray-600 mb-4">
                    Add colorful bubble animations to your bookmarks view. 
                    Click the button below to toggle bubbles animation.
                  </p>
                  <BubblesButton />
                </div>
                
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-xl font-bold mb-4 flex items-center">
                    <div 
                      className="h-5 w-5 mr-2 rounded-full" 
                      style={{ backgroundColor: demoColor }}
                    />
                    Color Customization
                  </h2>
                  <p className="text-gray-600 mb-4">
                    Change the color of bookmark frames to personalize your experience.
                  </p>
                  <ColorPicker onSelectColor={handleColorChange} />
                  <div 
                    className="mt-4 h-24 rounded-lg border-4" 
                    style={{ borderColor: demoColor }}
                  >
                    <div className="h-full flex items-center justify-center text-gray-500">
                      Preview of selected color
                    </div>
                  </div>
                </div>
                
                <div className="md:col-span-2">
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-bold mb-4 flex items-center">
                      <Droplets className="h-5 w-5 mr-2 text-blue-500" />
                      Water Ripple Effect
                    </h2>
                    <p className="text-gray-600 mb-4">
                      An interactive water-like animation. Click and drag in the area below to create ripples.
                    </p>
                    <WaterAnimation />
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
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
