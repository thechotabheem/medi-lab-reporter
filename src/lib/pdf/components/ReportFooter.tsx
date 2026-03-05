import React from 'react';
import { View, Text } from '@react-pdf/renderer';
import { FONTS } from '../fonts';
import { formatDateTime } from '@/lib/date-formats';

interface ReportFooterProps {
  clinicAddress?: string | null;
  accentColorDark?: string;
  signatureTitleLeft?: string;
  signatureTitleRight?: string;
}

export const ReportFooter: React.FC<ReportFooterProps> = ({
  clinicAddress,
}) => {
  const genDate = formatDateTime(new Date());

  return (
    <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }} fixed>
      {/* Page badge + Authorized Signature row */}
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingHorizontal: 24, marginBottom: 8 }}>
        {/* Left: Gray pill-shaped page badge */}
        <View style={{
          backgroundColor: '#808080',
          borderRadius: 12,
          paddingHorizontal: 14,
          paddingVertical: 4,
          alignItems: 'center',
        }}>
          <Text style={{ fontSize: 13, color: '#FFFFFF', fontFamily: FONTS.spaceGrotesk, fontWeight: 700 }}
            render={({ pageNumber, totalPages }) => `Page # ${pageNumber}/${totalPages}`}
          />
        </View>

        {/* Right: Authorized Signature - only on last page */}
        <View style={{ alignItems: 'center', width: 160 }}
          render={({ pageNumber, totalPages }) => pageNumber === totalPages ? (
            <>
              <View style={{ width: 160, borderBottomWidth: 1, borderBottomColor: '#000000', borderBottomStyle: 'solid', marginBottom: 4 }} />
              <Text style={{ fontSize: 13, color: '#000000', fontFamily: FONTS.beVietnam }}>
                Authorized Signature
              </Text>
            </>
          ) : null}
        />
      </View>

      {/* Full-width Dark Azure footer banner */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#084c6e', paddingVertical: 4, paddingHorizontal: 12 }}>
        {clinicAddress && (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', maxWidth: '60%' }}>
            <Text style={{ fontSize: 10, color: '#FFFFFF', fontFamily: FONTS.workSansBold, fontWeight: 700 }}>
              Address:{' '}
            </Text>
            <Text style={{ fontSize: 10, color: '#FFFFFF', fontFamily: FONTS.workSans }}>
              {clinicAddress}
            </Text>
          </View>
        )}
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ fontSize: 10, color: '#FFFFFF', fontFamily: FONTS.garet }}>
            Report Generated On:
          </Text>
          <Text style={{ fontSize: 10, color: '#FFFFFF', fontFamily: FONTS.garet }}>
            {genDate}
          </Text>
        </View>
      </View>
    </View>
  );
};
