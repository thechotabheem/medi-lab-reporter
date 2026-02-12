import React from 'react';
import { Document, Page, View } from '@react-pdf/renderer';
import { tw } from './tw-config';
import { darkenColor } from './utils';
import {
  ReportHeader,
  PatientInfoBox,
  TestResultsTable,
  CategoryHeader,
  ClinicalNotesBox,
  ReportFooter,
  Watermark,
} from './components';
import type { Report, Patient, ReportTemplate } from '@/types/database';

interface ReportDocumentProps {
  report: Report;
  patient: Patient;
  clinic?: {
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
    doctor_name?: string | null;
  } | null;
  template: ReportTemplate;
  reportData: Record<string, unknown>;
  logoBase64: string | null;
}

export const ReportDocument: React.FC<ReportDocumentProps> = ({
  report,
  patient,
  clinic,
  template,
  reportData,
  logoBase64,
}) => {
  const accentColor = clinic?.accent_color || '#009688';
  const accentColorDark = darkenColor(accentColor);
  const fontSizeMultiplier = clinic?.font_size === 'small' ? 0.9 : clinic?.font_size === 'large' ? 1.1 : 1;
  const showPatientId = clinic?.show_patient_id ?? true;
  const showLogoOnAllPages = clinic?.show_logo_on_all_pages ?? true;
  const pageSize = clinic?.page_size === 'letter' ? 'LETTER' : clinic?.page_size === 'legal' ? 'LEGAL' : 'A4';

  return (
    <Document>
      <Page size={pageSize as 'A4' | 'LETTER' | 'LEGAL'} style={tw('p-4 pb-12')}>
        {/* Watermark */}
        <Watermark
          text={clinic?.watermark_text}
          logoBase64={logoBase64}
          logoWatermarkEnabled={clinic?.logo_watermark_enabled ?? false}
        />

        {/* Header */}
        <ReportHeader
          logoBase64={logoBase64}
          clinicPhone={clinic?.phone}
          clinicEmail={clinic?.email}
          clinicName={clinic?.name}
          doctorName={clinic?.doctor_name}
          isFirstPage={true}
          showLogoOnAllPages={showLogoOnAllPages}
          reportNumber={report.report_number}
          accentColorDark={accentColorDark}
          fontSizeMultiplier={fontSizeMultiplier}
        />

        {/* Patient info */}
        <PatientInfoBox
          patient={patient}
          report={report}
          showPatientId={showPatientId}
          fontSizeMultiplier={fontSizeMultiplier}
        />

        {/* Test results by category */}
        {template.categories.map((category) => {
          const categoryFields = category.fields.filter(
            (f) => reportData[f.name] !== undefined && reportData[f.name] !== null && reportData[f.name] !== ''
          );
          if (categoryFields.length === 0) return null;

          return (
            <View key={category.name} wrap={false}>
              <CategoryHeader
                name={category.name}
                fontSizeMultiplier={fontSizeMultiplier}
                accentColorDark={accentColorDark}
              />
              <TestResultsTable
                fields={categoryFields}
                reportData={reportData}
                gender={patient.gender}
                fontSizeMultiplier={fontSizeMultiplier}
                accentColorDark={accentColorDark}
              />
            </View>
          );
        })}

        {/* Clinical notes */}
        {report.clinical_notes && (
          <ClinicalNotesBox notes={report.clinical_notes} fontSizeMultiplier={fontSizeMultiplier} />
        )}

        {/* Footer */}
        <ReportFooter
          pageNumber={1}
          totalPages={1}
          clinicAddress={clinic?.address}
          accentColorDark={accentColorDark}
          isLastPage={true}
        />
      </Page>
    </Document>
  );
};
