import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { useLocalStorage } from '@/lib/hooks';
import { Trash2, Plus, Video, Image, PaintBucket, Upload, Settings, Save, X } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { cn } from '@/lib/utils';

interface Theme {
  id: string;
  name: string;
  type: 'color' | 'gradient' | 'image' | 'video';
  value: string;
  overlay?: {
    color: string;
    opacity: number;
  };
  blur?: number;
}

export default function CustomThemeManager() {
  const [activeTheme, setActiveTheme] = useLocalStorage<string>('active-theme', 'default');
  const [themes, setThemes] = useLocalStorage<Theme[]>('custom-themes', [
    {
      id: 'default',
      name: 'Default Theme',
      type: 'color',
      value: '#f8fafc',
    } as Theme,
    {
      id: 'dark',
      name: 'Dark Theme',
      type: 'color',
      value: '#1e293b',
    } as Theme,
    {
      id: 'ocean',
      name: 'Ocean Gradient',
      type: 'gradient',
      value: 'linear-gradient(to bottom right, #0ea5e9, #2563eb)',
    } as Theme
  ]);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [newTheme, setNewTheme] = useState<Omit<Theme, 'id'>>({
    name: '',
    type: 'color',
    value: '#f8fafc',
  });
  
  const [selectedThemeId, setSelectedThemeId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  useEffect(() => {
    // Apply the active theme to the document
    const theme = themes.find(t => t.id === activeTheme);
    if (!theme) return;
    
    const root = document.documentElement;
    
    // Remove any existing theme classes and background
    root.classList.remove('theme-image', 'theme-video', 'theme-color', 'theme-gradient');
    root.style.removeProperty('--theme-background');
    root.style.removeProperty('--theme-overlay-color');
    root.style.removeProperty('--theme-overlay-opacity');
    root.style.removeProperty('--theme-blur');
    
    // Set the background based on theme type
    root.classList.add(`theme-${theme.type}`);
    root.style.setProperty('--theme-background', theme.value);
    
    // Set overlay and blur if defined
    if (theme.overlay) {
      root.style.setProperty('--theme-overlay-color', theme.overlay.color);
      root.style.setProperty('--theme-overlay-opacity', theme.overlay.opacity.toString());
    }
    
    if (theme.blur) {
      root.style.setProperty('--theme-blur', `${theme.blur}px`);
    }
    
    // Add CSS to the head if it doesn't exist
    if (!document.getElementById('theme-manager-css')) {
      const style = document.createElement('style');
      style.id = 'theme-manager-css';
      style.textContent = `
        .theme-color { background-color: var(--theme-background) !important; }
        .theme-gradient { background-image: var(--theme-background) !important; }
        .theme-image, .theme-video {
          position: relative;
        }
        .theme-image::before, .theme-video::before {
          content: '';
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: -1;
          background-color: var(--theme-overlay-color, rgba(0, 0, 0, 0));
          opacity: var(--theme-overlay-opacity, 0);
        }
        .theme-image::after {
          content: '';
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: -2;
          background-image: var(--theme-background);
          background-size: cover;
          background-position: center;
          filter: blur(var(--theme-blur, 0px));
        }
        .theme-video .bg-video {
          position: fixed;
          right: 0;
          bottom: 0;
          min-width: 100%;
          min-height: 100%;
          width: auto;
          height: auto;
          z-index: -2;
          object-fit: cover;
          filter: blur(var(--theme-blur, 0px));
        }
      `;
      document.head.appendChild(style);
    }
    
    // Handle video background
    const existingVideo = document.querySelector('.bg-video') as HTMLVideoElement;
    if (theme.type === 'video') {
      if (!existingVideo) {
        const video = document.createElement('video');
        video.className = 'bg-video';
        video.src = theme.value;
        video.autoplay = true;
        video.loop = true;
        video.muted = true;
        video.playsInline = true;
        document.body.appendChild(video);
      } else {
        existingVideo.src = theme.value;
      }
    } else if (existingVideo) {
      existingVideo.remove();
    }
  }, [activeTheme, themes]);
  
  const handleAddTheme = () => {
    if (!newTheme.name.trim()) {
      toast({
        title: 'Theme Name Required',
        description: 'Please enter a name for your theme.',
        variant: 'destructive',
      });
      return;
    }
    
    const id = `theme-${Date.now()}`;
    const theme: Theme = {
      id,
      ...newTheme,
    };
    
    setThemes((prev: Theme[]) => [...prev, theme]);
    setActiveTheme(id);
    setIsDialogOpen(false);
    setNewTheme({
      name: '',
      type: 'color',
      value: '#f8fafc',
    });
    
    toast({
      title: 'Theme Added',
      description: `Your "${newTheme.name}" theme has been created and applied.`,
    });
  };
  
  const handleDeleteTheme = (id: string) => {
    const theme = themes.find(t => t.id === id);
    if (!theme) return;
    
    // Don't allow deleting default themes
    if (['default', 'dark', 'ocean'].includes(id)) {
      toast({
        title: 'Cannot Delete Default Theme',
        description: 'Default themes cannot be deleted.',
        variant: 'destructive',
      });
      return;
    }
    
    setThemes((prev: Theme[]) => prev.filter((t: Theme) => t.id !== id));
    
    // If the active theme is deleted, switch to default
    if (activeTheme === id) {
      setActiveTheme('default');
    }
    
    toast({
      title: 'Theme Deleted',
      description: `"${theme.name}" theme has been deleted.`,
    });
  };
  
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const imageUrl = event.target?.result as string;
      setNewTheme(prev => ({
        ...prev,
        type: 'image',
        value: imageUrl,
        overlay: { color: '#000000', opacity: 0.3 },
        blur: 0,
      }));
    };
    reader.readAsDataURL(file);
  };
  
  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const videoUrl = event.target?.result as string;
      setNewTheme(prev => ({
        ...prev,
        type: 'video',
        value: videoUrl,
        overlay: { color: '#000000', opacity: 0.3 },
        blur: 0,
      }));
    };
    reader.readAsDataURL(file);
  };
  
  const updateThemeSettings = (themeId: string) => {
    const theme = themes.find(t => t.id === themeId);
    if (!theme) return;
    
    setSelectedThemeId(themeId);
    setNewTheme({
      name: theme.name,
      type: theme.type,
      value: theme.value,
      overlay: theme.overlay,
      blur: theme.blur,
    });
    
    setIsDialogOpen(true);
  };
  
  const handleSaveThemeSettings = () => {
    if (!selectedThemeId) return;
    
    setThemes((prev: Theme[]) => prev.map((theme: Theme) => 
      theme.id === selectedThemeId 
        ? { 
            ...theme, 
            name: newTheme.name,
            value: newTheme.value, 
            overlay: newTheme.overlay, 
            blur: newTheme.blur 
          } 
        : theme
    ));
    
    setIsDialogOpen(false);
    setSelectedThemeId(null);
    
    toast({
      title: 'Theme Updated',
      description: `Your "${newTheme.name}" theme has been updated.`,
    });
  };
  
  return (
    <div className="relative">
      <Popover open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="flex items-center">
            <PaintBucket className="h-4 w-4 mr-2" /> Theme
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-4" align="end">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Theme Manager</h3>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsSettingsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="theme-selector">Current Theme</Label>
              <Select
                value={activeTheme}
                onValueChange={setActiveTheme}
              >
                <SelectTrigger id="theme-selector">
                  <SelectValue placeholder="Select a theme" />
                </SelectTrigger>
                <SelectContent>
                  {themes.map((theme) => (
                    <SelectItem key={theme.id} value={theme.id}>
                      {theme.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Your Themes</Label>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => {
                    setSelectedThemeId(null);
                    setNewTheme({
                      name: '',
                      type: 'color',
                      value: '#f8fafc',
                    });
                    setIsDialogOpen(true);
                  }}
                >
                  <Plus className="h-4 w-4 mr-1" /> New Theme
                </Button>
              </div>
              
              <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                {themes.map((theme) => (
                  <div 
                    key={theme.id}
                    className={cn(
                      "flex items-center justify-between p-2 rounded border",
                      activeTheme === theme.id ? "border-primary" : "border-border"
                    )}
                  >
                    <div className="flex items-center">
                      <div 
                        className={cn(
                          "size-6 rounded mr-2 flex-shrink-0",
                          theme.type === 'gradient' && "bg-gradient-to-br from-blue-400 to-purple-500",
                          theme.type === 'color' && "bg-background"
                        )}
                        style={
                          theme.type === 'color' 
                            ? { backgroundColor: theme.value }
                            : theme.type === 'gradient'
                            ? { backgroundImage: theme.value }
                            : theme.type === 'image' || theme.type === 'video'
                            ? { backgroundImage: `url(${theme.value})`, backgroundSize: 'cover' }
                            : {}
                        }
                      >
                        {theme.type === 'video' && <Video className="size-4 text-white" />}
                      </div>
                      <span className="text-sm font-medium truncate max-w-[100px]">
                        {theme.name}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="size-6"
                        onClick={() => setActiveTheme(theme.id)}
                      >
                        <div className={cn(
                          "size-2 rounded-full",
                          activeTheme === theme.id ? "bg-primary" : "bg-border"
                        )} />
                      </Button>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="size-6"
                        onClick={() => updateThemeSettings(theme.id)}
                      >
                        <Settings className="size-3" />
                      </Button>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="size-6 text-destructive"
                        onClick={() => handleDeleteTheme(theme.id)}
                        disabled={['default', 'dark', 'ocean'].includes(theme.id)}
                      >
                        <Trash2 className="size-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedThemeId ? 'Edit Theme' : 'Create New Theme'}</DialogTitle>
            <DialogDescription>
              Customize your theme settings.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="theme-name">Theme Name</Label>
              <Input
                id="theme-name"
                placeholder="My Custom Theme"
                value={newTheme.name}
                onChange={(e) => setNewTheme(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            
            <Tabs 
              defaultValue={newTheme.type} 
              value={newTheme.type}
              onValueChange={(value) => setNewTheme(prev => ({ 
                ...prev, 
                type: value as Theme['type'],
                value: value === 'color' ? '#f8fafc' : 
                       value === 'gradient' ? 'linear-gradient(to right, #00c6ff, #0072ff)' :
                       prev.value
              }))}
            >
              <TabsList className="grid grid-cols-4">
                <TabsTrigger value="color" className="text-xs">Color</TabsTrigger>
                <TabsTrigger value="gradient" className="text-xs">Gradient</TabsTrigger>
                <TabsTrigger value="image" className="text-xs">Image</TabsTrigger>
                <TabsTrigger value="video" className="text-xs">Video</TabsTrigger>
              </TabsList>
              
              <TabsContent value="color" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="color-picker">Background Color</Label>
                  <div className="flex items-center space-x-2">
                    <div
                      className="size-8 rounded border border-border cursor-pointer"
                      style={{ backgroundColor: newTheme.value }}
                      onClick={() => document.getElementById('color-picker')?.click()}
                    />
                    <Input
                      id="color-picker"
                      type="color"
                      value={newTheme.value}
                      onChange={(e) => setNewTheme(prev => ({ ...prev, value: e.target.value }))}
                      className="sr-only"
                    />
                    <Input
                      value={newTheme.value}
                      onChange={(e) => setNewTheme(prev => ({ ...prev, value: e.target.value }))}
                      className="w-32"
                    />
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="gradient" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Gradient CSS</Label>
                  <Input
                    placeholder="linear-gradient(to right, #00c6ff, #0072ff)"
                    value={newTheme.value}
                    onChange={(e) => setNewTheme(prev => ({ ...prev, value: e.target.value }))}
                  />
                  <div className="h-16 rounded-lg border border-border overflow-hidden">
                    <div 
                      className="w-full h-full" 
                      style={{ backgroundImage: newTheme.value }}
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    Enter a CSS gradient like: linear-gradient(to right, #00c6ff, #0072ff)
                  </p>
                </div>
              </TabsContent>
              
              <TabsContent value="image" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Background Image</Label>
                  <div className="grid gap-4">
                    <div className="h-40 rounded-lg border border-border overflow-hidden bg-gray-100">
                      {newTheme.value && newTheme.type === 'image' ? (
                        <img 
                          src={newTheme.value} 
                          alt="Background preview" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <p className="text-sm text-gray-500">
                            No image selected
                          </p>
                        </div>
                      )}
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="size-4 mr-2" /> Upload Image
                    </Button>
                  </div>
                  
                  {newTheme.type === 'image' && (
                    <>
                      <div className="space-y-2 mt-4">
                        <Label>Overlay Color</Label>
                        <div className="flex items-center space-x-2">
                          <div
                            className="size-8 rounded border border-border cursor-pointer"
                            style={{ backgroundColor: newTheme.overlay?.color || '#000000' }}
                            onClick={() => document.getElementById('overlay-color-picker')?.click()}
                          />
                          <Input
                            id="overlay-color-picker"
                            type="color"
                            value={newTheme.overlay?.color || '#000000'}
                            onChange={(e) => setNewTheme(prev => ({ 
                              ...prev, 
                              overlay: { 
                                ...(prev.overlay || { opacity: 0.3 }), 
                                color: e.target.value 
                              } 
                            }))}
                            className="sr-only"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>Overlay Opacity</Label>
                          <span className="text-xs">
                            {Math.round((newTheme.overlay?.opacity || 0) * 100)}%
                          </span>
                        </div>
                        <Slider
                          value={[(newTheme.overlay?.opacity || 0) * 100]}
                          min={0}
                          max={100}
                          step={5}
                          onValueChange={(values) => setNewTheme(prev => ({ 
                            ...prev, 
                            overlay: { 
                              ...(prev.overlay || { color: '#000000' }), 
                              opacity: values[0] / 100 
                            } 
                          }))}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>Blur Effect</Label>
                          <span className="text-xs">
                            {newTheme.blur || 0}px
                          </span>
                        </div>
                        <Slider
                          value={[newTheme.blur || 0]}
                          min={0}
                          max={20}
                          step={1}
                          onValueChange={(values) => setNewTheme(prev => ({ 
                            ...prev, 
                            blur: values[0]
                          }))}
                        />
                      </div>
                    </>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="video" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Background Video</Label>
                  <div className="grid gap-4">
                    <div className="h-40 rounded-lg border border-border overflow-hidden bg-gray-100">
                      {newTheme.value && newTheme.type === 'video' ? (
                        <video 
                          src={newTheme.value} 
                          className="w-full h-full object-cover"
                          autoPlay
                          loop
                          muted
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <p className="text-sm text-gray-500">
                            No video selected
                          </p>
                        </div>
                      )}
                    </div>
                    <input
                      ref={videoInputRef}
                      type="file"
                      accept="video/*"
                      onChange={handleVideoUpload}
                      className="hidden"
                    />
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => videoInputRef.current?.click()}
                    >
                      <Upload className="size-4 mr-2" /> Upload Video
                    </Button>
                  </div>
                  
                  {newTheme.type === 'video' && (
                    <>
                      <div className="space-y-2 mt-4">
                        <Label>Overlay Color</Label>
                        <div className="flex items-center space-x-2">
                          <div
                            className="size-8 rounded border border-border cursor-pointer"
                            style={{ backgroundColor: newTheme.overlay?.color || '#000000' }}
                            onClick={() => document.getElementById('video-overlay-color-picker')?.click()}
                          />
                          <Input
                            id="video-overlay-color-picker"
                            type="color"
                            value={newTheme.overlay?.color || '#000000'}
                            onChange={(e) => setNewTheme(prev => ({ 
                              ...prev, 
                              overlay: { 
                                ...(prev.overlay || { opacity: 0.3 }), 
                                color: e.target.value 
                              } 
                            }))}
                            className="sr-only"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>Overlay Opacity</Label>
                          <span className="text-xs">
                            {Math.round((newTheme.overlay?.opacity || 0) * 100)}%
                          </span>
                        </div>
                        <Slider
                          value={[(newTheme.overlay?.opacity || 0) * 100]}
                          min={0}
                          max={100}
                          step={5}
                          onValueChange={(values) => setNewTheme(prev => ({ 
                            ...prev, 
                            overlay: { 
                              ...(prev.overlay || { color: '#000000' }), 
                              opacity: values[0] / 100 
                            } 
                          }))}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>Blur Effect</Label>
                          <span className="text-xs">
                            {newTheme.blur || 0}px
                          </span>
                        </div>
                        <Slider
                          value={[newTheme.blur || 0]}
                          min={0}
                          max={20}
                          step={1}
                          onValueChange={(values) => setNewTheme(prev => ({ 
                            ...prev, 
                            blur: values[0]
                          }))}
                        />
                      </div>
                    </>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline"
              onClick={() => {
                setIsDialogOpen(false);
                setSelectedThemeId(null);
              }}
            >
              Cancel
            </Button>
            <Button 
              type="button"
              onClick={selectedThemeId ? handleSaveThemeSettings : handleAddTheme}
            >
              <Save className="size-4 mr-2" />
              {selectedThemeId ? 'Save Changes' : 'Create Theme'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}