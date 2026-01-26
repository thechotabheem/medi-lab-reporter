import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import type { Report, Patient, Clinic, Gender } from '@/types/database';
import { reportTemplates, getReportTypeName } from './report-templates';

interface GeneratePDFOptions {
  report: Report;
  patient: Patient;
  clinic?: Clinic | null;
}

// Colors
const COLORS = {
  primary: [0, 150, 136] as [number, number, number],      // Teal
  primaryDark: [0, 121, 107] as [number, number, number],  // Dark Teal
  destructive: [220, 38, 38] as [number, number, number],  // Red
  success: [22, 163, 74] as [number, number, number],      // Green
  text: [30, 30, 30] as [number, number, number],          // Dark text
  textMuted: [100, 100, 100] as [number, number, number],  // Muted text
  border: [200, 200, 200] as [number, number, number],     // Light border
  background: [248, 250, 252] as [number, number, number], // Light background
  white: [255, 255, 255] as [number, number, number],
};

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

export const generateReportPDF = async ({ report, patient, clinic }: GeneratePDFOptions): Promise<jsPDF> => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  let yPos = margin;

  // ============ HEADER / LETTERHEAD ============
  
  // Clinic Name
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.primaryDark);
  doc.text(clinic?.name || 'Medical Laboratory', pageWidth / 2, yPos, { align: 'center' });
  yPos += 7;

  // Header Text (tagline)
  if (clinic?.header_text) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(...COLORS.textMuted);
    const headerLines = doc.splitTextToSize(clinic.header_text, pageWidth - margin * 2);
    doc.text(headerLines, pageWidth / 2, yPos, { align: 'center' });
    yPos += headerLines.length * 4 + 2;
  }

  // Contact Info Line
  if (clinic?.address || clinic?.phone || clinic?.email) {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.textMuted);
    const contactParts = [clinic?.address, clinic?.phone, clinic?.email].filter(Boolean);
    doc.text(contactParts.join('  |  '), pageWidth / 2, yPos, { align: 'center' });
    yPos += 6;
  }

  // Decorative Header Line
  doc.setDrawColor(...COLORS.primary);
  doc.setLineWidth(1.5);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 2;
  doc.setLineWidth(0.5);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 8;

  // ============ REPORT TITLE BAR ============
  
  doc.setFillColor(...COLORS.primary);
  doc.rect(margin, yPos, pageWidth - margin * 2, 10, 'F');
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.white);
  doc.text(getReportTypeName(report.report_type), margin + 5, yPos + 7);
  
  // Report number on right
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Report #: ${report.report_number}`, pageWidth - margin - 5, yPos + 7, { align: 'right' });
  yPos += 15;

  // ============ PATIENT & REPORT INFO ============
  
  doc.setFillColor(...COLORS.background);
  doc.setDrawColor(...COLORS.border);
  doc.setLineWidth(0.3);
  doc.rect(margin, yPos, pageWidth - margin * 2, 24, 'FD');

  const leftCol = margin + 5;
  const rightCol = pageWidth / 2 + 5;
  let infoY = yPos + 5;

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.textMuted);

  // Left column
  doc.text('Patient Name:', leftCol, infoY);
  doc.text('Age / Gender:', leftCol, infoY + 6);
  doc.text('Patient ID:', leftCol, infoY + 12);
  doc.text('Ref. Doctor:', leftCol, infoY + 18);

  // Right column
  doc.text('Report No.:', rightCol, infoY);
  doc.text('Test Date:', rightCol, infoY + 6);
  doc.text('Status:', rightCol, infoY + 12);
  doc.text('Report Date:', rightCol, infoY + 18);

  // Values - Left column
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.text);
  doc.text(patient.full_name, leftCol + 28, infoY);
  doc.text(`${calculateAge(patient.date_of_birth)} / ${patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1)}`, leftCol + 28, infoY + 6);
  doc.text(patient.patient_id_number || '-', leftCol + 28, infoY + 12);
  doc.text(report.referring_doctor || '-', leftCol + 28, infoY + 18);

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
    doc.text('CLINICAL NOTES', margin, yPos);
    yPos += 4;
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.text);
    doc.setFontSize(9);
    const notesLines = doc.splitTextToSize(report.clinical_notes, pageWidth - margin * 2);
    doc.text(notesLines, margin, yPos);
    yPos += notesLines.length * 4 + 6;
  }

  // ============ ABNORMAL VALUES SUMMARY ============
  
  const template = reportTemplates[report.report_type];
  const reportData = report.report_data as Record<string, unknown>;
  
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

  if (abnormalValues.length > 0) {
    // Check if we need a new page
    if (yPos > pageHeight - 60) {
      doc.addPage();
      yPos = margin;
    }

    doc.setFillColor(254, 242, 242); // Light red background
    doc.setDrawColor(...COLORS.destructive);
    doc.setLineWidth(0.5);
    
    const alertHeight = Math.min(abnormalValues.length * 5 + 12, 40);
    doc.rect(margin, yPos, pageWidth - margin * 2, alertHeight, 'FD');
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.destructive);
    doc.text(`ABNORMAL VALUES DETECTED (${abnormalValues.length})`, margin + 5, yPos + 5);
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    let alertY = yPos + 10;
    abnormalValues.slice(0, 5).forEach((item) => {
      doc.text(`• ${item.label}: ${item.value} (Ref: ${item.range})`, margin + 5, alertY);
      alertY += 4;
    });
    if (abnormalValues.length > 5) {
      doc.text(`... and ${abnormalValues.length - 5} more`, margin + 5, alertY);
    }
    
    yPos += alertHeight + 6;
  }

  // ============ TEST RESULTS TABLES ============

  for (const category of template.categories) {
    const categoryFields = category.fields.filter(
      (field) => reportData[field.name] !== undefined && reportData[field.name] !== null && reportData[field.name] !== ''
    );
    if (categoryFields.length === 0) continue;

    // Check if we need a new page
    if (yPos > pageHeight - 50) {
      doc.addPage();
      yPos = margin;
    }

    // Category Header
    doc.setFillColor(...COLORS.primary);
    doc.rect(margin, yPos, pageWidth - margin * 2, 7, 'F');
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.white);
    doc.text(category.name.toUpperCase(), margin + 3, yPos + 5);
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
      headStyles: {
        fillColor: COLORS.primaryDark,
        textColor: COLORS.white,
        fontSize: 8,
        fontStyle: 'bold',
        halign: 'center',
        cellPadding: 2,
      },
      bodyStyles: {
        fontSize: 8,
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
      margin: { left: margin, right: margin },
      tableLineColor: COLORS.border,
      tableLineWidth: 0.1,
    });

    yPos = (doc as any).lastAutoTable.finalY + 8;
  }

  // ============ SIGNATURE SECTION ============

  // Check if we need a new page for signatures
  if (yPos > pageHeight - 50) {
    doc.addPage();
    yPos = margin;
  }

  // Separator line
  doc.setDrawColor(...COLORS.border);
  doc.setLineWidth(0.3);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 10;

  // Signature boxes
  const signatureWidth = (pageWidth - margin * 2 - 20) / 2;
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.textMuted);
  
  // Left signature
  doc.text('Lab Technician', margin, yPos);
  doc.setDrawColor(...COLORS.textMuted);
  doc.setLineDashPattern([2, 2], 0);
  doc.line(margin, yPos + 12, margin + signatureWidth, yPos + 12);
  doc.text('Signature', margin, yPos + 16);
  doc.text('Date: ____________', margin, yPos + 22);

  // Right signature  
  doc.text('Pathologist', pageWidth - margin - signatureWidth, yPos);
  doc.line(pageWidth - margin - signatureWidth, yPos + 12, pageWidth - margin, yPos + 12);
  doc.text('Signature', pageWidth - margin - signatureWidth, yPos + 16);
  doc.text('Date: ____________', pageWidth - margin - signatureWidth, yPos + 22);

  doc.setLineDashPattern([], 0);
  yPos += 30;

  // ============ FOOTER ============

  const footerY = pageHeight - 15;
  
  // Footer line
  doc.setDrawColor(...COLORS.primary);
  doc.setLineWidth(0.5);
  doc.line(margin, footerY - 8, pageWidth - margin, footerY - 8);
  
  // Footer text
  if (clinic?.footer_text) {
    doc.setFontSize(7);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(...COLORS.textMuted);
    doc.text(clinic.footer_text, pageWidth / 2, footerY - 3, { align: 'center' });
  }

  // Generation timestamp
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.textMuted);
  doc.text(
    `Report generated on ${format(new Date(), 'dd MMM yyyy, hh:mm a')}  |  This is a computer-generated report`,
    pageWidth / 2,
    footerY + 2,
    { align: 'center' }
  );

  // End of Report marker
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.primary);
  doc.text('--- End of Report ---', pageWidth / 2, footerY + 8, { align: 'center' });

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
