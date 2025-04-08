import { useState, useEffect } from 'react';
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

export default function MultiTabsContainer({ 
  showWelcome, 
  onShowAddBookmark,
  initialBookmark 
}: MultiTabsContainerProps) {
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

  // Add a new tab
  const addTab = (bookmark: Bookmark) => {
    // If tab is already open, just activate it
    if (openTabs.some(tab => tab.bookmark.id === bookmark.id)) {
      setActiveTab(bookmark.id.toString());
      setOpenTabs(openTabs.map(tab => ({
        ...tab,
        isActive: tab.bookmark.id === bookmark.id
      })));
      return;
    }

    // Otherwise, add a new tab
    const newTab: OpenTab = {
      bookmark,
      isActive: true
    };

    const updatedTabs = openTabs.map(tab => ({
      ...tab,
      isActive: false
    }));

    setOpenTabs([...updatedTabs, newTab]);
    setActiveTab(bookmark.id.toString());
  };

  // Remove a tab
  const removeTab = (tabId: number) => {
    // Find index of the tab to remove
    const tabIndex = openTabs.findIndex(tab => tab.bookmark.id === tabId);
    if (tabIndex === -1) return;

    // If it's the active tab, determine which tab to activate next
    const isActiveTab = openTabs[tabIndex].isActive;
    
    const newTabs = openTabs.filter(tab => tab.bookmark.id !== tabId);
    
    if (isActiveTab && newTabs.length > 0) {
      // Activate the next tab, or the previous if it's the last one
      const nextActiveIndex = Math.min(tabIndex, newTabs.length - 1);
      newTabs[nextActiveIndex].isActive = true;
      setActiveTab(newTabs[nextActiveIndex].bookmark.id.toString());
    } else if (newTabs.length === 0) {
      setActiveTab(null);
    }
    
    setOpenTabs(newTabs);
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

  return (
    <div className={`flex flex-col flex-1 overflow-hidden ${isFullscreen ? 'fixed inset-0 z-50 bg-white' : ''}`}>
      {/* Tab bar */}
      <div className="border-b flex items-center bg-gray-50">
        <Tabs 
          value={activeTab || undefined} 
          onValueChange={changeActiveTab}
          className="flex-1 overflow-x-auto"
        >
          <TabsList className="bg-transparent h-auto p-0 flex overflow-x-auto">
            {openTabs.map((tab) => (
              <div key={tab.bookmark.id} className="flex items-center relative group">
                <TabsTrigger 
                  value={tab.bookmark.id.toString()}
                  className={`data-[state=active]:bg-white rounded-none border-r px-4 py-2 h-10 flex items-center gap-2 max-w-[180px] ${tab.isActive ? 'border-b-2 border-b-primary' : ''}`}
                >
                  <Globe className="h-4 w-4" />
                  <span className="truncate">{tab.bookmark.title}</span>
                </TabsTrigger>
                
                {/* Controls for active tabs */}
                {tab.isActive && (
                  <div className="absolute right-7 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 w-6 p-0 rounded-full hover:bg-gray-200 opacity-50 hover:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        refreshTab(tab.bookmark.id);
                      }}
                      title="रीफ्रेश करें"
                    >
                      <RefreshCw className="h-3 w-3" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 w-6 p-0 rounded-full hover:bg-gray-200 opacity-50 hover:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        openInNewTab(tab.bookmark.url);
                      }}
                      title="नए टैब में खोलें"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                )}
                
                {/* Close button */}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 w-6 p-0 rounded-full hover:bg-gray-200"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeTab(tab.bookmark.id);
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
            <Button
              variant="ghost"
              size="sm"
              className="h-10 px-2"
              onClick={onShowAddBookmark}
              title="नया बुकमार्क जोड़ें"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </TabsList>
        </Tabs>
        
        {/* Control buttons */}
        <div className="flex items-center ml-auto">
          {activeTab && (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="h-10 px-2"
                onClick={() => refreshTab(parseInt(activeTab))}
                title="वर्तमान टैब रीफ्रेश करें"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-10 px-2"
                onClick={() => {
                  const tab = openTabs.find(tab => tab.bookmark.id.toString() === activeTab);
                  if (tab) openInNewTab(tab.bookmark.url);
                }}
                title="नए ब्राउज़र टैब में खोलें"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </>
          )}
          
          {/* Fullscreen toggle */}
          <Button
            variant="ghost"
            size="sm"
            className="h-10 px-2"
            onClick={toggleFullscreen}
            title={isFullscreen ? "फुलस्क्रीन से बाहर निकलें" : "फुलस्क्रीन मोड"}
          >
            {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
          </Button>
        </div>
      </div>
      
      {/* Website frames container */}
      <div className="flex-1 relative overflow-hidden">
        {openTabs.length === 0 ? (
          <WebsiteFrame 
            showWelcome={showWelcome} 
            onShowAddBookmark={onShowAddBookmark} 
          />
        ) : (
          openTabs.map((tab) => (
            <div 
              key={tab.bookmark.id}
              className={`absolute inset-0 transition-opacity ${tab.isActive ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
            >
              <WebsiteFrame 
                bookmark={tab.bookmark} 
                showWelcome={false} 
                onShowAddBookmark={onShowAddBookmark}
                refreshKey={refreshCounter[tab.bookmark.id] || 0}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
}