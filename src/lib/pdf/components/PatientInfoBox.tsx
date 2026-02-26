import React from 'react';
import { View, Text } from '@react-pdf/renderer';
import { FONTS } from '../fonts';
import { calculateAge } from '../utils';
import type { Report, Patient } from '@/types/database';

interface PatientInfoBoxProps {
  patient: Patient;
  report: Report;
  showPatientId?: boolean;
  fontSizeMultiplier?: number;
}

const InfoPair = ({ label, value }: { label: string; value: string }) => (
  <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 5 }}>
    <Text style={{ fontSize: 15, color: '#000000', fontFamily: FONTS.workSans, fontWeight: 400 }}>{label}: </Text>
    <Text style={{ fontSize: 15, color: '#000000', fontFamily: FONTS.workSans }}>{value}</Text>
  </View>
);

export const PatientInfoBox: React.FC<PatientInfoBoxProps> = ({
  patient,
  report,
  showPatientId = true,
}) => {
  const fmt = (d: string) => { const dt = new Date(d); return `${dt.getDate()}/${dt.getMonth()+1}/${String(dt.getFullYear()).slice(-2)}`; };

  return (
    <View style={{
      flexDirection: 'row',
      marginTop: 10,
      borderWidth: 1.5,
      borderColor: '#000000',
      borderRadius: 6,
      padding: 12,
    }}>
      {/* Left column */}
      <View style={{ width: '50%', paddingRight: 10, borderRightWidth: 1, borderRightColor: '#000000', alignItems: 'center' }}>
        <InfoPair label="Name" value={patient.full_name} />
        <InfoPair
          label="Age / Gender"
          value={`${calculateAge(patient.date_of_birth)} / ${patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1)}`}
        />
        <InfoPair label="Referred By" value={report.referring_doctor || '—'} />
        {showPatientId && (
          <InfoPair label="Patient ID" value={patient.patient_id_number || '—'} />
        )}
      </View>

      {/* Right column */}
      <View style={{ width: '50%', paddingLeft: 10, alignItems: 'center' }}>
        <InfoPair label="Report No" value={report.report_number} />
        <InfoPair label="Collected On" value={fmt(report.test_date)} />
        <InfoPair label="Reported On" value={fmt(report.created_at)} />
      </View>
    </View>
  );
};
