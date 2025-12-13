import React from "react";
import { Box, Typography, Grid, useTheme, useMediaQuery } from "@mui/material";
import { Person as PersonIcon } from "@mui/icons-material";

// Components
import CustomerCard from "./CustomerCard";
import CustomerCardErrorBoundary from "./CustomerCardErrorBoundary";

/**
 * CustomerCardList - แสดงรายการลูกค้าเป็น Card บน Mobile/Tablet
 * @param {Array} customers - รายชื่อลูกค้า
 * @param {Function} onView - Handler สำหรับดูข้อมูล
 * @param {Function} onEdit - Handler สำหรับแก้ไข
 * @param {Function} handleRecall - Handler สำหรับ reset recall
 * @param {boolean} loading - สถานะการโหลด
 * @param {number} totalCount - จำนวนลูกค้าทั้งหมด
 * @param {Object} paginationModel - Pagination model
 * @param {Function} onPaginationChange - Handler สำหรับเปลี่ยนหน้า
 */
const CustomerCardList = ({
  customers,
  onView,
  onEdit,
  handleRecall,
  loading = false,
  totalCount = 0,
  paginationModel = { page: 0, pageSize: 30 },
  onPaginationChange,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isTablet = useMediaQuery(theme.breakpoints.between("sm", "md"));

  // แสดงเฉพาะบน mobile และ tablet
  if (!isMobile && !isTablet) return null;

  // Loading state
  if (loading) {
    return (
      <Box sx={{ px: 2, py: 6, textAlign: "center" }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 2,
          }}
        >
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              border: `3px solid ${theme.palette.primary.light}`,
              borderTop: `3px solid ${theme.palette.primary.main}`,
              animation: "spin 1s linear infinite",
              "@keyframes spin": {
                "0%": { transform: "rotate(0deg)" },
                "100%": { transform: "rotate(360deg)" },
              },
            }}
          />
          <Typography variant="body2" color="text.secondary">
            กำลังโหลดข้อมูล...
          </Typography>
        </Box>
      </Box>
    );
  }

  // Empty state
  if (!customers || customers.length === 0) {
    return (
      <Box sx={{ px: 2, py: 6, textAlign: "center" }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 2,
          }}
        >
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              bgcolor: theme.palette.grey[100],
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mb: 1,
            }}
          >
            <PersonIcon sx={{ fontSize: 40, color: theme.palette.grey[400] }} />
          </Box>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
            ไม่พบข้อมูลลูกค้า
          </Typography>
          <Typography variant="body2" color="text.disabled">
            ลองเปลี่ยนตัวกรองหรือค้นหาใหม่อีกครั้ง
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ px: { xs: 1, sm: 2 }, py: 2 }}>
      {/* Summary */}
      <Box sx={{ mb: 2, px: 1 }}>
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.85rem" }}>
          แสดง {customers.length} จากทั้งหมด {totalCount} รายการ
          {paginationModel && (
            <span style={{ marginLeft: "8px" }}>(หน้า {paginationModel.page + 1})</span>
          )}
        </Typography>
      </Box>

      {/* Cards Grid */}
      <Grid container spacing={{ xs: 1, sm: 2 }}>
        {customers.map((customer) => (
          <Grid
            item
            xs={12}
            sm={isTablet ? 6 : 12}
            key={customer?.cus_id || `customer-${Math.random()}`}
          >
            <CustomerCardErrorBoundary>
              <CustomerCard
                customer={customer}
                onView={onView}
                onEdit={onEdit}
                handleRecall={handleRecall}
              />
            </CustomerCardErrorBoundary>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

// Safe wrapper with error handling
const SafeCustomerCardList = (props) => {
  try {
    return <CustomerCardList {...props} />;
  } catch (error) {
    console.error("CustomerCardList Error:", error);
    return (
      <Box sx={{ p: 3, textAlign: "center" }}>
        <Typography variant="body2" color="error">
          ⚠️ เกิดข้อผิดพลาดในการแสดงรายการลูกค้า
        </Typography>
      </Box>
    );
  }
};

export default SafeCustomerCardList;
