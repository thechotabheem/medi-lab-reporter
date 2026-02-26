import { Font } from '@react-pdf/renderer';

// Register Google Fonts
// Garet is not on Google Fonts — using Poppins (geometric sans) as substitute
Font.register({
  family: 'Poppins',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/poppins/v21/pxiEyp8kv8JHgFVrFJA.ttf', fontWeight: 400 },
    { src: 'https://fonts.gstatic.com/s/poppins/v21/pxiByp8kv8JHgFVrLCz7V1s.ttf', fontWeight: 700 },
  ],
});

Font.register({
  family: 'Inter',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/inter/v18/UcCo3FwrK3iLTcviYwY.ttf', fontWeight: 400 },
  ],
});

Font.register({
  family: 'WorkSans',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/worksans/v19/QGYsz_wNahGAdqQ43Rh3H6Ds.ttf', fontWeight: 400 },
    { src: 'https://fonts.gstatic.com/s/worksans/v19/QGYsz_wNahGAdqQ43Rh3x6fs.ttf', fontWeight: 700 },
  ],
});

Font.register({
  family: 'SourceSans3',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/sourcesans3/v15/nwpBtKy2OAdR1K-IwhWudF-R9QMylBJAV3Bo8Ky462EM.ttf', fontWeight: 700 },
  ],
});

Font.register({
  family: 'BeVietnamPro',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/bevietnampro/v11/QdVPSTAyLFyeg_IDWvOJmVES_HRUBI49.ttf', fontWeight: 400 },
  ],
});

// Bruel Grotesk substitute — Space Grotesk (geometric sans)
Font.register({
  family: 'SpaceGrotesk',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/spacegrotesk/v16/V8mDoQDjQSkFtoMM3T6r8E7mPbF4Cw.ttf', fontWeight: 700 },
  ],
});

// Sukar substitute — Amiri (Arabic-compatible)
Font.register({
  family: 'Amiri',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/amiri/v27/J7aRnpd8CGxBHpUrtLMA7w.ttf', fontWeight: 400 },
  ],
});

export const FONTS = {
  // Legacy aliases (keep for backward compat)
  heading: 'Poppins',
  body: 'Helvetica',
  bodyBold: 'Helvetica-Bold',
  italic: 'Helvetica-Oblique',
  mono: 'Helvetica',

  // New specific fonts
  garet: 'Poppins',
  garetBold: 'Poppins',
  inter: 'Inter',
  workSans: 'WorkSans',
  workSansBold: 'WorkSans',
  sourceSans3Bold: 'SourceSans3',
  beVietnam: 'BeVietnamPro',
  spaceGrotesk: 'SpaceGrotesk',
  sukar: 'Amiri',
} as const;
