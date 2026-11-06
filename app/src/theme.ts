// Design tokens for PYN. Every screen pulls colors, type and spacing from
// here, so changing the look of the app means editing this one file.
//
// Think of this like the CSS variables at the top of your website's style.css.

// The app's name as shown on screen. To rename the app, change it here and
// "name" in app.json.
export const APP_NAME = 'PYN';

// Palette: Carolina Blue and UNC Navy, on white. Official values from the
// UNC brand guide.
//   Carolina Blue  #4B9CD3  big surfaces: welcome screen, headers, selected chips
//   Navy           #13294B  text and lines, and filled highlights: main
//                           buttons, the Post button, badges, achievements
//                           (white text on navy)
// Light Carolina Blue is too pale for small text on white, so links and
// "you did this" accents use UNC's darker web-link blue (#007FAE).
export const colors = {
  carolina: '#4B9CD3',
  carolinaWash: '#E7F1F9', // pale blue panels and highlighted rows
  navy: '#13294B',
  // Filled highlights: main buttons, the Post button, badges. White on top.
  accent: '#13294B',
  onAccent: '#FFFFFF',

  ink: '#13294B', // primary text, dividers between posts, the wordmark
  paper: '#FFFFFF', // screen background
  wash: '#F1F5F9', // input fields and subtle panels
  line: '#13294B', // the thin bars between posts (from the business plan)
  hairline: '#D5DEE7', // lighter separators inside a screen
  muted: '#5B6B7F', // secondary text: timestamps, counts, hints
  lane: '#007FAE', // accent text and icons: things YOU did (encouraged, committed)
  laneWash: '#E7F1F9',
  setback: '#B4480B', // burnt orange: distinct from the blues, and not an error red
  setbackWash: '#FDEBDD',
  achieved: '#FFFFFF', // achieved tags are navy with white text
  achievedFill: '#13294B',
  danger: '#B42318', // only for destructive actions like deleting an account
};

// Fonts are loaded in src/app/_layout.tsx. "display" is the condensed face
// used for goal subjects, like the lettering on a jersey or a scoreboard.
export const fonts = {
  display: 'BarlowCondensed_700Bold',
  displayHeavy: 'BarlowCondensed_800ExtraBold',
  displayMedium: 'BarlowCondensed_600SemiBold',
};

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };

export const type = {
  body: { fontSize: 16, lineHeight: 22, color: colors.ink },
  small: { fontSize: 13, lineHeight: 18, color: colors.muted },
  label: { fontSize: 14, lineHeight: 18, fontWeight: '600' as const, color: colors.ink },
};
