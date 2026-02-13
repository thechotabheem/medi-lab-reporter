import React from 'react';
import { View, Text } from '@react-pdf/renderer';
import { tw } from '../tw-config';
import { FONTS } from '../fonts';

interface CategoryHeaderProps {
  name: string;
  fontSizeMultiplier?: number;
  accentColorDark?: string;
}

export const CategoryHeader: React.FC<CategoryHeaderProps> = ({
  name,
  fontSizeMultiplier = 1,
  accentColorDark = '#006450',
}) => (
  <View style={tw('mt-2 mb-0')}>
    <Text style={[tw('text-center font-bold'), { fontSize: 18 * fontSizeMultiplier, color: '#282828', fontFamily: FONTS.heading }]}>
      {name}
    </Text>
    <View style={{ height: 1.5, backgroundColor: accentColorDark, marginTop: 2 }} />
  </View>
);
