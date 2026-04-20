import { Button, Card, CardContent, Chip, Typography, styled } from "@mui/material";

import { tokens } from "./tokens";

const STATUS_COLOR_MAP = {
  success: tokens.statusComplete,
  warning: tokens.statusPending,
  info: tokens.statusInProgress,
  primary: tokens.primary,
  error: tokens.statusError,
};

export const AccountingCard = styled(Card)(({ theme }) => ({
  height: "100%",
  display: "flex",
  flexDirection: "column",
  borderRadius: theme.spacing(3),
  border: `1px solid ${tokens.divider}`,
  backgroundColor: tokens.white,
  overflow: "hidden",
  position: "relative",
  transition: "all 0.2s ease-in-out",
  "&::before": {
    content: '""',
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    background: `linear-gradient(90deg, ${tokens.primary} 0%, ${tokens.primaryDark} 50%, ${tokens.accent} 100%)`,
    zIndex: 1,
  },
  "&:hover": {
    transform: "translateY(-2px)",
    boxShadow: "0 6px 16px rgba(144, 15, 15, 0.12)",
  },
}));

export const AccountingCardContent = styled(CardContent)(({ theme }) => ({
  flexGrow: 1,
  paddingTop: theme.spacing(3),
}));

export const PricingPRNumber = styled(Typography)(() => ({
  fontWeight: 600,
  color: tokens.primary,
  fontFamily: "'Kanit', sans-serif",
  display: "inline-flex",
  alignItems: "center",
}));

export const AccountingStatusChip = styled(Chip, {
  shouldForwardProp: (prop) => prop !== "statuscolor",
})(({ theme, statuscolor }) => ({
  fontWeight: 500,
  fontFamily: "'Kanit', sans-serif",
  height: 24,
  backgroundColor: STATUS_COLOR_MAP[statuscolor] || tokens.primary,
  color: tokens.white,
  "& .MuiChip-label": {
    paddingLeft: theme.spacing(1.5),
    paddingRight: theme.spacing(1.5),
    fontWeight: 500,
    fontFamily: "'Kanit', sans-serif",
  },
  "& .MuiChip-icon": {
    color: tokens.white,
  },
  "&:hover": {
    transform: "translateY(-1px)",
  },
}));

export const AccountingCountChip = styled(Chip)(({ theme }) => ({
  fontWeight: 600,
  fontSize: "0.75rem",
  fontFamily: "'Kanit', sans-serif",
  height: 26,
  backgroundColor: tokens.primary,
  color: tokens.white,
  "& .MuiChip-label": {
    paddingLeft: theme.spacing(1.5),
    paddingRight: theme.spacing(1.5),
    fontFamily: "'Kanit', sans-serif",
    fontWeight: 600,
  },
}));

export const AccountingPrimaryButton = styled(Button, {
  shouldForwardProp: (prop) => prop !== "disabled",
})(({ theme, disabled }) => ({
  borderRadius: theme.spacing(2),
  fontWeight: 600,
  fontFamily: "'Kanit', sans-serif",
  textTransform: "none",
  paddingLeft: theme.spacing(3),
  paddingRight: theme.spacing(3),
  paddingTop: theme.spacing(1),
  paddingBottom: theme.spacing(1),
  color: tokens.white,
  background: disabled
    ? theme.palette.grey[300]
    : `linear-gradient(45deg, ${tokens.primary} 30%, ${tokens.primaryDark} 90%)`,
  boxShadow: disabled ? "none" : "0 3px 5px 2px rgba(144, 15, 15, 0.3)",
  "&:hover": disabled
    ? {}
    : {
        background: `linear-gradient(45deg, ${tokens.primaryDeep} 30%, ${tokens.secondaryDark} 90%)`,
        transform: "translateY(-1px)",
        boxShadow: "0 4px 8px 2px rgba(144, 15, 15, 0.4)",
      },
}));

export const AccountingSecondaryButton = styled(Button)(({ theme }) => ({
  borderRadius: theme.spacing(2),
  fontWeight: 500,
  fontFamily: "'Kanit', sans-serif",
  textTransform: "none",
  paddingLeft: theme.spacing(2),
  paddingRight: theme.spacing(2),
  color: tokens.textPrimary,
  "&:hover": {
    backgroundColor: "rgba(0, 0, 0, 0.04)",
  },
}));

export const AccountingListItem = styled("div")(({ theme }) => ({
  padding: theme.spacing(1.5),
  border: `1px solid ${tokens.divider}`,
  borderRadius: theme.spacing(1.5),
  backgroundColor: tokens.white,
  transition: "all 0.15s ease-in-out",
  "&:hover": {
    backgroundColor: tokens.backgroundAccent,
    borderColor: tokens.primaryLight,
    transform: "translateY(-1px)",
    boxShadow: "0 2px 8px rgba(144, 15, 15, 0.08)",
  },
}));

export const accountingCardDividerSx = {
  border: "none",
  height: 1,
  backgroundColor: tokens.divider,
  margin: "20px 0",
};
