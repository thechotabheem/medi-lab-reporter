import React from 'react';
import { Document, Page, View, Text } from '@react-pdf/renderer';
import { pdf } from '@react-pdf/renderer';
import { format } from 'date-fns';
import { tw } from './pdf/tw-config';
import { loadImageAsBase64, darkenColor, calculateAge } from './pdf/utils';
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

const getTrendColor = (trend: TrendType): string => {
  if (trend === 'improved') return '#16a34a';
  if (trend === 'declined') return '#dc2626';
  return '#646464';
};

const BORDER = { borderWidth: 0.3, borderColor: '#d2d2d2' };

interface MultiComparisonDocumentProps {
  reports: Report[];
  patient: Patient;
  comparison: MultiComparisonResult[];
  reportDates: string[];
  uniqueFields?: Map<string, number[]>;
  clinic?: ClinicWithBranding | null;
  logoBase64: string | null;
}

const MultiComparisonDocument: React.FC<MultiComparisonDocumentProps> = ({
  reports, patient, comparison, reportDates, uniqueFields, clinic, logoBase64,
}) => {
  const accentColor = clinic?.accent_color || '#009688';
  const accentColorDark = darkenColor(accentColor);
  const fontSizeMultiplier = clinic?.font_size === 'small' ? 0.9 : clinic?.font_size === 'large' ? 1.1 : 1;
  const orientation = reports.length > 3 ? 'landscape' : 'portrait';
  const pageSize = clinic?.page_size === 'letter' ? 'LETTER' : clinic?.page_size === 'legal' ? 'LEGAL' : 'A4';

  const improved = comparison.filter(c => c.overallTrend === 'improved').length;
  const declined = comparison.filter(c => c.overallTrend === 'declined').length;
  const stable = comparison.filter(c => c.overallTrend === 'stable' || c.overallTrend === 'unchanged').length;

  const grouped = comparison.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, MultiComparisonResult[]>);

  // Calculate column widths
  const paramWidth = '25%';
  const trendWidth = '15%';
  const rangeWidth = '12%';
  const valueWidth = `${Math.floor(48 / reports.length)}%`;

  return (
    <Document>
      <Page size={pageSize as any} orientation={orientation} style={tw('p-4')}>
        {/* Header */}
        <Text style={[tw('text-center font-bold mb-1'), { fontSize: 22 * fontSizeMultiplier, color: accentColorDark }]}>
          {clinic?.name || 'Medical Laboratory'}
        </Text>
        {clinic?.tagline && (
          <Text style={[tw('text-center italic mb-1'), { fontSize: 10, color: '#646464' }]}>{clinic.tagline}</Text>
        )}
        <View style={{ height: 1.5, backgroundColor: accentColor, marginBottom: 8 }} />

        {/* Title */}
        <View style={[tw('py-2 mb-3'), { backgroundColor: accentColor }]}>
          <Text style={[tw('text-center font-bold text-white'), { fontSize: 12 * fontSizeMultiplier }]}>
            MULTI-REPORT COMPARISON ({reports.length} Reports)
          </Text>
        </View>

        {/* Patient info */}
        <View style={[tw('p-2 mb-2'), { backgroundColor: '#f8fafc', borderWidth: 0.3, borderColor: '#d2d2d2' }]}>
          <View style={tw('flex-row mb-1')}>
            <Text style={{ fontSize: 8, color: '#646464' }}>Patient: <Text style={tw('font-bold')}>{patient.full_name}</Text></Text>
            <Text style={{ fontSize: 8, color: '#646464', marginLeft: 20 }}>Age/Gender: <Text style={tw('font-bold')}>{calculateAge(patient.date_of_birth)} / {patient.gender}</Text></Text>
            <Text style={{ fontSize: 8, color: '#646464', marginLeft: 'auto' }}>Generated: <Text style={tw('font-bold')}>{format(new Date(), 'dd MMM yyyy')}</Text></Text>
          </View>
          <Text style={{ fontSize: 8, color: '#646464' }}>
            Date Range: <Text style={tw('font-bold')}>{format(new Date(reportDates[0]), 'dd MMM yyyy')} → {format(new Date(reportDates[reportDates.length - 1]), 'dd MMM yyyy')}</Text>
          </Text>
          <Text style={{ fontSize: 7, color: '#646464', marginTop: 2 }}>
            Reports: {reportDates.map((date, i) => `#${i + 1}: ${format(new Date(date), 'MMM d, yy')}`).join('  •  ')}
          </Text>
        </View>

        {/* Summary */}
        <Text style={[tw('font-bold mb-1'), { fontSize: 9, color: accentColor }]}>OVERALL TREND SUMMARY</Text>
        <Text style={{ fontSize: 8, color: '#282828', marginBottom: 6 }}>
          {comparison.length} parameters: {improved} improved ↗, {declined} declined ↘, {stable} stable →
        </Text>

        {/* Table header */}
        <View style={[tw('flex-row'), { backgroundColor: accentColor }]}>
          <View style={[BORDER, { width: paramWidth, padding: 2 }]}>
            <Text style={[tw('font-bold text-white'), { fontSize: 7 }]}>Test Parameter</Text>
          </View>
          {reportDates.map((date, idx) => (
            <View key={idx} style={[BORDER, { width: valueWidth, padding: 2 }]}>
              <Text style={[tw('text-center font-bold text-white'), { fontSize: 7 }]}>#{idx + 1}{'\n'}{format(new Date(date), 'MMM d')}</Text>
            </View>
          ))}
          <View style={[BORDER, { width: trendWidth, padding: 2 }]}>
            <Text style={[tw('text-center font-bold text-white'), { fontSize: 7 }]}>Trend</Text>
          </View>
          <View style={[BORDER, { width: rangeWidth, padding: 2 }]}>
            <Text style={[tw('text-center font-bold text-white'), { fontSize: 7 }]}>Range</Text>
          </View>
        </View>

        {/* Data rows */}
        {Object.entries(grouped).map(([category, items]) => (
          <View key={category}>
            <View style={[tw('flex-row'), { backgroundColor: '#f0f0f0' }]}>
              <View style={[BORDER, { width: '100%', padding: 2 }]}>
                <Text style={[tw('font-bold'), { fontSize: 7 }]}>{category}</Text>
              </View>
            </View>
            {items.map((item) => (
              <View key={item.fieldName} style={tw('flex-row')}>
                <View style={[BORDER, { width: paramWidth, padding: 2 }]}>
                  <Text style={{ fontSize: 7 }}>{item.fieldLabel}{item.unit ? ` (${item.unit})` : ''}</Text>
                </View>
                {item.values.map((val, idx) => (
                  <View key={idx} style={[BORDER, { width: valueWidth, padding: 2 }]}>
                    <Text style={[tw('text-center'), { fontSize: 7, color: item.statuses[idx] === 'abnormal' ? '#dc2626' : '#282828' }]}>
                      {val !== null && val !== undefined ? String(val) : '-'}
                    </Text>
                  </View>
                ))}
                <View style={[BORDER, { width: trendWidth, padding: 2 }]}>
                  <Text style={[tw('text-center font-bold'), { fontSize: 7, color: getTrendColor(item.overallTrend) }]}>
                    {getTrendSymbol(item.overallTrend)} {getTrendLabel(item.overallTrend)}
                  </Text>
                </View>
                <View style={[BORDER, { width: rangeWidth, padding: 2 }]}>
                  <Text style={[tw('text-center'), { fontSize: 7, color: '#646464' }]}>{item.normalRange}</Text>
                </View>
              </View>
            ))}
          </View>
        ))}

        {/* Unique fields */}
        {uniqueFields && uniqueFields.size > 0 && (
          <View style={tw('mt-3')}>
            <Text style={[tw('font-bold'), { fontSize: 9, color: '#646464' }]}>
              Fields not present in all reports: {uniqueFields.size} parameter(s)
            </Text>
            <Text style={{ fontSize: 7, marginTop: 2 }}>
              {[...uniqueFields.entries()].map(([name, indices]) => `${name} (#${indices.map(i => i + 1).join(', ')})`).join(', ')}
            </Text>
          </View>
        )}

        {/* Legend */}
        <View style={tw('mt-4')}>
          <Text style={[tw('font-bold mb-1'), { fontSize: 8, color: '#646464' }]}>LEGEND:</Text>
          <View style={tw('flex-row')}>
            <Text style={{ fontSize: 7, marginRight: 30 }}>↗ Improved - Value toward normal</Text>
            <Text style={{ fontSize: 7, marginRight: 30 }}>↘ Declined - Value from normal</Text>
            <Text style={{ fontSize: 7 }}>→ Stable - {'<'}5% change</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};

export const generateMultiComparisonPDF = async (options: GenerateMultiComparisonPDFOptions): Promise<Blob> => {
  let logoBase64: string | null = null;
  if (options.clinic?.logo_url) {
    logoBase64 = await loadImageAsBase64(options.clinic.logo_url);
  }
  const doc = React.createElement(MultiComparisonDocument, { ...options, logoBase64 });
  return (pdf as any)(doc).toBlob();
};

export const downloadMultiComparisonPDF = async (options: GenerateMultiComparisonPDFOptions): Promise<void> => {
  const blob = await generateMultiComparisonPDF(options);
  const fileName = `comparison_${options.patient.full_name.replace(/\s+/g, '_')}_${options.reports.length}reports_${format(new Date(), 'yyyyMMdd')}.pdf`;
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
};

export const shareMultiComparisonPDFViaWhatsApp = async (options: GenerateMultiComparisonPDFOptions): Promise<void> => {
  const dateRange = `${format(new Date(options.reportDates[0]), 'dd MMM yyyy')} to ${format(new Date(options.reportDates[options.reportDates.length - 1]), 'dd MMM yyyy')}`;
  const message = encodeURIComponent(`Lab report comparison for ${options.patient.full_name} is ready. Comparing ${options.reports.length} reports from ${dateRange}.`);
  const phone = options.patient.phone?.replace(/\D/g, '') || '';
  window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
};
