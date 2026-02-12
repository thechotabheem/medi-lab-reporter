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
  // Status badge colors
  statusNormalBg: [212, 237, 218] as [number, number, number],
  statusNormalText: [21, 87, 36] as [number, number, number],
  statusAbnormalBg: [255, 243, 205] as [number, number, number],
  statusAbnormalText: [133, 100, 4] as [number, number, number],
  statusCriticalBg: [248, 215, 218] as [number, number, number],
  statusCriticalText: [114, 28, 36] as [number, number, number],
};

const MARGIN = 15;
const FOOTER_BAR_HEIGHT = 10;

// Enhanced status detection with directional labels
type DetailedStatus = 'Normal' | 'Low-Abnormal' | 'High-Abnormal' | 'Low-Critical' | 'High-Critical' | 'unknown';

const getDetailedValueStatus = (
  value: number | string | null | undefined,
  field: { normalRange?: { min?: number; max?: number; male?: { min?: number; max?: number }; female?: { min?: number; max?: number } } },
  gender: Gender
): DetailedStatus => {
  if (value === null || value === undefined || value === '') return 'unknown';
  if (typeof value !== 'number') return 'unknown';
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

  if (min !== undefined && value < min) {
    return value < min * 0.7 ? 'Low-Critical' : 'Low-Abnormal';
  }
  if (max !== undefined && value > max) {
    return value > max * 1.3 ? 'High-Critical' : 'High-Abnormal';
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

  if (min !== undefined && max !== undefined) return `${min} – ${max}`;
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
  
  return `${age} yrs`;
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

const getStatusBadgeColors = (status: DetailedStatus): { bg: [number, number, number]; text: [number, number, number] } => {
  switch (status) {
    case 'Normal':
      return { bg: DEFAULT_COLORS.statusNormalBg, text: DEFAULT_COLORS.statusNormalText };
    case 'Low-Abnormal':
    case 'High-Abnormal':
      return { bg: DEFAULT_COLORS.statusAbnormalBg, text: DEFAULT_COLORS.statusAbnormalText };
    case 'Low-Critical':
    case 'High-Critical':
      return { bg: DEFAULT_COLORS.statusCriticalBg, text: DEFAULT_COLORS.statusCriticalText };
    default:
      return { bg: DEFAULT_COLORS.white, text: DEFAULT_COLORS.textMuted };
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
      // Logo on the left (larger ~26mm)
      let logoRightEdge = MARGIN;
      if (logoBase64) {
        try {
          const logoSize = 40;
          doc.addImage(logoBase64, 'AUTO', MARGIN, y - 2, logoSize, logoSize);
          logoRightEdge = MARGIN + logoSize + 4;
        } catch { /* */ }
      }

      // Right side: Clinic name (bold, large) + contact info stacked below
      const rightX = pageWidth - MARGIN;
      doc.setFontSize(20 * fontSizeMultiplier);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...COLORS.primaryDark);
      doc.text(clinic?.name || 'Medical Laboratory', rightX, y + 8, { align: 'right' });

      let contactY = y + 16;
      doc.setFontSize(10 * fontSizeMultiplier);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...COLORS.label);

      if (clinic?.phone) {
        doc.text(`Contact: ${clinic.phone}`, rightX, contactY, { align: 'right' });
        contactY += 4;
      }
      if (clinic?.email) {
        doc.text(clinic.email, rightX, contactY, { align: 'right' });
        contactY += 4;
      }
      if (clinic?.address) {
        const addrLines = doc.splitTextToSize(clinic.address, 80);
        doc.text(addrLines, rightX, contactY, { align: 'right' });
      }

      y += 42;

      // Thick teal gradient-style divider
      doc.setFillColor(...COLORS.primary);
      doc.rect(MARGIN, y, pageWidth - MARGIN * 2, 2.5, 'F');
      // Slight lighter line below for gradient effect
      doc.setFillColor(...lightenColor(accentColor, 0.4));
      doc.rect(MARGIN, y + 2.5, pageWidth - MARGIN * 2, 1, 'F');
      y += 6;

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
      doc.setFillColor(...COLORS.primary);
      doc.rect(MARGIN, y, pageWidth - MARGIN * 2, 1, 'F');
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

    // Left: Address (bold)
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.white);
    const address = clinic?.address || '';
    if (address) {
      doc.text(`Address: ${address}`, MARGIN, footerBarY + 6.5);
    }

    // Right: Report Generated On badge
    const genText = `Report Generated On: ${format(new Date(), 'dd MMM yyyy, hh:mm a')}`;
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    const genTextWidth = doc.getTextWidth(genText) + 8;
    const genBadgeX = pageWidth - MARGIN - genTextWidth;
    const genBadgeY = footerBarY - 8;
    doc.setFillColor(...COLORS.primaryDark);
    doc.roundedRect(genBadgeX, genBadgeY, genTextWidth, 6, 1.5, 1.5, 'F');
    doc.setTextColor(...COLORS.white);
    doc.text(genText, genBadgeX + 4, genBadgeY + 4.2);

    // Page # badge (dark rounded rectangle, above footer bar, left side)
    const badgeY = footerBarY - 8;
    const badgeText = `Page # ${pageNum}/${totalPages}`;
    doc.setFontSize(7);
    const badgeWidth = doc.getTextWidth(badgeText) + 8;
    const badgeHeight = 6;
    const badgeX = MARGIN;

    doc.setFillColor(...COLORS.primaryDark);
    // Rounded rect
    doc.roundedRect(badgeX, badgeY, badgeWidth, badgeHeight, 1.5, 1.5, 'F');
    doc.setTextColor(...COLORS.white);
    doc.text(badgeText, badgeX + 4, badgeY + 4.2);
  };

  let yPos = MARGIN;

  // ============ FIRST PAGE HEADER ============
  yPos = drawHeader(1, true);

  // ============ "Patient Report" CENTERED HEADING ============
  doc.setFontSize(16 * fontSizeMultiplier);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.text);
  doc.text('Patient Report', pageWidth / 2, yPos + 4, { align: 'center' });
  yPos += 12;

  // ============ PATIENT INFORMATION BOX ============
  const boxHeight = 40;
  const boxY = yPos;
  
  // Bordered rectangle
  doc.setDrawColor(...COLORS.border);
  doc.setLineWidth(0.5);
  doc.rect(MARGIN, boxY, pageWidth - MARGIN * 2, boxHeight, 'S');

  // Vertical center divider
  const centerX = pageWidth / 2;
  doc.line(centerX, boxY, centerX, boxY + boxHeight);

  // Two-column patient info (inline "Label: Value" format)
  const leftCol = MARGIN + 5;
  const rightCol = centerX + 5;
  let infoY = boxY + 8;
  const rowGap = 8;

  doc.setFontSize(11 * fontSizeMultiplier);

  // Helper to draw a label:value pair
  const drawInfoPair = (label: string, value: string, x: number, y: number) => {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.label);
    const labelText = `${label}: `;
    doc.text(labelText, x, y);
    const labelWidth = doc.getTextWidth(labelText);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.text);
    doc.text(value, x + labelWidth, y);
  };

  // Left column
  drawInfoPair('Name', patient.full_name, leftCol, infoY);
  drawInfoPair('Age/Gender', `${calculateAge(patient.date_of_birth)} / ${patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1)}`, leftCol, infoY + rowGap);
  drawInfoPair('Referred By', report.referring_doctor || '—', leftCol, infoY + rowGap * 2);
  if (showPatientId) {
    drawInfoPair('Patient ID', patient.patient_id_number || '—', leftCol, infoY + rowGap * 3);
  }

  // Right column
  drawInfoPair('Report No', report.report_number, rightCol, infoY);
  drawInfoPair('Collected On', format(new Date(report.test_date), 'dd MMM yyyy'), rightCol, infoY + rowGap);
  drawInfoPair('Reported On', format(new Date(report.created_at), 'dd MMM yyyy'), rightCol, infoY + rowGap * 2);

  yPos = boxY + boxHeight + 8;

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

    // Check if we need a new page (leave room for footer bar + page badge)
    if (yPos > pageHeight - FOOTER_BAR_HEIGHT - 45) {
      doc.addPage();
      yPos = drawHeader(doc.getNumberOfPages(), false);
    }

    // Category Header – centered bold text with thin underline
    doc.setFontSize(11 * fontSizeMultiplier);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.text);
    doc.text(category.name, pageWidth / 2, yPos + 5, { align: 'center' });
    yPos += 7;
    doc.setDrawColor(...COLORS.primary);
    doc.setLineWidth(0.5);
    doc.line(MARGIN, yPos, pageWidth - MARGIN, yPos);
    yPos += 3;

    // Build table data: Test Name | Reference Range | Unit | Result | Status
    const tableData: (string | { content: string; styles: object })[][] = [];

    for (const field of categoryFields) {
      const value = reportData[field.name];
      const displayValue = String(value);
      const normalRange = formatNormalRange(field, patient.gender);
      const status = getDetailedValueStatus(value as number, field, patient.gender);
      const badgeColors = getStatusBadgeColors(status);

      const row = [
        field.label, // Test Name
        normalRange, // Reference Range
        field.unit || '—', // Unit
        {
          content: displayValue,
          styles: status !== 'Normal' && status !== 'unknown'
            ? { textColor: COLORS.destructive, fontStyle: 'bold' }
            : {},
        }, // Result
        {
          content: status === 'unknown' ? '—' : status,
          styles: {
            fillColor: status !== 'unknown' ? badgeColors.bg : undefined,
            textColor: status !== 'unknown' ? badgeColors.text : COLORS.textMuted,
            fontSize: 7 * fontSizeMultiplier,
            fontStyle: 'bold',
            halign: 'center',
          },
        }, // Status
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
        fontSize: 9 * fontSizeMultiplier,
        fontStyle: 'bold',
        halign: 'center',
        cellPadding: 4,
      },
      bodyStyles: {
        fontSize: 10 * fontSizeMultiplier,
        cellPadding: 4,
        textColor: COLORS.text,
        halign: 'center',
      },
      columnStyles: {
        0: { cellWidth: 55, fontStyle: 'bold', halign: 'left' }, // Test Name
        1: { halign: 'center' }, // Reference Range
        2: { cellWidth: 20, halign: 'center' }, // Unit
        3: { cellWidth: 28, halign: 'center' }, // Result
        4: { cellWidth: 32, halign: 'center' }, // Status
      },
      tableLineColor: COLORS.border,
      tableLineWidth: 0.1,
      margin: { left: MARGIN, right: MARGIN, top: MARGIN + 15, bottom: FOOTER_BAR_HEIGHT + 20 },
      didDrawPage: (data) => {
        const pageNum = doc.getNumberOfPages();
        if (data.pageNumber > 1) {
          drawHeader(pageNum, false);
        }
      },
    });

    yPos = (doc as any).lastAutoTable.finalY + 8;
  }

  // ============ CLINICAL NOTES BOX ============

  if (report.clinical_notes) {
    if (yPos > pageHeight - FOOTER_BAR_HEIGHT - 40) {
      doc.addPage();
      yPos = drawHeader(doc.getNumberOfPages(), false);
    }

    yPos += 4;
    const notesLines = doc.splitTextToSize(report.clinical_notes, pageWidth - MARGIN * 2 - 10);
    const notesBoxHeight = Math.max(notesLines.length * 4.5 + 10, 18);

    // Bordered box
    doc.setDrawColor(...COLORS.border);
    doc.setLineWidth(0.5);
    doc.rect(MARGIN, yPos, pageWidth - MARGIN * 2, notesBoxHeight, 'S');

    // Bold label in accent color
    doc.setFontSize(9 * fontSizeMultiplier);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.primary);
    doc.text('Clinical Notes:-', MARGIN + 4, yPos + 5.5);

    // Notes text
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5 * fontSizeMultiplier);
    doc.setTextColor(...COLORS.text);
    doc.text(notesLines, MARGIN + 4, yPos + 11);

    yPos += notesBoxHeight + 6;
  }

  // ============ AUTHORIZED SIGNATURE (above footer bar, right side) ============

  const totalPages = doc.getNumberOfPages();
  // Draw signature on the last page
  doc.setPage(totalPages);

  const sigY = pageHeight - FOOTER_BAR_HEIGHT - 18;

  // Signature line on the right
  const sigLineWidth = 65;
  const sigLineX = pageWidth - MARGIN - sigLineWidth;
  doc.setDrawColor(...COLORS.border);
  doc.setLineWidth(0.4);
  doc.line(sigLineX, sigY, pageWidth - MARGIN, sigY);

  doc.setFontSize(8 * fontSizeMultiplier);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.text);
  const sigTextWidth = doc.getTextWidth('Authorized Signature');
  doc.text('Authorized Signature', sigLineX + (sigLineWidth - sigTextWidth) / 2, sigY + 5);

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
