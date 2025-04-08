import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { PlusCircle, X, Settings, Sun, Moon, Laptop } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from '@/hooks/use-toast';
import { useLocalStorage } from '@/lib/hooks';

interface Tab {
  id: string;
  name: string;
  content: React.ReactNode;
  isDefault?: boolean;
}

interface CustomTabsProps {
  defaultTabs: Tab[];
  onTabChange?: (tabId: string) => void;
}

export interface CustomTabsRef {
  addTab: (tab: Omit<Tab, 'id'>) => void;
  removeTab: (tabId: string) => void;
  getCurrentTab: () => string;
  setActiveTab: (tabId: string) => void;
}

const CustomTabs = forwardRef<CustomTabsRef, CustomTabsProps>((props, ref) => {
  const { defaultTabs, onTabChange } = props;
  const [theme, setTheme] = useLocalStorage('theme', 'system');
  const [tabs, setTabs] = useState<Tab[]>(defaultTabs);
  const [activeTab, setActiveTab] = useState<string>(defaultTabs[0]?.id || '');
  const [isNewTabInputVisible, setIsNewTabInputVisible] = useState(false);
  const [newTabName, setNewTabName] = useState('');
  const { toast } = useToast();

  // Update document theme class
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('dark', 'light');
    
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
  }, [theme]);

  // Update tabs when defaultTabs change
  useEffect(() => {
    // Only add default tabs if they don't already exist
    const updatedTabs = [...tabs];
    let tabsChanged = false;
    
    defaultTabs.forEach(defaultTab => {
      if (!tabs.some(tab => tab.id === defaultTab.id)) {
        updatedTabs.push(defaultTab);
        tabsChanged = true;
      }
    });
    
    if (tabsChanged) {
      setTabs(updatedTabs);
    }
  }, [defaultTabs]);

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    addTab: (newTab: Omit<Tab, 'id'>) => {
      const id = `tab-${Date.now()}`;
      const tab = { ...newTab, id };
      setTabs(prev => [...prev, tab]);
      setActiveTab(id);
      return id;
    },
    removeTab: (tabId: string) => {
      const tabToRemove = tabs.find(tab => tab.id === tabId);
      if (tabToRemove && !tabToRemove.isDefault) {
        setTabs(prev => prev.filter(tab => tab.id !== tabId));
        // If removing active tab, switch to first tab
        if (activeTab === tabId) {
          const firstRemainingTab = tabs.find(tab => tab.id !== tabId);
          if (firstRemainingTab) {
            setActiveTab(firstRemainingTab.id);
          }
        }
      } else {
        toast({
          title: "Cannot Remove Default Tab",
          description: "This tab cannot be removed as it's a default system tab.",
          variant: "destructive"
        });
      }
    },
    getCurrentTab: () => activeTab,
    setActiveTab: (tabId: string) => {
      setActiveTab(tabId);
    }
  }));

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    if (onTabChange) {
      onTabChange(tabId);
    }
  };

  const handleAddTabClick = () => {
    setIsNewTabInputVisible(true);
  };

  const handleAddTab = () => {
    if (newTabName.trim() === '') {
      toast({
        title: "Tab Name Required",
        description: "Please enter a name for your new tab.",
        variant: "destructive"
      });
      return;
    }

    const id = `tab-${Date.now()}`;
    const newTab: Tab = {
      id,
      name: newTabName,
      content: <div className="p-4 h-full">
        <h2 className="text-xl font-bold mb-4">Custom Tab: {newTabName}</h2>
        <p className="text-gray-500">
          This is your custom tab. You can add any content here.
        </p>
      </div>
    };

    setTabs(prev => [...prev, newTab]);
    setActiveTab(id);
    setNewTabName('');
    setIsNewTabInputVisible(false);

    toast({
      title: "Tab Created",
      description: `New tab "${newTabName}" has been created.`
    });
  };

  const handleRemoveTab = (tabId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const tabToRemove = tabs.find(tab => tab.id === tabId);
    
    if (tabToRemove && !tabToRemove.isDefault) {
      setTabs(prev => prev.filter(tab => tab.id !== tabId));
      
      // If removing active tab, switch to first tab
      if (activeTab === tabId) {
        const firstRemainingTab = tabs.find(tab => tab.id !== tabId);
        if (firstRemainingTab) {
          setActiveTab(firstRemainingTab.id);
        }
      }
      
      toast({
        title: "Tab Removed",
        description: `Tab "${tabToRemove.name}" has been removed.`
      });
    } else {
      toast({
        title: "Cannot Remove Default Tab",
        description: "This tab cannot be removed as it's a default system tab.",
        variant: "destructive"
      });
    }
  };

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    
    toast({
      title: "Theme Changed",
      description: `Theme set to ${newTheme === 'system' ? 'system default' : newTheme} mode.`
    });
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <div className="flex items-center space-x-2 overflow-x-auto pb-2">
            <TabsList className="flex-1 overflow-x-auto">
              {tabs.map(tab => (
                <TabsTrigger 
                  key={tab.id} 
                  value={tab.id}
                  className="relative group"
                >
                  {tab.name}
                  {!tab.isDefault && (
                    <button
                      onClick={(e) => handleRemoveTab(tab.id, e)}
                      className="absolute -top-1 -right-1 size-5 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="size-3" />
                    </button>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={handleAddTabClick}
              className="shrink-0"
            >
              <PlusCircle className="h-4 w-4 mr-1" /> Add Tab
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="shrink-0">
                  <Settings className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleThemeChange('light')}>
                  <Sun className="mr-2 h-4 w-4" /> Light Mode
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleThemeChange('dark')}>
                  <Moon className="mr-2 h-4 w-4" /> Dark Mode
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleThemeChange('system')}>
                  <Laptop className="mr-2 h-4 w-4" /> System Default
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          {isNewTabInputVisible && (
            <div className="flex items-center gap-2 mt-2">
              <Input
                placeholder="Enter tab name"
                value={newTabName}
                onChange={(e) => setNewTabName(e.target.value)}
                className="max-w-xs"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddTab();
                  if (e.key === 'Escape') {
                    setIsNewTabInputVisible(false);
                    setNewTabName('');
                  }
                }}
              />
              <Button onClick={handleAddTab}>Add</Button>
              <Button variant="outline" onClick={() => {
                setIsNewTabInputVisible(false);
                setNewTabName('');
              }}>
                Cancel
              </Button>
            </div>
          )}
          
          {tabs.map(tab => (
            <TabsContent key={tab.id} value={tab.id} className="h-full">
              {tab.content}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
});

CustomTabs.displayName = 'CustomTabs';

export default CustomTabs;