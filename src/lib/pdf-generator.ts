import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import type { Report, Patient, Clinic, Gender, ReportTemplate, ReportType } from '@/types/database';
import { reportTemplates, getReportTypeName, buildCombinedTemplate, flattenCombinedReportData } from './report-templates';

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
}

interface GeneratePDFOptions {
  report: Report;
  patient: Patient;
  clinic?: ClinicWithBranding | null;
  reportUrl?: string;
  customTemplate?: ReportTemplate | null;
}

// Helper to parse hex color to RGB
const hexToRgb = (hex: string): [number, number, number] => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (result) {
    return [
      parseInt(result[1], 16),
      parseInt(result[2], 16),
      parseInt(result[3], 16),
    ];
  }
  return [0, 150, 136]; // Default teal
};

const darkenColor = (rgb: [number, number, number], factor: number = 0.7): [number, number, number] => {
  return [
    Math.round(rgb[0] * factor),
    Math.round(rgb[1] * factor),
    Math.round(rgb[2] * factor),
  ];
};

const lightenColor = (rgb: [number, number, number], factor: number = 0.15): [number, number, number] => {
  return [
    Math.round(rgb[0] + (255 - rgb[0]) * factor),
    Math.round(rgb[1] + (255 - rgb[1]) * factor),
    Math.round(rgb[2] + (255 - rgb[2]) * factor),
  ];
};

const DEFAULT_COLORS = {
  primary: [0, 150, 136] as [number, number, number],
  primaryDark: [0, 100, 90] as [number, number, number],
  primaryLight: [224, 242, 240] as [number, number, number],
  destructive: [200, 40, 40] as [number, number, number],
  success: [22, 163, 74] as [number, number, number],
  text: [40, 40, 40] as [number, number, number],
  textMuted: [120, 120, 120] as [number, number, number],
  label: [100, 100, 100] as [number, number, number],
  border: [210, 210, 210] as [number, number, number],
  borderLight: [230, 230, 230] as [number, number, number],
  background: [248, 250, 252] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  tableHeaderBg: [245, 245, 245] as [number, number, number],
  tableStripeBg: [252, 252, 253] as [number, number, number],
  // Status text colors (no background pills - just colored text)
  statusNormalText: [22, 163, 74] as [number, number, number],
  statusAbnormalText: [200, 130, 0] as [number, number, number],
  statusCriticalText: [200, 40, 40] as [number, number, number],
};

const MARGIN = 15;
const FOOTER_BAR_HEIGHT = 10;

// Enhanced status detection with directional labels
type DetailedStatus = 'Normal' | 'Low' | 'High' | 'Low-Critical' | 'High-Critical' | 'unknown';

const getDetailedValueStatus = (
  value: number | string | null | undefined,
  field: { normalRange?: { min?: number; max?: number; male?: { min?: number; max?: number }; female?: { min?: number; max?: number } } },
  gender: Gender
): DetailedStatus => {
  if (value === null || value === undefined || value === '') return 'unknown';
  const numValue = typeof value === 'number' ? value : parseFloat(String(value));
  if (isNaN(numValue)) return 'unknown';
  if (!field.normalRange) return 'unknown';

  let min: number | undefined;
  let max: number | undefined;

  if (field.normalRange.male && field.normalRange.female) {
    const genderRange = gender === 'male' ? field.normalRange.male : field.normalRange.female;
    min = genderRange.min;
    max = genderRange.max;
  } else {
    min = field.normalRange.min;
    max = field.normalRange.max;
  }

  if (min !== undefined && numValue < min) {
    return numValue < min * 0.7 ? 'Low-Critical' : 'Low';
  }
  if (max !== undefined && numValue > max) {
    return numValue > max * 1.3 ? 'High-Critical' : 'High';
  }
  return 'Normal';
};

// Keep old function for backward compat in other files
const getValueStatus = (
  value: number | string | null | undefined,
  field: { normalRange?: { min?: number; max?: number; male?: { min?: number; max?: number }; female?: { min?: number; max?: number } } },
  gender: Gender
): 'normal' | 'abnormal' | 'unknown' => {
  const detailed = getDetailedValueStatus(value, field, gender);
  if (detailed === 'unknown') return 'unknown';
  if (detailed === 'Normal') return 'normal';
  // Map simplified labels back to abnormal for backward compat
  return 'abnormal';
};

const formatNormalRange = (
  field: { normalRange?: { min?: number; max?: number; male?: { min?: number; max?: number }; female?: { min?: number; max?: number } } },
  gender: Gender
): string => {
  if (!field.normalRange) return '-';

  let min: number | undefined;
  let max: number | undefined;

  if (field.normalRange.male && field.normalRange.female) {
    const genderRange = gender === 'male' ? field.normalRange.male : field.normalRange.female;
    min = genderRange.min;
    max = genderRange.max;
  } else {
    min = field.normalRange.min;
    max = field.normalRange.max;
  }

  if (min !== undefined && max !== undefined) return `${min} - ${max}`;
  if (min !== undefined) return `> ${min}`;
  if (max !== undefined) return `< ${max}`;
  return '-';
};

const calculateAge = (dateOfBirth: string): string => {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return `${age}`;
};

const loadImageAsBase64 = async (url: string): Promise<string | null> => {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
};

const getStatusTextColor = (status: DetailedStatus): [number, number, number] => {
  switch (status) {
    case 'Normal':
      return DEFAULT_COLORS.statusNormalText;
    case 'Low':
    case 'High':
      return DEFAULT_COLORS.statusAbnormalText;
    case 'Low-Critical':
    case 'High-Critical':
      return DEFAULT_COLORS.statusCriticalText;
    default:
      return DEFAULT_COLORS.textMuted;
  }
};

export const generateReportPDF = async ({ report, patient, clinic, reportUrl, customTemplate }: GeneratePDFOptions): Promise<jsPDF> => {
  const pageFormat = clinic?.page_size === 'letter' ? 'letter' : clinic?.page_size === 'legal' ? 'legal' : 'a4';
  const doc = new jsPDF({ format: pageFormat });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  const accentColor = clinic?.accent_color ? hexToRgb(clinic.accent_color) : DEFAULT_COLORS.primary;
  const accentColorDark = darkenColor(accentColor);
  const fontSizeMultiplier = clinic?.font_size === 'small' ? 0.9 : clinic?.font_size === 'large' ? 1.1 : 1;
  const showLogoOnAllPages = clinic?.show_logo_on_all_pages ?? true;
  const showPatientId = clinic?.show_patient_id ?? true;
  const logoWatermarkEnabled = clinic?.logo_watermark_enabled ?? false;
  
  const COLORS = {
    ...DEFAULT_COLORS,
    primary: accentColor,
    primaryDark: accentColorDark,
  };
  
  let logoBase64: string | null = null;
  const logoSource = clinic?.logo_url || '/images/report-logo.png';
  logoBase64 = await loadImageAsBase64(logoSource);

  // ── Watermark (text or logo) ──
  const drawWatermark = (pageNum: number) => {
    doc.setPage(pageNum);
    
    if (logoWatermarkEnabled && logoBase64) {
      doc.saveGraphicsState();
      try {
        const wmSize = 80;
        const wmX = (pageWidth - wmSize) / 2;
        const wmY = (pageHeight - wmSize) / 2;
        (doc as any).setGState(new (doc as any).GState({ opacity: 0.06 }));
        doc.addImage(logoBase64, 'AUTO', wmX, wmY, wmSize, wmSize);
      } catch { /* */ }
      doc.restoreGraphicsState();
    }
    
    if (clinic?.watermark_text) {
      doc.saveGraphicsState();
      doc.setFontSize(50);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(220, 220, 220);
      doc.text(clinic.watermark_text.toUpperCase(), pageWidth / 2, pageHeight / 2, {
        align: 'center',
        angle: 45,
      });
      doc.restoreGraphicsState();
    }
  };

  // ── Header ──
  const drawHeader = (pageNum: number, isFirstPage: boolean): number => {
    doc.setPage(pageNum);
    let y = MARGIN;

    if (isFirstPage) {
      // Logo on the left (large, matching sample proportions)
      const logoHeight = 28;
      const logoWidth = 55;
      if (logoBase64) {
        try {
          doc.addImage(logoBase64, 'AUTO', MARGIN, y, logoWidth, logoHeight);
        } catch { /* */ }
      }

      // Right side: Contact info only (clinic name is in the logo)
      const rightX = pageWidth - MARGIN;
      doc.setFontSize(11 * fontSizeMultiplier);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...COLORS.label);

      let contactY = y + 8;
      if (clinic?.phone) {
        doc.text(`Contact: ${clinic.phone}`, rightX, contactY, { align: 'right' });
        contactY += 6;
      }
      if (clinic?.email) {
        doc.text(clinic.email, rightX, contactY, { align: 'right' });
        contactY += 6;
      }

      y += 32;

      // Single thin teal divider line
      doc.setDrawColor(...COLORS.primary);
      doc.setLineWidth(0.8);
      doc.line(MARGIN, y, pageWidth - MARGIN, y);
      y += 10;

      // "Patient Report" centered heading
      doc.setFontSize(18 * fontSizeMultiplier);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...COLORS.text);
      doc.text('Patient Report', pageWidth / 2, y, { align: 'center' });
      y += 8;

      return y;
    } else {
      // Compact continuation header
      if (showLogoOnAllPages && logoBase64) {
        try {
          doc.addImage(logoBase64, 'AUTO', MARGIN, y - 2, 10, 10);
        } catch { /* */ }
      }
      
      const headerX = (showLogoOnAllPages && logoBase64) ? MARGIN + 13 : MARGIN;
      doc.setFontSize(11 * fontSizeMultiplier);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...COLORS.primaryDark);
      doc.text(clinic?.name || 'Medical Laboratory', headerX, y + 5);
      
      doc.setFontSize(8 * fontSizeMultiplier);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...COLORS.textMuted);
      doc.text(`Report #: ${report.report_number}`, pageWidth - MARGIN, y + 5, { align: 'right' });
      
      y += 9;
      doc.setDrawColor(...COLORS.primary);
      doc.setLineWidth(0.5);
      doc.line(MARGIN, y, pageWidth - MARGIN, y);
      y += 4;

      return y;
    }
  };

  // ── Footer (full-width dark teal bar + page number badge + signature) ──
  const drawFooter = (pageNum: number, totalPages: number) => {
    doc.setPage(pageNum);
    
    const footerBarY = pageHeight - FOOTER_BAR_HEIGHT;

    // Full-width dark teal bar
    doc.setFillColor(...COLORS.primaryDark);
    doc.rect(0, footerBarY, pageWidth, FOOTER_BAR_HEIGHT, 'F');

    // Left: Address (bold white)
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.white);
    const address = clinic?.address || '';
    if (address) {
      doc.text(`Address: ${address}`, MARGIN, footerBarY + 6.5);
    }

    // Right: "Report Generated On:" INSIDE the footer bar
    const genDate = format(new Date(), 'd/MM/yy hh:mm:ss a');
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.white);
    doc.text(`Report Generated On:`, pageWidth - MARGIN, footerBarY + 4, { align: 'right' });
    doc.text(genDate, pageWidth - MARGIN, footerBarY + 7.5, { align: 'right' });

    // Page # badge (dark rounded rectangle, above footer bar, left side)
    const badgeY = footerBarY - 10;
    const badgeText = `Page # ${pageNum}/${totalPages}`;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    const badgeWidth = doc.getTextWidth(badgeText) + 10;
    const badgeHeight = 7;
    const badgeX = MARGIN;

    doc.setFillColor(...COLORS.primaryDark);
    doc.roundedRect(badgeX, badgeY, badgeWidth, badgeHeight, 2, 2, 'F');
    doc.setTextColor(...COLORS.white);
    doc.text(badgeText, badgeX + 5, badgeY + 5);
  };

  let yPos = MARGIN;

  // ============ FIRST PAGE HEADER ============
  yPos = drawHeader(1, true);

  // ============ PATIENT INFORMATION BOX (rounded, with vertical divider) ============
  const boxMidX = pageWidth / 2;
  const leftCol = MARGIN + 8;
  const rightCol = boxMidX + 8;
  const rowGap = 7;
  const boxPadTop = 10;

  // Calculate box height based on number of rows
  const numLeftRows = showPatientId ? 4 : 3;
  const boxHeight = boxPadTop + numLeftRows * rowGap + 6;
  const boxY = yPos;
  
  // Rounded bordered rectangle
  doc.setDrawColor(...COLORS.border);
  doc.setLineWidth(0.5);
  doc.roundedRect(MARGIN, boxY, pageWidth - MARGIN * 2, boxHeight, 3, 3, 'S');

  // Vertical divider line in center
  doc.setDrawColor(...COLORS.border);
  doc.setLineWidth(0.3);
  doc.line(boxMidX, boxY + 3, boxMidX, boxY + boxHeight - 3);

  let infoY = boxY + boxPadTop;
  doc.setFontSize(13 * fontSizeMultiplier);

  // Helper to draw "Label: Value" with bold label
  const drawInfoPair = (label: string, value: string, x: number, y: number) => {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.text);
    const labelText = `${label}: `;
    doc.text(labelText, x, y);
    const labelWidth = doc.getTextWidth(labelText);
    doc.setFont('helvetica', 'normal');
    doc.text(value, x + labelWidth, y);
  };

  // Left column
  drawInfoPair('Name', patient.full_name, leftCol, infoY);
  drawInfoPair('Age / Gender', `${calculateAge(patient.date_of_birth)} / ${patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1)}`, leftCol, infoY + rowGap);
  drawInfoPair('Referred By', report.referring_doctor || '—', leftCol, infoY + rowGap * 2);
  if (showPatientId) {
    drawInfoPair('Patient ID', patient.patient_id_number || '—', leftCol, infoY + rowGap * 3);
  }

  // Right column
  drawInfoPair('Report No', report.report_number, rightCol, infoY);
  drawInfoPair('Collected On', format(new Date(report.test_date), 'd/MM/yy'), rightCol, infoY + rowGap);
  drawInfoPair('Reported On', format(new Date(report.created_at), 'd/MM/yy'), rightCol, infoY + rowGap * 2);

  yPos = boxY + boxHeight + 6;

  // ============ RESOLVE TEMPLATE & DATA ============
  
  const isCombinedReport = report.report_type === 'combined';
  let template: ReportTemplate;
  
  if (customTemplate) {
    template = customTemplate;
  } else if (isCombinedReport && report.included_tests) {
    template = buildCombinedTemplate(report.included_tests);
  } else {
    template = reportTemplates[report.report_type];
  }
  
  const rawReportData = report.report_data as Record<string, unknown>;
  const reportData = isCombinedReport && report.included_tests
    ? flattenCombinedReportData(rawReportData, report.included_tests)
    : rawReportData;
  
  // ============ TEST RESULTS TABLES ============

  for (const category of template.categories) {
    const categoryFields = category.fields.filter(
      (field) => reportData[field.name] !== undefined && reportData[field.name] !== null && reportData[field.name] !== ''
    );
    if (categoryFields.length === 0) continue;

    // Check if we need a new page
    if (yPos > pageHeight - FOOTER_BAR_HEIGHT - 45) {
      doc.addPage();
      yPos = drawHeader(doc.getNumberOfPages(), false);
    }

    // Category Header – centered bold text with full-width line below (matching sample)
    doc.setFontSize(16 * fontSizeMultiplier);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.text);
    doc.text(category.name, pageWidth / 2, yPos + 6, { align: 'center' });
    yPos += 10;
    doc.setDrawColor(...COLORS.primaryDark);
    doc.setLineWidth(1);
    doc.line(MARGIN, yPos, pageWidth - MARGIN, yPos);
    yPos += 5;

    // Build table data: Test Name | Reference Range | Unit | Result | Status
    const tableData: (string | { content: string; styles: object })[][] = [];

    for (const field of categoryFields) {
      const value = reportData[field.name];
      const displayValue = String(value);
      const normalRange = formatNormalRange(field, patient.gender);
      const status = getDetailedValueStatus(value as number, field, patient.gender);
      const statusColor = getStatusTextColor(status);

      const row = [
        field.label, // Test Name
        normalRange, // Reference Range
        field.unit || '—', // Unit
        displayValue, // Result (plain text, no special styling)
        {
          content: status === 'unknown' ? '—' : status,
          styles: {
            textColor: statusColor,
            fontStyle: 'bold',
          },
        }, // Status - just colored text, no background
      ];

      tableData.push(row as (string | { content: string; styles: object })[]);
    }

    autoTable(doc, {
      startY: yPos,
      head: [['Test Name', 'Reference Range', 'Unit', 'Result', 'Status']],
      body: tableData,
      theme: 'grid',
      showHead: 'everyPage',
      headStyles: {
        fillColor: COLORS.primaryDark,
        textColor: COLORS.white,
        fontSize: 10 * fontSizeMultiplier,
        fontStyle: 'bold',
        halign: 'center',
        cellPadding: 3,
        lineColor: COLORS.borderLight,
        lineWidth: 0.3,
      },
      bodyStyles: {
        fontSize: 10 * fontSizeMultiplier,
        cellPadding: 2.5,
        textColor: COLORS.text,
        halign: 'center',
        lineColor: COLORS.borderLight,
        lineWidth: 0.3,
      },
      columnStyles: {
        0: { cellWidth: 50, halign: 'center' }, // Test Name
        1: { halign: 'center' }, // Reference Range
        2: { cellWidth: 25, halign: 'center' }, // Unit
        3: { cellWidth: 28, halign: 'center' }, // Result
        4: { cellWidth: 35, halign: 'center' }, // Status
      },
      tableLineColor: COLORS.borderLight,
      tableLineWidth: 0.3,
      margin: { left: MARGIN, right: MARGIN, top: MARGIN + 15, bottom: FOOTER_BAR_HEIGHT + 22 },
      didDrawPage: (data) => {
        const pageNum = doc.getNumberOfPages();
        if (data.pageNumber > 1) {
          drawHeader(pageNum, false);
        }
      },
    });

    yPos = (doc as any).lastAutoTable.finalY + 6;
  }

  // ============ CLINICAL NOTES BOX ============

  if (report.clinical_notes) {
    if (yPos > pageHeight - FOOTER_BAR_HEIGHT - 40) {
      doc.addPage();
      yPos = drawHeader(doc.getNumberOfPages(), false);
    }

    yPos += 2;
    const notesLines = doc.splitTextToSize(report.clinical_notes, pageWidth - MARGIN * 2 - 10);
    const notesBoxHeight = Math.max(notesLines.length * 4.5 + 12, 18);

    // Bordered box with rounded corners
    doc.setDrawColor(...COLORS.border);
    doc.setLineWidth(0.5);
    doc.roundedRect(MARGIN, yPos, pageWidth - MARGIN * 2, notesBoxHeight, 2, 2, 'S');

    // Bold label "Clinical Notes:-"
    doc.setFontSize(10 * fontSizeMultiplier);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.text);
    doc.text('Clinical Notes:-', MARGIN + 4, yPos + 6);

    // Notes text
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9 * fontSizeMultiplier);
    doc.setTextColor(...COLORS.text);
    doc.text(notesLines, MARGIN + 4, yPos + 12);

    yPos += notesBoxHeight + 6;
  }

  // ============ AUTHORIZED SIGNATURE (above footer bar, right side) ============

  const totalPages = doc.getNumberOfPages();
  doc.setPage(totalPages);

  const sigY = pageHeight - FOOTER_BAR_HEIGHT - 16;

  // Signature line on the right
  const sigLineWidth = 60;
  const sigLineX = pageWidth - MARGIN - sigLineWidth;
  doc.setDrawColor(...COLORS.text);
  doc.setLineWidth(0.4);
  doc.line(sigLineX, sigY, pageWidth - MARGIN, sigY);

  doc.setFontSize(9 * fontSizeMultiplier);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.text);
  const sigText = 'Authorized Signature';
  const sigTextWidth = doc.getTextWidth(sigText);
  doc.text(sigText, sigLineX + (sigLineWidth - sigTextWidth) / 2, sigY + 5);

  // ============ DRAW ALL FOOTERS AND WATERMARKS ============
  for (let i = 1; i <= totalPages; i++) {
    drawFooter(i, totalPages);
    drawWatermark(i);
  }

  return doc;
};

export const downloadPDF = (doc: jsPDF, filename: string) => {
  doc.save(filename);
};

export const sharePDFViaWhatsApp = async (doc: jsPDF, patientPhone?: string) => {
  const pdfBlob = doc.output('blob');
  const pdfUrl = URL.createObjectURL(pdfBlob);
  
  const message = encodeURIComponent('Your lab report is ready. Please check the attached document.');
  const phone = patientPhone?.replace(/\D/g, '') || '';
  
  window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
  
  URL.revokeObjectURL(pdfUrl);
};
