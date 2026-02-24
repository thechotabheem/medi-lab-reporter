import React from 'react';
import { View, Text } from '@react-pdf/renderer';
import { FONTS } from '../fonts';

interface ClinicalNotesBoxProps {
  notes: string;
  fontSizeMultiplier?: number;
}

export const ClinicalNotesBox: React.FC<ClinicalNotesBoxProps> = ({ notes, fontSizeMultiplier = 1 }) => (
  <View style={{ marginTop: 12, padding: 10, borderWidth: 1, borderColor: '#D3D3D3' }}>
    <Text style={{ fontSize: 12 * fontSizeMultiplier, color: '#000000', fontFamily: FONTS.bold, marginBottom: 4 }}>
      Clinical Notes:-
    </Text>
    <Text style={{ fontSize: 10 * fontSizeMultiplier, color: '#000000', fontFamily: FONTS.body, lineHeight: 1.5 }}>
      {notes}
    </Text>
  </View>
);
