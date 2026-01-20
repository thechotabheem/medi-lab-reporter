import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import type { Report, Patient, Clinic, ReportType, Gender } from '@/types/database';
import { reportTemplates, getReportTypeName } from './report-templates';

interface GeneratePDFOptions {
  report: Report;
  patient: Patient;
  clinic?: Clinic | null;
}

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

export const generateReportPDF = async ({ report, patient, clinic }: GeneratePDFOptions): Promise<jsPDF> => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  let yPos = margin;

  // Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(clinic?.name || 'Medical Laboratory', pageWidth / 2, yPos, { align: 'center' });
  yPos += 8;

  if (clinic?.header_text) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const headerLines = doc.splitTextToSize(clinic.header_text, pageWidth - margin * 2);
    doc.text(headerLines, pageWidth / 2, yPos, { align: 'center' });
    yPos += headerLines.length * 5;
  }

  if (clinic?.address || clinic?.phone || clinic?.email) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const contactInfo = [clinic.address, clinic.phone, clinic.email].filter(Boolean).join(' | ');
    doc.text(contactInfo, pageWidth / 2, yPos, { align: 'center' });
    yPos += 8;
  }

  // Divider
  doc.setDrawColor(0, 150, 136);
  doc.setLineWidth(0.5);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 10;

  // Report Title
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(getReportTypeName(report.report_type), pageWidth / 2, yPos, { align: 'center' });
  yPos += 10;

  // Patient & Report Info
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  const infoData = [
    ['Patient Name', `${patient.first_name} ${patient.last_name}`, 'Report No.', report.report_number],
    ['Patient ID', patient.patient_id_number || '-', 'Test Date', format(new Date(report.test_date), 'dd MMM yyyy')],
    ['Gender', patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1), 'Status', report.status.charAt(0).toUpperCase() + report.status.slice(1)],
    ['Age', calculateAge(patient.date_of_birth), 'Ref. Doctor', report.referring_doctor || '-'],
  ];

  autoTable(doc, {
    startY: yPos,
    body: infoData,
    theme: 'plain',
    styles: { fontSize: 9, cellPadding: 2 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 35 },
      1: { cellWidth: 55 },
      2: { fontStyle: 'bold', cellWidth: 35 },
      3: { cellWidth: 55 },
    },
    margin: { left: margin, right: margin },
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;

  // Clinical Notes
  if (report.clinical_notes) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Clinical Notes:', margin, yPos);
    yPos += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const notesLines = doc.splitTextToSize(report.clinical_notes, pageWidth - margin * 2);
    doc.text(notesLines, margin, yPos);
    yPos += notesLines.length * 4 + 5;
  }

  // Test Results
  const template = reportTemplates[report.report_type];
  const reportData = report.report_data as Record<string, unknown>;

  for (const category of template.categories) {
    // Check if we need a new page
    if (yPos > 250) {
      doc.addPage();
      yPos = margin;
    }

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 150, 136);
    doc.text(category.name, margin, yPos);
    doc.setTextColor(0, 0, 0);
    yPos += 5;

    const tableData: string[][] = [];

    for (const field of category.fields) {
      const value = reportData[field.name];
      if (value === undefined || value === null || value === '') continue;

      const displayValue = field.unit ? `${value} ${field.unit}` : String(value);
      const normalRange = formatNormalRange(field, patient.gender);
      const status = getValueStatus(value as number, field, patient.gender);

      // Mark abnormal values with asterisk
      const row = [
        field.label,
        status === 'abnormal' ? `${displayValue} *` : displayValue,
        normalRange,
      ];

      tableData.push(row);
    }

    if (tableData.length > 0) {
      autoTable(doc, {
        startY: yPos,
        head: [['Test', 'Result', 'Normal Range']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [0, 150, 136], fontSize: 9 },
        styles: { fontSize: 9, cellPadding: 3 },
        margin: { left: margin, right: margin },
      });

      yPos = (doc as any).lastAutoTable.finalY + 8;
    }
  }

  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 20;
  
  if (clinic?.footer_text) {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.text(clinic.footer_text, pageWidth / 2, footerY - 5, { align: 'center' });
  }

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated on ${format(new Date(), 'dd MMM yyyy HH:mm')}`, pageWidth / 2, footerY, { align: 'center' });

  return doc;
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
