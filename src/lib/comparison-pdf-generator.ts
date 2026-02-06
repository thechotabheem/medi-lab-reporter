import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import type { Report, Patient, Clinic, Gender } from '@/types/database';
import type { ComparisonResult, TrendType } from '@/hooks/useReportComparison';

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

interface GenerateComparisonPDFOptions {
  reportA: Report;
  reportB: Report;
  patient: Patient;
  comparison: ComparisonResult[];
  uniqueToA: string[];
  uniqueToB: string[];
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

export const generateComparisonPDF = async ({
  reportA,
  reportB,
  patient,
  comparison,
  uniqueToA,
  uniqueToB,
  clinic,
}: GenerateComparisonPDFOptions): Promise<jsPDF> => {
  const pageFormat = clinic?.page_size === 'letter' ? 'letter' : clinic?.page_size === 'legal' ? 'legal' : 'a4';
  const doc = new jsPDF({ format: pageFormat });
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
  doc.text('REPORT COMPARISON SUMMARY', pageWidth / 2, yPos + 7, { align: 'center' });
  yPos += 15;

  // ============ PATIENT INFO ============
  doc.setFillColor(...COLORS.background);
  doc.setDrawColor(...COLORS.border);
  doc.setLineWidth(0.3);
  doc.rect(MARGIN, yPos, pageWidth - MARGIN * 2, 16, 'FD');

  const leftCol = MARGIN + 5;
  const midCol = pageWidth / 3 + 5;
  const rightCol = (pageWidth * 2) / 3 + 5;
  let infoY = yPos + 5;

  doc.setFontSize(8 * fontSizeMultiplier);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.textMuted);

  doc.text('Patient:', leftCol, infoY);
  doc.text('Age / Gender:', midCol, infoY);
  doc.text('Generated:', rightCol, infoY);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.text);
  doc.text(patient.full_name, leftCol + 18, infoY);
  doc.text(`${calculateAge(patient.date_of_birth)} / ${patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1)}`, midCol + 25, infoY);
  doc.text(format(new Date(), 'dd MMM yyyy'), rightCol + 22, infoY);

  infoY += 6;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.textMuted);
  doc.text('Baseline (A):', leftCol, infoY);
  doc.text('Current (B):', midCol, infoY);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.text);
  doc.text(`${format(new Date(reportA.test_date), 'dd MMM yyyy')} (#${reportA.report_number})`, leftCol + 25, infoY);
  doc.text(`${format(new Date(reportB.test_date), 'dd MMM yyyy')} (#${reportB.report_number})`, midCol + 23, infoY);

  yPos += 22;

  // ============ SUMMARY STATS ============
  const improved = comparison.filter(c => c.trend === 'improved').length;
  const declined = comparison.filter(c => c.trend === 'declined').length;
  const stable = comparison.filter(c => c.trend === 'stable' || c.trend === 'unchanged').length;
  const totalCompared = comparison.length;

  doc.setFontSize(9 * fontSizeMultiplier);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.primary);
  doc.text('TREND SUMMARY', MARGIN, yPos);
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
    }, {} as Record<string, ComparisonResult[]>);

    // Prepare table data
    const tableBody: (string | { content: string; styles?: object })[][] = [];
    
    Object.entries(groupedComparison).forEach(([category, items]) => {
      // Category header row
      tableBody.push([
        { content: category, styles: { fontStyle: 'bold', fillColor: [240, 240, 240] as [number, number, number] } },
        { content: '', styles: { fillColor: [240, 240, 240] as [number, number, number] } },
        { content: '', styles: { fillColor: [240, 240, 240] as [number, number, number] } },
        { content: '', styles: { fillColor: [240, 240, 240] as [number, number, number] } },
        { content: '', styles: { fillColor: [240, 240, 240] as [number, number, number] } },
        { content: '', styles: { fillColor: [240, 240, 240] as [number, number, number] } },
      ]);

      items.forEach(item => {
        const valueAStr = item.valueA !== null && item.valueA !== undefined ? String(item.valueA) : '-';
        const valueBStr = item.valueB !== null && item.valueB !== undefined ? String(item.valueB) : '-';
        
        let changeStr = '-';
        if (item.percentChange !== null) {
          const sign = item.percentChange >= 0 ? '+' : '';
          changeStr = `${sign}${item.percentChange.toFixed(1)}%`;
        }

        const trendSymbol = getTrendSymbol(item.trend);
        const trendLabel = getTrendLabel(item.trend);

        // Determine trend color
        let trendColor: [number, number, number] = COLORS.textMuted;
        if (item.trend === 'improved') trendColor = COLORS.success;
        else if (item.trend === 'declined') trendColor = COLORS.destructive;

        // Status indicator for values
        const statusAColor = item.statusA === 'abnormal' ? COLORS.destructive : COLORS.text;
        const statusBColor = item.statusB === 'abnormal' ? COLORS.destructive : COLORS.text;

        tableBody.push([
          { content: `${item.fieldLabel}${item.unit ? ` (${item.unit})` : ''}`, styles: {} },
          { content: valueAStr, styles: { textColor: statusAColor } },
          { content: valueBStr, styles: { textColor: statusBColor } },
          { content: changeStr, styles: {} },
          { content: `${trendSymbol} ${trendLabel}`, styles: { textColor: trendColor, fontStyle: 'bold' } },
          { content: item.normalRange, styles: { textColor: COLORS.textMuted } },
        ]);
      });
    });

    autoTable(doc, {
      startY: yPos,
      head: [[
        { content: 'Test Parameter', styles: { halign: 'left' } },
        { content: 'Baseline (A)', styles: { halign: 'center' } },
        { content: 'Current (B)', styles: { halign: 'center' } },
        { content: 'Change', styles: { halign: 'center' } },
        { content: 'Trend', styles: { halign: 'center' } },
        { content: 'Normal Range', styles: { halign: 'center' } },
      ]],
      body: tableBody,
      theme: 'grid',
      headStyles: {
        fillColor: COLORS.primary,
        textColor: COLORS.white,
        fontStyle: 'bold',
        fontSize: 8 * fontSizeMultiplier,
      },
      bodyStyles: {
        fontSize: 8 * fontSizeMultiplier,
        textColor: COLORS.text,
      },
      columnStyles: {
        0: { cellWidth: 55, halign: 'left' },
        1: { cellWidth: 25, halign: 'center' },
        2: { cellWidth: 25, halign: 'center' },
        3: { cellWidth: 22, halign: 'center' },
        4: { cellWidth: 28, halign: 'center' },
        5: { cellWidth: 25, halign: 'center' },
      },
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
  if (uniqueToA.length > 0 || uniqueToB.length > 0) {
    // Check if we need a new page
    if (yPos > pageHeight - 50) {
      doc.addPage();
      yPos = MARGIN;
    }

    if (uniqueToA.length > 0) {
      doc.setFontSize(9 * fontSizeMultiplier);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...COLORS.textMuted);
      doc.text(`Only in Baseline Report (A): ${uniqueToA.length} parameter(s)`, MARGIN, yPos);
      yPos += 5;
      
      doc.setFontSize(8 * fontSizeMultiplier);
      doc.setFont('helvetica', 'normal');
      doc.text(uniqueToA.join(', '), MARGIN, yPos);
      yPos += 8;
    }

    if (uniqueToB.length > 0) {
      doc.setFontSize(9 * fontSizeMultiplier);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...COLORS.textMuted);
      doc.text(`Only in Current Report (B): ${uniqueToB.length} parameter(s)`, MARGIN, yPos);
      yPos += 5;
      
      doc.setFontSize(8 * fontSizeMultiplier);
      doc.setFont('helvetica', 'normal');
      doc.text(uniqueToB.join(', '), MARGIN, yPos);
      yPos += 8;
    }
  }

  // ============ LEGEND ============
  if (yPos > pageHeight - 40) {
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
    { symbol: '↗ Improved', desc: 'Value moving toward normal range' },
    { symbol: '↘ Declined', desc: 'Value moving away from normal range' },
    { symbol: '→ Stable', desc: 'Change less than 5%' },
    { symbol: '★ New', desc: 'Value present only in current report' },
  ];

  doc.setFontSize(7 * fontSizeMultiplier);
  legendItems.forEach((item, i) => {
    const xPos = MARGIN + (i * 45);
    doc.setFont('helvetica', 'bold');
    doc.text(item.symbol, xPos, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(` - ${item.desc}`, xPos + doc.getTextWidth(item.symbol), yPos);
  });

  return doc;
};

export const downloadComparisonPDF = async (options: GenerateComparisonPDFOptions): Promise<void> => {
  const doc = await generateComparisonPDF(options);
  const fileName = `comparison_${options.patient.full_name.replace(/\s+/g, '_')}_${format(new Date(), 'yyyyMMdd')}.pdf`;
  doc.save(fileName);
};
