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
import { Sparkles, Droplets, Palette, Bot, PaintBucket } from 'lucide-react';
import WaterAnimation from '@/components/WaterAnimation';
import BubblesButton from '@/components/BubblesButton';
import ColorPicker from '@/components/ColorPicker';
import BackgroundEffects from '@/components/BackgroundEffects';
import OceanWaterAnimation from '@/components/OceanWaterAnimation';
import RobotAssistant from '@/components/RobotAssistant'; 
import CustomThemeManager from '@/components/CustomThemeManager';
import CategoryManager from '@/components/CategoryManager';
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
      {/* Background Effects Container - positioned absolutely to cover the entire screen */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <BackgroundEffects />
      </div>
      
      <Sidebar 
        onSelectBookmark={handleSelectBookmark} 
        onAddBookmark={() => setIsAddBookmarkModalOpen(true)}
        currentBookmarkId={currentBookmark?.id}
      />
      
      <main className="flex-1 flex flex-col overflow-hidden bg-gray-50 bg-opacity-80 backdrop-blur-sm">
        <div className="p-2 bg-white bg-opacity-90 border-b flex items-center justify-between">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex justify-between items-center mb-2">
              <TabsList className="grid w-[400px] grid-cols-3">
                <TabsTrigger value="bookmarks">Bookmarks</TabsTrigger>
                <TabsTrigger value="features">Features</TabsTrigger>
                <TabsTrigger value="themes">Themes</TabsTrigger>
              </TabsList>
              
              <div className="flex space-x-2">
                <CategoryManager />
                <CustomThemeManager />
              </div>
            </div>
            
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
                
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-xl font-bold mb-4 flex items-center">
                    <Bot className="h-5 w-5 mr-2 text-indigo-500" />
                    Robot Assistant
                  </h2>
                  <p className="text-gray-600 mb-4">
                    The robot assistant can help you interact with your bookmarked websites and answer 
                    questions. Look for the robot icon in the bottom left corner of the screen.
                  </p>
                  <div className="p-4 bg-gray-100 rounded-lg">
                    <p className="text-sm">
                      To use the full capabilities of the robot assistant, 
                      you'll need to provide an Anthropic API key. You can set this 
                      by clicking on the terminal icon in the assistant panel.
                    </p>
                  </div>
                </div>
                
                <div className="md:col-span-2">
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-bold mb-4 flex items-center">
                      <Droplets className="h-5 w-5 mr-2 text-blue-500" />
                      Interactive Ocean Water
                    </h2>
                    <p className="text-gray-600 mb-4">
                      An interactive ocean-like water animation with drag-and-drop support. Click to create 
                      waves, and drop files to display them floating on the water.
                    </p>
                    <div className="h-[400px] overflow-hidden rounded-lg border border-gray-200">
                      <OceanWaterAnimation />
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="themes" className="p-4 h-full overflow-auto">
              <div className="grid grid-cols-1 gap-6">
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-xl font-bold mb-4 flex items-center">
                    <PaintBucket className="h-5 w-5 mr-2 text-purple-500" />
                    Theme Manager
                  </h2>
                  <p className="text-gray-600 mb-4">
                    Create and manage custom themes for your bookmark application. You can create themes with 
                    solid colors, gradients, background images, or even videos.
                  </p>
                  <div className="flex justify-center mt-2">
                    <CustomThemeManager />
                  </div>
                </div>
                
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
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
      {/* Robot Assistant */}
      <RobotAssistant 
        activeWebsiteUrl={currentBookmark?.url}
        websiteTitle={currentBookmark?.title}
      />
      
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
