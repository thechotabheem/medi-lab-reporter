import { Font } from '@react-pdf/renderer';

// Register Google Fonts with correct TTF URLs
// Garet substitute — Poppins (geometric sans)
Font.register({
  family: 'Poppins',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/poppins/v21/pxiEyp8kv8JHgFVrFJA.ttf', fontWeight: 400 },
    { src: 'https://fonts.gstatic.com/s/poppins/v21/pxiByp8kv8JHgFVrLEj6V1s.ttf', fontWeight: 600 },
    { src: 'https://fonts.gstatic.com/s/poppins/v21/pxiByp8kv8JHgFVrLCz7V1s.ttf', fontWeight: 700 },
  ],
});

Font.register({
  family: 'Inter',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfAZ9hjQ.ttf', fontWeight: 400 },
  ],
});

Font.register({
  family: 'WorkSans',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/worksans/v24/QGY_z_wNahGAdqQ43RhVcIgYT2Xz5u32K0nXBi8Jow.ttf', fontWeight: 400 },
    { src: 'https://fonts.gstatic.com/s/worksans/v24/QGY_z_wNahGAdqQ43RhVcIgYT2Xz5u32K3fRBi8Jow.ttf', fontWeight: 600 },
    { src: 'https://fonts.gstatic.com/s/worksans/v24/QGY_z_wNahGAdqQ43RhVcIgYT2Xz5u32K67QBi8Jow.ttf', fontWeight: 700 },
  ],
});

Font.register({
  family: 'SourceSans3',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/sourcesans3/v19/nwpBtKy2OAdR1K-IwhWudF-R9QMylBJAV3Bo8Kxf7GEK9C4.ttf', fontWeight: 700 },
  ],
});

Font.register({
  family: 'BeVietnamPro',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/bevietnampro/v12/QdVPSTAyLFyeg_IDWvOJmVES_Hw3BX8.ttf', fontWeight: 400 },
  ],
});

// Bruel Grotesk substitute — Space Grotesk (geometric sans)
Font.register({
  family: 'SpaceGrotesk',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/spacegrotesk/v22/V8mQoQDjQSkFtoMM3T6r8E7mF71Q-gOoraIAEj4PVnskPMU.ttf', fontWeight: 700 },
  ],
});

// Sukar substitute — Amiri (Arabic-compatible)
Font.register({
  family: 'Amiri',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/amiri/v30/J7aRnpd8CGxBHpUutLY.ttf', fontWeight: 400 },
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
