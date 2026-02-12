import React from 'react';
import { View, Text } from '@react-pdf/renderer';
import { tw } from '../tw-config';

interface ClinicalNotesBoxProps {
  notes: string;
  fontSizeMultiplier?: number;
}

export const ClinicalNotesBox: React.FC<ClinicalNotesBoxProps> = ({ notes, fontSizeMultiplier = 1 }) => (
  <View style={[tw('mt-3 p-2'), { borderWidth: 0.5, borderColor: '#d2d2d2', borderRadius: 2 }]}>
    <Text style={[tw('font-bold'), { fontSize: 10 * fontSizeMultiplier, color: '#282828' }]}>
      Clinical Notes:-
    </Text>
    <Text style={{ fontSize: 9 * fontSizeMultiplier, color: '#282828', marginTop: 3 }}>
      {notes}
    </Text>
  </View>
);
