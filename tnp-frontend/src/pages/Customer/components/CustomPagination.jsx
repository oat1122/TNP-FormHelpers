import { useEffect } from "react";
import { Box, Typography, PaginationItem, useTheme, useMediaQuery } from "@mui/material";
import { useGridApiContext, useGridSelector, gridPageSelector, gridPageCountSelector } from "@mui/x-data-grid";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import PageSizeSelector from "./PageSizeSelector";
import { StyledPagination } from "./StyledComponents";
import { setPaginationModel } from "../../../features/Customer/customerSlice";

export default function CustomPagination({ paginationModel, scrollToTop, totalItems, dispatch }) {
  const apiRef = useGridApiContext();
  const page = useGridSelector(apiRef, gridPageSelector);
  const pageCount = useGridSelector(apiRef, gridPageCountSelector);
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down("sm"));

  useEffect(() => {
    if (paginationModel.page !== page) {
      apiRef.current.setPage(0);
      scrollToTop();
    }
  }, [paginationModel, scrollToTop]);

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
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 2,
        width: "100%",
        p: 1,
      }}
    >
      <PageSizeSelector value={paginationModel.pageSize} onChange={handlePageSizeChange} />
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          flexWrap: "wrap",
          justifyContent: "center",
          flex: 1,
        }}
      >
        <StyledPagination
          color="error"
          variant="outlined"
          shape="rounded"
          page={page + 1}
          count={pageCount}
          siblingCount={isXs ? 0 : 1}
          boundaryCount={1}
          renderItem={(props2) => (
            <PaginationItem {...props2} disableRipple slots={{ previous: FaChevronLeft, next: FaChevronRight }} />
          )}
          onChange={(event, value) => {
            apiRef.current.setPage(value - 1);
            scrollToTop();
          }}
        />
      </Box>
      <Typography
        variant="body2"
        sx={{ color: (theme) => theme.vars.palette.grey.dark, minWidth: 120, textAlign: "right" }}
      >
        {`${page * paginationModel.pageSize + 1}-${Math.min((page + 1) * paginationModel.pageSize, totalItems)} of ${totalItems}`}
      </Typography>
    </Box>
  );
}
