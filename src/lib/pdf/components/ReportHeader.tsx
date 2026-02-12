import React from 'react';
import { View, Text, Image } from '@react-pdf/renderer';
import { tw } from '../tw-config';

interface ReportHeaderProps {
  logoBase64: string | null;
  clinicPhone?: string | null;
  clinicEmail?: string | null;
  clinicName?: string;
  doctorName?: string | null;
  isFirstPage: boolean;
  showLogoOnAllPages?: boolean;
  reportNumber?: string;
  accentColorDark?: string;
  fontSizeMultiplier?: number;
}

export const ReportHeader: React.FC<ReportHeaderProps> = ({
  logoBase64,
  clinicPhone,
  clinicEmail,
  clinicName,
  doctorName,
  isFirstPage,
  showLogoOnAllPages = true,
  reportNumber,
  accentColorDark = '#006450',
  fontSizeMultiplier = 1,
}) => {
  if (isFirstPage) {
    return (
      <View>
        {/* Dark azure header bar */}
        <View style={[tw('flex-row'), { backgroundColor: '#003366', height: 90, borderRadius: 4, padding: 5 }]}>
          {/* Logo - 60% width */}
          {logoBase64 && (
            <View style={{ width: '60%', justifyContent: 'center' }}>
              <Image src={logoBase64} style={{ height: 85, objectFit: 'contain', objectPosition: 'left' }} />
            </View>
          )}
          {/* Clinic info - 40% */}
          <View style={{ width: logoBase64 ? '40%' : '100%', justifyContent: 'center', alignItems: 'flex-end', paddingRight: 10 }}>
            {doctorName && (
              <Text style={[tw('text-white font-bold'), { fontSize: 14 * fontSizeMultiplier, marginBottom: 2 }]}>
                {doctorName}
              </Text>
            )}
            {clinicPhone && (
              <Text style={[tw('text-white'), { fontSize: 10 * fontSizeMultiplier }]}>
                Contact: {clinicPhone}
              </Text>
            )}
            {clinicEmail && (
              <Text style={[tw('text-white'), { fontSize: 10 * fontSizeMultiplier, marginTop: 3 }]}>
                {clinicEmail}
              </Text>
            )}
          </View>
        </View>

        {/* Accent divider line */}
        <View style={{ height: 2, backgroundColor: accentColorDark }} />
      </View>
    );
  }

  // Compact continuation header for subsequent pages
  return (
    <View style={[tw('flex-row items-center pb-2 mb-2'), { borderBottomWidth: 1, borderBottomColor: accentColorDark }]}>
      {showLogoOnAllPages && logoBase64 && (
        <Image src={logoBase64} style={{ width: 25, height: 25, marginRight: 8, objectFit: 'contain' }} />
      )}
      <Text style={[tw('font-bold flex-1'), { fontSize: 11 * fontSizeMultiplier, color: accentColorDark }]}>
        {clinicName || 'Medical Laboratory'}
      </Text>
      {reportNumber && (
        <Text style={{ fontSize: 8 * fontSizeMultiplier, color: '#787878' }}>Report #: {reportNumber}</Text>
      )}
    </View>
  );
};
