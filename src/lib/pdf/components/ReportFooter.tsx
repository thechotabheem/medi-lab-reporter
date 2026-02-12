import React from 'react';
import { View, Text } from '@react-pdf/renderer';
import { tw } from '../tw-config';
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
  accentColorDark = '#006450',
  isLastPage = false,
}) => {
  const genDate = format(new Date(), 'd/MM/yy hh:mm:ss a');

  return (
    <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }} fixed>
      {/* Authorized Signature (last page only) */}
      {isLastPage && (
        <View style={[tw('flex-row justify-end'), { paddingRight: 15, marginBottom: 8 }]}>
          <View style={{ alignItems: 'center' }}>
            <View style={{ width: 150, borderBottomWidth: 0.4, borderBottomColor: '#282828', marginBottom: 3 }} />
            <Text style={{ fontSize: 9, color: '#282828' }}>Authorized Signature</Text>
          </View>
        </View>
      )}

      {/* Page badge */}
      <View style={[tw('flex-row items-end'), { paddingHorizontal: 15, marginBottom: 2 }]}>
        <View style={[tw('rounded-sm px-2 py-1'), { backgroundColor: accentColorDark }]}>
          <Text style={[tw('text-white font-bold'), { fontSize: 8 }]}>
            Page # {pageNumber}/{totalPages}
          </Text>
        </View>
      </View>

      {/* Full-width accent footer bar */}
      <View style={[tw('flex-row items-center px-4'), { backgroundColor: accentColorDark, height: 25 }]}>
        {clinicAddress && (
          <Text style={[tw('text-white font-bold flex-1'), { fontSize: 7 }]}>
            Address: {clinicAddress}
          </Text>
        )}
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={[tw('text-white'), { fontSize: 7 }]}>Report Generated On:</Text>
          <Text style={[tw('text-white'), { fontSize: 7 }]}>{genDate}</Text>
        </View>
      </View>
    </View>
  );
};
