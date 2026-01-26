import { format, formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { IconWrapper } from '@/components/ui/icon-wrapper';
import { FileText, RefreshCcw, X } from 'lucide-react';
import type { DraftReport } from '@/hooks/useDraftReport';
import { getReportTypeName } from '@/lib/report-templates';

interface DraftBannerProps {
  draft: DraftReport;
  onResume: () => void;
  onDiscard: () => void;
}

export function DraftBanner({ draft, onResume, onDiscard }: DraftBannerProps) {
  const savedAt = new Date(draft.savedAt);
  const timeAgo = formatDistanceToNow(savedAt, { addSuffix: true });
  
  const patientName = draft.patient?.full_name || draft.newPatientData?.full_name;
  const templateName = draft.selectedTemplate ? getReportTypeName(draft.selectedTemplate) : null;

  // Build description parts
  const descParts: string[] = [];
  if (templateName) descParts.push(templateName);
  if (patientName) descParts.push(`for ${patientName}`);

  return (
    <Card className="border-primary/50 bg-primary/5">
      <CardContent className="p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3">
            <IconWrapper variant="default" size="sm">
              <FileText className="h-4 w-4" />
            </IconWrapper>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">
                Unsaved draft found
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {descParts.length > 0 ? descParts.join(' ') : 'Started a new report'} • Saved {timeAgo}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onDiscard}
              className="text-xs"
            >
              <X className="h-3 w-3 mr-1" />
              Discard
            </Button>
            <Button
              size="sm"
              onClick={onResume}
              className="text-xs"
            >
              <RefreshCcw className="h-3 w-3 mr-1" />
              Resume
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
