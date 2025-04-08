import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Bookmark, OpenTab } from '@/lib/types';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { X, Globe, Plus, Maximize, Minimize, RefreshCw, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import WebsiteFrame from './WebsiteFrame';

interface MultiTabsContainerProps {
  showWelcome: boolean;
  onShowAddBookmark: () => void;
  initialBookmark?: Bookmark;
}

const MultiTabsContainer = forwardRef<{ addTab: (bookmark: Bookmark) => void }, MultiTabsContainerProps>((props, ref) => {
  const { showWelcome, onShowAddBookmark, initialBookmark } = props;
  const [openTabs, setOpenTabs] = useState<OpenTab[]>([]);
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [refreshCounter, setRefreshCounter] = useState<Record<number, number>>({});
  const { toast } = useToast();

  // Initialize with initial bookmark if provided
  useEffect(() => {
    if (initialBookmark && !openTabs.some(tab => tab.bookmark.id === initialBookmark.id)) {
      addTab(initialBookmark);
    }
  }, [initialBookmark]);

  // Add a new tab - in this version we actually don't need to track active status
  // since we're displaying all tabs stacked
  const addTab = (bookmark: Bookmark) => {
    // Don't add duplicates
    if (openTabs.some(tab => tab.bookmark.id === bookmark.id)) {
      // Maybe scroll to the existing tab instead?
      return;
    }

    // Add a new tab
    const newTab: OpenTab = {
      bookmark,
      isActive: true // We don't really use this flag in stacked mode, but keep for consistency
    };

    setOpenTabs([...openTabs, newTab]);
    // We could potentially scroll to the new tab
  };

  // Remove a tab - simplified for stacked view
  const removeTab = (tabId: number) => {
    setOpenTabs(openTabs.filter(tab => tab.bookmark.id !== tabId));
    
    // If no tabs left, clear active tab
    if (openTabs.length <= 1) {
      setActiveTab(null);
    }
    
    toast({
      title: "वेबसाइट बंद की गई",
      description: "बुकमार्क किए गए वेबसाइट को बंद कर दिया गया है।",
    });
  };

  // Change the active tab
  const changeActiveTab = (tabId: string) => {
    setActiveTab(tabId);
    setOpenTabs(openTabs.map(tab => ({
      ...tab,
      isActive: tab.bookmark.id.toString() === tabId
    })));
  };

  // Toggle fullscreen mode
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };
  
  // Refresh a specific tab
  const refreshTab = (tabId: number) => {
    setRefreshCounter(prev => ({
      ...prev,
      [tabId]: (prev[tabId] || 0) + 1
    }));
    
    toast({
      title: "टैब रीफ्रेश किया गया",
      description: "वेबपेज पुनः लोड हो रहा है।"
    });
  };
  
  // Open a tab in external browser
  const openInNewTab = (url: string) => {
    window.open(url, '_blank');
  };

  // Expose addTab method to parent component
  useImperativeHandle(ref, () => ({
    addTab
  }));

  return (
    <div className={`flex flex-col flex-1 overflow-hidden ${isFullscreen ? 'fixed inset-0 z-50 bg-white' : ''}`}>
      {/* Tab bar */}
      <div className="border-b flex items-center justify-between bg-gray-50 px-4 py-2">
        <h2 className="text-lg font-medium">बुकमार्क वेबसाइट्स</h2>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8"
            onClick={onShowAddBookmark}
          >
            <Plus className="h-4 w-4 mr-1" />
            नया बुकमार्क जोड़ें
          </Button>
          
          {/* Fullscreen toggle */}
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={toggleFullscreen}
            title={isFullscreen ? "फुलस्क्रीन से बाहर निकलें" : "फुलस्क्रीन मोड"}
          >
            {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
          </Button>
        </div>
      </div>
      
      {/* Website frames container - Vertical stack of websites */}
      <div className="flex-1 overflow-y-auto">
        {openTabs.length === 0 ? (
          <div className="h-full">
            <WebsiteFrame 
              showWelcome={showWelcome} 
              onShowAddBookmark={onShowAddBookmark} 
            />
          </div>
        ) : (
          <div className="flex flex-col gap-4 p-4">
            {openTabs.map((tab) => (
              <div 
                key={tab.bookmark.id}
                className="border rounded-lg shadow-sm overflow-hidden"
              >
                <div className="bg-gray-100 border-b px-3 py-2 flex items-center justify-between">
                  <div className="font-medium truncate flex items-center">
                    <Globe className="h-4 w-4 mr-2 text-primary" />
                    {tab.bookmark.title}
                  </div>
                  <div className="flex items-center space-x-1">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-7 w-7 p-0"
                      onClick={() => refreshTab(tab.bookmark.id)}
                      title="रीफ्रेश करें"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-7 w-7 p-0"
                      onClick={() => openInNewTab(tab.bookmark.url)}
                      title="नए टैब में खोलें"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-7 w-7 p-0 hover:bg-red-50 hover:text-red-500"
                      onClick={() => removeTab(tab.bookmark.id)}
                      title="बंद करें"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="h-[500px]">
                  <WebsiteFrame 
                    bookmark={tab.bookmark} 
                    showWelcome={false} 
                    onShowAddBookmark={onShowAddBookmark}
                    refreshKey={refreshCounter[tab.bookmark.id] || 0}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

export default MultiTabsContainer;