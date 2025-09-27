import {
  DataGrid,
  gridPageCountSelector,
  gridPageSelector,
  useGridApiContext,
  useGridSelector,
} from "@mui/x-data-grid";
import { Box, styled, Pagination, PaginationItem, useTheme, useMediaQuery } from "@mui/material";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

const StyledDataGrid = styled(DataGrid)(({ theme }) => ({
  "& .MuiDataGrid-columnHeader": {
    backgroundColor: theme.palette.error.dark,
    color: theme.palette.common.white,
    textTransform: "uppercase",
  },

  "& .MuiDataGrid-columnHeaderTitleContainer": {
    justifyContent: "center",
  },

  "& .MuiDataGrid-row--borderBottom .MuiDataGrid-columnHeader": {
    borderBottom: `1px solid ${theme.palette.error.dark}`,
  },

  "& .MuiDataGrid-columnHeader[aria-colindex='1']": {
    borderBottomLeftRadius: theme.shape.borderRadius,
  },

  "& .MuiDataGrid-columnHeader--last": {
    borderBottomRightRadius: theme.shape.borderRadius,
  },

  "& .MuiDataGrid-iconSeparator": {
    display: "none",
  },

  "& .MuiDataGrid-row": {
    backgroundColor: theme.vars.palette.grey.main,
    borderRadius: theme.shape.borderRadius,
    marginTop: 10,
  },

  "& .MuiDataGrid-cell, .MuiDataGrid-filler > div": {
    textAlign: "center",
    borderWidth: 0,
    color: theme.vars.palette.grey.dark,
  },

  "& .MuiDataGrid-menuIcon > button > svg": {
    color: "#fff",
  },

  "& .MuiDataGrid-iconButtonContainer > button > svg": {
    color: "#fff",
  },

  "& .MuiDataGrid-actionsCell > .MuiIconButton-root:not(.Mui-disabled) > svg": {
    color: theme.vars.palette.grey.dark,
  },

  "& .MuiDataGrid-footerContainer": {
    borderWidth: 0,
    justifyContent: "center",
  },

  "& .uppercase-cell": {
    // Target the cell by class
    textTransform: "uppercase",
  },

  "& .danger-days": {
    color: theme.vars.palette.error.main,
  },
}));

const StyledPagination = styled(Pagination)(({ theme }) => ({
  "& .MuiPaginationItem-previousNext": {
    backgroundColor: theme.vars.palette.error.dark,
    color: "#fff",
    height: 30,
    width: 38,

    "&:hover": {
      backgroundColor: theme.vars.palette.error.main,
    },
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
    backgroundColor: theme.vars.palette.grey.light,
    borderColor: theme.vars.palette.grey.light,
    color: theme.vars.palette.grey.dark,

    "&:hover": {
      backgroundColor: theme.vars.palette.grey.light,
    },
  },
}));

// Render when not found data.
const NoDataComponent = () => (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      height: "100%",
      color: "gray",
    }}
  >
    <p style={{ fontSize: 18 }}>No data found.</p>
  </div>
);

// Pagination customize
function CustomPagination() {
  const apiRef = useGridApiContext();
  const page = useGridSelector(apiRef, gridPageSelector);
  const pageCount = useGridSelector(apiRef, gridPageCountSelector);
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <StyledPagination
      color="error"
      variant="outlined"
      shape="rounded"
      page={page + 1}
      count={pageCount}
      siblingCount={isXs ? 0 : 1}
      boundaryCount={1}
      // @ts-expect-error
      renderItem={(props2) => (
        <PaginationItem
          {...props2}
          disableRipple
          slots={{ previous: FaChevronLeft, next: FaChevronRight }}
        />
      )}
      onChange={(event, value) => apiRef.current.setPage(value - 1)}
    />
  );
}

function DataTable(params) {
  return (
    <Box sx={{ height: "100%", width: "100%" }}>
      <StyledDataGrid
        disableColumnSelector
        disableRowSelectionOnClick
        rows={params.data}
        columns={params.columns}
        loading={params.loading}
        getRowId={params.getRowId}
        paginationMode="server"
        initialState={{ pagination: { paginationModel: params.paginationModel } }}
        onPaginationModelChange={params.setPaginationModel}
        rowCount={params.rowCount}
        slots={{
          noRowsOverlay: NoDataComponent,
          pagination: CustomPagination,
        }}
        sx={{ border: 0 }}
        rowHeight={params.rowHeight}
        columnHeaderHeight={params.columnHeaderHeight}
      />
    </Box>
  );
}

export default DataTable;
