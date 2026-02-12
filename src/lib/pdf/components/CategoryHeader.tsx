import React from 'react';
import { View, Text } from '@react-pdf/renderer';
import { tw } from '../tw-config';

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
  <View style={tw('mt-3 mb-1')}>
    <Text style={[tw('text-center font-bold'), { fontSize: 16 * fontSizeMultiplier, color: '#282828' }]}>
      {name}
    </Text>
    <View style={{ height: 1, backgroundColor: accentColorDark, marginTop: 3 }} />
  </View>
);
