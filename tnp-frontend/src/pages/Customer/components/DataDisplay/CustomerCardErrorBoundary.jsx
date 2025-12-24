import React from "react";
import { Card, Typography } from "@mui/material";

/**
 * CustomerCardErrorBoundary - Error Boundary สำหรับ Customer Card
 * ใช้จับ error ใน Customer Card และแสดง fallback UI
 */
class CustomerCardErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("CustomerCard Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Card sx={{ mb: 2, p: 2, backgroundColor: "#ffebee" }}>
          <Typography variant="body2" color="error">
            ⚠️ เกิดข้อผิดพลาดในการแสดงข้อมูลลูกค้า
          </Typography>
        </Card>
      );
    }

    return this.props.children;
  }
}

export default CustomerCardErrorBoundary;
