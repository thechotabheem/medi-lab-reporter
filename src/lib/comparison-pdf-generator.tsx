import React from 'react';
import { Document, Page, View, Text } from '@react-pdf/renderer';
import { pdf } from '@react-pdf/renderer';
import { formatDate, formatDateFull, formatDateForFile } from '@/lib/date-formats';
import { tw } from './pdf/tw-config';
import { loadImageAsBase64, darkenColor, calculateAge } from './pdf/utils';
import type { Report, Patient } from '@/types/database';
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

interface ComparisonDocumentProps {
  reportA: Report;
  reportB: Report;
  patient: Patient;
  comparison: ComparisonResult[];
  uniqueToA: string[];
  uniqueToB: string[];
  clinic?: ClinicWithBranding | null;
  logoBase64: string | null;
}

const BORDER = { borderWidth: 0.3, borderColor: '#d2d2d2' };

const ComparisonDocument: React.FC<ComparisonDocumentProps> = ({
  reportA, reportB, patient, comparison, uniqueToA, uniqueToB, clinic, logoBase64,
}) => {
  const accentColor = clinic?.accent_color || '#009688';
  const accentColorDark = darkenColor(accentColor);
  const fontSizeMultiplier = clinic?.font_size === 'small' ? 0.9 : clinic?.font_size === 'large' ? 1.1 : 1;
  const pageSize = clinic?.page_size === 'letter' ? 'LETTER' : clinic?.page_size === 'legal' ? 'LEGAL' : 'A4';

  const improved = comparison.filter(c => c.trend === 'improved').length;
  const declined = comparison.filter(c => c.trend === 'declined').length;
  const stable = comparison.filter(c => c.trend === 'stable' || c.trend === 'unchanged').length;

  // Group by category
  const grouped = comparison.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, ComparisonResult[]>);

  return (
    <Document>
      <Page size={pageSize as any} style={tw('p-4')}>
        {/* Header */}
        <View style={tw('flex-row items-center mb-2')}>
          {logoBase64 && <View style={{ width: 50, height: 50, marginRight: 10 }}><View /></View>}
          <Text style={[tw('text-center font-bold flex-1'), { fontSize: 22 * fontSizeMultiplier, color: accentColorDark }]}>
            {clinic?.name || 'Medical Laboratory'}
          </Text>
        </View>

        {clinic?.tagline && (
          <Text style={[tw('text-center italic'), { fontSize: 10 * fontSizeMultiplier, color: '#646464', marginBottom: 4 }]}>
            {clinic.tagline}
          </Text>
        )}

        <View style={{ height: 1.5, backgroundColor: accentColor, marginBottom: 8 }} />

        {/* Title bar */}
        <View style={[tw('py-2 mb-3'), { backgroundColor: accentColor }]}>
          <Text style={[tw('text-center font-bold text-white'), { fontSize: 12 * fontSizeMultiplier }]}>
            REPORT COMPARISON SUMMARY
          </Text>
        </View>

        {/* Patient info */}
        <View style={[tw('p-2 mb-3'), { backgroundColor: '#f8fafc', borderWidth: 0.3, borderColor: '#d2d2d2' }]}>
          <View style={tw('flex-row mb-1')}>
            <Text style={{ fontSize: 8, color: '#646464', width: '33%' }}>Patient: <Text style={tw('font-bold')}>{patient.full_name}</Text></Text>
            <Text style={{ fontSize: 8, color: '#646464', width: '33%' }}>Age/Gender: <Text style={tw('font-bold')}>{calculateAge(patient.date_of_birth)} yrs / {patient.gender}</Text></Text>
            <Text style={{ fontSize: 8, color: '#646464', width: '33%' }}>Generated: <Text style={tw('font-bold')}>{formatDateFull(new Date())}</Text></Text>
          </View>
          <View style={tw('flex-row')}>
            <Text style={{ fontSize: 8, color: '#646464', width: '50%' }}>Baseline (A): <Text style={tw('font-bold')}>{formatDateFull(reportA.test_date)} (#{reportA.report_number})</Text></Text>
            <Text style={{ fontSize: 8, color: '#646464', width: '50%' }}>Current (B): <Text style={tw('font-bold')}>{formatDateFull(reportB.test_date)} (#{reportB.report_number})</Text></Text>
          </View>
        </View>

        {/* Trend summary */}
        <Text style={[tw('font-bold mb-1'), { fontSize: 9, color: accentColor }]}>TREND SUMMARY</Text>
        <Text style={{ fontSize: 8, color: '#282828', marginBottom: 6 }}>
          {comparison.length} parameters compared: {improved} improved ↗, {declined} declined ↘, {stable} stable →
        </Text>

        {/* Comparison table */}
        {/* Header */}
        <View style={[tw('flex-row'), { backgroundColor: accentColor }]}>
          {['Test Parameter', 'Baseline (A)', 'Current (B)', 'Change', 'Trend', 'Normal Range'].map((h, i) => (
            <View key={h} style={[BORDER, { width: i === 0 ? '30%' : '14%', padding: 2 }]}>
              <Text style={[tw('text-center font-bold text-white'), { fontSize: 8 * fontSizeMultiplier }]}>{h}</Text>
            </View>
          ))}
        </View>

        {/* Rows */}
        {Object.entries(grouped).map(([category, items]) => (
          <View key={category}>
            {/* Category header */}
            <View style={[tw('flex-row'), { backgroundColor: '#f0f0f0' }]}>
              <View style={[BORDER, { width: '100%', padding: 2 }]}>
                <Text style={[tw('font-bold'), { fontSize: 8 }]}>{category}</Text>
              </View>
            </View>
            {items.map((item) => {
              const valueA = item.valueA !== null && item.valueA !== undefined ? String(item.valueA) : '-';
              const valueB = item.valueB !== null && item.valueB !== undefined ? String(item.valueB) : '-';
              const changeStr = item.percentChange !== null ? `${item.percentChange >= 0 ? '+' : ''}${item.percentChange.toFixed(1)}%` : '-';
              const trendColor = getTrendColor(item.trend);

              return (
                <View key={item.fieldName} style={tw('flex-row')}>
                  <View style={[BORDER, { width: '30%', padding: 2 }]}>
                    <Text style={{ fontSize: 8, color: '#282828' }}>{item.fieldLabel}{item.unit ? ` (${item.unit})` : ''}</Text>
                  </View>
                  <View style={[BORDER, { width: '14%', padding: 2 }]}>
                    <Text style={[tw('text-center'), { fontSize: 8, color: item.statusA === 'abnormal' ? '#dc2626' : '#282828' }]}>{valueA}</Text>
                  </View>
                  <View style={[BORDER, { width: '14%', padding: 2 }]}>
                    <Text style={[tw('text-center'), { fontSize: 8, color: item.statusB === 'abnormal' ? '#dc2626' : '#282828' }]}>{valueB}</Text>
                  </View>
                  <View style={[BORDER, { width: '14%', padding: 2 }]}>
                    <Text style={[tw('text-center'), { fontSize: 8 }]}>{changeStr}</Text>
                  </View>
                  <View style={[BORDER, { width: '14%', padding: 2 }]}>
                    <Text style={[tw('text-center font-bold'), { fontSize: 8, color: trendColor }]}>
                      {getTrendSymbol(item.trend)} {getTrendLabel(item.trend)}
                    </Text>
                  </View>
                  <View style={[BORDER, { width: '14%', padding: 2 }]}>
                    <Text style={[tw('text-center'), { fontSize: 8, color: '#646464' }]}>{item.normalRange}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        ))}

        {/* Unique fields */}
        {(uniqueToA.length > 0 || uniqueToB.length > 0) && (
          <View style={tw('mt-3')}>
            {uniqueToA.length > 0 && (
              <View style={tw('mb-2')}>
                <Text style={[tw('font-bold'), { fontSize: 9, color: '#646464' }]}>Only in Baseline Report (A): {uniqueToA.length} parameter(s)</Text>
                <Text style={{ fontSize: 8 }}>{uniqueToA.join(', ')}</Text>
              </View>
            )}
            {uniqueToB.length > 0 && (
              <View>
                <Text style={[tw('font-bold'), { fontSize: 9, color: '#646464' }]}>Only in Current Report (B): {uniqueToB.length} parameter(s)</Text>
                <Text style={{ fontSize: 8 }}>{uniqueToB.join(', ')}</Text>
              </View>
            )}
          </View>
        )}

        {/* Legend */}
        <View style={tw('mt-4')}>
          <Text style={[tw('font-bold mb-1'), { fontSize: 8, color: '#646464' }]}>LEGEND:</Text>
          <View style={tw('flex-row')}>
            <Text style={{ fontSize: 7, marginRight: 20 }}>↗ Improved - Value toward normal</Text>
            <Text style={{ fontSize: 7, marginRight: 20 }}>↘ Declined - Value from normal</Text>
            <Text style={{ fontSize: 7, marginRight: 20 }}>→ Stable - {'<'}5% change</Text>
            <Text style={{ fontSize: 7 }}>★ New - Only in current</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};

export const generateComparisonPDF = async (options: GenerateComparisonPDFOptions): Promise<Blob> => {
  let logoBase64: string | null = null;
  if (options.clinic?.logo_url) {
    logoBase64 = await loadImageAsBase64(options.clinic.logo_url);
  }

  const doc = React.createElement(ComparisonDocument, { ...options, logoBase64 });
  return (pdf as any)(doc).toBlob();
};

export const downloadComparisonPDF = async (options: GenerateComparisonPDFOptions): Promise<void> => {
  const blob = await generateComparisonPDF(options);
  const fileName = `comparison_${options.patient.full_name.replace(/\s+/g, '_')}_${formatDateForFile(new Date())}.pdf`;
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
};

export const shareComparisonPDFViaWhatsApp = async (options: GenerateComparisonPDFOptions): Promise<void> => {
  const message = encodeURIComponent(`Lab report comparison for ${options.patient.full_name} is ready. Comparing reports from ${formatDateFull(options.reportA.test_date)} and ${formatDateFull(options.reportB.test_date)}.`);
  const phone = options.patient.phone?.replace(/\D/g, '') || '';
  window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
};
