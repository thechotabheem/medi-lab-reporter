import React from 'react';
import { View, Text } from '@react-pdf/renderer';
import { FONTS } from '../fonts';
import { format } from 'date-fns';

interface ReportFooterProps {
  pageNumber: number;
  totalPages: number;
  clinicAddress?: string | null;
  accentColorDark?: string;
  signatureTitleLeft?: string;
  signatureTitleRight?: string;
  isLastPage?: boolean;
}

export const ReportFooter: React.FC<ReportFooterProps> = ({
  pageNumber,
  totalPages,
  clinicAddress,
  isLastPage = false,
}) => {
  const genDate = format(new Date(), 'd/MM/yy hh:mm:ss a');

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
          <Text style={{ fontSize: 13, color: '#FFFFFF', fontFamily: FONTS.spaceGrotesk, fontWeight: 700 }}>
            Page # {pageNumber}/{totalPages}
          </Text>
        </View>

        {/* Right: Authorized Signature */}
        {isLastPage && (
          <View style={{ alignItems: 'center' }}>
            <View style={{ width: 160, borderBottomWidth: 2, borderBottomColor: '#000000', marginBottom: 3 }} />
            <Text style={{ fontSize: 13, color: '#000000', fontFamily: FONTS.beVietnam }}>Authorized Signature</Text>
          </View>
        )}
      </View>

      {/* Full-width Dark Azure footer banner */}
      <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#084c6e', height: 44, paddingHorizontal: 16 }}>
        {clinicAddress && (
          <View style={{ width: '55%', flexDirection: 'row', flexWrap: 'wrap' }}>
            <Text style={{ fontSize: 12, color: '#FFFFFF', fontFamily: FONTS.workSansBold, fontWeight: 700 }}>
              Address:{' '}
            </Text>
            <Text style={{ fontSize: 12, color: '#FFFFFF', fontFamily: FONTS.workSans }}>
              {clinicAddress}
            </Text>
          </View>
        )}
        <View style={{ width: '35%', marginLeft: 'auto', alignItems: 'flex-end' }}>
          <Text style={{ fontSize: 12, color: '#FFFFFF', fontFamily: FONTS.garet }}>
            Report Generated On:
          </Text>
          <Text style={{ fontSize: 12, color: '#FFFFFF', fontFamily: FONTS.garet }}>
            {genDate}
          </Text>
        </View>
      </View>
    </View>
  );
};
