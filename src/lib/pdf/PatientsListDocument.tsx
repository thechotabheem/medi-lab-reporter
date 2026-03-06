import React from 'react';
import { Document, Page, View, Text } from '@react-pdf/renderer';
import './fonts';
import { FONTS } from './fonts';
import { tw } from './tw-config';
import type { Patient } from '@/types/database';
import { format } from 'date-fns';

interface PatientsListDocumentProps {
  patients: Patient[];
  clinicName: string;
  generatedAt: string;
}

const calculateAge = (dob: string): string => {
  const birth = new Date(dob);
  const now = new Date();
  const years = now.getFullYear() - birth.getFullYear();
  return `${years}y`;
};

export const PatientsListDocument: React.FC<PatientsListDocumentProps> = ({
  patients,
  clinicName,
  generatedAt,
}) => {
  const columns = [
    { key: 'sno', label: '#', width: '5%' },
    { key: 'id', label: 'Patient ID', width: '14%' },
    { key: 'name', label: 'Full Name', width: '22%' },
    { key: 'gender', label: 'Gender', width: '10%' },
    { key: 'age', label: 'Age', width: '8%' },
    { key: 'dob', label: 'Date of Birth', width: '14%' },
    { key: 'phone', label: 'Phone', width: '14%' },
    { key: 'address', label: 'Address', width: '13%' },
  ];

  return (
    <Document>
      <Page
        size="A4"
        orientation="landscape"
        style={{
          fontFamily: FONTS.body,
          fontSize: 8,
          paddingTop: 40,
          paddingBottom: 60,
          paddingHorizontal: 30,
        }}
      >
        {/* Header */}
        <View style={tw('mb-4')} fixed>
          <Text style={{ fontFamily: FONTS.heading, fontSize: 16, fontWeight: 700, color: '#084c6e' }}>
            Patient Records
          </Text>
          <Text style={{ fontSize: 9, color: '#787878', marginTop: 2 }}>
            {clinicName} — Generated on {generatedAt}
          </Text>
          <View style={{ height: 1, backgroundColor: '#084c6e', marginTop: 6 }} />
        </View>

        {/* Table Header */}
        <View style={{ flexDirection: 'row', backgroundColor: '#084c6e', paddingVertical: 5, paddingHorizontal: 4 }} fixed>
          {columns.map((col) => (
            <Text
              key={col.key}
              style={{
                width: col.width,
                color: '#ffffff',
                fontSize: 7.5,
                fontFamily: FONTS.heading,
                fontWeight: 600,
                textAlign: col.key === 'sno' ? 'center' : 'left',
              }}
            >
              {col.label}
            </Text>
          ))}
        </View>

        {/* Table Rows */}
        {patients.map((patient, idx) => (
          <View
            key={patient.id}
            style={{
              flexDirection: 'row',
              paddingVertical: 4,
              paddingHorizontal: 4,
              backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc',
              borderBottomWidth: 0.5,
              borderBottomColor: '#e6e6e6',
            }}
            wrap={false}
          >
            <Text style={{ width: '5%', textAlign: 'center', color: '#787878' }}>{idx + 1}</Text>
            <Text style={{ width: '14%', fontFamily: FONTS.heading, fontWeight: 600, fontSize: 7.5 }}>
              {patient.patient_id_number || '—'}
            </Text>
            <Text style={{ width: '22%' }}>{patient.full_name}</Text>
            <Text style={{ width: '10%', textTransform: 'capitalize' }}>{patient.gender}</Text>
            <Text style={{ width: '8%' }}>{calculateAge(patient.date_of_birth)}</Text>
            <Text style={{ width: '14%' }}>
              {format(new Date(patient.date_of_birth), 'dd MMM yyyy')}
            </Text>
            <Text style={{ width: '14%' }}>{patient.phone || '—'}</Text>
            <Text style={{ width: '13%', fontSize: 7 }}>{patient.address || '—'}</Text>
          </View>
        ))}

        {/* Footer with page numbers */}
        <View
          style={{
            position: 'absolute',
            bottom: 20,
            left: 30,
            right: 30,
            flexDirection: 'row',
            justifyContent: 'space-between',
            borderTopWidth: 0.5,
            borderTopColor: '#d2d2d2',
            paddingTop: 6,
          }}
          fixed
        >
          <Text style={{ fontSize: 7, color: '#787878' }}>
            Total Patients: {patients.length}
          </Text>
          <Text
            style={{ fontSize: 7, color: '#787878' }}
            render={({ pageNumber, totalPages }) => `Page ${pageNumber} / ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  );
};
