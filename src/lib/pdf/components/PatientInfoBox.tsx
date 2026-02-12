import React from 'react';
import { View, Text } from '@react-pdf/renderer';
import { tw } from '../tw-config';
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
    <Text style={[tw('font-bold'), { fontSize, color: '#282828' }]}>{label}: </Text>
    <Text style={{ fontSize, color: '#282828' }}>{value}</Text>
  </View>
);

export const PatientInfoBox: React.FC<PatientInfoBoxProps> = ({
  patient,
  report,
  showPatientId = true,
  fontSizeMultiplier = 1,
}) => {
  const fs = 11 * fontSizeMultiplier;

  return (
    <View style={[tw('flex-row mt-2'), { borderWidth: 0.5, borderColor: '#d2d2d2', borderRadius: 3, padding: 8 }]}>
      {/* Left column */}
      <View style={{ width: '50%', paddingRight: 8, borderRightWidth: 0.3, borderRightColor: '#d2d2d2' }}>
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
      <View style={{ width: '50%', paddingLeft: 8 }}>
        <InfoPair label="Report No" value={report.report_number} fontSize={fs} />
        <InfoPair label="Collected On" value={format(new Date(report.test_date), 'd/MM/yy')} fontSize={fs} />
        <InfoPair label="Reported On" value={format(new Date(report.created_at), 'd/MM/yy')} fontSize={fs} />
      </View>
    </View>
  );
};
