import { Font } from '@react-pdf/renderer';

// Use Helvetica (built-in, closest to Arial) as the standard font
// No need to register - Helvetica is a built-in PDF font

export const FONTS = {
  heading: 'Helvetica-Bold',
  body: 'Helvetica',
  bodyBold: 'Helvetica-Bold',
  italic: 'Helvetica-Oblique',
  mono: 'Helvetica',
} as const;
