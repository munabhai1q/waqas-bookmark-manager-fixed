import { useState } from 'react';
import { BookmarkCategory, Bookmark } from '@/lib/types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteBookmark } from '@/lib/hooks';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronDown, ChevronRight, Trash2, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CategorySectionProps {
  category: BookmarkCategory;
  onSelectBookmark: (bookmark: Bookmark) => void;
  currentBookmarkId?: number;
}

export default function CategorySection({ 
  category, 
  onSelectBookmark,
  currentBookmarkId
}: CategorySectionProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: bookmarks, isLoading } = useQuery<Bookmark[]>({
    queryKey: ['/api/bookmarks/category', category.id],
    retry: 1
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteBookmark(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bookmarks/category', category.id] });
      toast({
        title: "Bookmark deleted",
        description: "The bookmark has been removed from your list.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete bookmark. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleDeleteBookmark = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    deleteMutation.mutate(id);
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="p-3 border-b border-gray-100">
      <div 
        className="flex items-center justify-between cursor-pointer mb-2"
        onClick={toggleExpand}
      >
        <span className="font-medium text-gray-700 flex items-center">
          <i className="fas fa-folder mr-2 text-primary"></i> {category.name}
        </span>
        {isExpanded ? 
          <ChevronDown className="h-4 w-4 text-gray-500" /> : 
          <ChevronRight className="h-4 w-4 text-gray-500" />
        }
      </div>
      
      {isExpanded && (
        <div className="ml-6 py-1 space-y-1">
          {isLoading ? (
            <>
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </>
          ) : bookmarks && bookmarks.length > 0 ? (
            bookmarks.map(bookmark => (
              <div 
                key={bookmark.id} 
                className={`flex items-center justify-between text-sm hover:bg-gray-100 p-2 rounded-lg cursor-pointer text-gray-700 transition-colors group ${currentBookmarkId === bookmark.id ? 'bg-gray-100' : ''}`}
                onClick={() => onSelectBookmark(bookmark)}
              >
                <div className="flex items-center overflow-hidden">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2 flex-shrink-0"></div>
                  <span className="truncate">{bookmark.title}</span>
                </div>
                <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    className="p-1 rounded hover:bg-gray-200"
                    onClick={(e) => handleDeleteBookmark(e, bookmark.id)}
                    aria-label="Delete bookmark"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-gray-500" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-sm text-gray-500 italic p-2">No bookmarks in this category</div>
          )}
        </div>
      )}
    </div>
  );
}
