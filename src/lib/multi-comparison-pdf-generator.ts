import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import type { Report, Patient } from '@/types/database';
import type { MultiComparisonResult, TrendType } from '@/hooks/useMultiReportComparison';

interface ClinicWithBranding {
  name: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  logo_url?: string | null;
  accent_color?: string | null;
  font_size?: string | null;
  page_size?: string | null;
  border_style?: string | null;
  secondary_color?: string | null;
  tagline?: string | null;
  footer_text?: string | null;
}

interface GenerateMultiComparisonPDFOptions {
  reports: Report[];
  patient: Patient;
  comparison: MultiComparisonResult[];
  reportDates: string[];
  uniqueFields?: Map<string, number[]>;
  clinic?: ClinicWithBranding | null;
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
  warning: [234, 179, 8] as [number, number, number],
  text: [30, 30, 30] as [number, number, number],
  textMuted: [100, 100, 100] as [number, number, number],
  border: [200, 200, 200] as [number, number, number],
  background: [248, 250, 252] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
};

const MARGIN = 15;

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

// Get trend symbol for PDF
const getTrendSymbol = (trend: TrendType): string => {
  switch (trend) {
    case 'improved': return '↗';
    case 'declined': return '↘';
    case 'stable': return '→';
    case 'new': return '★';
    case 'removed': return '○';
    default: return '-';
  }
};

// Get trend label
const getTrendLabel = (trend: TrendType): string => {
  switch (trend) {
    case 'improved': return 'Improved';
    case 'declined': return 'Declined';
    case 'stable': return 'Stable';
    case 'new': return 'New';
    case 'removed': return 'Removed';
    default: return 'Unchanged';
  }
};

export const generateMultiComparisonPDF = async ({
  reports,
  patient,
  comparison,
  reportDates,
  uniqueFields,
  clinic,
}: GenerateMultiComparisonPDFOptions): Promise<jsPDF> => {
  // Use landscape for more than 3 reports
  const orientation = reports.length > 3 ? 'landscape' : 'portrait';
  const pageFormat = clinic?.page_size === 'letter' ? 'letter' : clinic?.page_size === 'legal' ? 'legal' : 'a4';
  const doc = new jsPDF({ format: pageFormat, orientation });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Get colors
  const accentColor = clinic?.accent_color ? hexToRgb(clinic.accent_color) : DEFAULT_COLORS.primary;
  const accentColorDark = darkenColor(accentColor);
  const secondaryColor = clinic?.secondary_color ? hexToRgb(clinic.secondary_color) : DEFAULT_COLORS.border;
  const fontSizeMultiplier = clinic?.font_size === 'small' ? 0.9 : clinic?.font_size === 'large' ? 1.1 : 1;
  const borderStyle = clinic?.border_style || 'simple';

  const COLORS = {
    ...DEFAULT_COLORS,
    primary: accentColor,
    primaryDark: accentColorDark,
    border: secondaryColor,
  };

  // Pre-load logo
  let logoBase64: string | null = null;
  if (clinic?.logo_url) {
    logoBase64 = await loadImageAsBase64(clinic.logo_url);
  }

  let yPos = MARGIN;

  // ============ HEADER ============
  let nameStartX = pageWidth / 2;
  
  if (logoBase64) {
    try {
      doc.addImage(logoBase64, 'AUTO', MARGIN, yPos - 5, 20, 20);
      nameStartX = (pageWidth + 25) / 2;
    } catch {
      // Logo failed
    }
  }

  doc.setFontSize(22 * fontSizeMultiplier);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.primaryDark);
  doc.text(clinic?.name || 'Medical Laboratory', nameStartX, yPos + 5, { align: 'center' });
  yPos += 10;

  if (clinic?.tagline) {
    doc.setFontSize(10 * fontSizeMultiplier);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(...COLORS.textMuted);
    doc.text(clinic.tagline, pageWidth / 2, yPos, { align: 'center' });
    yPos += 5;
  }

  // Header line
  if (borderStyle !== 'none') {
    yPos += 3;
    doc.setDrawColor(...COLORS.primary);
    doc.setLineWidth(1.5);
    doc.line(MARGIN, yPos, pageWidth - MARGIN, yPos);
    if (borderStyle === 'double') {
      yPos += 2;
      doc.setLineWidth(0.5);
      doc.line(MARGIN, yPos, pageWidth - MARGIN, yPos);
    }
  }
  yPos += 8;

  // ============ REPORT COMPARISON TITLE ============
  doc.setFillColor(...COLORS.primary);
  doc.rect(MARGIN, yPos, pageWidth - MARGIN * 2, 10, 'F');
  doc.setFontSize(12 * fontSizeMultiplier);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.white);
  doc.text(`MULTI-REPORT COMPARISON (${reports.length} Reports)`, pageWidth / 2, yPos + 7, { align: 'center' });
  yPos += 15;

  // ============ PATIENT INFO ============
  doc.setFillColor(...COLORS.background);
  doc.setDrawColor(...COLORS.border);
  doc.setLineWidth(0.3);
  doc.rect(MARGIN, yPos, pageWidth - MARGIN * 2, 20, 'FD');

  let infoY = yPos + 5;
  doc.setFontSize(8 * fontSizeMultiplier);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.textMuted);

  doc.text('Patient:', MARGIN + 5, infoY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.text);
  doc.text(patient.full_name, MARGIN + 23, infoY);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.textMuted);
  doc.text('Age / Gender:', MARGIN + 80, infoY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.text);
  doc.text(`${calculateAge(patient.date_of_birth)} / ${patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1)}`, MARGIN + 107, infoY);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.textMuted);
  doc.text('Generated:', pageWidth - 60, infoY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.text);
  doc.text(format(new Date(), 'dd MMM yyyy'), pageWidth - 38, infoY);

  infoY += 7;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.textMuted);
  doc.text('Date Range:', MARGIN + 5, infoY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.text);
  const dateRange = `${format(new Date(reportDates[0]), 'dd MMM yyyy')} → ${format(new Date(reportDates[reportDates.length - 1]), 'dd MMM yyyy')}`;
  doc.text(dateRange, MARGIN + 32, infoY);

  infoY += 7;
  doc.setFontSize(7 * fontSizeMultiplier);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.textMuted);
  const reportsList = reportDates.map((date, i) => `#${i + 1}: ${format(new Date(date), 'MMM d, yy')}`).join('  •  ');
  doc.text(`Reports: ${reportsList}`, MARGIN + 5, infoY);

  yPos += 25;

  // ============ SUMMARY STATS ============
  const improved = comparison.filter(c => c.overallTrend === 'improved').length;
  const declined = comparison.filter(c => c.overallTrend === 'declined').length;
  const stable = comparison.filter(c => c.overallTrend === 'stable' || c.overallTrend === 'unchanged').length;
  const totalCompared = comparison.length;

  doc.setFontSize(9 * fontSizeMultiplier);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.primary);
  doc.text('OVERALL TREND SUMMARY', MARGIN, yPos);
  yPos += 5;

  doc.setFontSize(8 * fontSizeMultiplier);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.text);
  
  const summaryText = `${totalCompared} parameters compared: ${improved} improved ↗, ${declined} declined ↘, ${stable} stable →`;
  doc.text(summaryText, MARGIN, yPos);
  yPos += 8;

  // ============ COMPARISON TABLE ============
  if (comparison.length > 0) {
    // Group by category
    const groupedComparison = comparison.reduce((acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    }, {} as Record<string, MultiComparisonResult[]>);

    // Calculate column widths dynamically
    const paramColWidth = 45;
    const trendColWidth = 25;
    const rangeColWidth = 22;
    const remainingWidth = pageWidth - MARGIN * 2 - paramColWidth - trendColWidth - rangeColWidth;
    const valueColWidth = Math.min(remainingWidth / reports.length, 25);

    // Prepare table data
    const tableBody: (string | { content: string; styles?: object })[][] = [];
    
    Object.entries(groupedComparison).forEach(([category, items]) => {
      // Category header row
      const categoryRow: { content: string; styles: object }[] = [
        { content: category, styles: { fontStyle: 'bold', fillColor: [240, 240, 240] as [number, number, number] } },
      ];
      for (let i = 0; i < reports.length; i++) {
        categoryRow.push({ content: '', styles: { fillColor: [240, 240, 240] as [number, number, number] } });
      }
      categoryRow.push({ content: '', styles: { fillColor: [240, 240, 240] as [number, number, number] } });
      categoryRow.push({ content: '', styles: { fillColor: [240, 240, 240] as [number, number, number] } });
      tableBody.push(categoryRow);

      items.forEach(item => {
        const row: (string | { content: string; styles?: object })[] = [
          { content: `${item.fieldLabel}${item.unit ? ` (${item.unit})` : ''}`, styles: {} },
        ];

        // Add value columns
        item.values.forEach((value, idx) => {
          const valueStr = value !== null && value !== undefined ? String(value) : '-';
          const statusColor = item.statuses[idx] === 'abnormal' ? COLORS.destructive : COLORS.text;
          row.push({ content: valueStr, styles: { textColor: statusColor, halign: 'center' } });
        });

        // Trend column
        const trendSymbol = getTrendSymbol(item.overallTrend);
        const trendLabel = getTrendLabel(item.overallTrend);
        let trendColor: [number, number, number] = COLORS.textMuted;
        if (item.overallTrend === 'improved') trendColor = COLORS.success;
        else if (item.overallTrend === 'declined') trendColor = COLORS.destructive;
        row.push({ content: `${trendSymbol} ${trendLabel}`, styles: { textColor: trendColor, fontStyle: 'bold', halign: 'center' } });

        // Normal range column
        row.push({ content: item.normalRange, styles: { textColor: COLORS.textMuted, halign: 'center' } });

        tableBody.push(row);
      });
    });

    // Build header row
    const headerRow: { content: string; styles?: object }[] = [
      { content: 'Test Parameter', styles: { halign: 'left' } },
    ];
    reportDates.forEach((date, idx) => {
      headerRow.push({ content: `#${idx + 1}\n${format(new Date(date), 'MMM d')}`, styles: { halign: 'center' } });
    });
    headerRow.push({ content: 'Trend', styles: { halign: 'center' } });
    headerRow.push({ content: 'Range', styles: { halign: 'center' } });

    // Build column styles
    const columnStyles: Record<number, object> = {
      0: { cellWidth: paramColWidth, halign: 'left' },
    };
    for (let i = 0; i < reports.length; i++) {
      columnStyles[i + 1] = { cellWidth: valueColWidth, halign: 'center' };
    }
    columnStyles[reports.length + 1] = { cellWidth: trendColWidth, halign: 'center' };
    columnStyles[reports.length + 2] = { cellWidth: rangeColWidth, halign: 'center' };

    autoTable(doc, {
      startY: yPos,
      head: [headerRow],
      body: tableBody,
      theme: 'grid',
      headStyles: {
        fillColor: COLORS.primary,
        textColor: COLORS.white,
        fontStyle: 'bold',
        fontSize: 7 * fontSizeMultiplier,
        valign: 'middle',
      },
      bodyStyles: {
        fontSize: 7 * fontSizeMultiplier,
        textColor: COLORS.text,
      },
      columnStyles,
      margin: { left: MARGIN, right: MARGIN },
      didDrawPage: (data) => {
        // Footer
        const footerY = pageHeight - 15;
        doc.setDrawColor(...COLORS.primary);
        doc.setLineWidth(0.5);
        doc.line(MARGIN, footerY, pageWidth - MARGIN, footerY);

        if (clinic?.footer_text) {
          doc.setFontSize(7);
          doc.setFont('helvetica', 'italic');
          doc.setTextColor(...COLORS.textMuted);
          doc.text(clinic.footer_text, pageWidth / 2, footerY + 5, { align: 'center' });
        }

        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...COLORS.textMuted);
        const pageNum = (doc as jsPDF & { internal: { getCurrentPageInfo: () => { pageNumber: number } } }).internal.getCurrentPageInfo().pageNumber;
        doc.text(`Page ${pageNum}`, pageWidth / 2, footerY + 10, { align: 'center' });
      },
    });

    yPos = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
  }

  // ============ UNIQUE FIELDS SECTIONS ============
  if (uniqueFields && uniqueFields.size > 0) {
    if (yPos > pageHeight - 40) {
      doc.addPage();
      yPos = MARGIN;
    }

    doc.setFontSize(9 * fontSizeMultiplier);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.textMuted);
    doc.text(`Fields not present in all reports: ${uniqueFields.size} parameter(s)`, MARGIN, yPos);
    yPos += 5;
    
    doc.setFontSize(7 * fontSizeMultiplier);
    doc.setFont('helvetica', 'normal');
    const uniqueFieldsList = [...uniqueFields.entries()]
      .map(([name, indices]) => `${name} (#${indices.map(i => i + 1).join(', ')})`)
      .join(', ');
    doc.text(uniqueFieldsList, MARGIN, yPos, { maxWidth: pageWidth - MARGIN * 2 });
    yPos += 8;
  }

  // ============ LEGEND ============
  if (yPos > pageHeight - 30) {
    doc.addPage();
    yPos = MARGIN;
  }

  yPos += 5;
  doc.setFontSize(8 * fontSizeMultiplier);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.textMuted);
  doc.text('LEGEND:', MARGIN, yPos);
  yPos += 5;

  doc.setFont('helvetica', 'normal');
  const legendItems = [
    { symbol: '↗ Improved', desc: 'Value moving toward normal' },
    { symbol: '↘ Declined', desc: 'Value moving away from normal' },
    { symbol: '→ Stable', desc: 'Change less than 5%' },
  ];

  doc.setFontSize(7 * fontSizeMultiplier);
  legendItems.forEach((item, i) => {
    const xPos = MARGIN + (i * 60);
    doc.setFont('helvetica', 'bold');
    doc.text(item.symbol, xPos, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(` - ${item.desc}`, xPos + doc.getTextWidth(item.symbol), yPos);
  });

  return doc;
};

export const downloadMultiComparisonPDF = async (options: GenerateMultiComparisonPDFOptions): Promise<void> => {
  const doc = await generateMultiComparisonPDF(options);
  const fileName = `comparison_${options.patient.full_name.replace(/\s+/g, '_')}_${options.reports.length}reports_${format(new Date(), 'yyyyMMdd')}.pdf`;
  doc.save(fileName);
};

export const shareMultiComparisonPDFViaWhatsApp = async (options: GenerateMultiComparisonPDFOptions): Promise<void> => {
  await generateMultiComparisonPDF(options);
  
  const dateRange = `${format(new Date(options.reportDates[0]), 'dd MMM yyyy')} to ${format(new Date(options.reportDates[options.reportDates.length - 1]), 'dd MMM yyyy')}`;
  const message = encodeURIComponent(`Lab report comparison for ${options.patient.full_name} is ready. Comparing ${options.reports.length} reports from ${dateRange}.`);
  const phone = options.patient.phone?.replace(/\D/g, '') || '';
  
  window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
};
