import { pdf } from '@react-pdf/renderer';
import React from 'react';

import type { Report, Patient, ReportTemplate, ReportType } from '@/types/database';
import { reportTemplates, buildCombinedTemplate, flattenCombinedReportData } from './report-templates';
import { loadImageAsBase64 } from './pdf/utils';
import { ReportDocument } from './pdf/ReportDocument';

interface ClinicWithBranding {
  name: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  logo_url?: string | null;
  header_text?: string | null;
  footer_text?: string | null;
  watermark_text?: string | null;
  enable_qr_code?: boolean;
  accent_color?: string | null;
  tagline?: string | null;
  website?: string | null;
  font_size?: string | null;
  show_logo_on_all_pages?: boolean | null;
  signature_title_left?: string | null;
  signature_title_right?: string | null;
  page_size?: string | null;
  show_abnormal_summary?: boolean | null;
  show_patient_id?: boolean | null;
  border_style?: string | null;
  secondary_color?: string | null;
  contact_display_format?: string | null;
  pdf_style?: string | null;
  logo_watermark_enabled?: boolean | null;
  doctor_name?: string | null;
}

interface GeneratePDFOptions {
  report: Report;
  patient: Patient;
  clinic?: ClinicWithBranding | null;
  reportUrl?: string;
  customTemplate?: ReportTemplate | null;
}

export const generateReportPDF = async ({ report, patient, clinic, customTemplate }: GeneratePDFOptions): Promise<Blob> => {
  // Resolve template
  const isCombinedReport = report.report_type === 'combined';
  let template: ReportTemplate;

  if (customTemplate) {
    template = customTemplate;
  } else if (isCombinedReport && report.included_tests) {
    template = buildCombinedTemplate(report.included_tests);
  } else {
    template = reportTemplates[report.report_type];
  }

  // Resolve data
  const rawReportData = report.report_data as Record<string, unknown>;
  const reportData = isCombinedReport && report.included_tests
    ? flattenCombinedReportData(rawReportData, report.included_tests)
    : rawReportData;

  // Load logo from clinic settings, fallback to integrated logo
  const logoSource = clinic?.logo_url || '/images/report-logo.png';
  const logoBase64 = await loadImageAsBase64(logoSource);

  const doc = React.createElement(ReportDocument, {
    report,
    patient,
    clinic: clinic || null,
    template,
    reportData,
    logoBase64,
  });

  const blob = await (pdf as any)(doc).toBlob();
  return blob;
};

export const downloadPDF = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

export const sharePDFViaWhatsApp = async (blob: Blob, patientPhone?: string) => {
  const message = encodeURIComponent('Your lab report is ready. Please check the attached document.');
  const phone = patientPhone?.replace(/\D/g, '') || '';
  window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
};
