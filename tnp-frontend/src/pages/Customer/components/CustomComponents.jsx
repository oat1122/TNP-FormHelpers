import React, { useEffect } from "react";
import { useDispatch } from "react-redux";
import {
  Box,
  Typography,
  PaginationItem,
  CircularProgress,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import {
  useGridApiContext,
  useGridSelector,
  gridPageCountSelector,
  gridPageSelector,
  GridToolbarContainer,
} from "@mui/x-data-grid";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { setPaginationModel } from "../../../features/Customer/customerSlice";
import { StyledPagination } from "../styles/StyledComponents";
import { PageSizeSelector, SortInfoDisplay } from "./UtilityComponents";

// Component Pagination ที่กำหนดเอง
export const CustomPagination = ({ 
  paginationModel, 
  totalItems, 
  scrollToTop 
}) => {
  const dispatch = useDispatch();
  const apiRef = useGridApiContext();
  const page = useGridSelector(apiRef, gridPageSelector);
  const pageCount = useGridSelector(apiRef, gridPageCountSelector);
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down("sm"));
  const isMd = useMediaQuery(theme.breakpoints.down("md"));

  // Reset page เมื่อเปลี่ยน group
  useEffect(() => {
    if (paginationModel.page !== page) {
      apiRef.current.setPage(0);
      scrollToTop();
    }
  }, [paginationModel, scrollToTop, apiRef, page]);

  // Handle page size change
  const handlePageSizeChange = (newPageSize) => {
    const newModel = { ...paginationModel, pageSize: newPageSize, page: 0 };
    dispatch(setPaginationModel(newModel));
    apiRef.current.setPageSize(newPageSize);
    scrollToTop();
  };

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: isXs ? "center" : "space-between",
        flexDirection: isXs ? "column" : "row",
        flexWrap: "wrap",
        gap: isXs ? 1 : 2,
        width: "100%",
        p: isXs ? 0.5 : 1,
      }}
    >
      {/* PageSizeSelector - ซ่อนบน mobile */}
      {!isXs && (
        <PageSizeSelector
          value={paginationModel.pageSize}
          onChange={handlePageSizeChange}
        />
      )}

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          flexWrap: "wrap",
          justifyContent: "center",
          flex: 1,
          order: isXs ? 2 : 0,
        }}
      >
        <StyledPagination
          color="error"
          variant="outlined"
          shape="rounded"
          page={page + 1}
          count={pageCount}
          size={isXs ? "small" : "medium"}
          siblingCount={isXs ? 0 : isMd ? 0 : 1}
          boundaryCount={isXs ? 1 : 1}
          showFirstButton={!isXs}
          showLastButton={!isXs}
          renderItem={(props2) => (
            <PaginationItem
              {...props2}
              disableRipple
              slots={{ 
                previous: FaChevronLeft, 
                next: FaChevronRight,
                ...(isXs ? {} : { first: "first_page", last: "last_page" })
              }}
              sx={{
                fontSize: isXs ? "0.75rem" : "0.875rem",
                minWidth: isXs ? "32px" : "auto",
                height: isXs ? "32px" : "auto",
                "&.Mui-selected": {
                  backgroundColor: "#9e0000",
                  color: "white",
                  "&:hover": {
                    backgroundColor: "#d32f2f",
                  },
                },
              }}
            />
          )}
          onChange={(event, value) => {
            apiRef.current.setPage(value - 1);
            scrollToTop();
          }}
        />
      </Box>

      {/* Info text - ปรับให้เล็กลงใน mobile */}
      <Typography
        variant={isXs ? "caption" : "body2"}
        sx={{
          color: (theme) => theme.vars.palette.grey.dark,
          minWidth: isXs ? "auto" : 120,
          textAlign: isXs ? "center" : "right",
          fontSize: isXs ? "0.7rem" : "0.875rem",
          order: isXs ? 1 : 0,
        }}
      >
        {isXs 
          ? `${page + 1}/${pageCount}` 
          : `${page * paginationModel.pageSize + 1}-${Math.min(
              (page + 1) * paginationModel.pageSize,
              totalItems
            )} of ${totalItems}`
        }
      </Typography>
    </Box>
  );
};

// Component Toolbar ที่กำหนดเอง
export const CustomToolbar = ({ 
  serverSortModel, 
  isFetching 
}) => {
  return (
    <GridToolbarContainer>
      <Box sx={{ display: "flex", alignItems: "center", flex: 1 }}>
        <Typography
          variant="subtitle2"
          sx={{
            color: "common.white",
            fontWeight: "bold",
            display: "flex",
            alignItems: "center",
            mr: 2,
          }}
        >
          รายการลูกค้า
        </Typography>
        <SortInfoDisplay sortModel={serverSortModel} />
      </Box>

      <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
        {isFetching && (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              marginRight: 1,
              color: "white",
              fontSize: "0.75rem",
              backgroundColor: "rgba(255,255,255,0.2)",
              padding: "4px 8px",
              borderRadius: "4px",
              gap: 1,
            }}
          >
            <CircularProgress size={16} thickness={5} color="inherit" />
            <Typography variant="caption">กำลังโหลด...</Typography>
          </Box>
        )}
      </Box>
    </GridToolbarContainer>
  );
}; 