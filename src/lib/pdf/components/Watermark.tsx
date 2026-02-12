import React from 'react';
import { View, Text, Image } from '@react-pdf/renderer';

interface WatermarkProps {
  text?: string | null;
  logoBase64?: string | null;
  logoWatermarkEnabled?: boolean;
}

export const Watermark: React.FC<WatermarkProps> = ({ text, logoBase64, logoWatermarkEnabled }) => {
  if (!text && !(logoWatermarkEnabled && logoBase64)) return null;

  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' }} fixed>
      {logoWatermarkEnabled && logoBase64 && (
        <Image src={logoBase64} style={{ width: 200, height: 200, opacity: 0.06 }} />
      )}
      {text && (
        <Text
          style={{
            fontSize: 50,
            fontWeight: 'bold',
            color: '#dcdcdc',
            transform: 'rotate(-45deg)',
            position: 'absolute',
          }}
        >
          {text.toUpperCase()}
        </Text>
      )}
    </View>
  );
};
