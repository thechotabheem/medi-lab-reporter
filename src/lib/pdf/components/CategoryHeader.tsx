import React from 'react';
import { View, Text } from '@react-pdf/renderer';
import { FONTS } from '../fonts';

interface CategoryHeaderProps {
  name: string;
  fontSizeMultiplier?: number;
  accentColorDark?: string;
}

export const CategoryHeader: React.FC<CategoryHeaderProps> = ({
  name,
  fontSizeMultiplier = 1,
}) => (
  <View style={{ marginTop: 14, marginBottom: 8, paddingHorizontal: 0 }}>
    <View style={{ height: 1.25, backgroundColor: '#000000', marginBottom: 6 }} />
    <Text style={{ textAlign: 'center', fontFamily: FONTS.garetBold, fontWeight: 700, fontSize: 16 * fontSizeMultiplier, color: '#000000' }}>
      {name}
    </Text>
    <View style={{ height: 1.25, backgroundColor: '#000000', marginTop: 6 }} />
  </View>
);
