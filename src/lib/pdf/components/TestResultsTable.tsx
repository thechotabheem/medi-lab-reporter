import React from 'react';
import { View, Text } from '@react-pdf/renderer';
import { tw } from '../tw-config';
import type { TestField, Gender } from '@/types/database';
import { getDetailedValueStatus, formatNormalRange, getStatusColor } from '../utils';

interface TestResultsTableProps {
  fields: TestField[];
  reportData: Record<string, unknown>;
  gender: Gender;
  fontSizeMultiplier?: number;
  accentColorDark?: string;
}

const BORDER = { borderWidth: 0.3, borderColor: '#e6e6e6' };

export const TestResultsTable: React.FC<TestResultsTableProps> = ({
  fields,
  reportData,
  gender,
  fontSizeMultiplier = 1,
  accentColorDark = '#006450',
}) => {
  const fs = 10 * fontSizeMultiplier;
  const headerFs = 10 * fontSizeMultiplier;

  const filledFields = fields.filter(
    (f) => reportData[f.name] !== undefined && reportData[f.name] !== null && reportData[f.name] !== ''
  );

  if (filledFields.length === 0) return null;

  return (
    <View style={tw('mt-1')}>
      {/* Header row */}
      <View style={[tw('flex-row'), { backgroundColor: accentColorDark }]}>
        <View style={[BORDER, { width: '28%', padding: 3 }]}>
          <Text style={[tw('text-center font-bold text-white'), { fontSize: headerFs }]}>Test Name</Text>
        </View>
        <View style={[BORDER, { width: '22%', padding: 3 }]}>
          <Text style={[tw('text-center font-bold text-white'), { fontSize: headerFs }]}>Reference Range</Text>
        </View>
        <View style={[BORDER, { width: '14%', padding: 3 }]}>
          <Text style={[tw('text-center font-bold text-white'), { fontSize: headerFs }]}>Unit</Text>
        </View>
        <View style={[BORDER, { width: '16%', padding: 3 }]}>
          <Text style={[tw('text-center font-bold text-white'), { fontSize: headerFs }]}>Result</Text>
        </View>
        <View style={[BORDER, { width: '20%', padding: 3 }]}>
          <Text style={[tw('text-center font-bold text-white'), { fontSize: headerFs }]}>Status</Text>
        </View>
      </View>

      {/* Data rows */}
      {filledFields.map((field, idx) => {
        const value = reportData[field.name];
        const displayValue = String(value);
        const normalRange = formatNormalRange(field, gender);
        const status = getDetailedValueStatus(value as number, field, gender);
        const statusColor = getStatusColor(status);

        return (
          <View key={field.name} style={[tw('flex-row'), idx % 2 === 1 ? { backgroundColor: '#fcfcfd' } : {}]}>
            <View style={[BORDER, { width: '28%', padding: 2.5 }]}>
              <Text style={[tw('text-center'), { fontSize: fs, color: '#282828' }]}>{field.label}</Text>
            </View>
            <View style={[BORDER, { width: '22%', padding: 2.5 }]}>
              <Text style={[tw('text-center'), { fontSize: fs, color: '#282828' }]}>{normalRange}</Text>
            </View>
            <View style={[BORDER, { width: '14%', padding: 2.5 }]}>
              <Text style={[tw('text-center'), { fontSize: fs, color: '#282828' }]}>{field.unit || '—'}</Text>
            </View>
            <View style={[BORDER, { width: '16%', padding: 2.5 }]}>
              <Text style={[tw('text-center'), { fontSize: fs, color: '#282828' }]}>{displayValue}</Text>
            </View>
            <View style={[BORDER, { width: '20%', padding: 2.5 }]}>
              <Text style={[tw('text-center font-bold'), { fontSize: fs, color: statusColor }]}>
                {status === 'unknown' ? '—' : status}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
};
