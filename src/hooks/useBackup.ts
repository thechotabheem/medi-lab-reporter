import { useState, useEffect, useCallback } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { pdf } from '@react-pdf/renderer';
import React from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useClinic } from '@/contexts/ClinicContext';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { generateReportPDF } from '@/lib/pdf-generator';
import { PatientsListDocument } from '@/lib/pdf/PatientsListDocument';
import type { Patient, Report } from '@/types/database';

const LAST_BACKUP_KEY = 'lab-reporter-last-backup';
const BACKUP_INTERVAL_DAYS = 30;

export function useBackup() {
  const { clinicId, clinic } = useClinic();
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
      const generatedAt = format(new Date(), 'dd MMM yyyy, hh:mm a');

      // 1. Fetch patients
      setProgress(5);
      const { data: patients, error: pErr } = await supabase
        .from('patients')
        .select('*')
        .eq('clinic_id', clinicId)
        .order('full_name');
      if (pErr) throw pErr;

      // 2. Fetch reports with patient data
      setProgress(15);
      const { data: reports, error: rErr } = await supabase
        .from('reports')
        .select('*')
        .eq('clinic_id', clinicId)
        .order('created_at', { ascending: false });
      if (rErr) throw rErr;

      // 3. Fetch clinic settings for PDF branding
      setProgress(20);
      const { data: clinic, error: cErr } = await supabase
        .from('clinics')
        .select('*')
        .eq('id', clinicId)
        .maybeSingle();
      if (cErr) throw cErr;

      const clinicName = clinic?.name || 'Clinic';

      // 4. Generate Patients List PDF
      setProgress(25);
      const patientsDoc = React.createElement(PatientsListDocument, {
        patients: (patients || []) as Patient[],
        clinicName,
        generatedAt,
      });
      const patientsBlob = await (pdf as any)(patientsDoc).toBlob();
      zip.file('All_Patients.pdf', patientsBlob);
      setProgress(35);

      // 5. Generate individual report PDFs
      const reportList = (reports || []) as Report[];
      const patientMap = new Map((patients || []).map((p: any) => [p.id, p as Patient]));
      const reportsFolder = zip.folder('Reports');

      if (reportsFolder && reportList.length > 0) {
        const step = 55 / reportList.length; // distribute 35-90 range

        for (let i = 0; i < reportList.length; i++) {
          const report = reportList[i];
          const patient = patientMap.get(report.patient_id);

          if (!patient) continue;

          try {
            const blob = await generateReportPDF({
              report,
              patient,
              clinic,
            });

            const safeName = patient.full_name.replace(/[^a-zA-Z0-9 ]/g, '').trim();
            const fileName = `${report.report_number}_${safeName}.pdf`;
            reportsFolder.file(fileName, blob);
          } catch (err) {
            console.warn(`Failed to generate PDF for report ${report.report_number}:`, err);
            // Skip failed reports instead of stopping the whole backup
          }

          setProgress(35 + Math.round(step * (i + 1)));
        }
      }

      setProgress(92);

      // Generate ZIP
      const zipBlob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
      saveAs(zipBlob, `lab-reporter-backup_${backupDate}.zip`);

      // Update last backup date
      const now = new Date();
      localStorage.setItem(LAST_BACKUP_KEY, now.toISOString());
      setLastBackupDate(now);
      setIsReminderDue(false);
      setProgress(100);

      toast.success(`Backup downloaded! (${patients?.length || 0} patients, ${reportList.length} report PDFs)`);
    } catch (error) {
      console.error('Backup failed:', error);
      toast.error('Failed to create backup. Please try again.');
    } finally {
      setIsExporting(false);
      setProgress(0);
    }
  }, [clinicId, clinic]);

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
