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
  // New branding options
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
  reportUrl?: string; // URL for QR code
  customTemplate?: ReportTemplate | null; // Custom template with customizations applied
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

// Helper to darken a color
const darkenColor = (rgb: [number, number, number], factor: number = 0.8): [number, number, number] => {
  return [
    Math.round(rgb[0] * factor),
    Math.round(rgb[1] * factor),
    Math.round(rgb[2] * factor),
  ];
};

// Default colors
const DEFAULT_COLORS = {
  primary: [0, 150, 136] as [number, number, number],
  primaryDark: [0, 121, 107] as [number, number, number],
  destructive: [220, 38, 38] as [number, number, number],
  success: [22, 163, 74] as [number, number, number],
  text: [30, 30, 30] as [number, number, number],
  textMuted: [100, 100, 100] as [number, number, number],
  border: [200, 200, 200] as [number, number, number],
  background: [248, 250, 252] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
};

// Page margins and constants
const MARGIN = 15;
const HEADER_HEIGHT = 35;
const FOOTER_HEIGHT = 20;

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
  
  return `${age} years`;
};

// Load image and convert to base64
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
  // Determine page format based on clinic settings
  const pageFormat = clinic?.page_size === 'letter' ? 'letter' : clinic?.page_size === 'legal' ? 'legal' : 'a4';
  const doc = new jsPDF({ format: pageFormat });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  // Get colors from clinic accent color or use defaults
  const accentColor = clinic?.accent_color ? hexToRgb(clinic.accent_color) : DEFAULT_COLORS.primary;
  const accentColorDark = darkenColor(accentColor);
  const secondaryColor = clinic?.secondary_color ? hexToRgb(clinic.secondary_color) : DEFAULT_COLORS.border;
  
  // Determine font size multiplier
  const fontSizeMultiplier = clinic?.font_size === 'small' ? 0.9 : clinic?.font_size === 'large' ? 1.1 : 1;
  
  // Show logo on continuation pages
  const showLogoOnAllPages = clinic?.show_logo_on_all_pages ?? true;
  
  // Show abnormal summary
  const showAbnormalSummary = clinic?.show_abnormal_summary ?? true;
  
  // Show patient ID
  const showPatientId = clinic?.show_patient_id ?? true;
  
  // Signature titles
  const signatureTitleLeft = clinic?.signature_title_left || 'Lab Technician';
  const signatureTitleRight = clinic?.signature_title_right || 'Pathologist';
  
  // Border style
  const borderStyle = clinic?.border_style || 'simple';
  
  // Contact display format
  const contactDisplayFormat = clinic?.contact_display_format || 'inline';
  
  const COLORS = {
    ...DEFAULT_COLORS,
    primary: accentColor,
    primaryDark: accentColorDark,
    border: secondaryColor,
  };
  
  // Pre-load logo if available
  let logoBase64: string | null = null;
  if (clinic?.logo_url) {
    logoBase64 = await loadImageAsBase64(clinic.logo_url);
  }

  // Page tracking for "Page X of Y"
  const pageNumbers: { x: number; y: number; page: number }[] = [];

  // Function to draw watermark on a page
  const drawWatermark = (pageNum: number) => {
    if (!clinic?.watermark_text) return;
    
    doc.setPage(pageNum);
    doc.saveGraphicsState();
    
    // Set watermark style
    doc.setFontSize(50);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(200, 200, 200); // Light gray
    
    // Draw diagonal watermark
    const text = clinic.watermark_text.toUpperCase();
    const textWidth = doc.getTextWidth(text);
    
    // Center the watermark
    const centerX = pageWidth / 2;
    const centerY = pageHeight / 2;
    
    // Rotate and draw
    doc.text(text, centerX, centerY, {
      align: 'center',
      angle: 45,
    });
    
    doc.restoreGraphicsState();
  };
  const drawHeader = (pageNum: number, isFirstPage: boolean) => {
    doc.setPage(pageNum);
    let yPos = MARGIN;

    if (isFirstPage) {
      // Full header on first page
      // Logo + Clinic Name
      let nameStartX = pageWidth / 2;
      
      if (logoBase64) {
        try {
          doc.addImage(logoBase64, 'AUTO', MARGIN, yPos - 5, 20, 20);
          nameStartX = (pageWidth + 25) / 2;
        } catch {
          // Logo failed, continue without
        }
      }

      doc.setFontSize(22 * fontSizeMultiplier);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...COLORS.primaryDark);
      doc.text(clinic?.name || 'Medical Laboratory', nameStartX, yPos + 5, { align: 'center' });
      yPos += 10;

      // Tagline (if provided)
      if (clinic?.tagline) {
        doc.setFontSize(10 * fontSizeMultiplier);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(...COLORS.textMuted);
        doc.text(clinic.tagline, pageWidth / 2, yPos, { align: 'center' });
        yPos += 5;
      }

      // Header Text
      if (clinic?.header_text) {
        doc.setFontSize(10 * fontSizeMultiplier);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(...COLORS.textMuted);
        const headerLines = doc.splitTextToSize(clinic.header_text, pageWidth - MARGIN * 2 - 30);
        doc.text(headerLines, pageWidth / 2, yPos, { align: 'center' });
        yPos += headerLines.length * 4 + 2;
      }

      // Contact Info based on display format
      if (contactDisplayFormat !== 'hidden' && (clinic?.address || clinic?.phone || clinic?.email || clinic?.website)) {
        doc.setFontSize(8 * fontSizeMultiplier);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...COLORS.textMuted);
        
        const contactParts = [clinic?.address, clinic?.phone, clinic?.email, clinic?.website].filter(Boolean);
        
        if (contactDisplayFormat === 'stacked') {
          // Multiple lines
          contactParts.forEach((part) => {
            doc.text(part as string, pageWidth / 2, yPos, { align: 'center' });
            yPos += 4;
          });
        } else {
          // Inline (single line)
          doc.text(contactParts.join('  |  '), pageWidth / 2, yPos, { align: 'center' });
          yPos += 6;
        }
      }

      // Decorative Header Line based on border style
      if (borderStyle !== 'none') {
        doc.setDrawColor(...COLORS.primary);
        doc.setLineWidth(1.5);
        doc.line(MARGIN, yPos, pageWidth - MARGIN, yPos);
        
        if (borderStyle === 'double') {
          yPos += 2;
          doc.setLineWidth(0.5);
          doc.line(MARGIN, yPos, pageWidth - MARGIN, yPos);
        }
      }
    } else {
      // Compact header for continuation pages
      if (showLogoOnAllPages && logoBase64) {
        try {
          doc.addImage(logoBase64, 'AUTO', MARGIN, yPos - 3, 12, 12);
        } catch {
          // Logo failed
        }
      }
      
      doc.setFontSize(12 * fontSizeMultiplier);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...COLORS.primaryDark);
      const headerX = (showLogoOnAllPages && logoBase64) ? MARGIN + 15 : MARGIN;
      doc.text(clinic?.name || 'Medical Laboratory', headerX, yPos + 5);
      
      doc.setFontSize(9 * fontSizeMultiplier);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...COLORS.textMuted);
      doc.text(`Report #: ${report.report_number}`, pageWidth - MARGIN, yPos + 5, { align: 'right' });
      
      // Simple line
      yPos += 10;
      if (borderStyle !== 'none') {
        doc.setDrawColor(...COLORS.primary);
        doc.setLineWidth(0.5);
        doc.line(MARGIN, yPos, pageWidth - MARGIN, yPos);
      }
    }
  };

  // Function to draw footer on a page
  const drawFooter = (pageNum: number) => {
    doc.setPage(pageNum);
    const footerY = pageHeight - FOOTER_HEIGHT;
    
    // Footer line
    doc.setDrawColor(...COLORS.primary);
    doc.setLineWidth(0.5);
    doc.line(MARGIN, footerY, pageWidth - MARGIN, footerY);
    
    // Footer text
    if (clinic?.footer_text) {
      doc.setFontSize(7);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(...COLORS.textMuted);
      doc.text(clinic.footer_text, pageWidth / 2, footerY + 5, { align: 'center' });
    }

    // Store position for page number (will be filled in later)
    pageNumbers.push({ x: pageWidth / 2, y: footerY + 12, page: pageNum });
  };

  let yPos = MARGIN;

  // ============ FIRST PAGE HEADER ============
  drawHeader(1, true);
  yPos = MARGIN + HEADER_HEIGHT;

  // ============ REPORT TITLE BAR ============
  
  // Determine report title
  const isCombined = report.report_type === 'combined';
  const reportTitle = isCombined && report.included_tests
    ? `Combined Report (${report.included_tests.map(t => getReportTypeName(t as ReportType)).join(', ')})`
    : getReportTypeName(report.report_type);
  
  doc.setFillColor(...COLORS.primary);
  doc.rect(MARGIN, yPos, pageWidth - MARGIN * 2, 10, 'F');
  doc.setFontSize(isCombined ? 10 : 12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.white);
  doc.text(reportTitle, MARGIN + 5, yPos + 7, { maxWidth: pageWidth / 2 - MARGIN });
  
  // Report number on right
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Report #: ${report.report_number}`, pageWidth - MARGIN - 5, yPos + 7, { align: 'right' });
  yPos += 15;

  // ============ PATIENT & REPORT INFO ============
  
  doc.setFillColor(...COLORS.background);
  doc.setDrawColor(...COLORS.border);
  doc.setLineWidth(0.3);
  doc.rect(MARGIN, yPos, pageWidth - MARGIN * 2, 24, 'FD');

  const leftCol = MARGIN + 5;
  const rightCol = pageWidth / 2 + 5;
  let infoY = yPos + 5;

  doc.setFontSize(8 * fontSizeMultiplier);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.textMuted);

  // Left column labels
  doc.text('Patient Name:', leftCol, infoY);
  doc.text('Age / Gender:', leftCol, infoY + 6);
  if (showPatientId) {
    doc.text('Patient ID:', leftCol, infoY + 12);
  }
  doc.text('Ref. Doctor:', leftCol, infoY + (showPatientId ? 18 : 12));

  // Right column labels
  doc.text('Report No.:', rightCol, infoY);
  doc.text('Test Date:', rightCol, infoY + 6);
  doc.text('Status:', rightCol, infoY + 12);
  doc.text('Report Date:', rightCol, infoY + 18);

  // Values - Left column
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.text);
  doc.text(patient.full_name, leftCol + 28, infoY);
  doc.text(`${calculateAge(patient.date_of_birth)} / ${patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1)}`, leftCol + 28, infoY + 6);
  if (showPatientId) {
    doc.text(patient.patient_id_number || '-', leftCol + 28, infoY + 12);
  }
  doc.text(report.referring_doctor || '-', leftCol + 28, infoY + (showPatientId ? 18 : 12));

  // Values - Right column
  doc.text(report.report_number, rightCol + 28, infoY);
  doc.text(format(new Date(report.test_date), 'dd MMM yyyy'), rightCol + 28, infoY + 6);
  doc.text(report.status.charAt(0).toUpperCase() + report.status.slice(1), rightCol + 28, infoY + 12);
  doc.text(format(new Date(report.created_at), 'dd MMM yyyy'), rightCol + 28, infoY + 18);

  yPos += 30;

  // ============ CLINICAL NOTES ============
  
  if (report.clinical_notes) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.primary);
    doc.text('CLINICAL NOTES', MARGIN, yPos);
    yPos += 4;
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.text);
    doc.setFontSize(9);
    const notesLines = doc.splitTextToSize(report.clinical_notes, pageWidth - MARGIN * 2);
    doc.text(notesLines, MARGIN, yPos);
    yPos += notesLines.length * 4 + 6;
  }

  // ============ ABNORMAL VALUES SUMMARY ============
  
  // Use custom template if provided, otherwise fall back to default
  // For combined reports, build template from included_tests
  const isCombinedReport = report.report_type === 'combined';
  let template: ReportTemplate;
  
  if (customTemplate) {
    template = customTemplate;
  } else if (isCombinedReport && report.included_tests) {
    template = buildCombinedTemplate(report.included_tests);
  } else {
    template = reportTemplates[report.report_type];
  }
  
  // For combined reports, flatten the namespaced data
  const rawReportData = report.report_data as Record<string, unknown>;
  const reportData = isCombinedReport && report.included_tests
    ? flattenCombinedReportData(rawReportData, report.included_tests)
    : rawReportData;
  
  // Collect abnormal values
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

  if (showAbnormalSummary && abnormalValues.length > 0) {
    // Check if we need a new page
    if (yPos > pageHeight - FOOTER_HEIGHT - 50) {
      drawFooter(doc.getNumberOfPages());
      doc.addPage();
      drawHeader(doc.getNumberOfPages(), false);
      yPos = MARGIN + 15;
    }

    doc.setFillColor(254, 242, 242); // Light red background
    doc.setDrawColor(...COLORS.destructive);
    doc.setLineWidth(0.5);
    
    const alertHeight = Math.min(abnormalValues.length * 5 + 12, 40);
    doc.rect(MARGIN, yPos, pageWidth - MARGIN * 2, alertHeight, 'FD');
    
    doc.setFontSize(9 * fontSizeMultiplier);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.destructive);
    doc.text(`ABNORMAL VALUES DETECTED (${abnormalValues.length})`, MARGIN + 5, yPos + 5);
    
    doc.setFontSize(8 * fontSizeMultiplier);
    doc.setFont('helvetica', 'normal');
    let alertY = yPos + 10;
    abnormalValues.slice(0, 5).forEach((item) => {
      doc.text(`• ${item.label}: ${item.value} (Ref: ${item.range})`, MARGIN + 5, alertY);
      alertY += 4;
    });
    if (abnormalValues.length > 5) {
      doc.text(`... and ${abnormalValues.length - 5} more`, MARGIN + 5, alertY);
    }
    
    yPos += alertHeight + 6;
  }

  // ============ TEST RESULTS TABLES ============

  for (const category of template.categories) {
    const categoryFields = category.fields.filter(
      (field) => reportData[field.name] !== undefined && reportData[field.name] !== null && reportData[field.name] !== ''
    );
    if (categoryFields.length === 0) continue;

    // Check if we need a new page for category header
    if (yPos > pageHeight - FOOTER_HEIGHT - 40) {
      drawFooter(doc.getNumberOfPages());
      doc.addPage();
      drawHeader(doc.getNumberOfPages(), false);
      yPos = MARGIN + 15;
    }

    // Category Header
    doc.setFillColor(...COLORS.primary);
    doc.rect(MARGIN, yPos, pageWidth - MARGIN * 2, 7, 'F');
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.white);
    doc.text(category.name.toUpperCase(), MARGIN + 3, yPos + 5);
    yPos += 9;

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
          styles: isAbnormal ? { textColor: COLORS.destructive, fontStyle: 'bold' } : {},
        },
        field.unit || '-',
        normalRange,
        {
          content: status === 'unknown' ? '-' : isAbnormal ? 'HIGH/LOW' : 'Normal',
          styles: isAbnormal 
            ? { textColor: COLORS.destructive, fontStyle: 'bold' } 
            : status === 'normal' 
              ? { textColor: COLORS.success } 
              : {},
        },
      ];

      tableData.push(row as (string | { content: string; styles: object })[]);
    }

    autoTable(doc, {
      startY: yPos,
      head: [['Test', 'Result', 'Unit', 'Reference Range', 'Status']],
      body: tableData,
      theme: 'grid',
      showHead: 'everyPage',
      headStyles: {
        fillColor: COLORS.primaryDark,
        textColor: COLORS.white,
        fontSize: 8 * fontSizeMultiplier,
        fontStyle: 'bold',
        halign: 'center',
        cellPadding: 2,
      },
      bodyStyles: {
        fontSize: 8 * fontSizeMultiplier,
        cellPadding: 2,
        textColor: COLORS.text,
      },
      columnStyles: {
        0: { cellWidth: 50, fontStyle: 'bold' },
        1: { halign: 'center', cellWidth: 30 },
        2: { halign: 'center', cellWidth: 25 },
        3: { halign: 'center', cellWidth: 40 },
        4: { halign: 'center', cellWidth: 25 },
      },
      alternateRowStyles: {
        fillColor: [250, 250, 250],
      },
      tableLineColor: borderStyle === 'none' ? [255, 255, 255] : COLORS.border,
      tableLineWidth: borderStyle === 'none' ? 0 : 0.1,
      margin: { left: MARGIN, right: MARGIN, top: MARGIN + 15, bottom: FOOTER_HEIGHT + 5 },
      didDrawPage: (data) => {
        // Draw header and footer on new pages created by the table
        const pageNum = doc.getNumberOfPages();
        if (data.pageNumber > 1) {
          drawHeader(pageNum, false);
        }
      },
    });

    yPos = (doc as any).lastAutoTable.finalY + 8;
  }

  // ============ SIGNATURE SECTION ============

  // Check if we need a new page for signatures
  if (yPos > pageHeight - FOOTER_HEIGHT - 45) {
    drawFooter(doc.getNumberOfPages());
    doc.addPage();
    drawHeader(doc.getNumberOfPages(), false);
    yPos = MARGIN + 15;
  }

  // Separator line
  doc.setDrawColor(...COLORS.border);
  doc.setLineWidth(0.3);
  doc.line(MARGIN, yPos, pageWidth - MARGIN, yPos);
  yPos += 10;

  // Signature boxes
  const signatureWidth = (pageWidth - MARGIN * 2 - 20) / 2;
  
  doc.setFontSize(8 * fontSizeMultiplier);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.textMuted);
  
  // Left signature
  doc.text(signatureTitleLeft, MARGIN, yPos);
  doc.setDrawColor(...COLORS.textMuted);
  doc.setLineDashPattern([2, 2], 0);
  doc.line(MARGIN, yPos + 12, MARGIN + signatureWidth, yPos + 12);
  doc.text('Signature', MARGIN, yPos + 16);
  doc.text('Date: ____________', MARGIN, yPos + 22);

  // Right signature  
  doc.text(signatureTitleRight, pageWidth - MARGIN - signatureWidth, yPos);
  doc.line(pageWidth - MARGIN - signatureWidth, yPos + 12, pageWidth - MARGIN, yPos + 12);
  doc.text('Signature', pageWidth - MARGIN - signatureWidth, yPos + 16);
  doc.text('Date: ____________', pageWidth - MARGIN - signatureWidth, yPos + 22);

  doc.setLineDashPattern([], 0);
  yPos += 30;

  // End of Report marker (before footer)
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.primary);
  doc.text('--- End of Report ---', pageWidth / 2, yPos, { align: 'center' });

  // ============ DRAW ALL FOOTERS AND WATERMARKS ============
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    drawFooter(i);
    drawWatermark(i);
  }

  // ============ ADD PAGE NUMBERS ============
  for (const pn of pageNumbers) {
    doc.setPage(pn.page);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.textMuted);
    doc.text(`Page ${pn.page} of ${totalPages}`, pn.x, pn.y, { align: 'center' });
  }

  return doc;
};

export const downloadPDF = (doc: jsPDF, filename: string) => {
  doc.save(filename);
};

export const sharePDFViaWhatsApp = async (doc: jsPDF, patientPhone?: string) => {
  const pdfBlob = doc.output('blob');
  const pdfUrl = URL.createObjectURL(pdfBlob);
  
  // For web, we can only open WhatsApp with a message, not attach files directly
  const message = encodeURIComponent('Your lab report is ready. Please check the attached document.');
  const phone = patientPhone?.replace(/\D/g, '') || '';
  
  window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
  
  // Clean up
  URL.revokeObjectURL(pdfUrl);
};
