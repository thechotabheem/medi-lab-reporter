import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Bookmark, Trash2, Clock, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import type { SavedComparison } from '@/hooks/useSavedComparisons';

interface SavedComparisonsListProps {
  savedComparisons: SavedComparison[];
  isLoading: boolean;
  onLoad: (comparison: SavedComparison) => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}

export function SavedComparisonsList({
  savedComparisons,
  isLoading,
  onLoad,
  onDelete,
  isDeleting,
}: SavedComparisonsListProps) {
  const [open, setOpen] = useState(false);

  const handleLoad = (comparison: SavedComparison) => {
    onLoad(comparison);
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          <Bookmark className="h-4 w-4 mr-2" />
          Saved ({savedComparisons?.length || 0})
        </Button>
      </SheetTrigger>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Saved Comparisons</SheetTitle>
          <SheetDescription>
            Load a previously saved comparison configuration.
          </SheetDescription>
        </SheetHeader>
        
        <ScrollArea className="h-[calc(100vh-180px)] mt-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : savedComparisons?.length === 0 ? (
            <div className="text-center py-8">
              <Bookmark className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No saved comparisons yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Save a comparison to quickly access it later.
              </p>
            </div>
          ) : (
            <div className="space-y-3 pr-4">
              {savedComparisons?.map((comparison) => (
                <Card 
                  key={comparison.id} 
                  className="cursor-pointer hover:border-primary/50 transition-colors group"
                  onClick={() => handleLoad(comparison)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h4 className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                          {comparison.name}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-2xs">
                            {comparison.comparison_mode === 'dual' ? '2 Reports' : 'Multi-Report'}
                          </Badge>
                          <span className="text-2xs text-muted-foreground">
                            {comparison.report_ids.length} reports
                          </span>
                        </div>
                        <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{format(new Date(comparison.created_at), 'MMM d, yyyy')}</span>
                        </div>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete saved comparison?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete "{comparison.name}".
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => onDelete(comparison.id)}
                              disabled={isDeleting}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              {isDeleting ? 'Deleting...' : 'Delete'}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
