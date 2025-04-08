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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bookmarks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/bookmarks/category'] });
      toast({
        title: "बुकमार्क जोड़ा गया",
        description: "आपका नया बुकमार्क सफलतापूर्वक जोड़ा गया है।"
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "त्रुटि",
        description: "बुकमार्क जोड़ने में विफल। कृपया पुनः प्रयास करें।",
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
        title: "श्रेणी जोड़ी गई",
        description: "आपकी नई श्रेणी बना दी गई है।"
      });
      setIsAddingCategory(false);
      setCategoryId(String(newCategory.id));
    },
    onError: (error) => {
      toast({
        title: "त्रुटि",
        description: "श्रेणी जोड़ने में विफल। कृपया पुनः प्रयास करें।",
        variant: "destructive"
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url || !title || !categoryId) {
      toast({
        title: "फील्ड अनुपलब्ध",
        description: "कृपया सभी आवश्यक फील्ड भरें।",
        variant: "destructive"
      });
      return;
    }

    // Validate URL
    try {
      new URL(url); // This will throw if URL is invalid
    } catch (error) {
      toast({
        title: "अमान्य URL",
        description: "कृपया http:// या https:// के साथ एक मान्य URL दर्ज करें",
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
        title: "खाली श्रेणी नाम",
        description: "कृपया एक श्रेणी नाम दर्ज करें।",
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
          <DialogTitle>नया बुकमार्क जोड़ें</DialogTitle>
          <DialogDescription>
            अपने बुकमार्क कलेक्शन में एक वेबसाइट जोड़ें।
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="url">वेबसाइट URL</Label>
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
            <Label htmlFor="title">शीर्षक</Label>
            <Input 
              id="title" 
              type="text" 
              placeholder="मेरा बुकमार्क" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="category">श्रेणी</Label>
            {isAddingCategory ? (
              <div className="flex gap-2">
                <Input 
                  id="newCategory" 
                  placeholder="नई श्रेणी का नाम" 
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                />
                <Button 
                  type="button" 
                  onClick={handleAddCategory}
                  disabled={addCategoryMutation.isPending}
                >
                  जोड़ें
                </Button>
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => setIsAddingCategory(false)}
                >
                  रद्द करें
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="श्रेणी चुनें" />
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
                  <PlusCircle className="h-4 w-4 mr-1" /> नई
                </Button>
              </div>
            )}
          </div>
          
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="description">विवरण (वैकल्पिक)</Label>
            <Textarea 
              id="description" 
              placeholder="विवरण जोड़ें..." 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>
          
          <DialogFooter className="sm:justify-end">
            <Button type="button" variant="outline" onClick={onClose}>
              रद्द करें
            </Button>
            <Button type="submit" disabled={addBookmarkMutation.isPending}>
              {addBookmarkMutation.isPending ? "जोड़ रहा है..." : "बुकमार्क जोड़ें"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
