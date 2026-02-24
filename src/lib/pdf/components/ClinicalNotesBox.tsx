import React from 'react';
import { View, Text } from '@react-pdf/renderer';
import { FONTS } from '../fonts';

interface ClinicalNotesBoxProps {
  notes: string;
  fontSizeMultiplier?: number;
}

export const ClinicalNotesBox: React.FC<ClinicalNotesBoxProps> = ({ notes, fontSizeMultiplier = 1 }) => (
  <View style={{ marginTop: 10, padding: 10, borderWidth: 1.2, borderColor: '#000000', borderRadius: 6 }}>
    <Text style={{ fontFamily: FONTS.bodyBold, fontSize: 12 * fontSizeMultiplier, color: '#000000' }}>
      Clinical Notes:-
    </Text>
    <Text style={{ fontSize: 10 * fontSizeMultiplier, color: '#000000', marginTop: 4, fontFamily: FONTS.body, lineHeight: 1.5 }}>
      {notes}
    </Text>
  </View>
);
