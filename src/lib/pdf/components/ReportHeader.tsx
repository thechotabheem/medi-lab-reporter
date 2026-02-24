import React from 'react';
import { View, Text, Image } from '@react-pdf/renderer';
import { FONTS } from '../fonts';

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
  accentColorDark = '#003366',
  fontSizeMultiplier = 1,
}) => {
  if (isFirstPage) {
    return (
      <View>
        {/* Deep navy header banner */}
        <View style={{
          flexDirection: 'row',
          backgroundColor: '#003366',
          height: 90,
          alignItems: 'center',
          paddingHorizontal: 15,
        }}>
          {/* Left: Logo */}
          {logoBase64 && (
            <View style={{ width: '40%', justifyContent: 'center' }}>
              <Image src={logoBase64} style={{ height: 80, objectFit: 'contain', objectPosition: 'left' }} />
            </View>
          )}
          {/* Center: spacer */}
          <View style={{ flex: 1 }} />
          {/* Right: Doctor info */}
          <View style={{ alignItems: 'flex-end', justifyContent: 'center' }}>
            {doctorName && (
              <Text style={{ fontSize: 12 * fontSizeMultiplier, color: '#FFFFFF', fontFamily: FONTS.body, marginBottom: 3 }}>
                {doctorName}
              </Text>
            )}
            {clinicPhone && (
              <Text style={{ fontSize: 12 * fontSizeMultiplier, color: '#FFFFFF', fontFamily: FONTS.body, marginBottom: 2 }}>
                Contact: {clinicPhone}
              </Text>
            )}
            {clinicEmail && (
              <Text style={{ fontSize: 12 * fontSizeMultiplier, color: '#FFFFFF', fontFamily: FONTS.body }}>
                {clinicEmail}
              </Text>
            )}
          </View>
        </View>
      </View>
    );
  }

  // Compact continuation header for subsequent pages
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingBottom: 6, marginBottom: 6, borderBottomWidth: 1, borderBottomColor: '#003366' }}>
      {showLogoOnAllPages && logoBase64 && (
        <Image src={logoBase64} style={{ width: 25, height: 25, marginRight: 8, objectFit: 'contain' }} />
      )}
      <Text style={{ flex: 1, fontSize: 11 * fontSizeMultiplier, color: '#003366', fontFamily: FONTS.bold }}>
        {clinicName || 'Medical Laboratory'}
      </Text>
      {reportNumber && (
        <Text style={{ fontSize: 8 * fontSizeMultiplier, color: '#787878', fontFamily: FONTS.mono }}>Report #: {reportNumber}</Text>
      )}
    </View>
  );
};
