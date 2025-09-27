import { Box, Typography, TextField, Paper, Pagination, Chip, LinearProgress } from "@mui/material";
import React from "react";

const PaginationSection = ({
  pagination,
  currentPage,
  itemsPerPage,
  isFetching,
  onPageChange,
  onItemsPerPageChange,
  showHeader = true,
  title = "Pricing Request ที่พร้อมออกใบเสนอราคา",
}) => {
  if (!pagination) return null;

  return (
    <>
      {/* Content Header */}
      {showHeader && (
        <Box sx={{ mb: 3 }}>
          <Box
            sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Typography variant="h6" color="primary">
                {title}
              </Typography>
              <Chip label={pagination.total} color="secondary" size="small" />
            </Box>

            {/* Items per page selector */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography variant="body2" color="text.secondary">
                แสดง:
              </Typography>
              <TextField
                select
                size="small"
                value={itemsPerPage}
                onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
                SelectProps={{ native: true }}
                sx={{ minWidth: 80 }}
              >
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={200}>200</option>
              </TextField>
              <Typography variant="body2" color="text.secondary">
                รายการ
              </Typography>
            </Box>
          </Box>

          {/* Pagination info */}
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography variant="body2" color="text.secondary">
                แสดง {pagination.from || 0} - {pagination.to || 0} จาก {pagination.total} รายการ
              </Typography>
              {isFetching && <Chip label="กำลังโหลด..." size="small" color="primary" />}
            </Box>
            {isFetching && <LinearProgress sx={{ mt: 1, borderRadius: 1 }} color="primary" />}
          </Box>
        </Box>
      )}

      {/* Bottom Pagination */}
      {pagination.last_page > 1 && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4, mb: 2 }}>
          <Paper sx={{ p: 2, display: "flex", alignItems: "center", gap: 2 }}>
            <Typography variant="body2" color="text.secondary">
              หน้า {pagination.current_page} จาก {pagination.last_page}
            </Typography>
            <Pagination
              count={pagination.last_page}
              page={pagination.current_page}
              onChange={onPageChange}
              color="primary"
              size="medium"
              showFirstButton
              showLastButton
              disabled={isFetching}
              sx={{
                "& .MuiPaginationItem-root": {
                  "&.Mui-selected": {
                    backgroundColor: "primary.main",
                    color: "white",
                    "&:hover": {
                      backgroundColor: "primary.dark",
                    },
                  },
                },
              }}
            />
          </Paper>
        </Box>
      )}
    </>
  );
};

export default PaginationSection;
