import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Bookmark, Loader2 } from 'lucide-react';

interface SaveComparisonDialogProps {
  onSave: (name: string) => void;
  isSaving: boolean;
  disabled?: boolean;
}

export function SaveComparisonDialog({ onSave, isSaving, disabled }: SaveComparisonDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');

  const handleSave = () => {
    if (name.trim()) {
      onSave(name.trim());
      setName('');
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" disabled={disabled}>
          <Bookmark className="h-4 w-4 mr-2" />
          Save
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Save Comparison</DialogTitle>
          <DialogDescription>
            Give this comparison a name for quick access later.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <div className="space-y-2">
            <Label htmlFor="comparison-name">Name</Label>
            <Input
              id="comparison-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Monthly CBC Trend"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && name.trim()) {
                  handleSave();
                }
              }}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!name.trim() || isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Comparison'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
