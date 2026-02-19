import {
  Box,
  Typography,
  Button,
  IconButton,
  Grid,
  Tooltip,
  Alert,
  CircularProgress,
  Pagination,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import { MdAdd, MdPictureAsPdf, MdFilterList, MdViewList, MdGridView } from "react-icons/md";
import { useNavigate } from "react-router-dom";

import { SearchBar, FilterPanel, ProductCard, ProductListItem } from "./components";
import { useSupplierProducts } from "./hooks";
import SupplierPdf from "./SupplierPdf";
import { PRIMARY_RED } from "./utils";

/**
 * SupplierList - Main component for displaying supplier products list
 * Refactored to use custom hooks and components
 */
const SupplierList = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("userData"));
  const isAdmin = user?.role === "admin";

  const {
    // Data
    products,
    meta,
    tags,
    categories,
    countries,
    filters,
    paginationModel,

    // Loading states
    isLoading,

    // UI states
    searchInput,
    showFilters,
    setShowFilters,
    viewMode,
    setViewMode,
    pdfOpen,
    setPdfOpen,
    hasActiveFilters,

    // Handlers
    handleSearchChange,
    handleDelete,
    handlePageChange,
    handleCategoryFilter,
    handleTagFilter,
    handleTagsChange,
    handleCountryChange,
    handleSortChange,
    handleResetFilters,
  } = useSupplierProducts();

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h5" sx={{ fontFamily: "Kanit", fontWeight: 600, color: PRIMARY_RED }}>
          Supplier Products
        </Typography>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<MdPictureAsPdf />}
            onClick={() => setPdfOpen(true)}
            sx={{
              fontFamily: "Kanit",
              borderColor: PRIMARY_RED,
              color: PRIMARY_RED,
            }}
          >
            Export PDF
          </Button>
          <Button
            variant="contained"
            startIcon={<MdAdd />}
            onClick={() => navigate("/supplier/create")}
            sx={{ fontFamily: "Kanit", bgcolor: PRIMARY_RED }}
          >
            เพิ่มสินค้า
          </Button>
        </Box>
      </Box>

      {/* Search & Filter Bar */}
      <Box sx={{ display: "flex", gap: 2, mb: 2, alignItems: "center" }}>
        <SearchBar
          value={searchInput}
          onChange={handleSearchChange}
          placeholder="ค้นหาชื่อสินค้า, SKU, Supplier..."
        />
        <Tooltip title="ตัวกรอง">
          <IconButton
            onClick={() => setShowFilters(!showFilters)}
            sx={{ color: hasActiveFilters ? PRIMARY_RED : "inherit" }}
          >
            <MdFilterList size={24} />
          </IconButton>
        </Tooltip>
        <ToggleButtonGroup
          size="small"
          value={viewMode}
          exclusive
          onChange={(e, v) => v && setViewMode(v)}
        >
          <ToggleButton value="grid">
            <MdGridView />
          </ToggleButton>
          <ToggleButton value="list">
            <MdViewList />
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Filter Panel */}
      {showFilters && (
        <FilterPanel
          filters={filters}
          categories={categories}
          countries={countries}
          tags={tags}
          hasActiveFilters={hasActiveFilters}
          onCategoryChange={handleCategoryFilter}
          onCountryChange={handleCountryChange}
          onSortChange={(field, dir) => handleSortChange(field, dir)}
          onTagClick={handleTagsChange}
          onResetFilters={handleResetFilters}
        />
      )}

      {/* Loading */}
      {isLoading && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress sx={{ color: PRIMARY_RED }} />
        </Box>
      )}

      {/* Empty state */}
      {!isLoading && products.length === 0 && (
        <Alert severity="info" sx={{ fontFamily: "Kanit" }}>
          ไม่พบสินค้า{" "}
          {hasActiveFilters ? "— ลองเปลี่ยนตัวกรองหรือคำค้นหา" : "— เพิ่มสินค้าใหม่เลย!"}
        </Alert>
      )}

      {/* Product Grid */}
      {!isLoading && products.length > 0 && viewMode === "grid" && (
        <Grid container spacing={2}>
          {products.map((product) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={product.sp_id}>
              <ProductCard product={product} onDelete={handleDelete} isAdmin={isAdmin} />
            </Grid>
          ))}
        </Grid>
      )}

      {/* Product List View */}
      {!isLoading && products.length > 0 && viewMode === "list" && (
        <Stack spacing={1}>
          {products.map((product) => (
            <ProductListItem
              key={product.sp_id}
              product={product}
              onDelete={handleDelete}
              isAdmin={isAdmin}
            />
          ))}
        </Stack>
      )}

      {/* Pagination */}
      {meta.last_page > 1 && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
          <Pagination
            count={meta.last_page}
            page={paginationModel.page + 1}
            onChange={handlePageChange}
            color="error"
          />
        </Box>
      )}

      {/* PDF Export Dialog */}
      <SupplierPdf open={pdfOpen} onClose={() => setPdfOpen(false)} />
    </Box>
  );
};

export default SupplierList;
