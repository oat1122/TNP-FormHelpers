import React, { useState, useMemo, useCallback } from "react";
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  Font,
  PDFDownloadLink,
} from "@react-pdf/renderer";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
  Typography,
  Box,
  TextField,
  InputAdornment,
  Checkbox,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Grid,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Stepper,
  Step,
  StepLabel,
  Alert,
} from "@mui/material";
import {
  MdDownload,
  MdClose,
  MdSearch,
  MdSelectAll,
  MdDeselect,
  MdNavigateNext,
  MdNavigateBefore,
} from "react-icons/md";

const PRIMARY_RED = "#C1272D";

const getBackendOrigin = () => {
  try {
    const apiBase = import.meta.env.VITE_END_POINT_URL || "";
    return new URL(apiBase).origin;
  } catch {
    return "";
  }
};

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 10,
  },
  header: {
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 5,
    color: "#C1272D",
  },
  subHeader: {
    fontSize: 9,
    textAlign: "center",
    marginBottom: 15,
    color: "#666",
  },
  table: {
    display: "table",
    width: "100%",
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    minHeight: 30,
    alignItems: "center",
  },
  tableRowHeader: {
    flexDirection: "row",
    borderBottomWidth: 2,
    borderBottomColor: "#C1272D",
    minHeight: 28,
    alignItems: "center",
    backgroundColor: "#f9f9f9",
  },
  tableColNo: {
    width: "6%",
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  tableColImage: {
    width: "14%",
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  tableColName: {
    width: "25%",
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  tableColSku: {
    width: "12%",
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  tableColCategory: {
    width: "13%",
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  tableColPrice: {
    width: "15%",
    paddingHorizontal: 4,
    paddingVertical: 4,
    textAlign: "right",
  },
  tableColSupplier: {
    width: "15%",
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  headerText: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#333",
  },
  cellText: {
    fontSize: 8,
    color: "#444",
  },
  coverImage: {
    width: 50,
    height: 50,
    objectFit: "cover",
    borderRadius: 2,
  },
  noImage: {
    width: 50,
    height: 50,
    backgroundColor: "#f0f0f0",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  noImageText: {
    fontSize: 6,
    color: "#999",
  },
  priceText: {
    fontSize: 8,
    color: "#C1272D",
    fontWeight: "bold",
    textAlign: "right",
  },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 30,
    right: 30,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 7,
    color: "#999",
  },
  tierText: {
    fontSize: 6,
    color: "#777",
    marginTop: 2,
  },
});

const formatPrice = (price) => {
  if (!price) return "-";
  return new Intl.NumberFormat("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);
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

const SupplierPdfDocument = ({ products }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Text style={styles.header}>Supplier Product List</Text>
      <Text style={styles.subHeader}>
        Generated: {new Date().toLocaleDateString("th-TH")} | Total:{" "}
        {products.length} items
      </Text>

      <View style={styles.table}>
        {/* Header Row */}
        <View style={styles.tableRowHeader}>
          <View style={styles.tableColNo}>
            <Text style={styles.headerText}>#</Text>
          </View>
          <View style={styles.tableColImage}>
            <Text style={styles.headerText}>Image</Text>
          </View>
          <View style={styles.tableColName}>
            <Text style={styles.headerText}>Product Name</Text>
          </View>
          <View style={styles.tableColSku}>
            <Text style={styles.headerText}>SKU</Text>
          </View>
          <View style={styles.tableColCategory}>
            <Text style={styles.headerText}>Category</Text>
          </View>
          <View style={styles.tableColPrice}>
            <Text style={styles.headerText}>Price (THB)</Text>
          </View>
          <View style={styles.tableColSupplier}>
            <Text style={styles.headerText}>Supplier</Text>
          </View>
        </View>

        {/* Data Rows */}
        {products.map((product, index) => {
          const coverUrl = getCoverImageUrl(product);
          return (
            <View style={styles.tableRow} key={product.sp_id} wrap={false}>
              <View style={styles.tableColNo}>
                <Text style={styles.cellText}>{index + 1}</Text>
              </View>
              <View style={styles.tableColImage}>
                {coverUrl ? (
                  <Image src={coverUrl} style={styles.coverImage} />
                ) : (
                  <View style={styles.noImage}>
                    <Text style={styles.noImageText}>No Image</Text>
                  </View>
                )}
              </View>
              <View style={styles.tableColName}>
                <Text style={styles.cellText}>{product.sp_name}</Text>
                {product.price_tiers?.length > 0 && (
                  <Text style={styles.tierText}>
                    {product.price_tiers.length} price tier(s)
                  </Text>
                )}
              </View>
              <View style={styles.tableColSku}>
                <Text style={styles.cellText}>{product.sp_sku || "-"}</Text>
              </View>
              <View style={styles.tableColCategory}>
                <Text style={styles.cellText}>
                  {product.category?.mpc_name || "-"}
                </Text>
              </View>
              <View style={styles.tableColPrice}>
                <Text style={styles.priceText}>
                  {formatPrice(product.sp_price_thb || product.sp_base_price)}
                </Text>
                {product.sp_currency !== "THB" && (
                  <Text style={styles.tierText}>
                    ({product.sp_currency} {formatPrice(product.sp_base_price)})
                  </Text>
                )}
              </View>
              <View style={styles.tableColSupplier}>
                <Text style={styles.cellText}>
                  {product.sp_supplier_name || "-"}
                </Text>
              </View>
            </View>
          );
        })}
      </View>

      {/* Footer */}
      <View style={styles.footer} fixed>
        <Text>TNP Supplier System</Text>
        <Text
          render={({ pageNumber, totalPages }) =>
            `Page ${pageNumber} / ${totalPages}`
          }
        />
      </View>
    </Page>
  </Document>
);

const STEPS = ["กรองและเลือกสินค้า", "ดาวน์โหลด PDF"];

const SupplierPdf = ({ open, onClose, products, tags = [], categories = [] }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterTags, setFilterTags] = useState([]);
  const [filterCountry, setFilterCountry] = useState("");
  const [filterSupplier, setFilterSupplier] = useState("");

  // Reset state when dialog opens
  const handleClose = () => {
    setActiveStep(0);
    setSelected([]);
    setSearch("");
    setFilterCategory("");
    setFilterTags([]);
    setFilterCountry("");
    setFilterSupplier("");
    onClose();
  };

  // Filtered products
  const filteredProducts = useMemo(() => {
    let result = products || [];

    if (search) {
      const s = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.sp_name?.toLowerCase().includes(s) ||
          p.sp_sku?.toLowerCase().includes(s) ||
          p.sp_supplier_name?.toLowerCase().includes(s)
      );
    }

    if (filterCategory) {
      result = result.filter((p) => p.sp_mpc_id === filterCategory);
    }

    if (filterTags.length > 0) {
      result = result.filter((p) =>
        p.tags?.some((t) => filterTags.includes(t.spt_id))
      );
    }

    if (filterCountry) {
      result = result.filter((p) => p.sp_origin_country === filterCountry);
    }

    if (filterSupplier) {
      const s = filterSupplier.toLowerCase();
      result = result.filter((p) =>
        p.sp_supplier_name?.toLowerCase().includes(s)
      );
    }

    return result;
  }, [products, search, filterCategory, filterTags, filterCountry, filterSupplier]);

  // Selection helpers
  const handleToggle = useCallback((id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  }, []);

  const handleSelectAll = () => {
    setSelected(filteredProducts.map((p) => p.sp_id));
  };

  const handleDeselectAll = () => {
    setSelected([]);
  };

  const handleTagFilter = (tagId) => {
    setFilterTags((prev) =>
      prev.includes(tagId) ? prev.filter((t) => t !== tagId) : [...prev, tagId]
    );
  };

  // Selected products for PDF
  const selectedProducts = useMemo(
    () => products?.filter((p) => selected.includes(p.sp_id)) || [],
    [products, selected]
  );

  // Unique supplier names for filter
  const supplierNames = useMemo(() => {
    const names = [...new Set((products || []).map((p) => p.sp_supplier_name).filter(Boolean))];
    return names.sort();
  }, [products]);

  if (!open) return null;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontFamily: "Kanit", fontWeight: 600, pb: 1 }}>
        Export PDF
      </DialogTitle>

      <Box sx={{ px: 3, pb: 1 }}>
        <Stepper activeStep={activeStep} alternativeLabel>
          {STEPS.map((label) => (
            <Step key={label}>
              <StepLabel
                sx={{
                  "& .MuiStepLabel-label": { fontFamily: "Kanit", fontSize: 13 },
                }}
              >
                {label}
              </StepLabel>
            </Step>
          ))}
        </Stepper>
      </Box>

      <DialogContent sx={{ minHeight: 420 }}>
        {/* ==================== Step 1: Filter & Select ==================== */}
        {activeStep === 0 && (
          <Box>
            {/* Filters */}
            <Grid container spacing={1.5} sx={{ mb: 2 }}>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="ค้นหาชื่อ, SKU..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <MdSearch size={18} />
                      </InputAdornment>
                    ),
                    style: { fontFamily: "Kanit", fontSize: 13 },
                  }}
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <FormControl fullWidth size="small">
                  <InputLabel sx={{ fontFamily: "Kanit", fontSize: 13 }}>
                    หมวดหมู่
                  </InputLabel>
                  <Select
                    value={filterCategory}
                    label="หมวดหมู่"
                    onChange={(e) => setFilterCategory(e.target.value)}
                    sx={{ fontFamily: "Kanit", fontSize: 13 }}
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
              <Grid item xs={6} sm={3}>
                <FormControl fullWidth size="small">
                  <InputLabel sx={{ fontFamily: "Kanit", fontSize: 13 }}>
                    ประเทศ
                  </InputLabel>
                  <Select
                    value={filterCountry}
                    label="ประเทศ"
                    onChange={(e) => setFilterCountry(e.target.value)}
                    sx={{ fontFamily: "Kanit", fontSize: 13 }}
                  >
                    <MenuItem value="" sx={{ fontFamily: "Kanit" }}>
                      ทั้งหมด
                    </MenuItem>
                    <MenuItem value="ไทย" sx={{ fontFamily: "Kanit" }}>
                      ไทย
                    </MenuItem>
                    <MenuItem value="ต่างประเทศ" sx={{ fontFamily: "Kanit" }}>
                      ต่างประเทศ
                    </MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={2}>
                <FormControl fullWidth size="small">
                  <InputLabel sx={{ fontFamily: "Kanit", fontSize: 13 }}>
                    Supplier
                  </InputLabel>
                  <Select
                    value={filterSupplier}
                    label="Supplier"
                    onChange={(e) => setFilterSupplier(e.target.value)}
                    sx={{ fontFamily: "Kanit", fontSize: 13 }}
                  >
                    <MenuItem value="" sx={{ fontFamily: "Kanit" }}>
                      ทั้งหมด
                    </MenuItem>
                    {supplierNames.map((name) => (
                      <MenuItem
                        key={name}
                        value={name}
                        sx={{ fontFamily: "Kanit" }}
                      >
                        {name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            {/* Tags */}
            {tags.length > 0 && (
              <Box sx={{ mb: 1.5, display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                {tags.map((tag) => (
                  <Chip
                    key={tag.spt_id}
                    label={tag.spt_name}
                    size="small"
                    onClick={() => handleTagFilter(tag.spt_id)}
                    color={filterTags.includes(tag.spt_id) ? "error" : "default"}
                    variant={filterTags.includes(tag.spt_id) ? "filled" : "outlined"}
                    sx={{ fontFamily: "Kanit", fontSize: 11 }}
                  />
                ))}
              </Box>
            )}

            <Divider sx={{ mb: 1 }} />

            {/* Select All / Deselect */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 1,
              }}
            >
              <Typography
                variant="body2"
                sx={{ fontFamily: "Kanit", color: "text.secondary" }}
              >
                พบ {filteredProducts.length} รายการ — เลือกแล้ว{" "}
                <strong style={{ color: PRIMARY_RED }}>{selected.length}</strong>{" "}
                รายการ
              </Typography>
              <Box sx={{ display: "flex", gap: 1 }}>
                <Button
                  size="small"
                  startIcon={<MdSelectAll />}
                  onClick={handleSelectAll}
                  sx={{ fontFamily: "Kanit", fontSize: 12 }}
                >
                  เลือกทั้งหมด
                </Button>
                <Button
                  size="small"
                  startIcon={<MdDeselect />}
                  onClick={handleDeselectAll}
                  sx={{ fontFamily: "Kanit", fontSize: 12 }}
                >
                  ยกเลิกทั้งหมด
                </Button>
              </Box>
            </Box>

            {/* Product List */}
            <List
              dense
              sx={{
                maxHeight: 280,
                overflow: "auto",
                border: "1px solid #eee",
                borderRadius: 1,
              }}
            >
              {filteredProducts.length === 0 && (
                <ListItem>
                  <ListItemText
                    primary="ไม่พบสินค้า"
                    primaryTypographyProps={{ fontFamily: "Kanit", color: "text.secondary", textAlign: "center" }}
                  />
                </ListItem>
              )}
              {filteredProducts.map((product) => {
                const coverUrl = getCoverImageUrl(product);
                const isSelected = selected.includes(product.sp_id);
                return (
                  <ListItemButton
                    key={product.sp_id}
                    onClick={() => handleToggle(product.sp_id)}
                    selected={isSelected}
                    sx={{
                      borderBottom: "1px solid #f5f5f5",
                      "&.Mui-selected": { bgcolor: "#fff5f5" },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <Checkbox
                        edge="start"
                        checked={isSelected}
                        tabIndex={-1}
                        disableRipple
                        sx={{ color: PRIMARY_RED, "&.Mui-checked": { color: PRIMARY_RED } }}
                      />
                    </ListItemIcon>
                    <ListItemAvatar sx={{ minWidth: 48 }}>
                      {coverUrl ? (
                        <Avatar
                          variant="rounded"
                          src={coverUrl}
                          sx={{ width: 40, height: 40 }}
                        />
                      ) : (
                        <Avatar
                          variant="rounded"
                          sx={{ width: 40, height: 40, bgcolor: "#f0f0f0", fontSize: 10, color: "#999" }}
                        >
                          N/A
                        </Avatar>
                      )}
                    </ListItemAvatar>
                    <ListItemText
                      primary={product.sp_name}
                      secondary={[
                        product.sp_sku && `SKU: ${product.sp_sku}`,
                        product.category?.mpc_name,
                        product.sp_supplier_name,
                      ]
                        .filter(Boolean)
                        .join(" | ")}
                      primaryTypographyProps={{
                        fontFamily: "Kanit",
                        fontSize: 13,
                        fontWeight: 500,
                      }}
                      secondaryTypographyProps={{
                        fontFamily: "Kanit",
                        fontSize: 11,
                      }}
                    />
                    <Typography
                      variant="body2"
                      sx={{
                        fontFamily: "Kanit",
                        fontWeight: 600,
                        color: PRIMARY_RED,
                        whiteSpace: "nowrap",
                        ml: 1,
                      }}
                    >
                      {formatPrice(product.sp_price_thb || product.sp_base_price)}
                    </Typography>
                  </ListItemButton>
                );
              })}
            </List>
          </Box>
        )}

        {/* ==================== Step 2: Download ==================== */}
        {activeStep === 1 && (
          <Box sx={{ textAlign: "center", py: 3 }}>
            <Typography
              variant="h6"
              sx={{ fontFamily: "Kanit", mb: 1 }}
            >
              พร้อมสร้าง PDF
            </Typography>
            <Typography
              variant="body2"
              sx={{ fontFamily: "Kanit", mb: 2, color: "text.secondary" }}
            >
              จำนวน {selectedProducts.length} สินค้าที่เลือก
            </Typography>
            <Alert
              severity="info"
              sx={{ fontFamily: "Kanit", mb: 2, mx: "auto", maxWidth: 400 }}
            >
              PDF จะแสดงเฉพาะรูปปกของสินค้าเท่านั้น
            </Alert>

            <PDFDownloadLink
              document={<SupplierPdfDocument products={selectedProducts} />}
              fileName={`supplier-products-${new Date().toISOString().slice(0, 10)}.pdf`}
              style={{ textDecoration: "none" }}
            >
              {({ loading }) => (
                <Button
                  variant="contained"
                  size="large"
                  startIcon={
                    loading ? <CircularProgress size={20} /> : <MdDownload />
                  }
                  disabled={loading}
                  sx={{ fontFamily: "Kanit", bgcolor: PRIMARY_RED, px: 4 }}
                >
                  {loading ? "กำลังสร้าง PDF..." : "ดาวน์โหลด PDF"}
                </Button>
              )}
            </PDFDownloadLink>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} sx={{ fontFamily: "Kanit" }}>
          ยกเลิก
        </Button>
        <Box sx={{ flex: 1 }} />
        {activeStep === 1 && (
          <Button
            startIcon={<MdNavigateBefore />}
            onClick={() => setActiveStep(0)}
            sx={{ fontFamily: "Kanit" }}
          >
            ย้อนกลับ
          </Button>
        )}
        {activeStep === 0 && (
          <Button
            variant="contained"
            endIcon={<MdNavigateNext />}
            onClick={() => setActiveStep(1)}
            disabled={selected.length === 0}
            sx={{ fontFamily: "Kanit", bgcolor: PRIMARY_RED }}
          >
            ถัดไป ({selected.length})
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default SupplierPdf;
