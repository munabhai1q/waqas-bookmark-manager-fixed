import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { BookmarkCategory } from '@/lib/types';
import { deleteCategory } from '@/lib/hooks';
import { Plus, Trash2, Edit, Save, X, FolderPlus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function CategoryManager() {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<BookmarkCategory | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch categories
  const { data: categories = [], isLoading } = useQuery<BookmarkCategory[]>({
    queryKey: ['/api/categories'],
    retry: 1,
    staleTime: 0
  });

  // Add category mutation
  const addCategoryMutation = useMutation({
    mutationFn: async (name: string) => {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create category');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      toast({
        title: 'Category Created',
        description: 'Your new category has been created successfully.',
      });
      setNewCategoryName('');
      setIsOpen(false);
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to create the category. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Update category mutation
  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, name }: { id: number; name: string }) => {
      const response = await fetch(`/api/categories/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update category');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      toast({
        title: 'Category Updated',
        description: 'The category has been updated successfully.',
      });
      setSelectedCategory(null);
      setNewCategoryName('');
      setIsOpen(false);
      setIsEditMode(false);
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update the category. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Delete category mutation
  const deleteCategoryMutation = useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      queryClient.invalidateQueries({ queryKey: ['/api/bookmarks'] });
      toast({
        title: 'Category Deleted',
        description: 'The category and all its bookmarks have been deleted.',
      });
      setIsDeleteDialogOpen(false);
      setSelectedCategory(null);
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to delete the category. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) {
      toast({
        title: 'Category Name Required',
        description: 'Please enter a name for your category.',
        variant: 'destructive',
      });
      return;
    }

    addCategoryMutation.mutate(newCategoryName);
  };

  const handleUpdateCategory = () => {
    if (!selectedCategory) return;
    
    if (!newCategoryName.trim()) {
      toast({
        title: 'Category Name Required',
        description: 'Please enter a name for your category.',
        variant: 'destructive',
      });
      return;
    }

    updateCategoryMutation.mutate({
      id: selectedCategory.id,
      name: newCategoryName,
    });
  };

  const handleDeleteCategory = () => {
    if (!selectedCategory) return;
    deleteCategoryMutation.mutate(selectedCategory.id);
  };

  const openEditDialog = (category: BookmarkCategory) => {
    setSelectedCategory(category);
    setNewCategoryName(category.name);
    setIsEditMode(true);
    setIsOpen(true);
  };

  const openDeleteDialog = (category: BookmarkCategory) => {
    setSelectedCategory(category);
    setIsDeleteDialogOpen(true);
  };

  const closeDialog = () => {
    setIsOpen(false);
    setIsEditMode(false);
    setSelectedCategory(null);
    setNewCategoryName('');
  };

  // Filter categories by search query
  const filteredCategories = categories.filter(category => 
    category.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="flex items-center space-x-2">
            <FolderPlus className="h-4 w-4" />
            <span>Manage Categories</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-4" align="end">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Categories</h3>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8"
                onClick={() => {
                  setIsEditMode(false);
                  setNewCategoryName('');
                  setIsOpen(true);
                }}
              >
                <Plus className="h-4 w-4 mr-1" />
                <span>Add</span>
              </Button>
            </div>

            <div className="relative">
              <Input
                placeholder="Search categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
              <div className="absolute top-3 left-3 text-gray-400">
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 6.5C10 8.433 8.433 10 6.5 10C4.567 10 3 8.433 3 6.5C3 4.567 4.567 3 6.5 3C8.433 3 10 4.567 10 6.5ZM9.30884 10.0159C8.53901 10.6318 7.56251 11 6.5 11C4.01472 11 2 8.98528 2 6.5C2 4.01472 4.01472 2 6.5 2C8.98528 2 11 4.01472 11 6.5C11 7.56251 10.6318 8.53901 10.0159 9.30884L12.8536 12.1464C13.0488 12.3417 13.0488 12.6583 12.8536 12.8536C12.6583 13.0488 12.3417 13.0488 12.1464 12.8536L9.30884 10.0159Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path></svg>
              </div>
            </div>

            <div className="max-h-56 overflow-y-auto pr-1">
              {isLoading ? (
                <div className="py-4 text-center text-gray-500">Loading categories...</div>
              ) : filteredCategories.length === 0 ? (
                <div className="py-4 text-center text-gray-500">
                  {searchQuery ? 'No matches found' : 'No categories yet'}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredCategories.map((category) => (
                    <div 
                      key={category.id}
                      className="flex items-center justify-between py-2 px-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md"
                    >
                      <span className="font-medium truncate max-w-[160px]">
                        {category.name}
                      </span>
                      <div className="flex space-x-1">
                        <Button 
                          size="icon" 
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() => openEditDialog(category)}
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button 
                          size="icon" 
                          variant="ghost"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => openDeleteDialog(category)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Dialog for adding/editing categories */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{isEditMode ? 'Edit Category' : 'Add New Category'}</DialogTitle>
            <DialogDescription>
              {isEditMode 
                ? 'Update the category name.' 
                : 'Create a new category to organize your bookmarks.'}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="categoryName">Category Name</Label>
                <Input
                  id="categoryName"
                  placeholder="Enter category name"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  autoFocus
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={closeDialog}
            >
              Cancel
            </Button>
            <Button 
              onClick={isEditMode ? handleUpdateCategory : handleAddCategory}
              disabled={addCategoryMutation.isPending || updateCategoryMutation.isPending}
            >
              {isEditMode ? (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {updateCategoryMutation.isPending ? 'Saving...' : 'Save Changes'}
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  {addCategoryMutation.isPending ? 'Adding...' : 'Add Category'}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Alert dialog for deleting categories */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the category "{selectedCategory?.name}" and all bookmarks within it.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteCategory}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteCategoryMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}