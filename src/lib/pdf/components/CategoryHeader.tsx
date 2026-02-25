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
    {/* Top line */}
    <View style={{ height: 2, backgroundColor: '#000000', marginBottom: 6 }} />
    {/* Category name */}
    <Text style={{ textAlign: 'center', fontFamily: FONTS.bodyBold, fontSize: 16 * fontSizeMultiplier, color: '#000000' }}>
      {name}
    </Text>
    {/* Bottom line */}
    <View style={{ height: 2, backgroundColor: '#000000', marginTop: 6 }} />
  </View>
);
