/**
 * 🎨 TNP Styled Components for Better Typography
 *
 * Components ที่ช่วยให้ Typography อ่านง่ายขึ้น
 * แทนที่ CSS classes ที่ MUI generate ให้
 *
 * @author แต้ม - Fullstack Developer
 */

import { styled, Typography, Chip, Button, Card, CardContent } from "@mui/material";

import { typography, colors, spacing, animations } from "./DesignSystem";

// 📝 Typography Components ที่อ่านง่าย
export const TNPHeading = styled(Typography)(({ theme, variant = "h6" }) => ({
  ...typography.heading,
  fontSize: variant === "h5" ? "1.25rem" : variant === "h6" ? "1.1rem" : "1rem",
  marginBottom: theme.spacing(spacing.sm),
}));

export const TNPSubheading = styled(Typography)(({ theme }) => ({
  ...typography.subheading,
  fontSize: "0.875rem",
  marginBottom: theme.spacing(spacing.xs),
}));

export const TNPBodyText = styled(Typography)(() => ({
  ...typography.body,
  fontSize: "0.875rem",
}));

export const TNPCaption = styled(Typography)(() => ({
  ...typography.caption,
  fontSize: "0.75rem",
}));

export const TNPPRNumber = styled(Typography)(() => ({
  ...typography.prNumber,
  display: "inline-flex",
  alignItems: "center",
}));

// 🏷️ Chip Components ที่สวยงาม
export const TNPStatusChip = styled(Chip)(({ theme }) => ({
  ...typography.statusChip,
  height: 24,
  "& .MuiChip-label": {
    paddingLeft: theme.spacing(1.5),
    paddingRight: theme.spacing(1.5),
    ...typography.statusChip,
  },
  "&:hover": {
    ...animations.chipHover,
  },
}));

export const TNPCountChip = styled(Chip)(({ theme }) => ({
  fontWeight: 600,
  fontSize: "0.75rem",
  fontFamily: "'Kanit', sans-serif",
  height: 26,
  backgroundColor: colors.primary.main,
  color: colors.primary.contrast,
  "& .MuiChip-label": {
    paddingLeft: theme.spacing(1.5),
    paddingRight: theme.spacing(1.5),
    fontFamily: "'Kanit', sans-serif",
    fontWeight: 600,
  },
}));

// 🔘 Button Components ที่เป็น TNP Style
export const TNPPrimaryButton = styled(Button)(({ theme, disabled }) => ({
  ...typography.button,
  borderRadius: theme.spacing(2),
  fontWeight: 600,
  paddingLeft: theme.spacing(3),
  paddingRight: theme.spacing(3),
  paddingTop: theme.spacing(1),
  paddingBottom: theme.spacing(1),
  background: disabled
    ? theme.palette.grey[300]
    : "linear-gradient(45deg, #900F0F 30%, #B20000 90%)",
  boxShadow: disabled ? "none" : "0 3px 5px 2px rgba(144, 15, 15, 0.3)",
  "&:hover": disabled
    ? {}
    : {
        ...animations.buttonHover,
        background: "linear-gradient(45deg, #7A0D0D 30%, #8B0000 90%)",
      },
}));

export const TNPSecondaryButton = styled(Button)(({ theme }) => ({
  ...typography.button,
  borderRadius: theme.spacing(2),
  fontWeight: 500,
  paddingLeft: theme.spacing(2),
  paddingRight: theme.spacing(2),
  color: theme.palette.text.primary,
  "&:hover": {
    backgroundColor: theme.palette.action.hover,
  },
}));

// 🃏 Card Components ที่สวยงาม
export const TNPCard = styled(Card)(({ theme }) => ({
  height: "100%",
  display: "flex",
  flexDirection: "column",
  borderRadius: theme.spacing(3),
  border: "1px solid",
  borderColor: theme.palette.divider,
  backgroundColor: theme.palette.background.paper,
  overflow: "hidden",
  position: "relative",
  transition: animations.smooth,

  // เพิ่ม gradient top border สำหรับ TNP brand
  "&::before": {
    content: '""',
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    background: "linear-gradient(90deg, #900F0F 0%, #B20000 50%, #E36264 100%)",
    zIndex: 1,
  },

  "&:hover": {
    ...animations.cardHover,
  },
}));

export const TNPCardContent = styled(CardContent)(({ theme }) => ({
  flexGrow: 1,
  paddingTop: theme.spacing(3), // เผื่อพื้นที่สำหรับ gradient border
}));

// 📦 Container Components
export const TNPListItem = styled("div")(({ theme }) => ({
  padding: theme.spacing(1.5),
  border: "1px solid",
  borderColor: theme.palette.divider,
  borderRadius: theme.spacing(1.5),
  backgroundColor: theme.palette.background.paper,
  transition: animations.fast,

  "&:hover": {
    backgroundColor: theme.palette.background.accent || "#FDF2F2",
    borderColor: theme.palette.primary.light,
    transform: "translateY(-1px)",
    boxShadow: "0 2px 8px rgba(144, 15, 15, 0.08)",
  },
}));

// 🎨 Utility Components
export const TNPGradientText = styled(Typography)(() => ({
  background: "linear-gradient(45deg, #900F0F 30%, #B20000 90%)",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  backgroundClip: "text",
  fontWeight: 600,
  fontFamily: "'Kanit', sans-serif",
}));

export const TNPDivider = styled("hr")(({ theme }) => ({
  border: "none",
  height: 1,
  backgroundColor: theme.palette.divider,
  margin: `${theme.spacing(2.5)} 0`,
}));

// 📱 Responsive Typography
export const TNPResponsiveText = styled(Typography)(({ theme }) => ({
  fontFamily: "'Kanit', sans-serif",
  fontSize: "0.875rem",
  lineHeight: 1.4,

  [theme.breakpoints.up("sm")]: {
    fontSize: "1rem",
    lineHeight: 1.5,
  },

  [theme.breakpoints.up("md")]: {
    fontSize: "1.1rem",
    lineHeight: 1.6,
  },
}));
