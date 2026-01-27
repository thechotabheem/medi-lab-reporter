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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Copy, FileText, Loader2 } from 'lucide-react';
import { activeReportTypes, getReportTypeName } from '@/lib/report-templates';
import type { ReportType } from '@/types/database';

interface CloneTemplateDialogProps {
  currentTemplate: ReportType;
  onClone: (sourceTemplate: ReportType) => void;
  isCloning?: boolean;
}

export const CloneTemplateDialog = ({
  currentTemplate,
  onClone,
  isCloning = false,
}: CloneTemplateDialogProps) => {
  const [open, setOpen] = useState(false);
  const [selectedSource, setSelectedSource] = useState<ReportType | ''>('');

  const availableTemplates = activeReportTypes.filter(
    (type) => type !== currentTemplate
  );

  const handleClone = () => {
    if (selectedSource) {
      onClone(selectedSource);
      setOpen(false);
      setSelectedSource('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Copy className="h-4 w-4" />
          Clone From...
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Copy className="h-5 w-5 text-primary" />
            Clone Template Customizations
          </DialogTitle>
          <DialogDescription>
            Copy customizations from another template to use as a starting point for{' '}
            <span className="font-medium text-foreground">
              {getReportTypeName(currentTemplate)}
            </span>
            .
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <label className="text-sm font-medium mb-2 block">
            Clone customizations from:
          </label>
          <Select
            value={selectedSource}
            onValueChange={(value) => setSelectedSource(value as ReportType)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a template" />
            </SelectTrigger>
            <SelectContent>
              {availableTemplates.map((type) => (
                <SelectItem key={type} value={type}>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    {getReportTypeName(type)}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground mt-2">
            This will copy field visibility, labels, units, and custom normal ranges.
            Custom fields specific to the source template will not be copied.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleClone}
            disabled={!selectedSource || isCloning}
            className="gap-2"
          >
            {isCloning ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
            Clone Customizations
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
