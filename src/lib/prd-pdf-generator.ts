import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { reportTemplates, activeReportTypes } from './report-templates';

interface ClinicInfo {
  name?: string;
  logo_url?: string | null;
}

interface GeneratePRDOptions {
  clinic?: ClinicInfo | null;
}

// Colors matching the app theme
const COLORS = {
  primary: [0, 150, 136] as [number, number, number],
  primaryDark: [0, 121, 107] as [number, number, number],
  text: [30, 30, 30] as [number, number, number],
  textMuted: [100, 100, 100] as [number, number, number],
  border: [200, 200, 200] as [number, number, number],
  background: [248, 250, 252] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  sectionBg: [240, 253, 250] as [number, number, number],
};

const MARGIN = 15;
const PAGE_HEIGHT = 297; // A4 height
const FOOTER_Y = PAGE_HEIGHT - 15;

// Load image as base64
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

export const generatePRDPDF = async ({ clinic }: GeneratePRDOptions = {}): Promise<jsPDF> => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Pre-load logo if available
  let logoBase64: string | null = null;
  if (clinic?.logo_url) {
    logoBase64 = await loadImageAsBase64(clinic.logo_url);
  }

  const pageNumbers: { page: number }[] = [];
  
  // Helper: Add page number tracking
  const trackPage = () => {
    pageNumbers.push({ page: doc.getNumberOfPages() });
  };

  // Helper: Draw footer on current page
  const drawFooter = () => {
    const currentPage = doc.getNumberOfPages();
    doc.setPage(currentPage);
    doc.setDrawColor(...COLORS.primary);
    doc.setLineWidth(0.3);
    doc.line(MARGIN, FOOTER_Y - 5, pageWidth - MARGIN, FOOTER_Y - 5);
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.textMuted);
    doc.text('MedLab Reporter - Product Requirements Document', MARGIN, FOOTER_Y);
    doc.text(`Generated: ${format(new Date(), 'dd MMM yyyy')}`, pageWidth - MARGIN, FOOTER_Y, { align: 'right' });
    trackPage();
  };

  // Helper: Add new page with footer
  const addNewPage = () => {
    drawFooter();
    doc.addPage();
  };

  // Helper: Check if we need a new page
  const checkPageBreak = (yPos: number, requiredSpace: number = 40): number => {
    if (yPos > FOOTER_Y - requiredSpace) {
      addNewPage();
      return MARGIN + 10;
    }
    return yPos;
  };

  // Helper: Draw section header
  const drawSectionHeader = (title: string, sectionNum: number, yPos: number): number => {
    yPos = checkPageBreak(yPos, 30);
    
    doc.setFillColor(...COLORS.primary);
    doc.rect(MARGIN, yPos, pageWidth - MARGIN * 2, 10, 'F');
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.white);
    doc.text(`Section ${sectionNum}: ${title}`, MARGIN + 5, yPos + 7);
    
    return yPos + 15;
  };

  // Helper: Draw subsection header
  const drawSubsectionHeader = (title: string, yPos: number): number => {
    yPos = checkPageBreak(yPos, 25);
    
    doc.setFillColor(...COLORS.sectionBg);
    doc.rect(MARGIN, yPos, pageWidth - MARGIN * 2, 8, 'F');
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.primaryDark);
    doc.text(title, MARGIN + 3, yPos + 5.5);
    
    return yPos + 12;
  };

  // ============ COVER PAGE ============
  let yPos = 60;
  
  // Logo
  if (logoBase64) {
    try {
      doc.addImage(logoBase64, 'AUTO', pageWidth / 2 - 20, yPos, 40, 40);
      yPos += 50;
    } catch {
      yPos += 10;
    }
  }
  
  // Title
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.primaryDark);
  doc.text('MedLab Reporter', pageWidth / 2, yPos, { align: 'center' });
  yPos += 12;
  
  doc.setFontSize(18);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.text);
  doc.text('Product Requirements Document', pageWidth / 2, yPos, { align: 'center' });
  yPos += 8;
  
  doc.setFontSize(14);
  doc.text('& Technical Specification Blueprint', pageWidth / 2, yPos, { align: 'center' });
  yPos += 25;
  
  // Decorative line
  doc.setDrawColor(...COLORS.primary);
  doc.setLineWidth(2);
  doc.line(pageWidth / 2 - 40, yPos, pageWidth / 2 + 40, yPos);
  yPos += 20;
  
  // Version & Date
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.textMuted);
  doc.text(`Version 1.0`, pageWidth / 2, yPos, { align: 'center' });
  yPos += 6;
  doc.text(`Generated: ${format(new Date(), 'MMMM dd, yyyy')}`, pageWidth / 2, yPos, { align: 'center' });
  yPos += 6;
  if (clinic?.name) {
    doc.text(`Clinic: ${clinic.name}`, pageWidth / 2, yPos, { align: 'center' });
  }
  
  // Cover page footer
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.textMuted);
  doc.text('Comprehensive Technical Documentation for Medical Laboratory Reporting System', pageWidth / 2, PAGE_HEIGHT - 30, { align: 'center' });
  
  trackPage();
  doc.addPage();

  // ============ TABLE OF CONTENTS ============
  yPos = MARGIN + 10;
  
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.primaryDark);
  doc.text('Table of Contents', pageWidth / 2, yPos, { align: 'center' });
  yPos += 15;
  
  const tocItems = [
    { num: 1, title: 'Executive Summary', page: 3 },
    { num: 2, title: 'Technology Stack', page: 3 },
    { num: 3, title: 'Core Modules', page: 4 },
    { num: 4, title: 'Supported Test Types (17 Types)', page: 5 },
    { num: 5, title: 'Database Schema', page: 10 },
    { num: 6, title: 'Auto-Calculation Formulas', page: 11 },
    { num: 7, title: 'UI/UX Specifications', page: 12 },
    { num: 8, title: 'PDF Report Layout', page: 13 },
    { num: 9, title: 'Security Model', page: 14 },
  ];
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  
  tocItems.forEach((item) => {
    doc.setTextColor(...COLORS.text);
    doc.text(`Section ${item.num}: ${item.title}`, MARGIN + 5, yPos);
    
    // Dotted line
    const textWidth = doc.getTextWidth(`Section ${item.num}: ${item.title}`);
    const pageNumWidth = doc.getTextWidth(String(item.page));
    const dotsStart = MARGIN + 5 + textWidth + 5;
    const dotsEnd = pageWidth - MARGIN - pageNumWidth - 5;
    
    doc.setTextColor(...COLORS.border);
    let dotX = dotsStart;
    while (dotX < dotsEnd) {
      doc.text('.', dotX, yPos);
      dotX += 2;
    }
    
    doc.setTextColor(...COLORS.textMuted);
    doc.text(String(item.page), pageWidth - MARGIN - 5, yPos, { align: 'right' });
    yPos += 8;
  });
  
  drawFooter();
  doc.addPage();

  // ============ SECTION 1: EXECUTIVE SUMMARY ============
  yPos = MARGIN + 10;
  yPos = drawSectionHeader('Executive Summary', 1, yPos);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.text);
  
  const summaryText = [
    'MedLab Reporter is a Progressive Web Application (PWA) designed for medical laboratories to streamline the creation, management, and distribution of diagnostic test reports. The system provides a modern, mobile-first interface optimized for clinical workflows.',
    '',
    'Target Users:',
    '• Lab Technicians - Primary users for data entry and report generation',
    '• Pathologists - Review and verify completed reports',
    '• Laboratory Managers - Oversee operations and customize templates',
    '',
    'Key Value Propositions:',
    '• Instant PDF generation with professional clinic branding',
    '• 17 pre-configured test templates with auto-calculations',
    '• Offline-capable PWA for reliable access',
    '• Gender-aware normal ranges with abnormal value flagging',
    '• Customizable templates per clinic requirements',
    '• WhatsApp sharing integration for quick report delivery',
  ];
  
  summaryText.forEach((line) => {
    if (line === '') {
      yPos += 4;
    } else {
      const lines = doc.splitTextToSize(line, pageWidth - MARGIN * 2 - 10);
      lines.forEach((l: string) => {
        yPos = checkPageBreak(yPos, 10);
        doc.text(l, MARGIN + 5, yPos);
        yPos += 5;
      });
    }
  });
  
  yPos += 10;

  // ============ SECTION 2: TECHNOLOGY STACK ============
  yPos = drawSectionHeader('Technology Stack', 2, yPos);
  
  const techStack = [
    ['Category', 'Technology', 'Version/Details'],
    ['Frontend Framework', 'React', '18.3.x'],
    ['Build Tool', 'Vite', '5.x'],
    ['Styling', 'TailwindCSS', '3.x with custom design system'],
    ['Language', 'TypeScript', 'Strict mode enabled'],
    ['Backend', 'Lovable Cloud', 'Supabase-powered'],
    ['Database', 'PostgreSQL', 'Via Lovable Cloud'],
    ['PDF Generation', 'jsPDF + jspdf-autotable', '3.x / 5.x'],
    ['PWA Support', 'vite-plugin-pwa', '1.x'],
    ['UI Components', 'shadcn/ui', 'Radix primitives'],
    ['State Management', 'TanStack Query', '5.x'],
    ['Routing', 'React Router', '6.x'],
    ['Date Handling', 'date-fns', '3.x'],
  ];
  
  autoTable(doc, {
    startY: yPos,
    head: [techStack[0]],
    body: techStack.slice(1),
    margin: { left: MARGIN, right: MARGIN },
    headStyles: {
      fillColor: COLORS.primary,
      textColor: COLORS.white,
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 9,
      textColor: COLORS.text,
    },
    alternateRowStyles: {
      fillColor: COLORS.sectionBg,
    },
    columnStyles: {
      0: { cellWidth: 45 },
      1: { cellWidth: 55 },
      2: { cellWidth: 'auto' },
    },
  });
  
  yPos = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;

  // ============ SECTION 3: CORE MODULES ============
  yPos = checkPageBreak(yPos, 60);
  yPos = drawSectionHeader('Core Modules', 3, yPos);
  
  const modules = [
    {
      name: 'Dashboard',
      features: ['Real-time statistics (patients, reports, pending)', 'Quick action cards for common tasks', 'Recent reports widget', 'Weather integration (optional)'],
    },
    {
      name: 'Patient Management',
      features: ['CRUD operations for patient records', 'Inline patient registration during report creation', 'Patient search with filters', 'Patient history view'],
    },
    {
      name: 'Report Management',
      features: ['Create reports from 17 test templates', 'Draft auto-save functionality', 'Status workflow (Draft → Completed → Verified)', 'PDF export and WhatsApp sharing'],
    },
    {
      name: 'Template Editor',
      features: ['Customize field labels and units', 'Reorder fields via drag-and-drop', 'Add/remove custom fields', 'Clone templates for variations'],
    },
    {
      name: 'Settings',
      features: ['Clinic branding (logo, colors, watermark)', 'Notification preferences', 'Data reset functionality', 'PWA installation controls'],
    },
  ];
  
  modules.forEach((mod) => {
    yPos = checkPageBreak(yPos, 35);
    yPos = drawSubsectionHeader(mod.name, yPos);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.text);
    
    mod.features.forEach((feature) => {
      yPos = checkPageBreak(yPos, 8);
      doc.text(`• ${feature}`, MARGIN + 8, yPos);
      yPos += 5;
    });
    
    yPos += 5;
  });

  // ============ SECTION 4: SUPPORTED TEST TYPES ============
  addNewPage();
  yPos = MARGIN + 10;
  yPos = drawSectionHeader('Supported Test Types (17 Types)', 4, yPos);
  
  // Test type overview table
  const testTypeOverview = [
    ['Code', 'Full Name', 'Category'],
    ['cbc', 'Complete Blood Count', 'Value Based'],
    ['lft', 'Liver Function Test', 'Value Based'],
    ['rft', 'Renal Function Test', 'Value Based'],
    ['lipid_profile', 'Lipid Profile', 'Value Based'],
    ['esr', 'ESR (Erythrocyte Sedimentation Rate)', 'Value Based'],
    ['bsr', 'Blood Sugar Random', 'Value Based'],
    ['bsf', 'Blood Sugar Fasting', 'Value Based'],
    ['serum_calcium', 'Serum Calcium', 'Value Based'],
    ['mp', 'Malaria Parasites', 'Screening'],
    ['typhoid', 'Typhoid (IgM + IgG)', 'Screening'],
    ['hcv', 'Hepatitis C Virus', 'Screening'],
    ['hbsag', 'Hepatitis B Surface Antigen', 'Screening'],
    ['hiv', 'HIV', 'Screening'],
    ['vdrl', 'VDRL', 'Screening'],
    ['h_pylori', 'Helicobacter Pylori', 'Screening'],
    ['blood_group', 'Blood Group', 'Typing'],
    ['ra_factor', 'R.A Factor', 'Typing'],
  ];
  
  autoTable(doc, {
    startY: yPos,
    head: [testTypeOverview[0]],
    body: testTypeOverview.slice(1),
    margin: { left: MARGIN, right: MARGIN },
    headStyles: {
      fillColor: COLORS.primary,
      textColor: COLORS.white,
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: COLORS.text,
    },
    alternateRowStyles: {
      fillColor: COLORS.sectionBg,
    },
  });
  
  yPos = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

  // Detailed test specifications
  activeReportTypes.forEach((testType) => {
    const template = reportTemplates[testType];
    if (!template || template.categories.length === 0) return;
    
    yPos = checkPageBreak(yPos, 50);
    yPos = drawSubsectionHeader(`${template.name} (${testType})`, yPos);
    
    template.categories.forEach((category) => {
      if (category.fields.length === 0) return;
      
      const fieldData = category.fields.map((field) => {
        let normalRange = '-';
        if (field.normalRange) {
          if (field.normalRange.male && field.normalRange.female) {
            const maleRange = `M: ${field.normalRange.male.min ?? ''}${field.normalRange.male.min !== undefined && field.normalRange.male.max !== undefined ? '-' : ''}${field.normalRange.male.max ?? ''}`;
            const femaleRange = `F: ${field.normalRange.female.min ?? ''}${field.normalRange.female.min !== undefined && field.normalRange.female.max !== undefined ? '-' : ''}${field.normalRange.female.max ?? ''}`;
            normalRange = `${maleRange}, ${femaleRange}`;
          } else {
            const min = field.normalRange.min;
            const max = field.normalRange.max;
            if (min !== undefined && max !== undefined) normalRange = `${min} - ${max}`;
            else if (min !== undefined) normalRange = `> ${min}`;
            else if (max !== undefined) normalRange = `< ${max}`;
          }
        }
        
        return [
          field.label,
          field.unit || '-',
          normalRange,
          field.calculated ? `Yes: ${field.formula}` : '-',
        ];
      });
      
      yPos = checkPageBreak(yPos, 30);
      
      autoTable(doc, {
        startY: yPos,
        head: [['Field', 'Unit', 'Normal Range', 'Calculated']],
        body: fieldData,
        margin: { left: MARGIN + 5, right: MARGIN },
        headStyles: {
          fillColor: COLORS.primaryDark,
          textColor: COLORS.white,
          fontStyle: 'bold',
          fontSize: 8,
        },
        bodyStyles: {
          fontSize: 7,
          textColor: COLORS.text,
        },
        alternateRowStyles: {
          fillColor: [250, 250, 250],
        },
        columnStyles: {
          0: { cellWidth: 50 },
          1: { cellWidth: 25 },
          2: { cellWidth: 50 },
          3: { cellWidth: 'auto' },
        },
      });
      
      yPos = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
    });
  });

  // ============ SECTION 5: DATABASE SCHEMA ============
  addNewPage();
  yPos = MARGIN + 10;
  yPos = drawSectionHeader('Database Schema', 5, yPos);
  
  const tables = [
    {
      name: 'clinics',
      columns: [
        ['id', 'UUID', 'Primary Key'],
        ['name', 'TEXT', 'Clinic name (required)'],
        ['address', 'TEXT', 'Physical address'],
        ['phone', 'TEXT', 'Contact phone'],
        ['email', 'TEXT', 'Contact email'],
        ['logo_url', 'TEXT', 'URL to logo image'],
        ['header_text', 'TEXT', 'PDF header tagline'],
        ['footer_text', 'TEXT', 'PDF footer text'],
        ['watermark_text', 'TEXT', 'Diagonal watermark'],
        ['accent_color', 'TEXT', 'Hex color for branding'],
        ['enable_qr_code', 'BOOLEAN', 'Show QR on PDFs'],
        ['created_at', 'TIMESTAMP', 'Auto-generated'],
        ['updated_at', 'TIMESTAMP', 'Auto-updated'],
      ],
    },
    {
      name: 'patients',
      columns: [
        ['id', 'UUID', 'Primary Key'],
        ['clinic_id', 'UUID', 'FK → clinics.id'],
        ['patient_id_number', 'TEXT', 'Custom ID (optional)'],
        ['full_name', 'TEXT', 'Patient name (required)'],
        ['gender', 'ENUM', 'male | female | other'],
        ['date_of_birth', 'DATE', 'For age calculation'],
        ['phone', 'TEXT', 'Contact phone'],
        ['email', 'TEXT', 'Contact email'],
        ['address', 'TEXT', 'Home address'],
        ['created_at', 'TIMESTAMP', 'Auto-generated'],
        ['updated_at', 'TIMESTAMP', 'Auto-updated'],
      ],
    },
    {
      name: 'reports',
      columns: [
        ['id', 'UUID', 'Primary Key'],
        ['clinic_id', 'UUID', 'FK → clinics.id'],
        ['patient_id', 'UUID', 'FK → patients.id'],
        ['report_type', 'ENUM', '17 test types'],
        ['report_number', 'TEXT', 'Unique report ID'],
        ['test_date', 'DATE', 'Date of test'],
        ['status', 'TEXT', 'draft | completed | verified'],
        ['report_data', 'JSONB', 'Test results'],
        ['referring_doctor', 'TEXT', 'Doctor name'],
        ['clinical_notes', 'TEXT', 'Additional notes'],
        ['created_at', 'TIMESTAMP', 'Auto-generated'],
        ['updated_at', 'TIMESTAMP', 'Auto-updated'],
      ],
    },
    {
      name: 'report_images',
      columns: [
        ['id', 'UUID', 'Primary Key'],
        ['report_id', 'UUID', 'FK → reports.id'],
        ['image_url', 'TEXT', 'Storage URL'],
        ['caption', 'TEXT', 'Image description'],
        ['created_at', 'TIMESTAMP', 'Auto-generated'],
      ],
    },
    {
      name: 'custom_templates',
      columns: [
        ['id', 'UUID', 'Primary Key'],
        ['clinic_id', 'UUID', 'FK → clinics.id'],
        ['base_template', 'TEXT', 'Original test type'],
        ['customizations', 'JSONB', 'Field overrides'],
        ['created_at', 'TIMESTAMP', 'Auto-generated'],
        ['updated_at', 'TIMESTAMP', 'Auto-updated'],
      ],
    },
  ];
  
  tables.forEach((table) => {
    yPos = checkPageBreak(yPos, 50);
    yPos = drawSubsectionHeader(`Table: ${table.name}`, yPos);
    
    autoTable(doc, {
      startY: yPos,
      head: [['Column', 'Type', 'Description']],
      body: table.columns,
      margin: { left: MARGIN + 5, right: MARGIN },
      headStyles: {
        fillColor: COLORS.primaryDark,
        textColor: COLORS.white,
        fontStyle: 'bold',
        fontSize: 8,
      },
      bodyStyles: {
        fontSize: 7,
        textColor: COLORS.text,
      },
      alternateRowStyles: {
        fillColor: [250, 250, 250],
      },
    });
    
    yPos = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  });

  // ============ SECTION 6: AUTO-CALCULATION FORMULAS ============
  yPos = checkPageBreak(yPos, 80);
  yPos = drawSectionHeader('Auto-Calculation Formulas', 6, yPos);
  
  const formulas = [
    ['Test', 'Field', 'Formula', 'Description'],
    ['RFT', 'BUN', 'urea × 0.467', 'Blood Urea Nitrogen from Urea'],
    ['LFT', 'Indirect Bilirubin', 'Total Bilirubin - Direct Bilirubin', 'Unconjugated bilirubin'],
    ['LFT', 'Globulin', 'Total Protein - Albumin', 'Serum globulin level'],
    ['LFT', 'A/G Ratio', 'Albumin ÷ Globulin', 'Albumin to Globulin ratio'],
    ['Lipid', 'VLDL', 'Triglycerides ÷ 5', 'Friedewald formula'],
    ['Lipid', 'LDL', 'TC - HDL - (TG÷5)', 'Friedewald formula'],
    ['Lipid', 'TC/HDL Ratio', 'Total Cholesterol ÷ HDL', 'Cardiac risk indicator'],
    ['Lipid', 'LDL/HDL Ratio', 'LDL ÷ HDL', 'Atherogenic index'],
  ];
  
  autoTable(doc, {
    startY: yPos,
    head: [formulas[0]],
    body: formulas.slice(1),
    margin: { left: MARGIN, right: MARGIN },
    headStyles: {
      fillColor: COLORS.primary,
      textColor: COLORS.white,
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: COLORS.text,
    },
    alternateRowStyles: {
      fillColor: COLORS.sectionBg,
    },
  });
  
  yPos = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;

  // ============ SECTION 7: UI/UX SPECIFICATIONS ============
  yPos = checkPageBreak(yPos, 80);
  yPos = drawSectionHeader('UI/UX Specifications', 7, yPos);
  
  const uiSpecs = [
    ['Aspect', 'Specification'],
    ['Primary Color', '#009688 (Teal 500) - Medical professional aesthetic'],
    ['Background', 'Deep black (HSL 220 15% 4%) - Dark mode only'],
    ['Typography', 'System fonts with Helvetica fallback'],
    ['Component Library', 'shadcn/ui with Radix primitives'],
    ['Responsive', 'Mobile-first, breakpoints: sm(640), md(768), lg(1024), xl(1280)'],
    ['Animations', '5s pulsing glow on cards, scale transforms on hover'],
    ['Icons', 'Lucide React icon set'],
    ['Form Validation', 'React Hook Form with Zod schemas'],
    ['Toast Notifications', 'Sonner for success/error feedback'],
    ['Loading States', 'Skeleton components and spinners'],
  ];
  
  autoTable(doc, {
    startY: yPos,
    head: [uiSpecs[0]],
    body: uiSpecs.slice(1),
    margin: { left: MARGIN, right: MARGIN },
    headStyles: {
      fillColor: COLORS.primary,
      textColor: COLORS.white,
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: COLORS.text,
    },
    alternateRowStyles: {
      fillColor: COLORS.sectionBg,
    },
    columnStyles: {
      0: { cellWidth: 45 },
      1: { cellWidth: 'auto' },
    },
  });
  
  yPos = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;

  // ============ SECTION 8: PDF REPORT LAYOUT ============
  yPos = checkPageBreak(yPos, 80);
  yPos = drawSectionHeader('PDF Report Layout', 8, yPos);
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.text);
  
  const pdfLayoutText = [
    'Letterhead Section:',
    '• Clinic logo (left-aligned, 20×20mm on first page)',
    '• Clinic name (centered, bold, 22pt)',
    '• Header tagline (centered, italic, 10pt)',
    '• Contact information bar (address | phone | email)',
    '• Decorative double line separator',
    '',
    'Patient Information Block:',
    '• 2-column layout in bordered box',
    '• Left: Patient Name, Age/Gender, Patient ID, Referring Doctor',
    '• Right: Report Number, Test Date, Status, Report Date',
    '',
    'Results Table Format:',
    '• Columns: Test Name | Result | Unit | Normal Range | Status',
    '• Category headers as colored bars',
    '• Abnormal values in bold red with HIGH/LOW indicator',
    '• Abnormal summary box at top (red border, light red bg)',
    '',
    'Footer Section:',
    '• Signature lines: Lab Technician (left), Pathologist (right)',
    '• Footer text (customizable)',
    '• Page numbering: "Page X of Y"',
    '• Optional diagonal watermark overlay',
  ];
  
  pdfLayoutText.forEach((line) => {
    if (line === '') {
      yPos += 4;
    } else {
      yPos = checkPageBreak(yPos, 8);
      doc.text(line, MARGIN + 5, yPos);
      yPos += 5;
    }
  });
  
  yPos += 10;

  // ============ SECTION 9: SECURITY MODEL ============
  yPos = checkPageBreak(yPos, 80);
  yPos = drawSectionHeader('Security Model', 9, yPos);
  
  const securityText = [
    'Access Model:',
    '• Open-access design (no user authentication required)',
    '• Single-clinic mode with static clinic UUID',
    '• All data scoped to the default clinic',
    '',
    'Row Level Security (RLS):',
    '• All tables have RLS enabled',
    '• Policies allow read/write for default clinic scope',
    '• Storage policies for logo and image uploads',
    '',
    'Admin Functions:',
    '• Data reset requires secret ADMIN_RESET_CODE',
    '• Edge function validates code before deletion',
    '• Cascading delete respects foreign key constraints',
    '• Order: report_images → reports → patients',
    '',
    'Data Protection:',
    '• HTTPS-only API communication',
    '• Supabase handles encryption at rest',
    '• No sensitive data in localStorage except draft reports',
    '• Draft reports cleared on successful submission',
  ];
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.text);
  
  securityText.forEach((line) => {
    if (line === '') {
      yPos += 4;
    } else {
      yPos = checkPageBreak(yPos, 8);
      doc.text(line, MARGIN + 5, yPos);
      yPos += 5;
    }
  });

  // Final footer
  drawFooter();

  // Add page numbers
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.textMuted);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth / 2, FOOTER_Y, { align: 'center' });
  }

  return doc;
};
