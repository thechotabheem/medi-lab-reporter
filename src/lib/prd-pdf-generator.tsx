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
    ['Styling', 'TailwindCSS', '3.x with custom design system'],
    ['Language', 'TypeScript', 'Strict mode enabled'],
    ['Backend', 'Lovable Cloud', 'Supabase-powered'],
    ['Database', 'PostgreSQL', 'Via Lovable Cloud'],
    ['PDF Generation', '@react-pdf/renderer', '4.x JSX-based PDF rendering'],
    ['PWA Support', 'vite-plugin-pwa', '1.x'],
    ['UI Components', 'shadcn/ui', 'Radix primitives'],
    ['State Management', 'TanStack Query', '5.x'],
    ['Routing', 'React Router', '6.x'],
    ['Date Handling', 'date-fns', '3.x'],
  ];

  const modules = [
    { name: 'Dashboard', features: ['Real-time statistics', 'Quick action cards', 'Recent reports widget', 'Weather integration'] },
    { name: 'Patient Management', features: ['CRUD operations', 'Sequential IDs (PT-YY-NNNN)', 'Patient search with filters', 'Patient history view'] },
    { name: 'Report Management', features: ['17 test templates', 'Sequential numbers (TYPE-MM-NNN)', 'Draft auto-save', 'PDF export and WhatsApp sharing'] },
    { name: 'Template Editor', features: ['Customize field labels', 'Drag-and-drop reorder', 'Add/remove custom fields', 'Clone templates'] },
    { name: 'Settings', features: ['Basic clinic info (name, doctor, contact)', 'Notification preferences', 'Data reset', 'PWA installation controls'] },
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
          <Text style={{ fontSize: 11, color: COLORS.textMuted }}>Version 1.0</Text>
          <Text style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 4 }}>Generated: {formatDateFull(new Date())}</Text>
          {clinic?.name && <Text style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 4 }}>Clinic: {clinic.name}</Text>}
        </View>
        <Text style={[tw('text-center'), { fontSize: 9, color: COLORS.textMuted, position: 'absolute', bottom: 30, left: 0, right: 0 }]}>
          Comprehensive Technical Documentation for Medical Laboratory Reporting System
        </Text>
      </Page>

      {/* Content */}
      <Page size="A4" style={tw('p-4')}>
        <SectionHeader title="Executive Summary" sectionNum={1} />
        <Text style={{ fontSize: 10, color: COLORS.text, marginBottom: 8, lineHeight: 1.4 }}>
          MedLab Reporter is a Progressive Web Application (PWA) designed for medical laboratories to streamline the creation, management, and distribution of diagnostic test reports.
        </Text>
        <BulletList items={[
          'Instant PDF generation with professional clinic branding',
          '17 pre-configured test templates with auto-calculations',
          'Offline-capable PWA for reliable access',
          'Gender-aware normal ranges with abnormal value flagging',
          'Customizable templates per clinic requirements',
          'WhatsApp sharing integration for quick report delivery',
        ]} />

        <SectionHeader title="Technology Stack" sectionNum={2} />
        <SimpleTable head={['Category', 'Technology', 'Version']} body={techStack} colWidths={['25%', '35%', '40%']} />

        <SectionHeader title="Core Modules" sectionNum={3} />
        {modules.map((mod) => (
          <View key={mod.name}>
            <SubsectionHeader title={mod.name} />
            <BulletList items={mod.features} />
          </View>
        ))}
      </Page>

      {/* Test Types */}
      <Page size="A4" style={tw('p-4')}>
        <SectionHeader title="Supported Test Types (17 Types)" sectionNum={4} />
        <SimpleTable head={['Code', 'Full Name', 'Category']} body={testTypeOverview} colWidths={['25%', '45%', '30%']} />

        {/* Detailed specs */}
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

      {/* Remaining test types + more sections */}
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

        <SectionHeader title="Sequential ID System" sectionNum={6} />
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

        <SectionHeader title="Security Model" sectionNum={8} />
        <BulletList items={[
          'Restricted to 5 managed accounts (1 Admin + 4 Staff)',
          'Row Level Security (RLS) enabled on all tables',
          'HTTPS-only API communication',
          'Data reset requires secret ADMIN_RESET_CODE',
          'No sensitive data in localStorage except draft reports',
          'Draft reports cleared on successful submission',
        ]} />

        {/* Footer */}
        <Text style={[tw('text-center'), { fontSize: 8, color: COLORS.textMuted, position: 'absolute', bottom: 15, left: 0, right: 0 }]} fixed>
          MedLab Reporter - Product Requirements Document | Generated: {formatDateFull(new Date())}
        </Text>
      </Page>
    </Document>
  );

  const doc = React.createElement(PRDDocument);
  return (pdf as any)(doc).toBlob();
};
