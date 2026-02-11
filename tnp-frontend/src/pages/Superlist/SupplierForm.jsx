import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import {
  Box,
  Typography,
  Button,
  TextField,
  Grid,
  Card,
  CardContent,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Chip,
  IconButton,
  Tooltip,
  Divider,
  Autocomplete,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Checkbox,
  FormControlLabel,
  CircularProgress,
  Alert,
  ImageList,
  ImageListItem,
  ImageListItemBar,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
  RadioGroup,
  Radio,
  FormLabel,
} from "@mui/material";
import {
  MdArrowBack,
  MdSave,
  MdAdd,
  MdDelete,
  MdImage,
  MdStar,
  MdStarBorder,
  MdAutoFixHigh,
  MdCurrencyExchange,
  MdClose,
  MdEdit,
} from "react-icons/md";
import Swal from "sweetalert2";

import {
  useGetProductQuery,
  useAddProductMutation,
  useUpdateProductMutation,
  useUploadImagesMutation,
  useSetCoverImageMutation,
  useDeleteImageMutation,
  useLazyConvertCurrencyQuery,
  useGetTagsQuery,
  useAddTagMutation,
  useGetCategoriesQuery,
  useLazyGetNextSkuQuery,
} from "../../features/Superlist/supplierApi";
import CategoryDialog from "./CategoryDialog";

const PRIMARY_RED = "#C1272D";

const getBackendOrigin = () => {
  try {
    const apiBase = import.meta.env.VITE_END_POINT_URL || "";
    return new URL(apiBase).origin;
  } catch {
    return "";
  }
};

const CURRENCIES = [
  { code: "THB", label: "THB - บาท" },
  { code: "USD", label: "USD - ดอลลาร์สหรัฐ" },
  { code: "EUR", label: "EUR - ยูโร" },
  { code: "GBP", label: "GBP - ปอนด์" },
  { code: "JPY", label: "JPY - เยน" },
  { code: "CNY", label: "CNY - หยวน" },
  { code: "KRW", label: "KRW - วอน" },
  { code: "SGD", label: "SGD - ดอลลาร์สิงคโปร์" },
  { code: "MYR", label: "MYR - ริงกิต" },
  { code: "VND", label: "VND - ด่อง" },
];

// Helper: TextField ที่แสดงตัวเลขมี comma คั่นหลัก
const formatWithCommas = (val) => {
  if (val === "" || val == null) return "";
  const num = String(val);
  const parts = num.split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return parts.join(".");
};

const stripCommas = (val) => String(val).replace(/,/g, "");

const NumericTextField = ({ value, onChange, decimal = true, ...props }) => {
  const [focused, setFocused] = React.useState(false);
  const [localVal, setLocalVal] = React.useState("");

  const displayValue = focused ? localVal : formatWithCommas(value);

  const handleFocus = (e) => {
    setLocalVal(value == null ? "" : String(value));
    setFocused(true);
    props.onFocus?.(e);
  };

  const handleBlur = (e) => {
    setFocused(false);
    const raw = stripCommas(localVal);
    if (onChange) onChange(raw);
    props.onBlur?.(e);
  };

  const handleChange = (e) => {
    const raw = e.target.value;
    const pattern = decimal ? /^-?\d*\.?\d*$/ : /^-?\d*$/;
    if (raw === "" || pattern.test(raw)) {
      setLocalVal(raw);
    }
  };

  return (
    <TextField
      {...props}
      type="text"
      value={displayValue}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onChange={handleChange}
      inputProps={{
        ...props.inputProps,
        inputMode: decimal ? "decimal" : "numeric",
      }}
    />
  );
};

const DEFAULT_TIERS = [
  { min_qty: 1, max_qty: 99, discount: 0 },
  { min_qty: 100, max_qty: 499, discount: 5 },
  { min_qty: 500, max_qty: 999, discount: 10 },
  { min_qty: 1000, max_qty: 4999, discount: 15 },
  { min_qty: 5000, max_qty: null, discount: 20 },
];

const SupplierForm = ({ mode: propMode }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { id } = useParams();
  const user = JSON.parse(localStorage.getItem("userData"));
  const isView = propMode === "view";
  const isEdit = propMode === "edit";
  const isCreate = propMode === "create";

  // Form state
  const [form, setForm] = useState({
    sp_name: "",
    sp_description: "",
    sp_sku: "",
    sp_mpc_id: "",
    sp_origin_country: "",
    sp_supplier_name: "",
    sp_supplier_contact: "",
    sp_base_price: "",
    sp_currency: "THB",
    sp_price_thb: "",
    sp_exchange_rate: "",
    sp_exchange_date: "",
    sp_unit: "ชิ้น",
  });
  const [selectedTags, setSelectedTags] = useState([]);
  const [priceTiers, setPriceTiers] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [newImageFiles, setNewImageFiles] = useState([]);
  const [newImagePreviews, setNewImagePreviews] = useState([]);
  const [saving, setSaving] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [formulaOpen, setFormulaOpen] = useState(false);
  const [formulaMode, setFormulaMode] = useState("percent");
  const [formulaTiers, setFormulaTiers] = useState(
    DEFAULT_TIERS.map((t) => ({ ...t }))
  );

  // API
  const { data: productData, isLoading: loadingProduct } = useGetProductQuery(
    id,
    { skip: !id }
  );
  const { data: tagsData } = useGetTagsQuery();
  const { data: categoriesData } = useGetCategoriesQuery();
  const [triggerNextSku] = useLazyGetNextSkuQuery();
  const [addProduct] = useAddProductMutation();
  const [updateProduct] = useUpdateProductMutation();
  const [uploadImages] = useUploadImagesMutation();
  const [setCoverImage] = useSetCoverImageMutation();
  const [deleteImage] = useDeleteImageMutation();
  const [triggerConvert, { isFetching: convertingCurrency }] =
    useLazyConvertCurrencyQuery();
  const [addTag] = useAddTagMutation();

  const tags = tagsData?.data || [];
  const categories = categoriesData?.data?.data || categoriesData?.data || [];

  // Populate form when editing/viewing
  useEffect(() => {
    if (productData?.data && (isEdit || isView)) {
      const p = productData.data;
      setForm({
        sp_name: p.sp_name || "",
        sp_description: p.sp_description || "",
        sp_sku: p.sp_sku || "",
        sp_mpc_id: p.sp_mpc_id || "",
        sp_origin_country: p.sp_origin_country || "",
        sp_supplier_name: p.sp_supplier_name || "",
        sp_supplier_contact: p.sp_supplier_contact || "",
        sp_base_price: p.sp_base_price || "",
        sp_currency: p.sp_currency || "THB",
        sp_price_thb: p.sp_price_thb || "",
        sp_exchange_rate: p.sp_exchange_rate || "",
        sp_exchange_date: p.sp_exchange_date || "",
        sp_unit: p.sp_unit || "ชิ้น",
      });
      setSelectedTags(p.tags || []);
      setPriceTiers(
        (p.price_tiers || []).map((t) => ({
          min_qty: t.sptier_min_qty,
          max_qty: t.sptier_max_qty,
          price: t.sptier_price,
          is_auto: t.sptier_is_auto,
        }))
      );
      setExistingImages(p.images || []);
    }
  }, [productData, isEdit, isView]);

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  // Category change → auto generate SKU (create mode only)
  const handleCategoryChange = async (e) => {
    const categoryId = e.target.value;
    setForm((prev) => ({ ...prev, sp_mpc_id: categoryId }));

    if (isCreate && categoryId) {
      try {
        const res = await triggerNextSku(categoryId).unwrap();
        if (res?.data?.sku) {
          setForm((prev) => ({ ...prev, sp_sku: res.data.sku }));
        }
      } catch {
        // Silent fail — user can still type SKU manually
      }
    }
  };

  // Auto Formula — เปิด dialog
  const handleOpenFormula = () => {
    const thbPrice = parseFloat(form.sp_price_thb) || parseFloat(form.sp_base_price);
    if (!thbPrice || thbPrice <= 0) {
      Swal.fire("", "กรุณาใส่ราคาพื้นฐาน (บาท) ก่อน", "warning");
      return;
    }
    setFormulaMode("percent");
    setFormulaTiers(DEFAULT_TIERS.map((t) => ({ ...t })));
    setFormulaOpen(true);
  };

  const getFormulaPreviewPrice = (tier) => {
    const thbPrice = parseFloat(form.sp_price_thb) || parseFloat(form.sp_base_price);
    if (!thbPrice) return 0;
    if (formulaMode === "percent") {
      return parseFloat((thbPrice * (1 - (tier.discount || 0) / 100)).toFixed(2));
    }
    return parseFloat((thbPrice - (tier.discount || 0)).toFixed(2));
  };

  const handleFormulaTierChange = (index, value) => {
    setFormulaTiers((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], discount: parseFloat(value) || 0 };
      return updated;
    });
  };

  const handleFormulaTierQtyChange = (index, field, value) => {
    setFormulaTiers((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value === "" ? null : parseInt(value) };
      return updated;
    });
  };

  const handleAddFormulaTier = () => {
    const last = formulaTiers[formulaTiers.length - 1];
    setFormulaTiers((prev) => [
      ...prev,
      { min_qty: (last?.max_qty || 0) + 1, max_qty: null, discount: 0 },
    ]);
  };

  const handleRemoveFormulaTier = (index) => {
    setFormulaTiers((prev) => prev.filter((_, i) => i !== index));
  };

  const handleApplyFormula = () => {
    const thbPrice = parseFloat(form.sp_price_thb) || parseFloat(form.sp_base_price);
    const newTiers = formulaTiers.map((tier) => {
      let price;
      if (formulaMode === "percent") {
        price = parseFloat((thbPrice * (1 - (tier.discount || 0) / 100)).toFixed(2));
      } else {
        price = parseFloat((thbPrice - (tier.discount || 0)).toFixed(2));
      }
      return {
        min_qty: tier.min_qty,
        max_qty: tier.max_qty,
        price: Math.max(price, 0),
        is_auto: true,
      };
    });
    setPriceTiers(newTiers);
    setFormulaOpen(false);
  };

  // Manual edit tier price
  const handleTierPriceChange = (index, value) => {
    const updated = [...priceTiers];
    updated[index] = {
      ...updated[index],
      price: parseFloat(value) || 0,
      is_auto: false,
    };
    setPriceTiers(updated);
  };

  const handleTierQtyChange = (index, field, value) => {
    const updated = [...priceTiers];
    updated[index] = {
      ...updated[index],
      [field]: value === "" ? null : parseInt(value),
    };
    setPriceTiers(updated);
  };

  const handleAddTier = () => {
    const lastTier = priceTiers[priceTiers.length - 1];
    setPriceTiers([
      ...priceTiers,
      {
        min_qty: lastTier ? (lastTier.max_qty || 0) + 1 : 1,
        max_qty: null,
        price: parseFloat(form.sp_base_price) || 0,
        is_auto: false,
      },
    ]);
  };

  const handleRemoveTier = (index) => {
    setPriceTiers(priceTiers.filter((_, i) => i !== index));
  };

  // Currency conversion
  const handleConvertCurrency = async () => {
    if (form.sp_currency === "THB") {
      setForm((prev) => ({
        ...prev,
        sp_price_thb: prev.sp_base_price,
        sp_exchange_rate: "1",
        sp_exchange_date: new Date().toISOString(),
      }));
      return;
    }

    if (!form.sp_base_price || !form.sp_currency) {
      Swal.fire("", "กรุณาใส่ราคาและสกุลเงินก่อน", "warning");
      return;
    }

    try {
      const result = await triggerConvert({
        from: form.sp_currency,
        amount: form.sp_base_price,
      }).unwrap();

      if (result?.data) {
        setForm((prev) => ({
          ...prev,
          sp_price_thb: result.data.converted,
          sp_exchange_rate: result.data.rate,
          sp_exchange_date: result.data.date,
        }));
      }
    } catch (err) {
      Swal.fire("ผิดพลาด", err?.data?.message || "แปลงสกุลเงินไม่สำเร็จ", "error");
    }
  };

  // Image handling
  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    setNewImageFiles((prev) => [...prev, ...files]);

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setNewImagePreviews((prev) => [
          ...prev,
          { url: ev.target.result, name: file.name },
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveNewImage = (index) => {
    setNewImageFiles((prev) => prev.filter((_, i) => i !== index));
    setNewImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSetCover = async (imageId) => {
    if (!id) return;
    try {
      await setCoverImage({ productId: id, imageId }).unwrap();
      setExistingImages((prev) =>
        prev.map((img) => ({
          ...img,
          spi_is_cover: img.spi_id === imageId,
        }))
      );
    } catch (err) {
      Swal.fire("ผิดพลาด", "ตั้งรูปปกไม่สำเร็จ", "error");
    }
  };

  const handleDeleteImage = async (imageId) => {
    if (!id) return;
    const result = await Swal.fire({
      title: "ลบรูปภาพ?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: PRIMARY_RED,
      confirmButtonText: "ลบ",
      cancelButtonText: "ยกเลิก",
    });
    if (result.isConfirmed) {
      try {
        await deleteImage({ productId: id, imageId }).unwrap();
        setExistingImages((prev) =>
          prev.filter((img) => img.spi_id !== imageId)
        );
      } catch (err) {
        Swal.fire("ผิดพลาด", "ลบรูปไม่สำเร็จ", "error");
      }
    }
  };

  // Tag handling
  const handleCreateTag = async (tagName) => {
    try {
      const result = await addTag({ spt_name: tagName }).unwrap();
      if (result?.data) {
        setSelectedTags((prev) => [...prev, result.data]);
      }
    } catch (err) {
      if (err?.status === 409) {
        Swal.fire("", "Tag นี้มีอยู่แล้ว", "info");
      }
    }
  };

  // Save
  const handleSave = async () => {
    if (!form.sp_name.trim()) {
      Swal.fire("", "กรุณาใส่ชื่อสินค้า", "warning");
      return;
    }
    if (!form.sp_base_price || parseFloat(form.sp_base_price) <= 0) {
      Swal.fire("", "กรุณาใส่ราคาพื้นฐาน", "warning");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        sp_base_price: parseFloat(form.sp_base_price),
        sp_price_thb: form.sp_price_thb
          ? parseFloat(form.sp_price_thb)
          : null,
        sp_exchange_rate: form.sp_exchange_rate
          ? parseFloat(form.sp_exchange_rate)
          : null,
        tag_ids: selectedTags.map((t) => t.spt_id),
        price_tiers: priceTiers,
      };

      let productId = id;

      if (isCreate) {
        const result = await addProduct(payload).unwrap();
        productId = result?.data?.sp_id;
        if (!productId) throw new Error("Failed to create product");
      } else {
        await updateProduct({ id, ...payload }).unwrap();
      }

      // Upload new images
      if (newImageFiles.length > 0 && productId) {
        const formData = new FormData();
        newImageFiles.forEach((file) => {
          formData.append("images[]", file);
        });
        await uploadImages({ id: productId, formData }).unwrap();
      }

      Swal.fire("สำเร็จ", isCreate ? "สร้างสินค้าแล้ว" : "บันทึกแล้ว", "success");
      navigate("/supplier");
    } catch (err) {
      Swal.fire(
        "ผิดพลาด",
        err?.data?.message || "บันทึกไม่สำเร็จ",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  if (loadingProduct && id) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
        <CircularProgress sx={{ color: PRIMARY_RED }} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: "auto" }}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <IconButton onClick={() => navigate("/supplier")}>
            <MdArrowBack />
          </IconButton>
          <Typography
            variant="h5"
            sx={{ fontFamily: "Kanit", fontWeight: 600, color: PRIMARY_RED }}
          >
            {isCreate
              ? "เพิ่มสินค้าใหม่"
              : isEdit
                ? "แก้ไขสินค้า"
                : "รายละเอียดสินค้า"}
          </Typography>
        </Box>
        {!isView && (
          <Button
            variant="contained"
            startIcon={saving ? <CircularProgress size={16} /> : <MdSave />}
            onClick={handleSave}
            disabled={saving}
            sx={{ fontFamily: "Kanit", bgcolor: PRIMARY_RED }}
          >
            บันทึก
          </Button>
        )}
      </Box>

      {/* Basic Info */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography
            variant="subtitle1"
            sx={{ fontFamily: "Kanit", fontWeight: 600, mb: 2 }}
          >
            ข้อมูลพื้นฐาน
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="ชื่อสินค้า *"
                value={form.sp_name}
                onChange={handleChange("sp_name")}
                disabled={isView}
                InputProps={{ style: { fontFamily: "Kanit" } }}
                InputLabelProps={{ style: { fontFamily: "Kanit" } }}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                size="small"
                label="SKU"
                value={form.sp_sku}
                onChange={handleChange("sp_sku")}
                disabled={isView}
                InputProps={{ style: { fontFamily: "Kanit" } }}
                InputLabelProps={{ style: { fontFamily: "Kanit" } }}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                size="small"
                label="หน่วยนับ"
                value={form.sp_unit}
                onChange={handleChange("sp_unit")}
                disabled={isView}
                InputProps={{ style: { fontFamily: "Kanit" } }}
                InputLabelProps={{ style: { fontFamily: "Kanit" } }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                size="small"
                label="รายละเอียดสินค้า"
                value={form.sp_description}
                onChange={handleChange("sp_description")}
                disabled={isView}
                multiline
                rows={3}
                InputProps={{ style: { fontFamily: "Kanit" } }}
                InputLabelProps={{ style: { fontFamily: "Kanit" } }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Box sx={{ display: "flex", gap: 1, alignItems: "flex-start" }}>
                <FormControl fullWidth size="small">
                  <InputLabel sx={{ fontFamily: "Kanit" }}>หมวดหมู่</InputLabel>
                  <Select
                    value={form.sp_mpc_id}
                    label="หมวดหมู่"
                    onChange={handleCategoryChange}
                    disabled={isView}
                    sx={{ fontFamily: "Kanit" }}
                  >
                    <MenuItem value="" sx={{ fontFamily: "Kanit" }}>
                      -- ไม่ระบุ --
                    </MenuItem>
                    {categories.map((cat) => (
                      <MenuItem
                        key={cat.mpc_id}
                        value={cat.mpc_id}
                        sx={{ fontFamily: "Kanit" }}
                      >
                        {cat.mpc_name}
                        {cat.mpc_sku_prefix && (
                          <Typography
                            component="span"
                            sx={{ ml: 1, fontSize: 11, color: "text.secondary" }}
                          >
                            [{cat.mpc_sku_prefix}]
                          </Typography>
                        )}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                {!isView && (
                  <Tooltip title="จัดการหมวดหมู่">
                    <IconButton
                      size="small"
                      onClick={() => setCategoryDialogOpen(true)}
                      sx={{ mt: 0.5, color: PRIMARY_RED }}
                    >
                      <MdEdit />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small">
                <InputLabel sx={{ fontFamily: "Kanit" }}>
                  ประเทศต้นทาง
                </InputLabel>
                <Select
                  value={form.sp_origin_country}
                  label="ประเทศต้นทาง"
                  onChange={handleChange("sp_origin_country")}
                  disabled={isView}
                  sx={{ fontFamily: "Kanit" }}
                >
                  <MenuItem value="" sx={{ fontFamily: "Kanit" }}>
                    -- ไม่ระบุ --
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
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                size="small"
                label="ชื่อ Supplier"
                value={form.sp_supplier_name}
                onChange={handleChange("sp_supplier_name")}
                disabled={isView}
                InputProps={{ style: { fontFamily: "Kanit" } }}
                InputLabelProps={{ style: { fontFamily: "Kanit" } }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                size="small"
                label="ข้อมูลติดต่อ Supplier"
                value={form.sp_supplier_contact}
                onChange={handleChange("sp_supplier_contact")}
                disabled={isView}
                multiline
                rows={2}
                InputProps={{ style: { fontFamily: "Kanit" } }}
                InputLabelProps={{ style: { fontFamily: "Kanit" } }}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tags */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography
            variant="subtitle1"
            sx={{ fontFamily: "Kanit", fontWeight: 600, mb: 2 }}
          >
            Tags
          </Typography>
          {!isView && (
            <Autocomplete
              multiple
              freeSolo
              size="small"
              options={tags}
              value={selectedTags}
              getOptionLabel={(option) =>
                typeof option === "string" ? option : option.spt_name
              }
              isOptionEqualToValue={(option, value) =>
                option.spt_id === value.spt_id
              }
              onChange={(e, newValue) => {
                const lastItem = newValue[newValue.length - 1];
                if (typeof lastItem === "string") {
                  handleCreateTag(lastItem);
                  return;
                }
                setSelectedTags(newValue);
              }}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    key={option.spt_id}
                    label={option.spt_name}
                    size="small"
                    {...getTagProps({ index })}
                    sx={{ fontFamily: "Kanit" }}
                  />
                ))
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="เลือก Tags (พิมพ์เพื่อสร้างใหม่)"
                  InputProps={{
                    ...params.InputProps,
                    style: { fontFamily: "Kanit" },
                  }}
                  InputLabelProps={{ style: { fontFamily: "Kanit" } }}
                />
              )}
            />
          )}
          {isView && selectedTags.length > 0 && (
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
              {selectedTags.map((tag) => (
                <Chip
                  key={tag.spt_id}
                  label={tag.spt_name}
                  size="small"
                  sx={{ fontFamily: "Kanit" }}
                />
              ))}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Price & Currency */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography
            variant="subtitle1"
            sx={{ fontFamily: "Kanit", fontWeight: 600, mb: 2 }}
          >
            ราคาและสกุลเงิน
          </Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth size="small">
                <InputLabel sx={{ fontFamily: "Kanit" }}>สกุลเงิน</InputLabel>
                <Select
                  value={form.sp_currency}
                  label="สกุลเงิน"
                  onChange={handleChange("sp_currency")}
                  disabled={isView}
                  sx={{ fontFamily: "Kanit" }}
                >
                  {CURRENCIES.map((c) => (
                    <MenuItem
                      key={c.code}
                      value={c.code}
                      sx={{ fontFamily: "Kanit" }}
                    >
                      {c.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3}>
              <NumericTextField
                fullWidth
                size="small"
                label="ราคาพื้นฐาน *"
                value={form.sp_base_price}
                onChange={(val) => setForm((prev) => ({ ...prev, sp_base_price: val }))}
                disabled={isView}
                InputProps={{ style: { fontFamily: "Kanit" } }}
                InputLabelProps={{ style: { fontFamily: "Kanit" } }}
              />
            </Grid>
            <Grid item xs={12} sm={2}>
              {!isView && (
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={
                    convertingCurrency ? (
                      <CircularProgress size={16} />
                    ) : (
                      <MdCurrencyExchange />
                    )
                  }
                  onClick={handleConvertCurrency}
                  disabled={convertingCurrency}
                  sx={{
                    fontFamily: "Kanit",
                    borderColor: PRIMARY_RED,
                    color: PRIMARY_RED,
                    fontSize: 12,
                    height: 40,
                  }}
                >
                  แปลงเป็นบาท
                </Button>
              )}
            </Grid>
            <Grid item xs={12} sm={2}>
              <NumericTextField
                fullWidth
                size="small"
                label="ราคา (บาท)"
                value={form.sp_price_thb}
                onChange={(val) => setForm((prev) => ({ ...prev, sp_price_thb: val }))}
                disabled={isView}
                InputProps={{ style: { fontFamily: "Kanit" } }}
                InputLabelProps={{ style: { fontFamily: "Kanit" } }}
              />
            </Grid>
            <Grid item xs={12} sm={2}>
              <TextField
                fullWidth
                size="small"
                label="อัตราแลกเปลี่ยน"
                value={form.sp_exchange_rate}
                disabled
                InputProps={{ style: { fontFamily: "Kanit" } }}
                InputLabelProps={{ style: { fontFamily: "Kanit" } }}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Price Scaling */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2,
            }}
          >
            <Typography
              variant="subtitle1"
              sx={{ fontFamily: "Kanit", fontWeight: 600 }}
            >
              ขั้นบันไดราคา (Price Scaling)
            </Typography>
            {!isView && (
              <Box sx={{ display: "flex", gap: 1 }}>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<MdAutoFixHigh />}
                  onClick={handleOpenFormula}
                  sx={{
                    fontFamily: "Kanit",
                    borderColor: PRIMARY_RED,
                    color: PRIMARY_RED,
                    fontSize: 12,
                  }}
                >
                  Auto Formula
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<MdAdd />}
                  onClick={handleAddTier}
                  sx={{ fontFamily: "Kanit", fontSize: 12 }}
                >
                  เพิ่ม Tier
                </Button>
              </Box>
            )}
          </Box>

          {priceTiers.length === 0 ? (
            <Alert severity="info" sx={{ fontFamily: "Kanit" }}>
              ยังไม่มีขั้นบันไดราคา — กด "Auto Formula" เพื่อคำนวณอัตโนมัติ
            </Alert>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: "#f5f5f5" }}>
                    <TableCell sx={{ fontFamily: "Kanit", fontWeight: 600 }}>
                      ลำดับ
                    </TableCell>
                    <TableCell sx={{ fontFamily: "Kanit", fontWeight: 600 }}>
                      จำนวนขั้นต่ำ
                    </TableCell>
                    <TableCell sx={{ fontFamily: "Kanit", fontWeight: 600 }}>
                      จำนวนสูงสุด
                    </TableCell>
                    <TableCell sx={{ fontFamily: "Kanit", fontWeight: 600 }}>
                      ราคาต่อหน่วย
                    </TableCell>
                    <TableCell sx={{ fontFamily: "Kanit", fontWeight: 600 }}>
                      ประเภท
                    </TableCell>
                    {!isView && (
                      <TableCell
                        sx={{ fontFamily: "Kanit", fontWeight: 600 }}
                        align="center"
                      >
                        ลบ
                      </TableCell>
                    )}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {priceTiers.map((tier, idx) => (
                    <TableRow key={idx}>
                      <TableCell sx={{ fontFamily: "Kanit" }}>
                        {idx + 1}
                      </TableCell>
                      <TableCell>
                        <NumericTextField
                          size="small"
                          decimal={false}
                          value={tier.min_qty}
                          onChange={(val) =>
                            handleTierQtyChange(idx, "min_qty", val)
                          }
                          disabled={isView}
                          sx={{ width: 100 }}
                          InputProps={{
                            style: { fontFamily: "Kanit", fontSize: 13 },
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <NumericTextField
                          size="small"
                          decimal={false}
                          value={tier.max_qty ?? ""}
                          placeholder="ไม่จำกัด"
                          onChange={(val) =>
                            handleTierQtyChange(idx, "max_qty", val)
                          }
                          disabled={isView}
                          sx={{ width: 100 }}
                          InputProps={{
                            style: { fontFamily: "Kanit", fontSize: 13 },
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <NumericTextField
                          size="small"
                          value={tier.price}
                          onChange={(val) =>
                            handleTierPriceChange(idx, val)
                          }
                          disabled={isView}
                          sx={{ width: 120 }}
                          InputProps={{
                            style: { fontFamily: "Kanit", fontSize: 13 },
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={tier.is_auto ? "Auto" : "Manual"}
                          size="small"
                          color={tier.is_auto ? "success" : "warning"}
                          sx={{ fontFamily: "Kanit", fontSize: 11 }}
                        />
                      </TableCell>
                      {!isView && (
                        <TableCell align="center">
                          <IconButton
                            size="small"
                            onClick={() => handleRemoveTier(idx)}
                            sx={{ color: PRIMARY_RED }}
                          >
                            <MdDelete size={16} />
                          </IconButton>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Images */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography
            variant="subtitle1"
            sx={{ fontFamily: "Kanit", fontWeight: 600, mb: 2 }}
          >
            รูปสินค้า
          </Typography>

          {/* Upload button */}
          {!isView && (
            <Box sx={{ mb: 2 }}>
              <Button
                variant="outlined"
                component="label"
                startIcon={<MdImage />}
                sx={{
                  fontFamily: "Kanit",
                  borderColor: PRIMARY_RED,
                  color: PRIMARY_RED,
                }}
              >
                เลือกรูปภาพ
                <input
                  type="file"
                  hidden
                  multiple
                  accept="image/*"
                  onChange={handleImageSelect}
                />
              </Button>
            </Box>
          )}

          {/* Existing images */}
          {existingImages.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography
                variant="caption"
                sx={{ fontFamily: "Kanit", mb: 1, display: "block" }}
              >
                รูปปัจจุบัน:
              </Typography>
              <ImageList cols={6} gap={8} sx={{ mt: 0 }}>
                {existingImages.map((img) => (
                  <ImageListItem
                    key={img.spi_id}
                    sx={{
                      border: img.spi_is_cover
                        ? `3px solid ${PRIMARY_RED}`
                        : "1px solid #eee",
                      borderRadius: 1,
                      overflow: "hidden",
                    }}
                  >
                    <img
                      src={`${getBackendOrigin()}/storage/${img.spi_file_path}`}
                      alt={img.spi_original_name}
                      loading="lazy"
                      style={{
                        height: 120,
                        objectFit: "cover",
                      }}
                    />
                    <ImageListItemBar
                      sx={{ background: "rgba(0,0,0,0.5)" }}
                      actionIcon={
                        <Box sx={{ display: "flex" }}>
                          {!isView && (
                            <>
                              <Tooltip
                                title={
                                  img.spi_is_cover
                                    ? "รูปปกปัจจุบัน"
                                    : "ตั้งเป็นรูปปก"
                                }
                              >
                                <IconButton
                                  size="small"
                                  onClick={() => handleSetCover(img.spi_id)}
                                  sx={{
                                    color: img.spi_is_cover
                                      ? "#FFD700"
                                      : "white",
                                  }}
                                >
                                  {img.spi_is_cover ? (
                                    <MdStar size={16} />
                                  ) : (
                                    <MdStarBorder size={16} />
                                  )}
                                </IconButton>
                              </Tooltip>
                              <IconButton
                                size="small"
                                onClick={() => handleDeleteImage(img.spi_id)}
                                sx={{ color: "white" }}
                              >
                                <MdClose size={16} />
                              </IconButton>
                            </>
                          )}
                          {isView && img.spi_is_cover && (
                            <Chip
                              label="ปก"
                              size="small"
                              sx={{
                                bgcolor: PRIMARY_RED,
                                color: "white",
                                fontFamily: "Kanit",
                                fontSize: 10,
                                mr: 0.5,
                              }}
                            />
                          )}
                        </Box>
                      }
                    />
                  </ImageListItem>
                ))}
              </ImageList>
            </Box>
          )}

          {/* New image previews */}
          {newImagePreviews.length > 0 && (
            <Box>
              <Typography
                variant="caption"
                sx={{ fontFamily: "Kanit", mb: 1, display: "block" }}
              >
                รูปใหม่ (จะอัพโหลดเมื่อบันทึก):
              </Typography>
              <ImageList cols={6} gap={8} sx={{ mt: 0 }}>
                {newImagePreviews.map((preview, idx) => (
                  <ImageListItem
                    key={idx}
                    sx={{
                      border: "2px dashed #ccc",
                      borderRadius: 1,
                      overflow: "hidden",
                    }}
                  >
                    <img
                      src={preview.url}
                      alt={preview.name}
                      style={{ height: 120, objectFit: "cover" }}
                    />
                    <ImageListItemBar
                      sx={{ background: "rgba(0,0,0,0.5)" }}
                      actionIcon={
                        <IconButton
                          size="small"
                          onClick={() => handleRemoveNewImage(idx)}
                          sx={{ color: "white" }}
                        >
                          <MdClose size={16} />
                        </IconButton>
                      }
                    />
                  </ImageListItem>
                ))}
              </ImageList>
            </Box>
          )}

          {existingImages.length === 0 && newImagePreviews.length === 0 && (
            <Alert severity="info" sx={{ fontFamily: "Kanit" }}>
              ยังไม่มีรูปภาพ
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Bottom Actions */}
      {!isView && (
        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
          <Button
            variant="outlined"
            onClick={() => navigate("/supplier")}
            sx={{ fontFamily: "Kanit" }}
          >
            ยกเลิก
          </Button>
          <Button
            variant="contained"
            startIcon={saving ? <CircularProgress size={16} /> : <MdSave />}
            onClick={handleSave}
            disabled={saving}
            sx={{ fontFamily: "Kanit", bgcolor: PRIMARY_RED }}
          >
            บันทึก
          </Button>
        </Box>
      )}

      {isView && (
        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
          <Button
            variant="outlined"
            onClick={() => navigate("/supplier")}
            sx={{ fontFamily: "Kanit" }}
          >
            กลับ
          </Button>
          <Button
            variant="contained"
            startIcon={<MdEdit />}
            onClick={() => navigate(`/supplier/edit/${id}`)}
            sx={{ fontFamily: "Kanit", bgcolor: PRIMARY_RED }}
          >
            แก้ไข
          </Button>
        </Box>
      )}
      {/* ==================== Category Dialog ==================== */}
      <CategoryDialog
        open={categoryDialogOpen}
        onClose={() => setCategoryDialogOpen(false)}
      />

      {/* ==================== Auto Formula Dialog ==================== */}
      <Dialog
        open={formulaOpen}
        onClose={() => setFormulaOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ fontFamily: "Kanit", fontWeight: 600 }}>
          ตั้งค่า Auto Formula — ขั้นบันไดราคา
        </DialogTitle>
        <DialogContent>
          {/* Base price display */}
          <Alert severity="info" sx={{ fontFamily: "Kanit", mb: 2 }}>
            ราคาฐาน (THB):{" "}
            <strong>
              {(
                parseFloat(form.sp_price_thb) ||
                parseFloat(form.sp_base_price) ||
                0
              ).toLocaleString("th-TH", {
                minimumFractionDigits: 2,
              })}{" "}
              บาท
            </strong>
          </Alert>

          {/* Mode selector */}
          <FormControl sx={{ mb: 2 }}>
            <FormLabel sx={{ fontFamily: "Kanit", fontWeight: 600, fontSize: 14 }}>
              โหมดสเกลราคา
            </FormLabel>
            <RadioGroup
              row
              value={formulaMode}
              onChange={(e) => setFormulaMode(e.target.value)}
            >
              <FormControlLabel
                value="percent"
                control={<Radio sx={{ color: PRIMARY_RED, "&.Mui-checked": { color: PRIMARY_RED } }} />}
                label="ลดเป็นเปอร์เซ็นต์ (%)"
                sx={{ "& .MuiFormControlLabel-label": { fontFamily: "Kanit", fontSize: 14 } }}
              />
              <FormControlLabel
                value="fixed"
                control={<Radio sx={{ color: PRIMARY_RED, "&.Mui-checked": { color: PRIMARY_RED } }} />}
                label="ลดเป็นจำนวนเงินตายตัว (บาท)"
                sx={{ "& .MuiFormControlLabel-label": { fontFamily: "Kanit", fontSize: 14 } }}
              />
            </RadioGroup>
          </FormControl>

          {/* Tiers table */}
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: "#f5f5f5" }}>
                  <TableCell sx={{ fontFamily: "Kanit", fontWeight: 600, width: 60 }}>
                    ลำดับ
                  </TableCell>
                  <TableCell sx={{ fontFamily: "Kanit", fontWeight: 600 }}>
                    จำนวนขั้นต่ำ
                  </TableCell>
                  <TableCell sx={{ fontFamily: "Kanit", fontWeight: 600 }}>
                    จำนวนสูงสุด
                  </TableCell>
                  <TableCell sx={{ fontFamily: "Kanit", fontWeight: 600 }}>
                    {formulaMode === "percent" ? "ส่วนลด (%)" : "ส่วนลด (บาท)"}
                  </TableCell>
                  <TableCell sx={{ fontFamily: "Kanit", fontWeight: 600, color: PRIMARY_RED }}>
                    ราคาต่อหน่วย (THB)
                  </TableCell>
                  <TableCell sx={{ width: 50 }} />
                </TableRow>
              </TableHead>
              <TableBody>
                {formulaTiers.map((tier, index) => {
                  const previewPrice = getFormulaPreviewPrice(tier);
                  return (
                    <TableRow key={index}>
                      <TableCell sx={{ fontFamily: "Kanit" }}>
                        {index + 1}
                      </TableCell>
                      <TableCell>
                        <NumericTextField
                          size="small"
                          decimal={false}
                          value={tier.min_qty ?? ""}
                          onChange={(val) =>
                            handleFormulaTierQtyChange(index, "min_qty", val)
                          }
                          inputProps={{ style: { fontFamily: "Kanit", fontSize: 13 } }}
                          sx={{ width: 100 }}
                        />
                      </TableCell>
                      <TableCell>
                        <NumericTextField
                          size="small"
                          decimal={false}
                          value={tier.max_qty ?? ""}
                          onChange={(val) =>
                            handleFormulaTierQtyChange(index, "max_qty", val)
                          }
                          placeholder="ไม่จำกัด"
                          inputProps={{ style: { fontFamily: "Kanit", fontSize: 13 } }}
                          sx={{ width: 100 }}
                        />
                      </TableCell>
                      <TableCell>
                        <NumericTextField
                          size="small"
                          value={tier.discount ?? ""}
                          onChange={(val) =>
                            handleFormulaTierChange(index, val)
                          }
                          InputProps={{
                            endAdornment: (
                              <InputAdornment position="end">
                                {formulaMode === "percent" ? "%" : "฿"}
                              </InputAdornment>
                            ),
                            style: { fontFamily: "Kanit", fontSize: 13 },
                          }}
                          sx={{ width: 120 }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography
                          sx={{
                            fontFamily: "Kanit",
                            fontWeight: 600,
                            color: previewPrice > 0 ? PRIMARY_RED : "error.main",
                            fontSize: 14,
                          }}
                        >
                          {previewPrice > 0
                            ? previewPrice.toLocaleString("th-TH", {
                                minimumFractionDigits: 2,
                              })
                            : "0.00"}{" "}
                          ฿
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {formulaTiers.length > 1 && (
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleRemoveFormulaTier(index)}
                          >
                            <MdDelete />
                          </IconButton>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

          <Button
            size="small"
            startIcon={<MdAdd />}
            onClick={handleAddFormulaTier}
            sx={{ fontFamily: "Kanit", mt: 1 }}
          >
            เพิ่ม Tier
          </Button>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setFormulaOpen(false)}
            sx={{ fontFamily: "Kanit" }}
          >
            ยกเลิก
          </Button>
          <Button
            variant="contained"
            startIcon={<MdAutoFixHigh />}
            onClick={handleApplyFormula}
            sx={{ fontFamily: "Kanit", bgcolor: PRIMARY_RED }}
          >
            ยืนยัน — สร้าง {formulaTiers.length} ขั้นราคา
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SupplierForm;
