import { useState, useEffect } from 'react';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { BookmarkCategory, NewBookmark } from '@/lib/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { addNewBookmark, addNewCategory } from '@/lib/hooks';
import { PlusCircle } from 'lucide-react';

interface AddBookmarkModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddBookmarkModal({ isOpen, onClose }: AddBookmarkModalProps) {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Reset form when modal is opened
  useEffect(() => {
    if (isOpen) {
      setUrl('');
      setTitle('');
      setDescription('');
      setCategoryId('');
      setIsAddingCategory(false);
      setNewCategoryName('');
    }
  }, [isOpen]);

  // Fetch categories
  const { data: categories } = useQuery<BookmarkCategory[]>({
    queryKey: ['/api/categories'],
    retry: 1
  });

  // Add bookmark mutation
  const addBookmarkMutation = useMutation({
    mutationFn: (newBookmark: NewBookmark) => addNewBookmark(newBookmark),
    onSuccess: (data) => {
      // Invalidate all bookmarks queries
      queryClient.invalidateQueries({ queryKey: ['/api/bookmarks'] });
      // Invalidate the specific category's bookmarks
      queryClient.invalidateQueries({ queryKey: ['/api/bookmarks/category', data.categoryId] });
      // Invalidate all category bookmark queries (for good measure)
      queryClient.invalidateQueries({ queryKey: ['/api/bookmarks/category'] });
      toast({
        title: "Bookmark Added",
        description: "Your new bookmark has been successfully added."
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add bookmark. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Add category mutation
  const addCategoryMutation = useMutation({
    mutationFn: (name: string) => addNewCategory({ name }),
    onSuccess: (newCategory) => {
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      toast({
        title: "Category Added",
        description: "Your new category has been created."
      });
      setIsAddingCategory(false);
      setCategoryId(String(newCategory.id));
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add category. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url || !title || !categoryId) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    // Validate URL
    try {
      new URL(url); // This will throw if URL is invalid
    } catch (error) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid URL with http:// or https://",
        variant: "destructive"
      });
      return;
    }

    const newBookmark: NewBookmark = {
      url,
      title,
      description: description || undefined,
      categoryId: parseInt(categoryId)
    };

    addBookmarkMutation.mutate(newBookmark);
  };

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) {
      toast({
        title: "Empty Category Name",
        description: "Please enter a category name.",
        variant: "destructive"
      });
      return;
    }

    addCategoryMutation.mutate(newCategoryName.trim());
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Bookmark</DialogTitle>
          <DialogDescription>
            Add a website to your bookmark collection.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="url">Website URL</Label>
            <Input 
              id="url" 
              type="url" 
              placeholder="https://example.com" 
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
            />
          </div>
          
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="title">Title</Label>
            <Input 
              id="title" 
              type="text" 
              placeholder="My Bookmark" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="category">Category</Label>
            {isAddingCategory ? (
              <div className="flex gap-2">
                <Input 
                  id="newCategory" 
                  placeholder="New Category Name" 
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                />
                <Button 
                  type="button" 
                  onClick={handleAddCategory}
                  disabled={addCategoryMutation.isPending}
                >
                  Add
                </Button>
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => setIsAddingCategory(false)}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories?.map(category => (
                      <SelectItem key={category.id} value={String(category.id)}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsAddingCategory(true)}
                  className="shrink-0"
                >
                  <PlusCircle className="h-4 w-4 mr-1" /> New
                </Button>
              </div>
            )}
          </div>
          
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea 
              id="description" 
              placeholder="Add description..." 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>
          
          <DialogFooter className="sm:justify-end">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={addBookmarkMutation.isPending}>
              {addBookmarkMutation.isPending ? "Adding..." : "Add Bookmark"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
