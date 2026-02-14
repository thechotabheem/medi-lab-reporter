import React from 'react';
import { View, Text } from '@react-pdf/renderer';
import { tw } from '../tw-config';
import { FONTS } from '../fonts';
import { calculateAge } from '../utils';
import { format } from 'date-fns';
import type { Report, Patient } from '@/types/database';

interface PatientInfoBoxProps {
  patient: Patient;
  report: Report;
  showPatientId?: boolean;
  fontSizeMultiplier?: number;
}

const InfoPair = ({ label, value, fontSize }: { label: string; value: string; fontSize: number }) => (
  <View style={tw('flex-row mb-1')}>
    <Text style={[tw('font-bold'), { fontSize, color: '#282828', fontFamily: FONTS.body }]}>{label}: </Text>
    <Text style={{ fontSize, color: '#282828', fontFamily: FONTS.body }}>{value}</Text>
  </View>
);

export const PatientInfoBox: React.FC<PatientInfoBoxProps> = ({
  patient,
  report,
  showPatientId = true,
  fontSizeMultiplier = 1,
}) => {
  const fs = 14 * fontSizeMultiplier;

  return (
    <View style={[tw('flex-row mt-3'), { borderWidth: 1, borderColor: '#d2d2d2', borderRadius: 3, padding: 12 }]}>
      {/* Left column */}
      <View style={{ width: '50%', paddingRight: 10, borderRightWidth: 0.5, borderRightColor: '#d2d2d2' }}>
        <InfoPair label="Name" value={patient.full_name} fontSize={fs} />
        <InfoPair
          label="Age / Gender"
          value={`${calculateAge(patient.date_of_birth)} / ${patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1)}`}
          fontSize={fs}
        />
        <InfoPair label="Referred By" value={report.referring_doctor || '—'} fontSize={fs} />
        {showPatientId && (
          <InfoPair label="Patient ID" value={patient.patient_id_number || '—'} fontSize={fs} />
        )}
      </View>

      {/* Right column */}
      <View style={{ width: '50%', paddingLeft: 10 }}>
        <InfoPair label="Report No" value={report.report_number} fontSize={fs} />
        <InfoPair label="Collected On" value={format(new Date(report.test_date), 'd/MM/yy')} fontSize={fs} />
        <InfoPair label="Reported On" value={format(new Date(report.created_at), 'd/MM/yy')} fontSize={fs} />
      </View>
    </View>
  );
};
