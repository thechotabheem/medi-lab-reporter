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
  fontSizeMultiplier = 1,
}) => {
  if (isFirstPage) {
    return (
      <View>
        {/* Deep navy blue header banner - top ~18% of page */}
        <View style={{
          flexDirection: 'row',
          backgroundColor: '#003366',
          height: 130,
          borderRadius: 0,
          alignItems: 'center',
          paddingHorizontal: 16,
        }}>
          {/* Left: Logo */}
          {logoBase64 && (
            <View style={{ width: '55%', justifyContent: 'center' }}>
              <Image src={logoBase64} style={{ height: 110, objectFit: 'contain', objectPosition: 'left' }} />
            </View>
          )}
          {/* Right: Doctor info in white */}
          <View style={{ width: logoBase64 ? '45%' : '100%', justifyContent: 'center', alignItems: 'flex-end', paddingRight: 4 }}>
            {doctorName && (
              <Text style={{ fontSize: 14 * fontSizeMultiplier, color: '#FFFFFF', fontFamily: FONTS.bodyBold, marginBottom: 6 }}>
                {doctorName}
              </Text>
            )}
            {clinicPhone && (
              <Text style={{ fontSize: 12 * fontSizeMultiplier, color: '#FFFFFF', fontFamily: FONTS.body, marginBottom: 3 }}>
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

  // Continuation header for subsequent pages
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingBottom: 6, marginBottom: 6, borderBottomWidth: 1, borderBottomColor: '#003366' }}>
      {showLogoOnAllPages && logoBase64 && (
        <Image src={logoBase64} style={{ width: 25, height: 25, marginRight: 8, objectFit: 'contain' }} />
      )}
      <Text style={{ fontSize: 11 * fontSizeMultiplier, color: '#003366', fontFamily: FONTS.bodyBold, flex: 1 }}>
        {clinicName || 'Medical Laboratory'}
      </Text>
      {reportNumber && (
        <Text style={{ fontSize: 8 * fontSizeMultiplier, color: '#787878', fontFamily: FONTS.body }}>Report #: {reportNumber}</Text>
      )}
    </View>
  );
};
