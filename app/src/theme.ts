// Design tokens for PostIt. Every screen pulls colors, type and spacing from
// here, so changing the look of the app means editing this one file.
//
// Think of this like the CSS variables at the top of your website's style.css.

// The app's name as shown on screen. To rename the app, change it here and
// "name" in app.json.
export const APP_NAME = 'PostIt';

export const colors = {
  ink: '#000000', // primary text, dividers between posts, the wordmark
  paper: '#FFFFFF', // screen background
  wash: '#F2F3F5', // input fields, chips, subtle panels
  line: '#000000', // the thin black bars between posts (from the business plan)
  hairline: '#D9DBDF', // lighter separators inside a screen
  muted: '#62676E', // secondary text: timestamps, counts, hints
  lane: '#1D4ED8', // accent: things YOU did (encouraged, committed, active tab)
  laneWash: '#E6EDFF',
  setback: '#A15C00', // setback tag: amber, not red, because a setback is not an error
  setbackWash: '#FFF1DC',
  achieved: '#0F7A3D',
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
