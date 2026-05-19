/**
 * PDF Font Configuration
 * Register Kanit font for @react-pdf/renderer
 */
import { Font } from "@react-pdf/renderer";

Font.register({
  family: "Kanit",
  fonts: [
    { src: "/fonts/Kanit/Kanit-Light.ttf", fontWeight: 300 },
    { src: "/fonts/Kanit/Kanit-Regular.ttf", fontWeight: 400 },
    { src: "/fonts/Kanit/Kanit-Medium.ttf", fontWeight: 500 },
    { src: "/fonts/Kanit/Kanit-SemiBold.ttf", fontWeight: 600 },
    { src: "/fonts/Kanit/Kanit-Bold.ttf", fontWeight: 700 },
  ],
});

// Optional: Register Sarabun for alternative
Font.register({
  family: "Sarabun",
  fonts: [
    { src: "/fonts/Sarabun/Sarabun-Light.ttf", fontWeight: 300 },
    { src: "/fonts/Sarabun/Sarabun-Regular.ttf", fontWeight: 400 },
    { src: "/fonts/Sarabun/Sarabun-Medium.ttf", fontWeight: 500 },
    { src: "/fonts/Sarabun/Sarabun-SemiBold.ttf", fontWeight: 600 },
    { src: "/fonts/Sarabun/Sarabun-Bold.ttf", fontWeight: 700 },
  ],
});

// Hyphenation callback — Thai text has no spaces, so let @react-pdf/renderer
// break Thai "words" at every character. Keep Latin/digit tokens intact so
// English words don't split in the middle.
// Keep every word intact and rely on manual wrapping (see NotebookPDF
// `wrapLongText`). The previous implementation split Thai strings
// character-by-character via `Array.from(word)`, which let
// @react-pdf/renderer break between a base consonant and its trailing
// combining mark + final consonant. With `wrap={false}` on table rows the
// last letter was being dropped \u2014 e.g. "\u0E08\u0E33\u0E01\u0E31\u0E14" rendered as "\u0E08\u0E33\u0E01\u0E31". Returning
// the word as a single chunk lets the renderer treat each cluster
// atomically and trust the explicit `\n` characters we insert for breaks.
Font.registerHyphenationCallback((word) => [word]);

export default Font;
