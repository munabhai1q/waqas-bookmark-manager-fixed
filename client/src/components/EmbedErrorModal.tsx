import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

interface EmbedErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
}

export default function EmbedErrorModal({ isOpen, onClose, url }: EmbedErrorModalProps) {
  const handleOpenInNewTab = () => {
    window.open(url, '_blank');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-red-600 flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Embedding Error
          </DialogTitle>
          <DialogDescription>
            Unable to display this website in the embedded frame.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <div className="flex items-start mb-4">
            <div className="flex-shrink-0 text-red-500 mr-3">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-gray-800">
                The website you're trying to embed has X-Frame-Options that prevent it from being displayed in an iframe.
              </p>
            </div>
          </div>
          
          <p className="text-sm text-gray-600 mb-4">
            Some websites have security restrictions that prevent them from being embedded in other websites. This is often done to protect against clickjacking attacks.
          </p>
          
          <p className="text-sm text-gray-600 mb-4">
            You can still access this site by opening it in a new tab.
          </p>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleOpenInNewTab}>
            Open in New Tab
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
