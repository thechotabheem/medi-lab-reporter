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
        <View style={{
          flexDirection: 'row',
          backgroundColor: '#084c6e',
          height: 126,
          alignItems: 'center',
          paddingHorizontal: 16,
        }}>
          {/* Left: Logo */}
          {logoBase64 && (
            <View style={{ width: '55%', justifyContent: 'center', paddingLeft: 8 }}>
              <Image src={logoBase64} style={{ height: 110, objectFit: 'contain', objectPosition: 'left' }} />
            </View>
          )}
          {/* Right: Doctor info */}
          <View style={{ width: logoBase64 ? '45%' : '100%', justifyContent: 'center', alignItems: 'flex-end', paddingRight: 16 }}>
            {doctorName && (
              <Text style={{ fontSize: 16, color: '#FFFFFF', fontFamily: FONTS.garetBold, fontWeight: 700, marginBottom: 8 }}>
                {doctorName}
              </Text>
            )}
            {clinicPhone && (
              <Text style={{ fontSize: 14, color: '#FFFFFF', fontFamily: FONTS.inter, marginBottom: 4 }}>
                Contact: {clinicPhone}
              </Text>
            )}
            {clinicEmail && (
              <Text style={{ fontSize: 14, color: '#FFFFFF', fontFamily: FONTS.inter }}>
                {clinicEmail}
              </Text>
            )}
          </View>
        </View>
      </View>
    );
  }

  // Continuation header
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingBottom: 6, marginBottom: 6, borderBottomWidth: 1, borderBottomColor: '#084c6e' }}>
      {showLogoOnAllPages && logoBase64 && (
        <Image src={logoBase64} style={{ width: 25, height: 25, marginRight: 8, objectFit: 'contain' }} />
      )}
      <Text style={{ fontSize: 11 * fontSizeMultiplier, color: '#084c6e', fontFamily: FONTS.garetBold, fontWeight: 700, flex: 1 }}>
        {clinicName || 'Medical Laboratory'}
      </Text>
      {reportNumber && (
        <Text style={{ fontSize: 8 * fontSizeMultiplier, color: '#787878', fontFamily: FONTS.workSans }}>Report #: {reportNumber}</Text>
      )}
    </View>
  );
};
