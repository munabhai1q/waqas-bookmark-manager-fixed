import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface AddSectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddSection: (id: string, name: string) => void;
}

export default function AddSectionModal({ isOpen, onClose, onAddSection }: AddSectionModalProps) {
  const [name, setName] = useState("");
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast({
        title: "Error",
        description: "Section name cannot be empty",
        variant: "destructive"
      });
      return;
    }
    
    // Generate an ID from the name - lowercase, no spaces, no special chars
    const id = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    onAddSection(id, name);
    setName("");
    onClose();
    
    toast({
      title: "Section added",
      description: `"${name}" section has been added successfully.`
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold gradient-text">Add New Section</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid w-full items-center gap-2">
            <Label htmlFor="section-name" className="text-left">
              Section Name
            </Label>
            <Input 
              id="section-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter section name"
              className="w-full"
              autoFocus
            />
          </div>
          
          <DialogFooter className="flex justify-end space-x-2 pt-4">
            <Button 
              type="button" 
              variant="outline"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              className="bg-gradient-to-r from-red-500 to-black hover:from-red-600 hover:to-gray-900 text-white"
            >
              Add Section
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}