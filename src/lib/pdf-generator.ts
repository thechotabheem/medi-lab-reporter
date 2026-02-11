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

const darkenColor = (rgb: [number, number, number], factor: number = 0.8): [number, number, number] => {
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
  primaryDark: [0, 121, 107] as [number, number, number],
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
  alertAmber: [255, 251, 235] as [number, number, number],
  alertAmberBorder: [217, 119, 6] as [number, number, number],
};

// Increased margins for more whitespace
const MARGIN = 18;
const FOOTER_HEIGHT = 18;

const getValueStatus = (
  value: number | string | null | undefined,
  field: { normalRange?: { min?: number; max?: number; male?: { min?: number; max?: number }; female?: { min?: number; max?: number } } },
  gender: Gender
): 'normal' | 'abnormal' | 'unknown' => {
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

  if (min !== undefined && value < min) return 'abnormal';
  if (max !== undefined && value > max) return 'abnormal';
  return 'normal';
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

export const generateReportPDF = async ({ report, patient, clinic, reportUrl, customTemplate }: GeneratePDFOptions): Promise<jsPDF> => {
  const pageFormat = clinic?.page_size === 'letter' ? 'letter' : clinic?.page_size === 'legal' ? 'legal' : 'a4';
  const doc = new jsPDF({ format: pageFormat });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  const accentColor = clinic?.accent_color ? hexToRgb(clinic.accent_color) : DEFAULT_COLORS.primary;
  const accentColorDark = darkenColor(accentColor);
  const accentColorLight = lightenColor(accentColor, 0.85);
  const secondaryColor = clinic?.secondary_color ? hexToRgb(clinic.secondary_color) : DEFAULT_COLORS.border;
  
  const fontSizeMultiplier = clinic?.font_size === 'small' ? 0.9 : clinic?.font_size === 'large' ? 1.1 : 1;
  const showLogoOnAllPages = clinic?.show_logo_on_all_pages ?? true;
  const showAbnormalSummary = clinic?.show_abnormal_summary ?? true;
  const showPatientId = clinic?.show_patient_id ?? true;
  const signatureTitleLeft = clinic?.signature_title_left || 'Lab Technician';
  const signatureTitleRight = clinic?.signature_title_right || 'Pathologist';
  const borderStyle = clinic?.border_style || 'simple';
  // contactDisplayFormat removed – contacts always right-aligned in header
  const pdfStyle = clinic?.pdf_style || 'modern';
  const isClassic = pdfStyle === 'classic';
  const logoWatermarkEnabled = clinic?.logo_watermark_enabled ?? false;
  
  const COLORS = {
    ...DEFAULT_COLORS,
    primary: accentColor,
    primaryDark: accentColorDark,
    primaryLight: accentColorLight,
    border: secondaryColor,
  };
  
  let logoBase64: string | null = null;
  if (clinic?.logo_url) {
    logoBase64 = await loadImageAsBase64(clinic.logo_url);
  }

  // Page numbers removed – footer now shows only "Generated: [Date]"

  // ── Watermark (text or logo) ──
  const drawWatermark = (pageNum: number) => {
    doc.setPage(pageNum);
    
    // Logo watermark – faint centered logo on every page
    if (logoWatermarkEnabled && logoBase64) {
      doc.saveGraphicsState();
      try {
        const wmSize = 80;
        const wmX = (pageWidth - wmSize) / 2;
        const wmY = (pageHeight - wmSize) / 2;
        // jsPDF doesn't have native opacity for images, so we draw it normally
        // but at a large size in the center – the logo itself should be recognizable
        (doc as any).setGState(new (doc as any).GState({ opacity: 0.06 }));
        doc.addImage(logoBase64, 'AUTO', wmX, wmY, wmSize, wmSize);
      } catch {
        // Logo watermark failed
      }
      doc.restoreGraphicsState();
    }
    
    // Text watermark
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
  const drawHeader = (pageNum: number, isFirstPage: boolean) => {
    doc.setPage(pageNum);
    let yPos = MARGIN;

    if (isFirstPage) {
      // ── Both styles: Logo LEFT, Contact RIGHT ──
      let logoEndX = MARGIN;

      if (logoBase64) {
        try {
          const logoSize = isClassic ? 22 : 18;
          doc.addImage(logoBase64, 'AUTO', MARGIN, yPos - 2, logoSize, logoSize);
          logoEndX = MARGIN + logoSize + 4;
        } catch { /* */ }
      }

      // Clinic name next to logo
      const nameX = logoEndX;
      doc.setFontSize((isClassic ? 22 : 20) * fontSizeMultiplier);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...COLORS.primaryDark);
      doc.text(clinic?.name || 'Medical Laboratory', nameX, yPos + 6);

      if (clinic?.tagline) {
        doc.setFontSize((isClassic ? 10 : 9) * fontSizeMultiplier);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(...COLORS.textMuted);
        doc.text(clinic.tagline, nameX, yPos + 12);
      }

      // Right-aligned contact info (stacked: address, phone, email)
      const contactX = pageWidth - MARGIN;
      let contactY = yPos + 2;
      doc.setFontSize(7.5 * fontSizeMultiplier);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...COLORS.label);

      if (clinic?.address) {
        doc.text(clinic.address, contactX, contactY, { align: 'right' });
        contactY += 4;
      }
      if (clinic?.phone) {
        doc.text(clinic.phone, contactX, contactY, { align: 'right' });
        contactY += 4;
      }
      if (clinic?.email) {
        doc.text(clinic.email, contactX, contactY, { align: 'right' });
        contactY += 4;
      }

      yPos += (clinic?.tagline ? 18 : 14);

      if (clinic?.header_text) {
        doc.setFontSize(8 * fontSizeMultiplier);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...COLORS.textMuted);
        const headerLines = doc.splitTextToSize(clinic.header_text, pageWidth - MARGIN * 2);
        doc.text(headerLines, MARGIN, yPos);
        yPos += headerLines.length * 3.5 + 2;
      }

      // Horizontal divider
      if (borderStyle !== 'none') {
        yPos += 2;
        doc.setDrawColor(...COLORS.primary);
        if (isClassic) {
          doc.setLineWidth(1.5);
          doc.line(MARGIN, yPos, pageWidth - MARGIN, yPos);
          if (borderStyle === 'double') {
            yPos += 2;
            doc.setLineWidth(0.5);
            doc.line(MARGIN, yPos, pageWidth - MARGIN, yPos);
          }
        } else {
          doc.setLineWidth(0.8);
          doc.line(MARGIN, yPos, pageWidth - MARGIN, yPos);
          yPos += 1.5;
          doc.setDrawColor(...COLORS.borderLight);
          doc.setLineWidth(0.3);
          doc.line(MARGIN, yPos, pageWidth - MARGIN, yPos);
        }
      }
    } else {
      // Compact continuation header
      if (showLogoOnAllPages && logoBase64) {
        try {
          doc.addImage(logoBase64, 'AUTO', MARGIN, yPos - 2, 10, 10);
        } catch { /* */ }
      }
      
      const headerX = (showLogoOnAllPages && logoBase64) ? MARGIN + 13 : MARGIN;
      doc.setFontSize(11 * fontSizeMultiplier);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...COLORS.primaryDark);
      doc.text(clinic?.name || 'Medical Laboratory', headerX, yPos + 5);
      
      doc.setFontSize(8 * fontSizeMultiplier);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...COLORS.textMuted);
      doc.text(`Report #: ${report.report_number}`, pageWidth - MARGIN, yPos + 5, { align: 'right' });
      
      yPos += 9;
      if (borderStyle !== 'none') {
        doc.setDrawColor(...COLORS.primary);
        doc.setLineWidth(0.4);
        doc.line(MARGIN, yPos, pageWidth - MARGIN, yPos);
      }
    }
  };

  // ── Footer ──
  const drawFooter = (pageNum: number) => {
    doc.setPage(pageNum);
    const footerY = pageHeight - FOOTER_HEIGHT;
    
    // Thin line
    doc.setDrawColor(...COLORS.borderLight);
    doc.setLineWidth(0.3);
    doc.line(MARGIN, footerY, pageWidth - MARGIN, footerY);
    
    // Centered "Generated: [Date]"
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.label);
    doc.text(`Generated: ${format(new Date(), 'dd MMM yyyy, hh:mm a')}`, pageWidth / 2, footerY + 5, { align: 'center' });
  };

  let yPos = MARGIN;

  // ============ FIRST PAGE HEADER ============
  drawHeader(1, true);
  
  // Calculate dynamic header end position
  let headerEndY = MARGIN;
  const hasTagline = !!clinic?.tagline;
  const hasHeaderText = !!clinic?.header_text;
  
  headerEndY += (hasTagline ? 18 : 14);
  if (hasHeaderText) headerEndY += 6;
  headerEndY += 6; // divider space
  
  yPos = headerEndY + 6;

  // ============ REPORT TITLE ============
  
  const isCombined = report.report_type === 'combined';
  const reportTitle = isCombined && report.included_tests
    ? `Combined Report — ${report.included_tests.map(t => getReportTypeName(t as ReportType)).join(', ')}`
    : getReportTypeName(report.report_type);
  
  if (isClassic) {
    // Classic: full-width colored bar
    doc.setFillColor(...COLORS.primary);
    doc.rect(MARGIN, yPos, pageWidth - MARGIN * 2, 10, 'F');
    doc.setFontSize((isCombined ? 10 : 12) * fontSizeMultiplier);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.white);
    doc.text(reportTitle, MARGIN + 5, yPos + 7, { maxWidth: pageWidth / 2 - MARGIN });
    doc.setFontSize(10 * fontSizeMultiplier);
    doc.setFont('helvetica', 'normal');
    doc.text(`Report #: ${report.report_number}`, pageWidth - MARGIN - 5, yPos + 7, { align: 'right' });
    yPos += 15;
  } else {
    // Modern: subtle left-accent strip
    doc.setFillColor(...COLORS.primary);
    doc.rect(MARGIN, yPos, 2.5, 8, 'F');
    doc.setFontSize((isCombined ? 10 : 11) * fontSizeMultiplier);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.text);
    doc.text(reportTitle, MARGIN + 6, yPos + 5.5, { maxWidth: pageWidth / 2 });
    doc.setFontSize(9 * fontSizeMultiplier);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.textMuted);
    doc.text(`#${report.report_number}`, pageWidth - MARGIN, yPos + 5.5, { align: 'right' });
    yPos += 14;
  }

  // ============ PATIENT INFORMATION ============

  // Section title
  if (isClassic) {
    doc.setFillColor(...COLORS.primary);
    doc.rect(MARGIN, yPos, pageWidth - MARGIN * 2, 7, 'F');
    doc.setFontSize(9 * fontSizeMultiplier);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.white);
    doc.text('PATIENT INFORMATION', MARGIN + 3, yPos + 5);
    yPos += 10;
  } else {
    doc.setFillColor(...COLORS.primary);
    doc.rect(MARGIN, yPos, 2.5, 7, 'F');
    doc.setFontSize(9.5 * fontSizeMultiplier);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.text);
    doc.text('PATIENT INFORMATION', MARGIN + 6, yPos + 5);
    yPos += 10;
  }

  // Info box background
  if (isClassic) {
    doc.setFillColor(...COLORS.background);
    doc.setDrawColor(...COLORS.border);
    doc.setLineWidth(0.3);
    doc.rect(MARGIN, yPos, pageWidth - MARGIN * 2, 28, 'FD');
  } else {
    doc.setFillColor(...COLORS.primary);
    doc.rect(MARGIN, yPos, 1.5, 28, 'F');
  }

  const leftCol = isClassic ? MARGIN + 5 : MARGIN + 6;
  const leftValCol = leftCol + 26;
  const rightCol = pageWidth / 2 + 5;
  const rightValCol = rightCol + 28;
  let infoY = yPos + 5;
  const rowGap = 6;

  // Labels
  doc.setFontSize(8 * fontSizeMultiplier);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.label);

  doc.text('Name', leftCol, infoY);
  doc.text('Patient ID', rightCol, infoY);
  doc.text('Age / Gender', leftCol, infoY + rowGap);
  doc.text('Report No.', rightCol, infoY + rowGap);
  doc.text('Referring Dr.', leftCol, infoY + rowGap * 2);
  doc.text('Collection Date', rightCol, infoY + rowGap * 2);
  doc.text('Report Date', leftCol, infoY + rowGap * 3);
  doc.text('Status', rightCol, infoY + rowGap * 3);

  // Values
  doc.setFontSize(9 * fontSizeMultiplier);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.text);

  doc.text(patient.full_name, leftValCol, infoY);
  doc.text(patient.patient_id_number || '—', rightValCol, infoY);
  doc.text(`${calculateAge(patient.date_of_birth)} / ${patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1)}`, leftValCol, infoY + rowGap);
  doc.text(report.report_number, rightValCol, infoY + rowGap);
  doc.text(report.referring_doctor || '—', leftValCol, infoY + rowGap * 2);
  doc.text(format(new Date(report.test_date), 'dd MMM yyyy'), rightValCol, infoY + rowGap * 2);
  doc.text(format(new Date(report.created_at), 'dd MMM yyyy'), leftValCol, infoY + rowGap * 3);
  doc.text(report.status.charAt(0).toUpperCase() + report.status.slice(1), rightValCol, infoY + rowGap * 3);

  // Column separator
  if (!isClassic) {
    doc.setDrawColor(...COLORS.borderLight);
    doc.setLineDashPattern([1, 1.5], 0);
    doc.setLineWidth(0.2);
    const midX = pageWidth / 2;
    doc.line(midX, yPos + 1, midX, yPos + 27);
    doc.setLineDashPattern([], 0);
  }

  yPos += 34;

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
  
  // ============ COLLECT ABNORMAL VALUES ============
  
  const abnormalValues: { label: string; value: string; range: string }[] = [];
  for (const category of template.categories) {
    for (const field of category.fields) {
      const value = reportData[field.name];
      if (value !== undefined && value !== null && value !== '') {
        const status = getValueStatus(value as number, field, patient.gender);
        if (status === 'abnormal') {
          abnormalValues.push({
            label: field.label,
            value: `${value}${field.unit ? ` ${field.unit}` : ''}`,
            range: formatNormalRange(field, patient.gender),
          });
        }
      }
    }
  }

  // ============ ABNORMAL SUMMARY – soft amber/yellow ============

  if (showAbnormalSummary && abnormalValues.length > 0) {
    if (yPos > pageHeight - FOOTER_HEIGHT - 50) {
      drawFooter(doc.getNumberOfPages());
      doc.addPage();
      drawHeader(doc.getNumberOfPages(), false);
      yPos = MARGIN + 15;
    }

    const alertHeight = Math.min(abnormalValues.length * 4.5 + 11, 38);
    
    // Soft amber background
    doc.setFillColor(...COLORS.alertAmber);
    doc.rect(MARGIN, yPos, pageWidth - MARGIN * 2, alertHeight, 'F');
    
    // Thin red left border
    doc.setFillColor(...COLORS.destructive);
    doc.rect(MARGIN, yPos, 1.5, alertHeight, 'F');
    
    doc.setFontSize(8.5 * fontSizeMultiplier);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.alertAmberBorder);
    doc.text(`Abnormal Values (${abnormalValues.length})`, MARGIN + 5, yPos + 5);
    
    doc.setFontSize(7.5 * fontSizeMultiplier);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.text);
    let alertY = yPos + 10;
    abnormalValues.slice(0, 5).forEach((item) => {
      doc.text(`• ${item.label}: ${item.value}  (Ref: ${item.range})`, MARGIN + 5, alertY);
      alertY += 4;
    });
    if (abnormalValues.length > 5) {
      doc.setTextColor(...COLORS.textMuted);
      doc.text(`+ ${abnormalValues.length - 5} more`, MARGIN + 5, alertY);
    }
    
    yPos += alertHeight + 10;
  }

  // ============ TEST RESULTS TABLES ============

  for (const category of template.categories) {
    const categoryFields = category.fields.filter(
      (field) => reportData[field.name] !== undefined && reportData[field.name] !== null && reportData[field.name] !== ''
    );
    if (categoryFields.length === 0) continue;

    if (yPos > pageHeight - FOOTER_HEIGHT - 40) {
      drawFooter(doc.getNumberOfPages());
      doc.addPage();
      drawHeader(doc.getNumberOfPages(), false);
      yPos = MARGIN + 15;
    }

    // Category Header
    if (isClassic) {
      // Classic: full-color bar
      doc.setFillColor(...COLORS.primary);
      doc.rect(MARGIN, yPos, pageWidth - MARGIN * 2, 7, 'F');
      doc.setFontSize(10 * fontSizeMultiplier);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...COLORS.white);
      doc.text(category.name.toUpperCase(), MARGIN + 3, yPos + 5);
    } else {
      // Modern: left-accent strip
      doc.setFillColor(...COLORS.primary);
      doc.rect(MARGIN, yPos, 2.5, 7, 'F');
      doc.setFontSize(9.5 * fontSizeMultiplier);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...COLORS.text);
      doc.text(category.name.toUpperCase(), MARGIN + 6, yPos + 5);
    }
    yPos += 10;

    // Build table data
    const tableData: (string | { content: string; styles: object })[][] = [];

    for (const field of categoryFields) {
      const value = reportData[field.name];
      const displayValue = String(value);
      const normalRange = formatNormalRange(field, patient.gender);
      const status = getValueStatus(value as number, field, patient.gender);
      const isAbnormal = status === 'abnormal';

      const row = [
        field.label,
        {
          content: displayValue,
          styles: isAbnormal ? { textColor: COLORS.destructive } : {},
        },
        field.unit || '—',
        normalRange,
        {
          content: status === 'unknown' ? '—' : isAbnormal ? '● Abnormal' : 'Normal',
          styles: isAbnormal 
            ? { textColor: COLORS.destructive, fontSize: 7.5 * fontSizeMultiplier } 
            : status === 'normal' 
              ? { textColor: COLORS.success, fontSize: 7.5 * fontSizeMultiplier } 
              : { fontSize: 7.5 * fontSizeMultiplier },
        },
      ];

      tableData.push(row as (string | { content: string; styles: object })[]);
    }

    autoTable(doc, {
      startY: yPos,
      head: [['Test', 'Result', 'Unit', 'Reference Range', 'Status']],
      body: tableData,
      theme: isClassic ? 'grid' : 'striped',
      showHead: 'everyPage',
      headStyles: isClassic ? {
        fillColor: COLORS.primaryDark,
        textColor: COLORS.white,
        fontSize: 8 * fontSizeMultiplier,
        fontStyle: 'bold',
        halign: 'center',
        cellPadding: 2.5,
      } : {
        fillColor: COLORS.tableHeaderBg,
        textColor: [60, 60, 60] as [number, number, number],
        fontSize: 8 * fontSizeMultiplier,
        fontStyle: 'bold',
        halign: 'left',
        cellPadding: 3,
        lineWidth: 0,
      },
      bodyStyles: {
        fontSize: 8.5 * fontSizeMultiplier,
        cellPadding: isClassic ? 2.5 : 3,
        textColor: COLORS.text,
        lineWidth: isClassic ? undefined : 0,
      },
      columnStyles: {
        0: { cellWidth: 52, fontStyle: 'bold' },
        1: { halign: 'center', cellWidth: 28 },
        2: { halign: 'center', cellWidth: 22 },
        3: { halign: 'center', cellWidth: 38 },
        4: { halign: 'center', cellWidth: 28 },
      },
      alternateRowStyles: {
        fillColor: COLORS.tableStripeBg,
      },
      tableLineColor: isClassic ? (COLORS.border as [number, number, number]) : ([255, 255, 255] as [number, number, number]),
      tableLineWidth: isClassic ? 0.1 : 0,
      ...(isClassic ? {} : {
        didParseCell: (data: any) => {
          if (data.section === 'body') {
            data.cell.styles.lineColor = [235, 235, 235] as [number, number, number];
            data.cell.styles.lineWidth = { top: 0, right: 0, bottom: 0.15, left: 0 };
          }
        },
      }),
      margin: { left: MARGIN, right: MARGIN, top: MARGIN + 15, bottom: FOOTER_HEIGHT + 5 },
      didDrawPage: (data) => {
        const pageNum = doc.getNumberOfPages();
        if (data.pageNumber > 1) {
          drawHeader(pageNum, false);
        }
      },
    });

    yPos = (doc as any).lastAutoTable.finalY + 12;
  }

  // ============ SIGNATURE SECTION ============

  if (yPos > pageHeight - FOOTER_HEIGHT - 50) {
    drawFooter(doc.getNumberOfPages());
    doc.addPage();
    drawHeader(doc.getNumberOfPages(), false);
    yPos = MARGIN + 15;
  }

  yPos += 6;

  // Single signature: Lab Technician
  doc.setFontSize(8 * fontSizeMultiplier);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.text);
  doc.text("Lab Technician's Signature:", MARGIN, yPos);

  yPos += 14;

  doc.setDrawColor(...COLORS.border);
  doc.setLineWidth(0.4);
  doc.line(MARGIN, yPos, MARGIN + 70, yPos);

  // ============ COMMENTS & NOTES (after signature) ============

  if (report.clinical_notes) {
    yPos += 14;

    if (yPos > pageHeight - FOOTER_HEIGHT - 30) {
      drawFooter(doc.getNumberOfPages());
      doc.addPage();
      drawHeader(doc.getNumberOfPages(), false);
      yPos = MARGIN + 15;
    }

    doc.setFontSize(9 * fontSizeMultiplier);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.text);
    doc.text('COMMENTS & NOTES', pageWidth / 2, yPos, { align: 'center' });
    yPos += 6;

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.text);
    doc.setFontSize(8.5 * fontSizeMultiplier);
    const notesLines = doc.splitTextToSize(report.clinical_notes, pageWidth - MARGIN * 2);
    doc.text(notesLines, MARGIN, yPos);
    yPos += notesLines.length * 4 + 4;
  }

  // ============ DRAW ALL FOOTERS AND WATERMARKS ============
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    drawFooter(i);
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
