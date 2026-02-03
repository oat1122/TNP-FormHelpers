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

export default Font;
