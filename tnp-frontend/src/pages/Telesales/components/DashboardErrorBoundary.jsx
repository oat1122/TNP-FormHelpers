import React from "react";
import { Box, Container, Paper, Typography, Button } from "@mui/material";
import { ErrorOutline } from "@mui/icons-material";

/**
 * Error Boundary component for dashboard crashes
 * Catches errors in child components and displays friendly fallback UI
 */
class DashboardErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Dashboard Error Boundary caught an error:", error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    // Reload the page to recover
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <Container maxWidth="sm" sx={{ py: 8 }}>
          <Paper
            elevation={3}
            sx={{
              p: 4,
              textAlign: "center",
              borderTop: 3,
              borderColor: "error.main",
            }}
          >
            <Box mb={3}>
              <ErrorOutline color="error" sx={{ fontSize: 80 }} />
            </Box>

            <Typography variant="h5" gutterBottom fontWeight={600}>
              เกิดข้อผิดพลาด
            </Typography>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 3, lineHeight: 1.8 }}>
              {this.state.error?.message ||
                "แดชบอร์ดประสบปัญหาในการแสดงผล กรุณารีเฟรชหน้าหรือติดต่อผู้ดูแลระบบ"}
            </Typography>

            {process.env.NODE_ENV === "development" && this.state.errorInfo && (
              <Box
                sx={{
                  mb: 3,
                  p: 2,
                  bgcolor: "grey.100",
                  borderRadius: 1,
                  textAlign: "left",
                  maxHeight: 200,
                  overflow: "auto",
                }}
              >
                <Typography
                  variant="caption"
                  component="pre"
                  sx={{
                    fontFamily: "monospace",
                    fontSize: "0.7rem",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {this.state.errorInfo.componentStack}
                </Typography>
              </Box>
            )}

            <Box display="flex" gap={2} justifyContent="center">
              <Button variant="contained" color="primary" onClick={this.handleReset}>
                รีเฟรชหน้า
              </Button>

              <Button variant="outlined" onClick={() => window.history.back()}>
                กลับหน้าก่อนหน้า
              </Button>
            </Box>
          </Paper>
        </Container>
      );
    }

    return this.props.children;
  }
}

export default DashboardErrorBoundary;
