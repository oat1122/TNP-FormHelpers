import React, { useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  Box,
  Typography,
  Button,
  TextField,
  InputAdornment,
  Chip,
  IconButton,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Grid,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Pagination,
  Stack,
  Alert,
  CircularProgress,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import {
  MdSearch,
  MdAdd,
  MdEdit,
  MdDelete,
  MdPictureAsPdf,
  MdFilterList,
  MdClose,
  MdViewList,
  MdGridView,
  MdSort,
} from "react-icons/md";
import Swal from "sweetalert2";

import {
  useGetProductsQuery,
  useDeleteProductMutation,
  useGetTagsQuery,
} from "../../features/Superlist/supplierApi";
import { useGetAllProductCateQuery } from "../../features/globalApi";
import {
  setFilters,
  resetFilters,
  setPaginationModel,
} from "../../features/Superlist/supplierSlice";
import SupplierPdf from "./SupplierPdf";

const PRIMARY_RED = "#C1272D";

const getBackendOrigin = () => {
  try {
    const apiBase = import.meta.env.VITE_END_POINT_URL || "";
    return new URL(apiBase).origin;
  } catch {
    return "";
  }
};

const SupplierList = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = JSON.parse(localStorage.getItem("userData"));
  const isAdmin = user?.role === "admin";

  const { filters, paginationModel } = useSelector((state) => state.supplier);

  const [searchInput, setSearchInput] = useState(filters.search || "");
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState("grid");
  const [pdfOpen, setPdfOpen] = useState(false);

  // Debounce search
  const [searchTimeout, setSearchTimeout] = useState(null);
  const handleSearchChange = useCallback(
    (e) => {
      const value = e.target.value;
      setSearchInput(value);
      if (searchTimeout) clearTimeout(searchTimeout);
      const timeout = setTimeout(() => {
        dispatch(setFilters({ search: value }));
        dispatch(setPaginationModel({ ...paginationModel, page: 0 }));
      }, 300);
      setSearchTimeout(timeout);
    },
    [dispatch, paginationModel, searchTimeout]
  );

  // API Queries
  const {
    data: productsData,
    isLoading,
    isFetching,
  } = useGetProductsQuery({
    ...filters,
    tags: filters.tags?.join(",") || undefined,
    page: paginationModel.page,
    per_page: paginationModel.pageSize,
  });

  const { data: tagsData } = useGetTagsQuery();
  const { data: categoriesData } = useGetAllProductCateQuery();

  const [deleteProduct] = useDeleteProductMutation();

  const products = productsData?.data || [];
  const meta = productsData?.meta || {};
  const tags = tagsData?.data || [];
  const categories = categoriesData?.data || [];

  const handleDelete = async (product) => {
    const result = await Swal.fire({
      title: "ยืนยันการลบ",
      text: `ต้องการลบสินค้า "${product.sp_name}" หรือไม่?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: PRIMARY_RED,
      confirmButtonText: "ลบ",
      cancelButtonText: "ยกเลิก",
    });

    if (result.isConfirmed) {
      try {
        await deleteProduct(product.sp_id).unwrap();
        Swal.fire("สำเร็จ", "ลบสินค้าแล้ว", "success");
      } catch (err) {
        Swal.fire("ผิดพลาด", err?.data?.message || "ลบไม่สำเร็จ", "error");
      }
    }
  };

  const handlePageChange = (event, value) => {
    dispatch(setPaginationModel({ ...paginationModel, page: value - 1 }));
  };

  const handleCategoryFilter = (categoryId) => {
    dispatch(
      setFilters({
        category: filters.category === categoryId ? "" : categoryId,
      })
    );
    dispatch(setPaginationModel({ ...paginationModel, page: 0 }));
  };

  const handleTagFilter = (tagId) => {
    const currentTags = filters.tags || [];
    const newTags = currentTags.includes(tagId)
      ? currentTags.filter((t) => t !== tagId)
      : [...currentTags, tagId];
    dispatch(setFilters({ tags: newTags }));
    dispatch(setPaginationModel({ ...paginationModel, page: 0 }));
  };

  const handleSortChange = (field) => {
    const newDir =
      filters.sort_by === field && filters.sort_dir === "asc" ? "desc" : "asc";
    dispatch(setFilters({ sort_by: field, sort_dir: newDir }));
  };

  const handleResetFilters = () => {
    dispatch(resetFilters());
    setSearchInput("");
    dispatch(setPaginationModel({ pageSize: 20, page: 0 }));
  };

  const getCoverImageUrl = (product) => {
    if (product.sp_cover_image) {
      return `${getBackendOrigin()}/storage/${product.sp_cover_image}`;
    }
    const coverImg = product.images?.find((img) => img.spi_is_cover);
    if (coverImg) {
      return `${getBackendOrigin()}/storage/${coverImg.spi_file_path}`;
    }
    return null;
  };

  const formatPrice = (price, currency = "THB") => {
    if (!price) return "-";
    return new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 2,
    }).format(price);
  };

  const hasActiveFilters =
    filters.search ||
    filters.category ||
    (filters.tags && filters.tags.length > 0) ||
    filters.country ||
    filters.currency;

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
        <Typography
          variant="h5"
          sx={{ fontFamily: "Kanit", fontWeight: 600, color: PRIMARY_RED }}
        >
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
        <TextField
          size="small"
          placeholder="ค้นหาชื่อสินค้า, SKU, Supplier..."
          value={searchInput}
          onChange={handleSearchChange}
          sx={{ flex: 1, fontFamily: "Kanit" }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <MdSearch size={20} />
              </InputAdornment>
            ),
            style: { fontFamily: "Kanit", fontSize: 14 },
          }}
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
        <Card sx={{ p: 2, mb: 2 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 1,
            }}
          >
            <Typography
              variant="subtitle2"
              sx={{ fontFamily: "Kanit", fontWeight: 600 }}
            >
              ตัวกรอง
            </Typography>
            {hasActiveFilters && (
              <Button
                size="small"
                onClick={handleResetFilters}
                sx={{ fontFamily: "Kanit", color: PRIMARY_RED }}
              >
                ล้างตัวกรอง
              </Button>
            )}
          </Box>

          <Grid container spacing={2}>
            {/* Category Filter */}
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small">
                <InputLabel sx={{ fontFamily: "Kanit" }}>
                  หมวดหมู่
                </InputLabel>
                <Select
                  value={filters.category || ""}
                  label="หมวดหมู่"
                  onChange={(e) =>
                    handleCategoryFilter(e.target.value)
                  }
                  sx={{ fontFamily: "Kanit" }}
                >
                  <MenuItem value="" sx={{ fontFamily: "Kanit" }}>
                    ทั้งหมด
                  </MenuItem>
                  {categories.map((cat) => (
                    <MenuItem
                      key={cat.mpc_id}
                      value={cat.mpc_id}
                      sx={{ fontFamily: "Kanit" }}
                    >
                      {cat.mpc_name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Country Filter */}
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small">
                <InputLabel sx={{ fontFamily: "Kanit" }}>
                  ประเทศต้นทาง
                </InputLabel>
                <Select
                  value={filters.country || ""}
                  label="ประเทศต้นทาง"
                  onChange={(e) =>
                    dispatch(
                      setFilters({ country: e.target.value })
                    )
                  }
                  sx={{ fontFamily: "Kanit" }}
                >
                  <MenuItem value="" sx={{ fontFamily: "Kanit" }}>
                    ทั้งหมด
                  </MenuItem>
                  <MenuItem value="ไทย" sx={{ fontFamily: "Kanit" }}>
                    ไทย
                  </MenuItem>
                  <MenuItem
                    value="ต่างประเทศ"
                    sx={{ fontFamily: "Kanit" }}
                  >
                    ต่างประเทศ
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Sort */}
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small">
                <InputLabel sx={{ fontFamily: "Kanit" }}>
                  เรียงตาม
                </InputLabel>
                <Select
                  value={`${filters.sort_by}_${filters.sort_dir}`}
                  label="เรียงตาม"
                  onChange={(e) => {
                    const [field, dir] = e.target.value.split("_");
                    dispatch(
                      setFilters({ sort_by: field, sort_dir: dir })
                    );
                  }}
                  sx={{ fontFamily: "Kanit" }}
                >
                  <MenuItem
                    value="created_at_desc"
                    sx={{ fontFamily: "Kanit" }}
                  >
                    ใหม่ล่าสุด
                  </MenuItem>
                  <MenuItem
                    value="created_at_asc"
                    sx={{ fontFamily: "Kanit" }}
                  >
                    เก่าสุด
                  </MenuItem>
                  <MenuItem
                    value="sp_name_asc"
                    sx={{ fontFamily: "Kanit" }}
                  >
                    ชื่อ A-Z
                  </MenuItem>
                  <MenuItem
                    value="sp_name_desc"
                    sx={{ fontFamily: "Kanit" }}
                  >
                    ชื่อ Z-A
                  </MenuItem>
                  <MenuItem
                    value="sp_price_thb_asc"
                    sx={{ fontFamily: "Kanit" }}
                  >
                    ราคาน้อย-มาก
                  </MenuItem>
                  <MenuItem
                    value="sp_price_thb_desc"
                    sx={{ fontFamily: "Kanit" }}
                  >
                    ราคามาก-น้อย
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          {/* Tags */}
          {tags.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography
                variant="caption"
                sx={{ fontFamily: "Kanit", mb: 1, display: "block" }}
              >
                Tags:
              </Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                {tags.map((tag) => (
                  <Chip
                    key={tag.spt_id}
                    label={tag.spt_name}
                    size="small"
                    onClick={() => handleTagFilter(tag.spt_id)}
                    color={
                      filters.tags?.includes(tag.spt_id)
                        ? "error"
                        : "default"
                    }
                    variant={
                      filters.tags?.includes(tag.spt_id)
                        ? "filled"
                        : "outlined"
                    }
                    sx={{ fontFamily: "Kanit", fontSize: 12 }}
                  />
                ))}
              </Box>
            </Box>
          )}
        </Card>
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
          {hasActiveFilters
            ? "— ลองเปลี่ยนตัวกรองหรือคำค้นหา"
            : "— เพิ่มสินค้าใหม่เลย!"}
        </Alert>
      )}

      {/* Product Grid */}
      {!isLoading && products.length > 0 && viewMode === "grid" && (
        <Grid container spacing={2}>
          {products.map((product) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={product.sp_id}>
              <Card
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  cursor: "pointer",
                  transition: "box-shadow 0.2s",
                  "&:hover": { boxShadow: 4 },
                }}
                onClick={() =>
                  navigate(`/supplier/view/${product.sp_id}`)
                }
              >
                {getCoverImageUrl(product) ? (
                  <CardMedia
                    component="img"
                    height="180"
                    image={getCoverImageUrl(product)}
                    alt={product.sp_name}
                    sx={{ objectFit: "cover" }}
                  />
                ) : (
                  <Box
                    sx={{
                      height: 180,
                      bgcolor: "#f5f5f5",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ fontFamily: "Kanit" }}
                    >
                      ไม่มีรูป
                    </Typography>
                  </Box>
                )}
                <CardContent sx={{ flexGrow: 1, pb: 0 }}>
                  <Typography
                    variant="subtitle2"
                    sx={{
                      fontFamily: "Kanit",
                      fontWeight: 600,
                      mb: 0.5,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {product.sp_name}
                  </Typography>
                  {product.sp_sku && (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ fontFamily: "Kanit" }}
                    >
                      SKU: {product.sp_sku}
                    </Typography>
                  )}
                  <Typography
                    variant="body2"
                    sx={{
                      fontFamily: "Kanit",
                      fontWeight: 600,
                      color: PRIMARY_RED,
                      mt: 0.5,
                    }}
                  >
                    {product.sp_currency !== "THB" && product.sp_price_thb
                      ? `${formatPrice(product.sp_base_price, product.sp_currency)} (${formatPrice(product.sp_price_thb)})`
                      : formatPrice(
                          product.sp_price_thb || product.sp_base_price
                        )}
                  </Typography>
                  {product.category && (
                    <Chip
                      label={product.category.mpc_name}
                      size="small"
                      sx={{
                        mt: 0.5,
                        fontFamily: "Kanit",
                        fontSize: 11,
                      }}
                    />
                  )}
                  {product.tags?.length > 0 && (
                    <Box
                      sx={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 0.3,
                        mt: 0.5,
                      }}
                    >
                      {product.tags.slice(0, 3).map((tag) => (
                        <Chip
                          key={tag.spt_id}
                          label={tag.spt_name}
                          size="small"
                          variant="outlined"
                          sx={{ fontFamily: "Kanit", fontSize: 10 }}
                        />
                      ))}
                      {product.tags.length > 3 && (
                        <Chip
                          label={`+${product.tags.length - 3}`}
                          size="small"
                          variant="outlined"
                          sx={{ fontFamily: "Kanit", fontSize: 10 }}
                        />
                      )}
                    </Box>
                  )}
                </CardContent>
                <CardActions sx={{ justifyContent: "flex-end", pt: 0 }}>
                  <Tooltip title="แก้ไข">
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/supplier/edit/${product.sp_id}`);
                      }}
                    >
                      <MdEdit size={18} />
                    </IconButton>
                  </Tooltip>
                  {isAdmin && (
                    <Tooltip title="ลบ">
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(product);
                        }}
                        sx={{ color: PRIMARY_RED }}
                      >
                        <MdDelete size={18} />
                      </IconButton>
                    </Tooltip>
                  )}
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Product List View */}
      {!isLoading && products.length > 0 && viewMode === "list" && (
        <Stack spacing={1}>
          {products.map((product) => (
            <Card
              key={product.sp_id}
              sx={{
                display: "flex",
                alignItems: "center",
                p: 1.5,
                cursor: "pointer",
                "&:hover": { boxShadow: 3 },
              }}
              onClick={() =>
                navigate(`/supplier/view/${product.sp_id}`)
              }
            >
              {getCoverImageUrl(product) ? (
                <CardMedia
                  component="img"
                  sx={{
                    width: 80,
                    height: 80,
                    borderRadius: 1,
                    objectFit: "cover",
                    mr: 2,
                  }}
                  image={getCoverImageUrl(product)}
                  alt={product.sp_name}
                />
              ) : (
                <Box
                  sx={{
                    width: 80,
                    height: 80,
                    borderRadius: 1,
                    bgcolor: "#f5f5f5",
                    mr: 2,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ fontFamily: "Kanit", fontSize: 10 }}
                  >
                    ไม่มีรูป
                  </Typography>
                </Box>
              )}
              <Box sx={{ flex: 1 }}>
                <Typography
                  variant="subtitle2"
                  sx={{ fontFamily: "Kanit", fontWeight: 600 }}
                >
                  {product.sp_name}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontFamily: "Kanit" }}
                >
                  {product.sp_sku && `SKU: ${product.sp_sku} | `}
                  {product.sp_supplier_name &&
                    `Supplier: ${product.sp_supplier_name}`}
                </Typography>
                <Box
                  sx={{
                    display: "flex",
                    gap: 0.5,
                    mt: 0.5,
                    flexWrap: "wrap",
                  }}
                >
                  {product.category && (
                    <Chip
                      label={product.category.mpc_name}
                      size="small"
                      sx={{ fontFamily: "Kanit", fontSize: 11 }}
                    />
                  )}
                  {product.tags?.slice(0, 3).map((tag) => (
                    <Chip
                      key={tag.spt_id}
                      label={tag.spt_name}
                      size="small"
                      variant="outlined"
                      sx={{ fontFamily: "Kanit", fontSize: 10 }}
                    />
                  ))}
                </Box>
              </Box>
              <Box sx={{ textAlign: "right", mr: 1 }}>
                <Typography
                  variant="body2"
                  sx={{
                    fontFamily: "Kanit",
                    fontWeight: 600,
                    color: PRIMARY_RED,
                  }}
                >
                  {formatPrice(
                    product.sp_price_thb || product.sp_base_price
                  )}
                </Typography>
                {product.sp_currency !== "THB" && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ fontFamily: "Kanit" }}
                  >
                    {formatPrice(
                      product.sp_base_price,
                      product.sp_currency
                    )}
                  </Typography>
                )}
              </Box>
              <Box>
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/supplier/edit/${product.sp_id}`);
                  }}
                >
                  <MdEdit size={18} />
                </IconButton>
                {isAdmin && (
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(product);
                    }}
                    sx={{ color: PRIMARY_RED }}
                  >
                    <MdDelete size={18} />
                  </IconButton>
                )}
              </Box>
            </Card>
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

      {/* PDF Dialog */}
      <SupplierPdf
        open={pdfOpen}
        onClose={() => setPdfOpen(false)}
        products={products}
        tags={tags}
        categories={categories}
      />
    </Box>
  );
};

export default SupplierList;
