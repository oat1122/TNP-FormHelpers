import { Paper, Box, Button, Card } from "@mui/material";
import { styled } from "@mui/material/styles";

import tokens from "./tokens";

export { tokens };

export const Section = styled(Paper)(({ theme }) => ({
  backgroundColor: tokens.white,
  border: `1px solid ${tokens.border}`,
  borderRadius: 12,
  overflow: "hidden",
}));

export const SectionHeader = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: 12,
  padding: "14px 18px",
  borderBottom: `1px solid ${tokens.border}`,
  backgroundColor: tokens.white,
}));

export const PrimaryButton = styled(Button)({
  backgroundColor: tokens.primary,
  color: tokens.white,
  borderRadius: 10,
  padding: "10px 18px",
  textTransform: "none",
  fontWeight: 600,
  "&:hover": { backgroundColor: tokens.primaryDark },
  "&:disabled": { opacity: 0.6 },
});

export const SecondaryButton = styled(Button)({
  color: tokens.primary,
  borderColor: tokens.primary,
  borderWidth: 1,
  borderStyle: "solid",
  borderRadius: 10,
  padding: "9px 18px",
  textTransform: "none",
  fontWeight: 600,
  backgroundColor: "transparent",
  "&:hover": {
    backgroundColor: "#fff5f5",
    borderColor: tokens.primaryDark,
    color: tokens.primaryDark,
  },
});

export const InfoCard = styled(Card)({
  border: `1px solid ${tokens.border}`,
  borderRadius: 12,
});
