import { Font } from '@react-pdf/renderer';

// Heading font – elegant serif for category titles, doctor name
Font.register({
  family: 'Playfair Display',
  fonts: [
    { src: 'https://cdn.jsdelivr.net/fontsource/fonts/playfair-display@latest/latin-400-normal.ttf', fontWeight: 400 },
    { src: 'https://cdn.jsdelivr.net/fontsource/fonts/playfair-display@latest/latin-700-normal.ttf', fontWeight: 700 },
  ],
});

// Body font – clean sans-serif for labels, patient info, notes
Font.register({
  family: 'Lato',
  fonts: [
    { src: 'https://cdn.jsdelivr.net/fontsource/fonts/lato@latest/latin-400-normal.ttf', fontWeight: 400 },
    { src: 'https://cdn.jsdelivr.net/fontsource/fonts/lato@latest/latin-700-normal.ttf', fontWeight: 700 },
  ],
});

// Mono font – for result values and report numbers
Font.register({
  family: 'Roboto Mono',
  fonts: [
    { src: 'https://cdn.jsdelivr.net/fontsource/fonts/roboto-mono@latest/latin-400-normal.ttf', fontWeight: 400 },
    { src: 'https://cdn.jsdelivr.net/fontsource/fonts/roboto-mono@latest/latin-700-normal.ttf', fontWeight: 700 },
  ],
});

// Font family constants for easy reference
export const FONTS = {
  heading: 'Playfair Display',
  body: 'Lato',
  mono: 'Roboto Mono',
} as const;
