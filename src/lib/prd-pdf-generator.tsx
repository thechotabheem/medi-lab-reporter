import React from 'react';
import { Document, Page, View, Text, Image } from '@react-pdf/renderer';
import { pdf } from '@react-pdf/renderer';
import { formatDateFull } from '@/lib/date-formats';
import { tw } from './pdf/tw-config';
import { loadImageAsBase64 } from './pdf/utils';
import { reportTemplates, activeReportTypes } from './report-templates';

interface ClinicInfo {
  name?: string;
  logo_url?: string | null;
}

interface GeneratePRDOptions {
  clinic?: ClinicInfo | null;
}

const COLORS = {
  primary: '#009688',
  primaryDark: '#00796b',
  text: '#1e1e1e',
  textMuted: '#646464',
  sectionBg: '#f0fdf6',
};

const BORDER = { borderWidth: 0.3, borderColor: '#c8c8c8' };

const SectionHeader: React.FC<{ title: string; sectionNum: number }> = ({ title, sectionNum }) => (
  <View style={[tw('py-2 px-2 mb-3 mt-4'), { backgroundColor: COLORS.primary }]}>
    <Text style={[tw('font-bold text-white'), { fontSize: 12 }]}>Section {sectionNum}: {title}</Text>
  </View>
);

const SubsectionHeader: React.FC<{ title: string }> = ({ title }) => (
  <View style={[tw('py-1 px-1 mb-2 mt-2'), { backgroundColor: COLORS.sectionBg }]}>
    <Text style={[tw('font-bold'), { fontSize: 10, color: COLORS.primaryDark }]}>{title}</Text>
  </View>
);

const SimpleTable: React.FC<{ head: string[]; body: string[][]; colWidths?: string[] }> = ({ head, body, colWidths }) => {
  const defaultWidth = `${Math.floor(100 / head.length)}%`;

  return (
    <View style={tw('mb-3')}>
      <View style={[tw('flex-row'), { backgroundColor: COLORS.primary }]}>
        {head.map((h, i) => (
          <View key={i} style={[BORDER, { width: colWidths?.[i] || defaultWidth, padding: 2 }]}>
            <Text style={[tw('font-bold text-white'), { fontSize: 8 }]}>{h}</Text>
          </View>
        ))}
      </View>
      {body.map((row, ri) => (
        <View key={ri} style={[tw('flex-row'), ri % 2 === 1 ? { backgroundColor: '#fafafa' } : {}]}>
          {row.map((cell, ci) => (
            <View key={ci} style={[BORDER, { width: colWidths?.[ci] || defaultWidth, padding: 2 }]}>
              <Text style={{ fontSize: 7, color: COLORS.text }}>{cell}</Text>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
};

const BulletList: React.FC<{ items: string[] }> = ({ items }) => (
  <View style={tw('mb-2')}>
    {items.map((item, i) => (
      <Text key={i} style={{ fontSize: 9, color: COLORS.text, marginLeft: 8, marginBottom: 2 }}>• {item}</Text>
    ))}
  </View>
);

export const generatePRDPDF = async ({ clinic }: GeneratePRDOptions = {}): Promise<Blob> => {
  let logoBase64: string | null = null;
  if (clinic?.logo_url) {
    logoBase64 = await loadImageAsBase64(clinic.logo_url);
  }

  const techStack = [
    ['Frontend Framework', 'React', '18.3.x'],
    ['Build Tool', 'Vite', '5.x'],
    ['Styling', 'TailwindCSS', '3.x with high-contrast medical light theme'],
    ['Language', 'TypeScript', 'Strict mode enabled'],
    ['Backend', 'Lovable Cloud', 'Supabase-powered'],
    ['Database', 'PostgreSQL', 'Via Lovable Cloud with RLS'],
    ['PDF Generation', '@react-pdf/renderer', '4.x JSX-based PDF rendering'],
    ['PWA Support', 'vite-plugin-pwa', '1.x with offline-first strategy'],
    ['UI Components', 'shadcn/ui', 'Radix primitives with custom variants'],
    ['State Management', 'TanStack Query', '5.x with offline persistence'],
    ['Routing', 'React Router', '6.x with animated transitions'],
    ['Date Handling', 'date-fns', '3.x'],
    ['Error Monitoring', 'Sentry', '10.x with HIPAA-safe masking'],
    ['Drag & Drop', '@dnd-kit', 'Template field reordering'],
  ];

  const modules = [
    { name: 'Dashboard', features: ['Real-time statistics (reports, patients, monthly, drafts)', 'Quick action cards with glow effects', 'Weather integration', 'Date & time display', 'Clean medical-grade UI'] },
    { name: 'Patient Management', features: ['CRUD operations with form validation', 'Sequential IDs (PT-YY-NNNN)', 'Patient search with debounced filtering', 'Patient history with report timeline', 'CSV export of patient list'] },
    { name: 'Report Management', features: ['17 pre-configured test templates', 'Combined multi-test reports', 'Sequential numbers (TYPE-MM-NNN)', 'Draft auto-save with recovery', 'PDF export and WhatsApp sharing', 'Report status tracking (draft/final)'] },
    { name: 'Report Comparison', features: ['Side-by-side comparison of 2–5 reports', 'Trend tracking with visual indicators', 'Saved comparisons for future reference', 'Comparison PDF export'] },
    { name: 'Template Editor', features: ['Customize field labels and units', 'Drag-and-drop reorder with @dnd-kit', 'Add/remove custom fields', 'Clone and edit templates', 'Template preview dialog'] },
    { name: 'Clinic Settings', features: ['Basic info (name, doctor, contact)', 'PDF branding (logo, colors, watermark)', 'Signature configuration', 'Visual styling options (border, font size)', 'Live PDF preview thumbnail'] },
    { name: 'Admin Panel', features: ['Staff account management (4 slots)', 'Activity log monitoring', 'Data reset with ADMIN_RESET_CODE', 'Role-based access control'] },
  ];

  const testTypeOverview = activeReportTypes.map(type => {
    const t = reportTemplates[type];
    const cat = t.categories[0]?.fields.length > 0 && t.categories[0].fields[0].type === 'number' ? 'Value Based' : t.categories[0]?.fields[0]?.type === 'select' ? 'Screening' : 'Typing';
    return [type, t.name, cat];
  });

  const PRDDocument = () => (
    <Document>
      {/* Cover Page */}
      <Page size="A4" style={tw('p-4')}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          {logoBase64 && <Image src={logoBase64} style={{ width: 100, height: 100, marginBottom: 20, objectFit: 'contain' }} />}
          <Text style={[tw('font-bold'), { fontSize: 28, color: COLORS.primaryDark }]}>MedLab Reporter</Text>
          <Text style={{ fontSize: 18, color: COLORS.text, marginTop: 8 }}>Product Requirements Document</Text>
          <Text style={{ fontSize: 14, color: COLORS.text, marginTop: 4 }}>& Technical Specification Blueprint</Text>
          <View style={{ width: 200, height: 2, backgroundColor: COLORS.primary, marginVertical: 20 }} />
          <Text style={{ fontSize: 11, color: COLORS.textMuted }}>Version 2.0</Text>
          <Text style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 4 }}>Generated: {formatDateFull(new Date())}</Text>
          {clinic?.name && <Text style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 4 }}>Clinic: {clinic.name}</Text>}
        </View>
        <Text style={[tw('text-center'), { fontSize: 9, color: COLORS.textMuted, position: 'absolute', bottom: 30, left: 0, right: 0 }]}>
          Comprehensive Technical Documentation for Medical Laboratory Reporting System
        </Text>
      </Page>

      {/* Section 1-3: Executive Summary, Tech Stack, Core Modules */}
      <Page size="A4" style={tw('p-4')}>
        <SectionHeader title="Executive Summary" sectionNum={1} />
        <Text style={{ fontSize: 10, color: COLORS.text, marginBottom: 8, lineHeight: 1.4 }}>
          MedLab Reporter is a Progressive Web Application (PWA) designed for medical laboratories to streamline the creation, management, and distribution of diagnostic test reports. It features a high-contrast medical light theme, offline-first architecture, and professional branded PDF generation.
        </Text>
        <BulletList items={[
          'Instant PDF generation with professional clinic branding and watermarks',
          '17 pre-configured test templates with manual value entry',
          'Offline-capable PWA with background sync and queued operations',
          'Gender-aware normal ranges with abnormal value flagging',
          'Customizable templates with drag-and-drop field management',
          'Report comparison system for tracking 2–5 reports over time',
          'Manual backup/export as ZIP archive with all patient and report PDFs',
          'High-contrast medical light theme with semantic design tokens',
          'Sentry error monitoring with HIPAA-safe data masking',
          'Restricted to 5 managed accounts (1 Admin + 4 Staff)',
        ]} />

        <SectionHeader title="Technology Stack" sectionNum={2} />
        <SimpleTable head={['Category', 'Technology', 'Details']} body={techStack} colWidths={['22%', '30%', '48%']} />

        <SectionHeader title="Core Modules" sectionNum={3} />
        {modules.map((mod) => (
          <View key={mod.name}>
            <SubsectionHeader title={mod.name} />
            <BulletList items={mod.features} />
          </View>
        ))}
      </Page>

      {/* Section 4: Test Types */}
      <Page size="A4" style={tw('p-4')}>
        <SectionHeader title="Supported Test Types (17 Types)" sectionNum={4} />
        <SimpleTable head={['Code', 'Full Name', 'Category']} body={testTypeOverview} colWidths={['25%', '45%', '30%']} />

        {activeReportTypes.slice(0, 8).map((testType) => {
          const template = reportTemplates[testType];
          if (!template || template.categories.length === 0) return null;

          return (
            <View key={testType}>
              <SubsectionHeader title={`${template.name} (${testType})`} />
              {template.categories.map((category) => {
                if (category.fields.length === 0) return null;
                const fieldData = category.fields.map((field) => {
                  let normalRange = '-';
                  if (field.normalRange) {
                    if (field.normalRange.male && field.normalRange.female) {
                      normalRange = `M: ${field.normalRange.male.min ?? ''}-${field.normalRange.male.max ?? ''}, F: ${field.normalRange.female.min ?? ''}-${field.normalRange.female.max ?? ''}`;
                    } else {
                      const min = field.normalRange.min;
                      const max = field.normalRange.max;
                      if (min !== undefined && max !== undefined) normalRange = `${min} - ${max}`;
                      else if (min !== undefined) normalRange = `> ${min}`;
                      else if (max !== undefined) normalRange = `< ${max}`;
                    }
                  }
                  return [field.label, field.unit || '-', normalRange];
                });
                return (
                  <SimpleTable key={category.name} head={['Field', 'Unit', 'Normal Range']} body={fieldData} colWidths={['35%', '20%', '45%']} />
                );
              })}
            </View>
          );
        })}
      </Page>

      {/* Remaining test types + Sequential IDs + more sections */}
      <Page size="A4" style={tw('p-4')}>
        {activeReportTypes.slice(8).map((testType) => {
          const template = reportTemplates[testType];
          if (!template || template.categories.length === 0) return null;
          return (
            <View key={testType}>
              <SubsectionHeader title={`${template.name} (${testType})`} />
              {template.categories.map((category) => {
                if (category.fields.length === 0) return null;
                const fieldData = category.fields.map((field) => {
                  let normalRange = '-';
                  if (field.normalRange) {
                    if (field.normalRange.male && field.normalRange.female) {
                      normalRange = `M: ${field.normalRange.male.min ?? ''}-${field.normalRange.male.max ?? ''}, F: ${field.normalRange.female.min ?? ''}-${field.normalRange.female.max ?? ''}`;
                    } else {
                      const { min, max } = field.normalRange;
                      if (min !== undefined && max !== undefined) normalRange = `${min} - ${max}`;
                      else if (min !== undefined) normalRange = `> ${min}`;
                      else if (max !== undefined) normalRange = `< ${max}`;
                    }
                  }
                  return [field.label, field.unit || '-', normalRange];
                });
                return (
                  <SimpleTable key={category.name} head={['Field', 'Unit', 'Normal Range']} body={fieldData} colWidths={['35%', '20%', '45%']} />
                );
              })}
            </View>
          );
        })}

        <SectionHeader title="Sequential ID System" sectionNum={5} />
        <SimpleTable
          head={['Entity', 'Format', 'Example', 'Description']}
          body={[
            ['Patient ID', 'PT-YY-NNNN', 'PT-26-0001', 'Year-based sequential patient numbering'],
            ['Report Number', 'TYPE-MM-NNN', 'CBC-02-001', 'Type + month-based sequential report numbering'],
          ]}
          colWidths={['20%', '25%', '25%', '30%']}
        />
        <BulletList items={[
          'Generated via database functions (generate_patient_id, generate_report_number)',
          'Automatically increments within clinic scope',
          'Year/month resets ensure organized record-keeping',
        ]} />

      </Page>

      {/* Section 6-11: Comparison, Offline, Backup, Design, Security, Monitoring */}
      <Page size="A4" style={tw('p-4')}>
        <SectionHeader title="Report Comparison System" sectionNum={6} />
        <BulletList items={[
          'Compare 2–5 reports side-by-side for the same patient',
          'Visual trend indicators (↑ increase, ↓ decrease, → stable)',
          'Abnormal value highlighting across all compared reports',
          'Save comparisons for future reference with custom names',
          'Export comparison as branded PDF document',
          'Multi-report comparison table with sortable columns',
        ]} />

        <SectionHeader title="Offline & PWA Capabilities" sectionNum={7} />
        <BulletList items={[
          'Service Worker caching for offline access to all pages',
          'TanStack Query offline persistence for cached data',
          'Offline queue for mutations (create/update/delete) with automatic sync',
          'Offline status banner with visual indicator',
          'PWA installation prompt for desktop and mobile',
          'Background sync when connection is restored',
          'App works fully offline after initial load',
        ]} />

        <SectionHeader title="Backup & Data Export" sectionNum={8} />
        <BulletList items={[
          'Manual ZIP archive download from Settings',
          'Archive includes master patient list as PDF',
          'Each report exported as individual branded PDF',
          'Progress indicator during backup generation',
          'Compressed DEFLATE format for smaller file sizes',
          'Filename includes date/time stamp for versioning',
        ]} />

        <SectionHeader title="Design System" sectionNum={9} />
        <BulletList items={[
          'High-contrast medical light theme (primary: deep teal hsl(168 84% 26%))',
          'Semantic HSL design tokens for all colors (no direct color usage)',
          'Custom shadcn/ui component variants (stat-card, action-card, icon-wrapper)',
          'Responsive layouts for mobile (375px+), tablet, and desktop',
          'Animated page transitions and micro-interactions',
          'Mobile bottom navigation with active state indicators',
          'Global search with keyboard shortcuts (Ctrl+K / ⌘K)',
        ]} />

        <SectionHeader title="Security Model" sectionNum={11} />
        <BulletList items={[
          'Restricted to 5 managed accounts (1 Admin + 4 Staff)',
          'Role-based access: admin, lab_technician, receptionist',
          'Row Level Security (RLS) enabled on all database tables',
          'Roles stored in separate user_roles table (not on profiles)',
          'Security-definer has_role() function prevents RLS recursion',
          'HTTPS-only API communication via Lovable Cloud',
          'Data reset requires secret ADMIN_RESET_CODE via edge function',
          'No sensitive data in localStorage except draft reports',
          'Draft reports cleared on successful submission',
        ]} />

        <SectionHeader title="Monitoring & Activity Logging" sectionNum={12} />
        <BulletList items={[
          'Sentry error tracking integrated with HIPAA-safe data masking',
          'Activity logs for all CRUD operations (create, update, delete)',
          'Logs include entity type, action, user, and timestamp',
          'Admin can view activity logs in the Admin Panel',
          'No PII/PHI sent to external monitoring services',
        ]} />

        {/* Footer */}
        <Text style={[tw('text-center'), { fontSize: 8, color: COLORS.textMuted, position: 'absolute', bottom: 15, left: 0, right: 0 }]} fixed>
          MedLab Reporter v2.0 - Product Requirements Document | Generated: {formatDateFull(new Date())}
        </Text>
      </Page>
    </Document>
  );

  const doc = React.createElement(PRDDocument);
  return (pdf as any)(doc).toBlob();
};
