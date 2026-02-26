import React from 'react';
import { View, Text } from '@react-pdf/renderer';
import { FONTS } from '../fonts';

interface ClinicalNotesBoxProps {
  notes: string;
  fontSizeMultiplier?: number;
}

export const ClinicalNotesBox: React.FC<ClinicalNotesBoxProps> = ({ notes }) => (
  <View style={{ marginTop: 10, padding: 10, borderWidth: 1.2, borderColor: '#000000', borderRadius: 6 }}>
    <Text style={{ fontFamily: FONTS.sourceSans3Bold, fontWeight: 700, fontSize: 12.5, color: '#000000' }}>
      Clinical Notes:-
    </Text>
    <Text style={{ fontSize: 11, color: '#000000', marginTop: 4, fontFamily: FONTS.sukar, lineHeight: 1.5 }}>
      {notes}
    </Text>
  </View>
);
