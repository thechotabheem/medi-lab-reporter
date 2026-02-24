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

const BORDER = { borderWidth: 1.2, borderColor: '#000000' };

export const TestResultsTable: React.FC<TestResultsTableProps> = ({
  fields,
  reportData,
  gender,
  fontSizeMultiplier = 1,
}) => {
  const headerFs = 12 * fontSizeMultiplier;
  const dataFs = 10 * fontSizeMultiplier;

  const filledFields = fields.filter(
    (f) => reportData[f.name] !== undefined && reportData[f.name] !== null && reportData[f.name] !== ''
  );

  if (filledFields.length === 0) return null;

  const headerCellStyle = (width: string) => [
    BORDER,
    { width, padding: 6, backgroundColor: '#FFFFFF' },
  ];

  const dataCellStyle = (width: string) => [
    BORDER,
    { width, padding: 5 },
  ];

  return (
    <View>
      {/* Header row */}
      <View style={{ flexDirection: 'row' }}>
        <View style={headerCellStyle('25%')}>
          <Text style={{ textAlign: 'center', fontFamily: FONTS.bodyBold, fontSize: headerFs, color: '#000000' }}>Test Name</Text>
        </View>
        <View style={headerCellStyle('25%')}>
          <Text style={{ textAlign: 'center', fontFamily: FONTS.bodyBold, fontSize: headerFs, color: '#000000' }}>Reference Range</Text>
        </View>
        <View style={headerCellStyle('15%')}>
          <Text style={{ textAlign: 'center', fontFamily: FONTS.bodyBold, fontSize: headerFs, color: '#000000' }}>Unit</Text>
        </View>
        <View style={headerCellStyle('15%')}>
          <Text style={{ textAlign: 'center', fontFamily: FONTS.bodyBold, fontSize: headerFs, color: '#000000' }}>Result</Text>
        </View>
        <View style={headerCellStyle('20%')}>
          <Text style={{ textAlign: 'center', fontFamily: FONTS.bodyBold, fontSize: headerFs, color: '#000000' }}>Status</Text>
        </View>
      </View>

      {/* Data rows - no zebra striping */}
      {filledFields.map((field) => {
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
            <View style={dataCellStyle('25%')}>
              <Text style={{ textAlign: 'center', fontSize: dataFs, color: '#000000', fontFamily: FONTS.body }}>{field.label}</Text>
            </View>
            <View style={dataCellStyle('25%')}>
              <Text style={{ textAlign: 'center', fontSize: dataFs, color: '#000000', fontFamily: FONTS.body }}>{normalRange}</Text>
            </View>
            <View style={dataCellStyle('15%')}>
              <Text style={{ textAlign: 'center', fontSize: dataFs, color: '#000000', fontFamily: FONTS.body }}>{field.unit || '—'}</Text>
            </View>
            <View style={dataCellStyle('15%')}>
              <Text style={{ textAlign: 'center', fontSize: dataFs, color: '#000000', fontFamily: FONTS.body }}>{displayValue}</Text>
            </View>
            <View style={dataCellStyle('20%')}>
              <Text style={{ textAlign: 'center', fontFamily: FONTS.bodyBold, fontSize: dataFs, color: statusColor }}>
                {statusLabel}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
};
