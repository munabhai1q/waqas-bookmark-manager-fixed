import { useState, useEffect } from 'react';
import { Bookmark, BookmarkCategory } from '@/lib/types';
import { useQuery } from '@tanstack/react-query';
import { useMobile } from '@/lib/hooks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import CategorySection from './CategorySection';
import { Search, Plus, Menu, X, FolderPlus } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

interface SidebarProps {
  onSelectBookmark: (bookmark: Bookmark) => void;
  onAddBookmark: () => void;
  currentBookmarkId?: number;
}

export default function Sidebar({ 
  onSelectBookmark, 
  onAddBookmark,
  currentBookmarkId
}: SidebarProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const isMobile = useMobile();
  const [key, setKey] = useState(0); // Add a key for forcing re-render

  // Fetch categories
  const { data: categories, isLoading: isLoadingCategories } = useQuery<BookmarkCategory[]>({
    queryKey: ['/api/categories'],
    retry: 1,
    staleTime: 0 // Always refetch categories when component mounts
  });

  // Fetch all bookmarks for search
  const { data: bookmarks, refetch: refetchBookmarks } = useQuery<Bookmark[]>({
    queryKey: ['/api/bookmarks'],
    retry: 1,
    staleTime: 0, // Always refetch bookmarks when component mounts
    refetchOnWindowFocus: true // Also refetch on window focus
  });
  
  // Effect to refetch data when Home component passes in a new bookmark
  useEffect(() => {
    if (currentBookmarkId) {
      refetchBookmarks();
      setKey(prev => prev + 1); // Force re-render
    }
  }, [currentBookmarkId, refetchBookmarks]);

  const toggleSidebar = () => {
    setIsVisible(!isVisible);
  };

  // Filter bookmarks by search query
  const filteredCategories = categories?.filter(category => {
    if (!searchQuery.trim()) return true;
    
    // Check if any bookmark in this category matches the search query
    const categoryBookmarks = bookmarks?.filter(bookmark => 
      bookmark.categoryId === category.id && 
      (bookmark.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
       bookmark.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
       (bookmark.description && bookmark.description.toLowerCase().includes(searchQuery.toLowerCase())))
    );
    
    return categoryBookmarks && categoryBookmarks.length > 0;
  });

  return (
    <>
      {/* Mobile menu button */}
      {isMobile && (
        <button 
          onClick={toggleSidebar}
          className="fixed top-3 left-4 z-20 text-gray-500 hover:text-gray-700"
          aria-label={isVisible ? "Close sidebar" : "Open sidebar"}
        >
          {isVisible ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      )}

      <aside 
        className={`w-64 bg-white border-r border-gray-200 h-full flex flex-col z-10 transition-all duration-300 ${
          isMobile && !isVisible ? '-ml-64' : 'ml-0'
        } ${isMobile ? 'fixed' : 'relative'}`}
      >
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-primary flex items-center">
              <i className="fas fa-bookmark mr-2"></i> WAQAS BOOKMARK
            </h1>
            {isMobile && (
              <button 
                onClick={toggleSidebar}
                className="text-gray-500 hover:text-gray-700"
                aria-label="Close sidebar"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
        
        <div className="p-4 border-b border-gray-200">
          <div className="grid grid-cols-2 gap-2">
            <Button 
              onClick={onAddBookmark} 
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" /> Add Bookmark
            </Button>
            <Button 
              onClick={() => {
                const name = prompt("Enter name for new section:");
                if (name) {
                  // Import directly to avoid circular dependencies
                  import('@/lib/hooks').then(({ addNewCategory }) => {
                    addNewCategory({ name }).then(() => {
                      // Force refresh categories
                      setKey(prev => prev + 1);
                    });
                  });
                }
              }} 
              className="w-full bg-gradient-to-r from-red-500 to-black hover:from-red-600 hover:to-black"
            >
              <FolderPlus className="h-4 w-4 mr-2" /> New Section
            </Button>
          </div>
        </div>
        
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
            <Input 
              type="text" 
              placeholder="Search bookmarks..." 
              className="w-full pl-9 pr-4"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        <div className="overflow-y-auto flex-grow">
          {isLoadingCategories ? (
            <div className="p-4 space-y-6">
              <Skeleton className="h-6 w-3/4" />
              <div className="ml-6 space-y-2">
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-full" />
              </div>
              <Skeleton className="h-6 w-3/4" />
              <div className="ml-6 space-y-2">
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-full" />
              </div>
            </div>
          ) : filteredCategories && filteredCategories.length > 0 ? (
            filteredCategories.map(category => (
              <CategorySection 
                key={category.id} 
                category={category} 
                onSelectBookmark={onSelectBookmark}
                currentBookmarkId={currentBookmarkId}
              />
            ))
          ) : (
            <div className="p-4 text-center text-gray-500">
              {searchQuery ? 'No matches found' : 'No categories yet'}
            </div>
          )}
        </div>
        
        <Separator />
        <div className="p-4 mt-auto">
          <div className="flex items-center">
            <Avatar className="h-8 w-8 mr-3">
              <AvatarImage src="https://github.com/shadcn.png" />
              <AvatarFallback>DU</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">Demo User</p>
              <p className="text-xs text-gray-500">demo@example.com</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
