import React from 'react';
import { View, Text } from '@react-pdf/renderer';
import { FONTS } from '../fonts';
import type { TestField, Gender } from '@/types/database';
import { getDetailedValueStatus, formatNormalRange, getStatusColor, getStatusLabel } from '../utils';

interface TestResultsTableProps {
  fields: TestField[];
  reportData: Record<string, unknown>;
  gender: Gender;
  fontSizeMultiplier?: number;
  accentColorDark?: string;
}

const BORDER = { borderWidth: 0.5, borderColor: '#000000' };

export const TestResultsTable: React.FC<TestResultsTableProps> = ({
  fields,
  reportData,
  gender,
  fontSizeMultiplier = 1,
}) => {
  const fs = 10 * fontSizeMultiplier;
  const headerFs = 12 * fontSizeMultiplier;

  const filledFields = fields.filter(
    (f) => reportData[f.name] !== undefined && reportData[f.name] !== null && reportData[f.name] !== ''
  );

  if (filledFields.length === 0) return null;

  return (
    <View>
      {/* Header row */}
      <View style={{ flexDirection: 'row', backgroundColor: '#F0F0F0' }}>
        <View style={[BORDER, { width: '30%', padding: 5 }]}>
          <Text style={{ fontSize: headerFs, color: '#000000', fontFamily: FONTS.bold }}>Test Name</Text>
        </View>
        <View style={[BORDER, { width: '20%', padding: 5 }]}>
          <Text style={{ fontSize: headerFs, color: '#000000', fontFamily: FONTS.bold }}>Reference Range</Text>
        </View>
        <View style={[BORDER, { width: '15%', padding: 5 }]}>
          <Text style={{ fontSize: headerFs, color: '#000000', fontFamily: FONTS.bold }}>Unit</Text>
        </View>
        <View style={[BORDER, { width: '15%', padding: 5 }]}>
          <Text style={{ fontSize: headerFs, color: '#000000', fontFamily: FONTS.bold, textAlign: 'right' }}>Result</Text>
        </View>
        <View style={[BORDER, { width: '20%', padding: 5 }]}>
          <Text style={{ fontSize: headerFs, color: '#000000', fontFamily: FONTS.bold, textAlign: 'center' }}>Status</Text>
        </View>
      </View>

      {/* Data rows — no zebra striping */}
      {filledFields.map((field) => {
        const value = reportData[field.name];
        const displayValue = String(value);
        const normalRange = formatNormalRange(field, gender);
        const status = getDetailedValueStatus(value as number, field, gender);
        const statusColor = getStatusColor(status);
        const statusLabel = getStatusLabel(status);

        return (
          <View key={field.name} style={{ flexDirection: 'row' }}>
            <View style={[BORDER, { width: '30%', padding: 5 }]}>
              <Text style={{ fontSize: fs, color: '#000000', fontFamily: FONTS.body }}>{field.label}</Text>
            </View>
            <View style={[BORDER, { width: '20%', padding: 5 }]}>
              <Text style={{ fontSize: fs, color: '#000000', fontFamily: FONTS.body }}>{normalRange}</Text>
            </View>
            <View style={[BORDER, { width: '15%', padding: 5 }]}>
              <Text style={{ fontSize: fs, color: '#000000', fontFamily: FONTS.body }}>{field.unit || '—'}</Text>
            </View>
            <View style={[BORDER, { width: '15%', padding: 5 }]}>
              <Text style={{ fontSize: fs, color: '#000000', fontFamily: FONTS.body, textAlign: 'right' }}>{displayValue}</Text>
            </View>
            <View style={[BORDER, { width: '20%', padding: 5 }]}>
              <Text style={{ fontSize: fs, color: statusColor, fontFamily: FONTS.bold, textAlign: 'center' }}>
                {statusLabel}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
};
