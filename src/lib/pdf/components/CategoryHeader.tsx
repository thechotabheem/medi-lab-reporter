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
  <View style={{ marginTop: 14, marginBottom: 8 }}>
    <Text style={{ textAlign: 'center', fontSize: 16 * fontSizeMultiplier, color: '#000000', fontFamily: FONTS.bold }}>
      {name}
    </Text>
  </View>
);
