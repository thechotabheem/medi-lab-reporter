import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useClinic } from '@/contexts/ClinicContext';
import { toast } from '@/hooks/use-toast';
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2, AlertTriangle, Loader2 } from 'lucide-react';

const CONFIRMATION_PHRASE = 'DELETE ALL DATA';

export function ResetDataDialog() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { clinicId } = useClinic();
  
  const [open, setOpen] = useState(false);
  const [resetCode, setResetCode] = useState('');
  const [confirmPhrase, setConfirmPhrase] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  const isValid = resetCode.trim() !== '' && confirmPhrase === CONFIRMATION_PHRASE;

  const handleReset = async () => {
    if (!isValid) return;

    setIsResetting(true);
    try {
      const { data, error } = await supabase.functions.invoke('reset-clinic-data', {
        body: { resetCode, clinicId },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data.success) {
        throw new Error(data.error || 'Reset failed');
      }

      // Clear all cached queries
      await queryClient.invalidateQueries({ queryKey: ['patients'] });
      await queryClient.invalidateQueries({ queryKey: ['reports'] });
      await queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });

      toast({
        title: 'Data Reset Complete',
        description: `Deleted ${data.deletedCounts.patients} patients, ${data.deletedCounts.reports} reports, and ${data.deletedCounts.reportImages} images.`,
      });

      setOpen(false);
      setResetCode('');
      setConfirmPhrase('');
      navigate('/dashboard');
    } catch (error) {
      console.error('Reset error:', error);
      toast({
        title: 'Reset Failed',
        description: error instanceof Error ? error.message : 'An error occurred during reset',
        variant: 'destructive',
      });
    } finally {
      setIsResetting(false);
    }
  };

  const handleClearDraftAndReload = () => {
    // Clear draft report from localStorage
    localStorage.removeItem('draftReport');
    localStorage.removeItem('draftReportPatientId');
    localStorage.removeItem('draftReportTemplateType');
    
    toast({
      title: 'Draft Cleared',
      description: 'Local draft data has been cleared. Reloading...',
    });

    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" className="w-full">
          <Trash2 className="h-4 w-4 mr-2" />
          Reset All Data
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Reset All Data
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p>
              This will permanently delete all patients, reports, and report images.
            </p>
            <div className="bg-muted p-3 rounded-md text-sm space-y-1">
              <p className="font-medium text-foreground">What will be deleted:</p>
              <ul className="list-disc list-inside text-muted-foreground">
                <li>All patients</li>
                <li>All reports</li>
                <li>All report images</li>
              </ul>
            </div>
            <div className="bg-muted p-3 rounded-md text-sm space-y-1">
              <p className="font-medium text-foreground">What will be kept:</p>
              <ul className="list-disc list-inside text-muted-foreground">
                <li>Clinic settings (name, logo, contact info)</li>
                <li>Custom report templates</li>
              </ul>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="reset-code">Reset Code</Label>
            <Input
              id="reset-code"
              type="password"
              placeholder="Enter the admin reset code"
              value={resetCode}
              onChange={(e) => setResetCode(e.target.value)}
              disabled={isResetting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-phrase">
              Type <span className="font-mono font-bold text-destructive">{CONFIRMATION_PHRASE}</span> to confirm
            </Label>
            <Input
              id="confirm-phrase"
              placeholder={CONFIRMATION_PHRASE}
              value={confirmPhrase}
              onChange={(e) => setConfirmPhrase(e.target.value)}
              disabled={isResetting}
            />
          </div>
        </div>

        <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
          <div className="flex gap-2 w-full">
            <AlertDialogCancel className="flex-1" disabled={isResetting}>
              Cancel
            </AlertDialogCancel>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={handleReset}
              disabled={!isValid || isResetting}
            >
              {isResetting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Resetting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Reset Data
                </>
              )}
            </Button>
          </div>
          <Button
            variant="outline"
            className="w-full"
            onClick={handleClearDraftAndReload}
            disabled={isResetting}
          >
            Clear Draft & Reload (Local Only)
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
