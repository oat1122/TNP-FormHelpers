import React, { useEffect } from "react";
import {
  Box,
  Pagination,
  PaginationItem,
  useMediaQuery,
  useTheme,
  styled,
  Typography,
} from "@mui/material";
import {
  useGridApiContext,
  useGridSelector,
  gridPageSelector,
  gridPageCountSelector,
} from "@mui/x-data-grid";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import PageSizeSelector from "./PageSizeSelector";

const StyledPagination = styled(Pagination)(({ theme }) => ({
  "& .MuiPaginationItem-previousNext": {
    backgroundColor: theme.vars.palette.error.dark,
    color: "#fff",
    height: 30,
    width: 38,
    "&:hover": { backgroundColor: theme.vars.palette.error.main },
  },
  "& .MuiPaginationItem-page": {
    backgroundColor: theme.vars.palette.grey.outlinedInput,
    borderColor: theme.vars.palette.grey.outlinedInput,
    height: 30,
    width: 38,
    "&:hover": {
      backgroundColor: theme.vars.palette.grey.light,
      borderColor: theme.vars.palette.grey.light,
    },
  },
  "& .MuiPaginationItem-ellipsis": {
    backgroundColor: theme.vars.palette.grey.outlinedInput,
    borderColor: theme.vars.palette.grey.outlinedInput,
    borderRadius: theme.vars.shape.borderRadius,
    height: 30,
    width: 38,
    alignContent: "center",
  },
  "& .MuiPaginationItem-page.Mui-selected": {
    backgroundColor: theme.vars.palette.error.light,
    borderColor: theme.vars.palette.error.light,
    color: theme.palette.common.white,
    fontWeight: "bold",
    transform: "scale(1.05)",
    boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
    transition: "all 0.2s ease",
    "&:hover": { backgroundColor: theme.vars.palette.error.main },
  },
}));

function CustomPagination({ paginationModel, setPaginationModel, totalItems, scrollToTop }) {
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
    setPaginationModel(newModel);
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
          renderItem={(props) => (
            <PaginationItem {...props} disableRipple slots={{ previous: FaChevronLeft, next: FaChevronRight }} />
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

export default CustomPagination;
