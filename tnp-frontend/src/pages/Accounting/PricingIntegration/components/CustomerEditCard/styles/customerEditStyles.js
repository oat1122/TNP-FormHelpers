import { Box, Button, Card, IconButton, TextField } from "@mui/material";
import { styled } from "@mui/material/styles";

import { tokens } from "../../../../shared/styles/tokens";

export const CustomerCard = styled(Card)(() => ({
  background: `linear-gradient(135deg, ${tokens.white} 0%, ${tokens.bg} 100%)`,
  border: `2px solid ${tokens.accent}`,
  borderRadius: "16px",
  boxShadow: "0 8px 24px rgba(144, 15, 15, 0.15)",
  position: "relative",
  overflow: "hidden",
  "&::before": {
    content: '""',
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "4px",
    background: `linear-gradient(90deg, ${tokens.primary} 0%, ${tokens.primaryDark} 100%)`,
  },
}));

export const CustomerHeader = styled(Box)(() => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: "16px",
  padding: "8px 0",
}));

export const EditButton = styled(IconButton)(() => ({
  background: `linear-gradient(135deg, ${tokens.primary} 0%, ${tokens.primaryDark} 100%)`,
  color: tokens.white,
  width: "48px",
  height: "48px",
  boxShadow: "0 4px 12px rgba(144, 15, 15, 0.3)",
  "&:hover": {
    background: `linear-gradient(135deg, ${tokens.primaryDark} 0%, ${tokens.accent} 100%)`,
    transform: "scale(1.05)",
  },
  transition: "all 0.3s ease-in-out",
}));

export const SaveButton = styled(Button)(() => ({
  background: `linear-gradient(135deg, ${tokens.successBright} 0%, ${tokens.successBrightDark} 100%)`,
  color: tokens.white,
  borderRadius: "12px",
  padding: "10px 20px",
  fontWeight: 600,
  textTransform: "none",
  boxShadow: "0 4px 12px rgba(76, 175, 80, 0.3)",
  "&:hover": {
    background: `linear-gradient(135deg, ${tokens.successBrightDark} 0%, #388E3C 100%)`,
    transform: "translateY(-2px)",
  },
  "&:disabled": {
    background: tokens.divider,
    color: tokens.disabled,
  },
  transition: "all 0.3s ease-in-out",
}));

export const CancelButton = styled(Button)(() => ({
  border: `2px solid ${tokens.danger}`,
  color: tokens.danger,
  borderRadius: "12px",
  padding: "8px 20px",
  fontWeight: 600,
  textTransform: "none",
  "&:hover": {
    backgroundColor: "rgba(255, 107, 107, 0.05)",
    borderColor: tokens.dangerDark,
    color: tokens.dangerDark,
  },
  transition: "all 0.3s ease-in-out",
}));

export const StyledTextField = styled(TextField)(() => ({
  "& .MuiOutlinedInput-root": {
    borderRadius: "12px",
    backgroundColor: tokens.white,
    "&:hover .MuiOutlinedInput-notchedOutline": {
      borderColor: tokens.primaryDark,
    },
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
      borderColor: tokens.primary,
      borderWidth: "2px",
    },
  },
  "& .MuiInputLabel-root.Mui-focused": {
    color: tokens.primary,
  },
}));

export const hydratingIndicatorSx = {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  height: "3px",
  background: `linear-gradient(90deg, ${tokens.primary} 0%, ${tokens.accent} 50%, ${tokens.primary} 100%)`,
  backgroundSize: "200% 100%",
  animation: "loading 1.5s infinite ease-in-out",
  zIndex: 10,
  "@keyframes loading": {
    "0%": { backgroundPosition: "200% 0" },
    "100%": { backgroundPosition: "-200% 0" },
  },
};

export const sectionTitleSx = {
  color: tokens.primary,
  mb: 1,
  display: "flex",
  alignItems: "center",
  gap: 1,
};

export const primaryIconSx = { color: tokens.primary, fontSize: "28px" };

export const expandButtonSx = {
  color: tokens.primary,
  "&:hover": { backgroundColor: "rgba(144, 15, 15, 0.1)" },
};
