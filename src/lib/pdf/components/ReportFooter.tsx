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
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 8 }}>
        {/* Left: Gray pill-shaped page badge */}
        <View style={{
          backgroundColor: '#808080',
          borderRadius: 12,
          paddingHorizontal: 14,
          paddingVertical: 4,
          alignItems: 'center',
        }}>
          <Text style={{ fontSize: 10, color: '#FFFFFF', fontFamily: FONTS.bodyBold }}>
            Page # {pageNumber}/{totalPages}
          </Text>
        </View>

        {/* Right: Authorized Signature */}
        {isLastPage && (
          <View style={{ alignItems: 'center' }}>
            <View style={{ width: 160, borderBottomWidth: 1, borderBottomColor: '#000000', marginBottom: 3 }} />
            <Text style={{ fontSize: 10, color: '#000000', fontFamily: FONTS.body }}>Authorized Signature</Text>
          </View>
        )}
      </View>

      {/* Full-width deep navy blue footer banner */}
      <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#003366', height: 32, paddingHorizontal: 16 }}>
        {clinicAddress && (
          <Text style={{ flex: 1, fontSize: 10, color: '#FFFFFF', fontFamily: FONTS.italic }}>
            Address: {clinicAddress}
          </Text>
        )}
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ fontSize: 10, color: '#FFFFFF', fontFamily: FONTS.body }}>
            Report Generated On: {genDate}
          </Text>
        </View>
      </View>
    </View>
  );
};
