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
  const contactDisplayFormat = clinic?.contact_display_format || 'inline';
  
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

  const pageNumbers: { x: number; y: number; page: number }[] = [];

  // ── Watermark ──
  const drawWatermark = (pageNum: number) => {
    if (!clinic?.watermark_text) return;
    doc.setPage(pageNum);
    doc.saveGraphicsState();
    doc.setFontSize(50);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(220, 220, 220);
    doc.text(clinic.watermark_text.toUpperCase(), pageWidth / 2, pageHeight / 2, {
      align: 'center',
      angle: 45,
    });
    doc.restoreGraphicsState();
  };

  // ── Header ──
  const drawHeader = (pageNum: number, isFirstPage: boolean) => {
    doc.setPage(pageNum);
    let yPos = MARGIN;

    if (isFirstPage) {
      // Left-aligned letterhead style
      let textStartX = MARGIN;
      
      if (logoBase64) {
        try {
          doc.addImage(logoBase64, 'AUTO', MARGIN, yPos - 2, 18, 18);
          textStartX = MARGIN + 22;
        } catch {
          // Logo failed
        }
      }

      // Clinic name beside logo
      doc.setFontSize(20 * fontSizeMultiplier);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...COLORS.primaryDark);
      doc.text(clinic?.name || 'Medical Laboratory', textStartX, yPos + 6);

      // Tagline below name
      if (clinic?.tagline) {
        doc.setFontSize(9 * fontSizeMultiplier);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(...COLORS.textMuted);
        doc.text(clinic.tagline, textStartX, yPos + 12);
      }

      yPos += (clinic?.tagline ? 18 : 14);

      // Header text
      if (clinic?.header_text) {
        doc.setFontSize(8 * fontSizeMultiplier);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...COLORS.textMuted);
        const headerLines = doc.splitTextToSize(clinic.header_text, pageWidth - MARGIN * 2);
        doc.text(headerLines, MARGIN, yPos);
        yPos += headerLines.length * 3.5 + 2;
      }

      // Contact info – single subtle line with pipe separators
      if (contactDisplayFormat !== 'hidden' && (clinic?.address || clinic?.phone || clinic?.email || clinic?.website)) {
        doc.setFontSize(7.5 * fontSizeMultiplier);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...COLORS.label);
        
        const contactParts = [clinic?.address, clinic?.phone, clinic?.email, clinic?.website].filter(Boolean);
        
        if (contactDisplayFormat === 'stacked') {
          contactParts.forEach((part) => {
            doc.text(part as string, MARGIN, yPos);
            yPos += 3.5;
          });
        } else {
          doc.text(contactParts.join('  ·  '), MARGIN, yPos);
          yPos += 5;
        }
      }

      // Elegant double-line divider: accent top, light gray bottom
      if (borderStyle !== 'none') {
        yPos += 2;
        doc.setDrawColor(...COLORS.primary);
        doc.setLineWidth(0.8);
        doc.line(MARGIN, yPos, pageWidth - MARGIN, yPos);
        
        yPos += 1.5;
        doc.setDrawColor(...COLORS.borderLight);
        doc.setLineWidth(0.3);
        doc.line(MARGIN, yPos, pageWidth - MARGIN, yPos);
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
    
    // Footer text centered
    if (clinic?.footer_text) {
      doc.setFontSize(7);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(...COLORS.label);
      doc.text(clinic.footer_text, pageWidth / 2, footerY + 5, { align: 'center' });
    }

    // Page number right-aligned
    pageNumbers.push({ x: pageWidth - MARGIN, y: footerY + (clinic?.footer_text ? 10 : 5), page: pageNum });
  };

  let yPos = MARGIN;

  // ============ FIRST PAGE HEADER ============
  drawHeader(1, true);
  
  // Calculate dynamic header end position
  let headerEndY = MARGIN;
  const hasTagline = !!clinic?.tagline;
  const hasHeaderText = !!clinic?.header_text;
  const hasContact = contactDisplayFormat !== 'hidden' && !!(clinic?.address || clinic?.phone || clinic?.email || clinic?.website);
  
  headerEndY += (hasTagline ? 18 : 14); // name + tagline
  if (hasHeaderText) headerEndY += 6;
  if (hasContact) headerEndY += (contactDisplayFormat === 'stacked' ? 14 : 5);
  headerEndY += 6; // divider space
  
  yPos = headerEndY + 6;

  // ============ REPORT TITLE – subtle left-accent strip ============
  
  const isCombined = report.report_type === 'combined';
  const reportTitle = isCombined && report.included_tests
    ? `Combined Report — ${report.included_tests.map(t => getReportTypeName(t as ReportType)).join(', ')}`
    : getReportTypeName(report.report_type);
  
  // Left accent strip (3px wide)
  doc.setFillColor(...COLORS.primary);
  doc.rect(MARGIN, yPos, 2.5, 8, 'F');
  
  doc.setFontSize((isCombined ? 10 : 11) * fontSizeMultiplier);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.text);
  doc.text(reportTitle, MARGIN + 6, yPos + 5.5, { maxWidth: pageWidth / 2 });
  
  // Report number on right
  doc.setFontSize(9 * fontSizeMultiplier);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.textMuted);
  doc.text(`#${report.report_number}`, pageWidth - MARGIN, yPos + 5.5, { align: 'right' });
  yPos += 14;

  // ============ PATIENT & REPORT INFO – open layout with accent border ============
  
  // Thin accent-colored left border strip
  doc.setFillColor(...COLORS.primary);
  doc.rect(MARGIN, yPos, 1.5, 28, 'F');
  
  const leftCol = MARGIN + 6;
  const leftValCol = leftCol + 26;
  const rightCol = pageWidth / 2 + 5;
  const rightValCol = rightCol + 24;
  let infoY = yPos + 5;
  const rowGap = 6;

  // Labels (8pt, muted)
  doc.setFontSize(8 * fontSizeMultiplier);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.label);

  // Row 1
  doc.text('Patient Name', leftCol, infoY);
  doc.text('Report No.', rightCol, infoY);
  // Row 2
  doc.text('Age / Gender', leftCol, infoY + rowGap);
  doc.text('Test Date', rightCol, infoY + rowGap);
  // Row 3
  if (showPatientId) {
    doc.text('Patient ID', leftCol, infoY + rowGap * 2);
  }
  doc.text('Status', rightCol, infoY + rowGap * 2);
  // Row 4
  doc.text('Ref. Doctor', leftCol, infoY + rowGap * (showPatientId ? 3 : 2));
  doc.text('Report Date', rightCol, infoY + rowGap * 3);

  // Values (9pt, dark, semi-bold)
  doc.setFontSize(9 * fontSizeMultiplier);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.text);

  doc.text(patient.full_name, leftValCol, infoY);
  doc.text(report.report_number, rightValCol, infoY);
  
  doc.text(`${calculateAge(patient.date_of_birth)} / ${patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1)}`, leftValCol, infoY + rowGap);
  doc.text(format(new Date(report.test_date), 'dd MMM yyyy'), rightValCol, infoY + rowGap);
  
  if (showPatientId) {
    doc.text(patient.patient_id_number || '—', leftValCol, infoY + rowGap * 2);
  }
  doc.text(report.status.charAt(0).toUpperCase() + report.status.slice(1), rightValCol, infoY + rowGap * 2);
  
  doc.text(report.referring_doctor || '—', leftValCol, infoY + rowGap * (showPatientId ? 3 : 2));
  doc.text(format(new Date(report.created_at), 'dd MMM yyyy'), rightValCol, infoY + rowGap * 3);

  // Subtle dotted separator between left and right columns
  doc.setDrawColor(...COLORS.borderLight);
  doc.setLineDashPattern([1, 1.5], 0);
  doc.setLineWidth(0.2);
  const midX = pageWidth / 2;
  doc.line(midX, yPos + 1, midX, yPos + 27);
  doc.setLineDashPattern([], 0);

  yPos += 34;

  // ============ CLINICAL NOTES ============
  
  if (report.clinical_notes) {
    doc.setFontSize(8 * fontSizeMultiplier);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.label);
    doc.text('CLINICAL NOTES', MARGIN, yPos);
    yPos += 4;
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.text);
    doc.setFontSize(8.5 * fontSizeMultiplier);
    const notesLines = doc.splitTextToSize(report.clinical_notes, pageWidth - MARGIN * 2);
    doc.text(notesLines, MARGIN, yPos);
    yPos += notesLines.length * 4 + 8;
  }

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

    // Category Header – left-accent strip + bold name on white
    doc.setFillColor(...COLORS.primary);
    doc.rect(MARGIN, yPos, 2.5, 7, 'F');
    
    doc.setFontSize(9.5 * fontSizeMultiplier);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.text);
    doc.text(category.name.toUpperCase(), MARGIN + 6, yPos + 5);
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
      theme: 'striped',
      showHead: 'everyPage',
      headStyles: {
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
        cellPadding: 3,
        textColor: COLORS.text,
        lineWidth: 0,
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
      // No vertical lines – modern clean look
      tableLineColor: [255, 255, 255] as [number, number, number],
      tableLineWidth: 0,
      // Thin horizontal separators only
      didParseCell: (data) => {
        if (data.section === 'body') {
          data.cell.styles.lineColor = [235, 235, 235] as [number, number, number];
          data.cell.styles.lineWidth = { top: 0, right: 0, bottom: 0.15, left: 0 } as any;
        }
      },
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

  const signatureWidth = (pageWidth - MARGIN * 2 - 30) / 2;
  
  // Left signature
  doc.setFontSize(8 * fontSizeMultiplier);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.text);
  doc.text(signatureTitleLeft, MARGIN, yPos);
  
  yPos += 14;
  
  // Solid thin lines instead of dashed
  doc.setDrawColor(...COLORS.border);
  doc.setLineWidth(0.4);
  doc.line(MARGIN, yPos, MARGIN + signatureWidth, yPos);
  doc.line(pageWidth - MARGIN - signatureWidth, yPos, pageWidth - MARGIN, yPos);
  
  // Role labels below the line
  doc.setFontSize(7.5 * fontSizeMultiplier);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.label);
  doc.text('Signature & Date', MARGIN, yPos + 5);
  doc.text('Signature & Date', pageWidth - MARGIN - signatureWidth, yPos + 5);

  // Right title (above the line, same row as left)
  doc.setFontSize(8 * fontSizeMultiplier);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.text);
  doc.text(signatureTitleRight, pageWidth - MARGIN - signatureWidth, yPos - 14);

  // ============ DRAW ALL FOOTERS AND WATERMARKS ============
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    drawFooter(i);
    drawWatermark(i);
  }

  // ============ ADD PAGE NUMBERS (right-aligned) ============
  for (const pn of pageNumbers) {
    doc.setPage(pn.page);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.label);
    doc.text(`Page ${pn.page} of ${totalPages}`, pn.x, pn.y, { align: 'right' });
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
