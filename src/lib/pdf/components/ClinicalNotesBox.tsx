import React from 'react';
import { View, Text } from '@react-pdf/renderer';
import { tw } from '../tw-config';
import { FONTS } from '../fonts';

interface ClinicalNotesBoxProps {
  notes: string;
  fontSizeMultiplier?: number;
}

export const ClinicalNotesBox: React.FC<ClinicalNotesBoxProps> = ({ notes, fontSizeMultiplier = 1 }) => (
  <View style={[tw('mt-4 p-3'), { borderWidth: 0.5, borderColor: '#d2d2d2', borderRadius: 3 }]}>
    <Text style={[tw('font-bold'), { fontSize: 13 * fontSizeMultiplier, color: '#282828', fontFamily: FONTS.heading }]}>
      Clinical Notes:-
    </Text>
    <Text style={{ fontSize: 11 * fontSizeMultiplier, color: '#282828', marginTop: 4, fontFamily: FONTS.body, lineHeight: 1.4 }}>
      {notes}
    </Text>
  </View>
);
