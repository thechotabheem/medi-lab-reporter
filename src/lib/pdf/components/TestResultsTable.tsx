import React from 'react';
import { View, Text } from '@react-pdf/renderer';
import { FONTS } from '../fonts';
import type { TestField, Gender } from '@/types/database';
import { getDetailedValueStatus, formatNormalRange, getStatusColor } from '../utils';

interface TestResultsTableProps {
  fields: TestField[];
  reportData: Record<string, unknown>;
  gender: Gender;
  fontSizeMultiplier?: number;
  accentColorDark?: string;
}

const BORDER = { borderWidth: 1, borderColor: '#000000' };

export const TestResultsTable: React.FC<TestResultsTableProps> = ({
  fields,
  reportData,
  gender,
}) => {
  const filledFields = fields.filter(
    (f) => reportData[f.name] !== undefined && reportData[f.name] !== null && reportData[f.name] !== ''
  );

  if (filledFields.length === 0) return null;

  // Separate quantitative (number) vs qualitative (select/text with no unit & no normalRange)
  const isQualitative = (f: TestField) => f.type === 'select' || (f.type === 'text' && !f.unit && !f.normalRange);
  const quantitativeFields = filledFields.filter((f) => !isQualitative(f));
  const qualitativeFields = filledFields.filter((f) => isQualitative(f));

  const headerCellStyle = (width: string) => [
    BORDER,
    { width, paddingVertical: 5, paddingHorizontal: 5, backgroundColor: '#FFFFFF' },
  ];

  const dataCellStyle = (width: string) => [
    BORDER,
    { width, paddingVertical: 5, paddingHorizontal: 5 },
  ];

  const headerText = (label: string) => ({
    textAlign: 'center' as const,
    fontFamily: FONTS.garetBold,
    fontWeight: 600 as const,
    fontSize: 14,
    color: '#000000',
  });

  return (
    <View>
      {/* Quantitative table (5 columns) */}
      {quantitativeFields.length > 0 && (
        <View>
          <View style={{ flexDirection: 'row' }}>
            <View style={headerCellStyle('25%')}><Text style={headerText('Test Name')}>Test Name</Text></View>
            <View style={headerCellStyle('25%')}><Text style={headerText('Reference Range')}>Reference Range</Text></View>
            <View style={headerCellStyle('15%')}><Text style={headerText('Unit')}>Unit</Text></View>
            <View style={headerCellStyle('15%')}><Text style={headerText('Result')}>Result</Text></View>
            <View style={headerCellStyle('20%')}><Text style={headerText('Status')}>Status</Text></View>
          </View>
          {quantitativeFields.map((field) => {
            const value = reportData[field.name];
            const displayValue = String(value);
            const normalRange = formatNormalRange(field, gender);
            const status = getDetailedValueStatus(value as number, field, gender);
            const statusColor = getStatusColor(status);
            const statusLabel = status === 'Normal' ? 'Normal'
              : status.startsWith('Low') ? 'Low'
              : status.startsWith('High') ? 'High'
              : '—';

            return (
              <View key={field.name} style={{ flexDirection: 'row' }}>
                <View style={dataCellStyle('25%')}><Text style={{ textAlign: 'center', fontSize: 12, color: '#000000', fontFamily: FONTS.workSans }}>{field.label}</Text></View>
                <View style={dataCellStyle('25%')}><Text style={{ textAlign: 'center', fontSize: 12, color: '#000000', fontFamily: FONTS.workSans }}>{normalRange}</Text></View>
                <View style={dataCellStyle('15%')}><Text style={{ textAlign: 'center', fontSize: 12, color: '#000000', fontFamily: FONTS.workSans }}>{field.unit || '—'}</Text></View>
                <View style={dataCellStyle('15%')}><Text style={{ textAlign: 'center', fontSize: 12, color: '#000000', fontFamily: FONTS.workSans }}>{displayValue}</Text></View>
                <View style={dataCellStyle('20%')}><Text style={{ textAlign: 'center', fontFamily: FONTS.workSans, fontWeight: 400, fontSize: 12, color: statusColor }}>{statusLabel}</Text></View>
              </View>
            );
          })}
        </View>
      )}

      {/* Qualitative table (2 columns: Test Name + Status) */}
      {qualitativeFields.length > 0 && (
        <View style={quantitativeFields.length > 0 ? { marginTop: 8 } : {}}>
          <View style={{ flexDirection: 'row' }}>
            <View style={headerCellStyle('50%')}><Text style={headerText('Test Name')}>Test Name</Text></View>
            <View style={headerCellStyle('50%')}><Text style={headerText('Status')}>Status</Text></View>
          </View>
          {qualitativeFields.map((field) => {
            const value = reportData[field.name];
            const displayValue = String(value);

            return (
              <View key={field.name} style={{ flexDirection: 'row' }}>
                <View style={dataCellStyle('50%')}><Text style={{ textAlign: 'center', fontSize: 12, color: '#000000', fontFamily: FONTS.workSans }}>{field.label}</Text></View>
                <View style={dataCellStyle('50%')}><Text style={{ textAlign: 'center', fontSize: 12, color: '#000000', fontFamily: FONTS.workSans }}>{displayValue}</Text></View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
};
