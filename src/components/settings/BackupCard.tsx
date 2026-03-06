import { useBackup } from '@/hooks/useBackup';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { IconWrapper } from '@/components/ui/icon-wrapper';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { HardDrive, Download, Clock, AlertTriangle, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export function BackupCard() {
  const {
    downloadBackup,
    isExporting,
    progress,
    lastBackupDate,
    isReminderDue,
    dismissReminder,
  } = useBackup();

  return (
    <div className="space-y-3">
      {isReminderDue && (
        <Alert variant="destructive" className="border-warning/50 bg-warning/5 text-warning">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle className="flex items-center justify-between">
            <span>Backup Reminder</span>
            <button onClick={dismissReminder} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </AlertTitle>
          <AlertDescription className="text-muted-foreground">
            {lastBackupDate
              ? `Your last backup was ${formatDistanceToNow(lastBackupDate, { addSuffix: true })}. It's recommended to download a fresh backup.`
              : `You haven't created a backup yet. Download one now to protect your data.`}
          </AlertDescription>
        </Alert>
      )}

      <Card className="group animate-pulse-glow transition-all duration-300 hover:border-primary/40 hover:shadow-lg">
        <CardHeader className="p-4 sm:p-6">
          <div className="flex items-center gap-3">
            <IconWrapper variant="default" size="default" className="transition-all duration-300 group-hover:scale-110">
              <HardDrive className="h-5 w-5 transition-all duration-300 group-hover:text-primary" />
            </IconWrapper>
            <div>
              <CardTitle className="text-base sm:text-lg">Data Backup</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Download all your data as a ZIP file
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0 space-y-3">
          {lastBackupDate && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              <span>Last backup: {formatDistanceToNow(lastBackupDate, { addSuffix: true })}</span>
            </div>
          )}

          {isExporting && (
            <div className="space-y-1.5">
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-muted-foreground text-center">
                {progress < 25 ? 'Fetching data...' :
                 progress < 35 ? 'Generating patients PDF...' :
                 progress < 90 ? 'Generating report PDFs...' :
                 'Creating ZIP file...'}
              </p>
            </div>
          )}

          <Button
            variant="outline"
            className="w-full"
            onClick={downloadBackup}
            disabled={isExporting}
          >
            <Download className="h-4 w-4 mr-2" />
            {isExporting ? 'Creating Backup...' : 'Download Backup (.zip)'}
          </Button>

          <p className="text-[11px] text-muted-foreground text-center">
            Includes patients list PDF and all lab report PDFs
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
