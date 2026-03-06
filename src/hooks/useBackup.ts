import { useState, useEffect, useCallback } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { supabase } from '@/integrations/supabase/client';
import { useClinic } from '@/contexts/ClinicContext';
import { toast } from 'sonner';
import { format } from 'date-fns';

const LAST_BACKUP_KEY = 'lab-reporter-last-backup';
const BACKUP_INTERVAL_DAYS = 30;

export function useBackup() {
  const { clinicId } = useClinic();
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [lastBackupDate, setLastBackupDate] = useState<Date | null>(null);
  const [isReminderDue, setIsReminderDue] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(LAST_BACKUP_KEY);
    if (stored) {
      const date = new Date(stored);
      setLastBackupDate(date);
      const daysSince = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);
      setIsReminderDue(daysSince >= BACKUP_INTERVAL_DAYS);
    } else {
      setIsReminderDue(true);
    }
  }, []);

  const downloadBackup = useCallback(async () => {
    if (!clinicId) {
      toast.error('Clinic not found');
      return;
    }

    setIsExporting(true);
    setProgress(0);

    try {
      const zip = new JSZip();
      const backupDate = format(new Date(), 'yyyy-MM-dd_HH-mm');

      // 1. Fetch patients
      setProgress(10);
      const { data: patients, error: pErr } = await supabase
        .from('patients')
        .select('*')
        .eq('clinic_id', clinicId);
      if (pErr) throw pErr;

      zip.file('patients.json', JSON.stringify(patients || [], null, 2));
      setProgress(30);

      // 2. Fetch reports
      const { data: reports, error: rErr } = await supabase
        .from('reports')
        .select('*')
        .eq('clinic_id', clinicId);
      if (rErr) throw rErr;

      zip.file('reports.json', JSON.stringify(reports || [], null, 2));
      setProgress(50);

      // 3. Fetch clinic settings
      const { data: clinic, error: cErr } = await supabase
        .from('clinics')
        .select('*')
        .eq('id', clinicId)
        .maybeSingle();
      if (cErr) throw cErr;

      zip.file('clinic_settings.json', JSON.stringify(clinic || {}, null, 2));
      setProgress(60);

      // 4. Fetch custom templates
      const { data: templates, error: tErr } = await supabase
        .from('custom_templates')
        .select('*')
        .eq('clinic_id', clinicId);
      if (tErr) throw tErr;

      zip.file('custom_templates.json', JSON.stringify(templates || [], null, 2));
      setProgress(70);

      // 5. Fetch saved comparisons
      const { data: comparisons, error: scErr } = await supabase
        .from('saved_comparisons')
        .select('*')
        .eq('clinic_id', clinicId);
      if (scErr) throw scErr;

      zip.file('saved_comparisons.json', JSON.stringify(comparisons || [], null, 2));
      setProgress(80);

      // 6. Add metadata
      const metadata = {
        backup_date: new Date().toISOString(),
        clinic_id: clinicId,
        clinic_name: clinic?.name || 'Unknown',
        total_patients: patients?.length || 0,
        total_reports: reports?.length || 0,
        total_templates: templates?.length || 0,
        app_version: '1.0.0',
      };
      zip.file('backup_metadata.json', JSON.stringify(metadata, null, 2));
      setProgress(90);

      // Generate ZIP
      const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
      saveAs(blob, `lab-reporter-backup_${backupDate}.zip`);

      // Update last backup date
      const now = new Date();
      localStorage.setItem(LAST_BACKUP_KEY, now.toISOString());
      setLastBackupDate(now);
      setIsReminderDue(false);
      setProgress(100);

      toast.success(`Backup downloaded successfully! (${patients?.length || 0} patients, ${reports?.length || 0} reports)`);
    } catch (error) {
      console.error('Backup failed:', error);
      toast.error('Failed to create backup. Please try again.');
    } finally {
      setIsExporting(false);
      setProgress(0);
    }
  }, [clinicId]);

  const dismissReminder = useCallback(() => {
    setIsReminderDue(false);
  }, []);

  return {
    downloadBackup,
    isExporting,
    progress,
    lastBackupDate,
    isReminderDue,
    dismissReminder,
  };
}
