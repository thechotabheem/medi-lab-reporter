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
      {/* Centered page badge */}
      <View style={{ alignItems: 'center', marginBottom: 6 }}>
        <View style={{ backgroundColor: '#808080', paddingHorizontal: 12, paddingVertical: 3, borderRadius: 3 }}>
          <Text style={{ fontSize: 10, color: '#FFFFFF', fontFamily: FONTS.body }}>
            Page # {pageNumber}/{totalPages}
          </Text>
        </View>
      </View>

      {/* Signature line (last page only) */}
      {isLastPage && (
        <View style={{ alignItems: 'flex-end', paddingHorizontal: 72, marginBottom: 8 }}>
          <View style={{ width: 160, borderBottomWidth: 0.5, borderBottomColor: '#000000', marginBottom: 3 }} />
          <Text style={{ fontSize: 10, color: '#000000', fontFamily: FONTS.body }}>Authorized Signature</Text>
        </View>
      )}

      {/* Address + Generated On row */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 4 }}>
        {clinicAddress && (
          <Text style={{ fontSize: 10, color: '#000000', fontFamily: FONTS.italic }}>
            {clinicAddress}
          </Text>
        )}
        <Text style={{ fontSize: 10, color: '#000000', fontFamily: FONTS.body }}>
          Report Generated On: {genDate}
        </Text>
      </View>

      {/* Bottom banner mirroring header */}
      <View style={{ backgroundColor: '#003366', height: 20 }} />
    </View>
  );
};
