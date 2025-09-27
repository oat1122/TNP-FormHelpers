import {
  Warning as WarningIcon,
  Error as ErrorIcon,
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
} from "@mui/icons-material";
import {
  Alert,
  AlertTitle,
  Box,
  Collapse,
  List,
  ListItem,
  ListItemText,
  IconButton,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import React from "react";

const tokens = {
  primary: "#900F0F",
  white: "#FFFFFF",
  bg: "#F5F5F5",
};

const InvoiceAlert = styled(Alert)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  "&.MuiAlert-standardWarning": {
    backgroundColor: "#fff3cd",
    borderColor: "#ffecb5",
    color: "#856404",
  },
  "&.MuiAlert-standardError": {
    backgroundColor: "#f8d7da",
    borderColor: "#f5c6cb",
    color: "#721c24",
  },
}));

const InvoiceExpandButton = styled(IconButton)(({ theme, expanded }) => ({
  transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
  transition: theme.transitions.create("transform", {
    duration: theme.transitions.duration.shortest,
  }),
  marginLeft: "auto",
}));

const InvoiceWarningsBanner = React.memo(function InvoiceWarningsBanner({
  validation = {},
  onDismiss,
  collapsible = false,
}) {
  const { warnings = [], errors = [], hasWarnings = false, isValid = true } = validation;
  const [expanded, setExpanded] = React.useState(!collapsible);
  const [dismissed, setDismissed] = React.useState(false);

  // Don't render if no warnings or errors
  if ((!hasWarnings && isValid) || dismissed) {
    return null;
  }

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  const handleToggleExpanded = () => {
    setExpanded(!expanded);
  };

  const renderWarnings = () => {
    if (warnings.length === 0) return null;

    return (
      <InvoiceAlert
        severity="warning"
        icon={<WarningIcon />}
        action={
          <Box display="flex" alignItems="center">
            {collapsible && warnings.length > 1 && (
              <InvoiceExpandButton
                expanded={expanded}
                onClick={handleToggleExpanded}
                size="small"
                aria-label="แสดง/ซ่อนรายละเอียด"
              >
                <ExpandMoreIcon fontSize="small" />
              </InvoiceExpandButton>
            )}
            {onDismiss && (
              <IconButton size="small" onClick={handleDismiss} aria-label="ปิดการแจ้งเตือน">
                <CloseIcon fontSize="small" />
              </IconButton>
            )}
          </Box>
        }
      >
        <AlertTitle>คำเตือน</AlertTitle>
        {warnings.length === 1 ? (
          <Box>{warnings[0].message || warnings[0]}</Box>
        ) : (
          <>
            <Box>พบ {warnings.length} ข้อแจ้งเตือน</Box>
            <Collapse in={expanded}>
              <List dense sx={{ mt: 1 }}>
                {warnings.map((warning, index) => (
                  <ListItem key={index} sx={{ pl: 0 }}>
                    <ListItemText
                      primary={warning.message || warning}
                      primaryTypographyProps={{ variant: "body2" }}
                    />
                  </ListItem>
                ))}
              </List>
            </Collapse>
          </>
        )}
      </InvoiceAlert>
    );
  };

  const renderErrors = () => {
    if (errors.length === 0) return null;

    return (
      <InvoiceAlert
        severity="error"
        icon={<ErrorIcon />}
        action={
          <Box display="flex" alignItems="center">
            {collapsible && errors.length > 1 && (
              <InvoiceExpandButton
                expanded={expanded}
                onClick={handleToggleExpanded}
                size="small"
                aria-label="แสดง/ซ่อนรายละเอียด"
              >
                <ExpandMoreIcon fontSize="small" />
              </InvoiceExpandButton>
            )}
            {onDismiss && (
              <IconButton size="small" onClick={handleDismiss} aria-label="ปิดการแจ้งเตือน">
                <CloseIcon fontSize="small" />
              </IconButton>
            )}
          </Box>
        }
      >
        <AlertTitle>ข้อผิดพลาด</AlertTitle>
        {errors.length === 1 ? (
          <Box>{errors[0]}</Box>
        ) : (
          <>
            <Box>พบ {errors.length} ข้อผิดพลาด</Box>
            <Collapse in={expanded}>
              <List dense sx={{ mt: 1 }}>
                {errors.map((error, index) => (
                  <ListItem key={index} sx={{ pl: 0 }}>
                    <ListItemText primary={error} primaryTypographyProps={{ variant: "body2" }} />
                  </ListItem>
                ))}
              </List>
            </Collapse>
          </>
        )}
      </InvoiceAlert>
    );
  };

  return (
    <Box>
      {renderErrors()}
      {renderWarnings()}
    </Box>
  );
});

export default InvoiceWarningsBanner;
