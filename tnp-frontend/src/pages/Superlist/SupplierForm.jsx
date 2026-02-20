import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
  InputAdornment,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  ImageList,
  ImageListItem,
  ImageListItemBar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  RadioGroup,
  Radio,
  FormControlLabel,
  FormLabel,
  FormControl,
} from "@mui/material";
import { useState, useEffect } from "react";
import {
  MdSave,
  MdEdit,
  MdAdd,
  MdDelete,
  MdImage,
  MdStar,
  MdStarBorder,
  MdAutoFixHigh,
  MdClose,
} from "react-icons/md";
import Swal from "sweetalert2";

import CategoryDialog from "./CategoryDialog";
import SellerDialog from "./SellerDialog";
import { NumericTextField } from "./components";
import {
  FormHeader,
  BasicInfoCard,
  SellerInfoCard,
  TagsCard,
  PricingCard,
  PriceTiersCard,
  CustomizationCard,
} from "./components";
import {
  useSupplierForm,
  useSupplierPriceTiers,
  useCurrencyConversion,
  useSupplierImages,
} from "./hooks";
import { PRIMARY_RED, getBackendOrigin } from "./utils";

/**
 * SupplierForm - Form for creating/editing supplier products
 * Refactored to use custom hooks and components
 */
const SupplierForm = ({ mode: propMode }) => {
  const {
    // State
    form,
    setForm,
    selectedTags,
    setSelectedTags,
    options,
    setOptions,
    saving,
    setSaving,
    loadingProduct,

    // Data
    tags,
    categories,
    sellers,

    // Mode flags
    isView,
    isEdit,
    isCreate,
    id,

    // Handlers
    handleChange,
    handleCategoryChange,
    handleSellerChange,
    handleCreateTag,
    validateForm,
    navigate,

    // Mutations
    addProduct,
    updateProduct,

    // Raw product data for image/tier population
    productData,
  } = useSupplierForm(propMode);

  const {
    priceTiers,
    setPriceTiers,
    formulaOpen,
    setFormulaOpen,
    formulaMode,
    setFormulaMode,
    formulaTiers,
    handleOpenFormula,
    getFormulaPreviewPrice,
    handleFormulaTierChange,
    handleFormulaTierQtyChange,
    handleAddFormulaTier,
    handleRemoveFormulaTier,
    handleApplyFormula,
    handleTierPriceChange,
    handleTierQtyChange,
    handleAddTier,
    handleRemoveTier,
  } = useSupplierPriceTiers([]);

  const {
    existingImages,
    setExistingImages,
    newImageFiles,
    newImagePreviews,
    handleImageSelect,
    handleRemoveNewImage,
    handleSetCover,
    handleDeleteImage,
    uploadNewImages,
  } = useSupplierImages(id);

  const { handleConvertCurrency, convertingCurrency } = useCurrencyConversion();

  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [sellerDialogOpen, setSellerDialogOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [selectedOptionIds, setSelectedOptionIds] = useState([]);

  const handleOptionToggle = (optionId) => {
    setSelectedOptionIds((prev) =>
      prev.includes(optionId) ? prev.filter((id) => id !== optionId) : [...prev, optionId]
    );
  };

  // Find selected seller object for Autocomplete
  const selectedSeller = sellers.find((s) => s.ss_id === form.sp_ss_id) || null;

  // Populate images and price tiers from productData when editing/viewing
  useEffect(() => {
    if (productData?.data && (isEdit || isView)) {
      const p = productData.data;
      setExistingImages(p.images || []);
      setPriceTiers(
        (p.price_tiers || []).map((t) => ({
          min_qty: t.sptier_min_qty,
          max_qty: t.sptier_max_qty,
          price: t.sptier_price,
          is_auto: t.sptier_is_auto,
        }))
      );
    }
  }, [productData, isEdit, isView]);

  const handleSave = async () => {
    if (!validateForm()) return;

    setSaving(true);
    try {
      const payload = {
        ...form,
        sp_base_price: parseFloat(form.sp_base_price),
        sp_price_thb: form.sp_price_thb ? parseFloat(form.sp_price_thb) : null,
        sp_exchange_rate: form.sp_exchange_rate ? parseFloat(form.sp_exchange_rate) : null,
        tag_ids: selectedTags.map((t) => t.spt_id),
        price_tiers: priceTiers,
        options: options,
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
      await uploadNewImages(productId);

      Swal.fire("สำเร็จ", isCreate ? "สร้างสินค้าแล้ว" : "บันทึกแล้ว", "success");
      navigate("/supplier");
    } catch (err) {
      Swal.fire("ผิดพลาด", err?.data?.message || "บันทึกไม่สำเร็จ", "error");
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
      <FormHeader
        isCreate={isCreate}
        isEdit={isEdit}
        isView={isView}
        saving={saving}
        onSave={handleSave}
        onBack={() => navigate("/supplier")}
      />

      {/* Basic Info */}
      <BasicInfoCard
        form={form}
        handleChange={handleChange}
        handleCategoryChange={handleCategoryChange}
        categories={categories}
        isView={isView}
        isCreate={isCreate}
        onOpenCategory={() => setCategoryDialogOpen(true)}
      />

      {/* Seller Info */}
      <SellerInfoCard
        sellers={sellers}
        selectedSeller={selectedSeller}
        handleSellerChange={handleSellerChange}
        isView={isView}
        onOpenSeller={() => setSellerDialogOpen(true)}
      />

      {/* Tags */}
      <TagsCard
        tags={tags}
        selectedTags={selectedTags}
        setSelectedTags={setSelectedTags}
        handleCreateTag={handleCreateTag}
        isView={isView}
      />

      {/* Price & Currency */}
      <PricingCard
        form={form}
        setForm={setForm}
        handleChange={handleChange}
        isView={isView}
        handleConvertCurrency={handleConvertCurrency}
        convertingCurrency={convertingCurrency}
      />

      {/* Price Scaling */}
      <PriceTiersCard
        priceTiers={priceTiers}
        isView={isView}
        form={form}
        handleOpenFormula={handleOpenFormula}
        handleAddTier={handleAddTier}
        handleTierQtyChange={handleTierQtyChange}
        handleTierPriceChange={handleTierPriceChange}
        handleRemoveTier={handleRemoveTier}
        selectedOptionIds={selectedOptionIds}
        allOptions={options}
      />

      {/* Customizations */}
      <CustomizationCard
        options={options}
        setOptions={setOptions}
        isView={isView}
        selectedOptionIds={selectedOptionIds}
        handleOptionToggle={handleOptionToggle}
        priceTiers={priceTiers}
        currency={form.sp_currency}
        exchangeRate={form.sp_exchange_rate}
        basePrice={parseFloat(form.sp_price_thb) || parseFloat(form.sp_base_price) || 0}
      />

      {/* Images */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" sx={{ fontFamily: "Kanit", fontWeight: 600, mb: 2 }}>
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
                <input type="file" hidden multiple accept="image/*" onChange={handleImageSelect} />
              </Button>
            </Box>
          )}

          {/* Existing images */}
          {existingImages.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" sx={{ fontFamily: "Kanit", mb: 1, display: "block" }}>
                รูปปัจจุบัน:
              </Typography>
              <ImageList cols={6} gap={8} sx={{ mt: 0 }}>
                {existingImages.map((img) => (
                  <ImageListItem
                    key={img.spi_id}
                    sx={{
                      border: img.spi_is_cover ? `3px solid ${PRIMARY_RED}` : "1px solid #eee",
                      borderRadius: 1,
                      overflow: "hidden",
                    }}
                  >
                    <img
                      src={`${getBackendOrigin()}/storage/${img.spi_file_path}`}
                      alt={img.spi_original_name}
                      loading="lazy"
                      style={{ height: 120, objectFit: "cover", cursor: "pointer" }}
                      onClick={() =>
                        setPreviewImage(`${getBackendOrigin()}/storage/${img.spi_file_path}`)
                      }
                    />
                    <ImageListItemBar
                      sx={{ background: "rgba(0,0,0,0.5)", pointerEvents: "none" }}
                      actionIcon={
                        <Box sx={{ display: "flex", pointerEvents: "auto" }}>
                          {!isView && (
                            <>
                              <Tooltip title={img.spi_is_cover ? "รูปปกปัจจุบัน" : "ตั้งเป็นรูปปก"}>
                                <IconButton
                                  size="small"
                                  onClick={() => handleSetCover(img.spi_id)}
                                  sx={{ color: img.spi_is_cover ? "#FFD700" : "white" }}
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
              <Typography variant="caption" sx={{ fontFamily: "Kanit", mb: 1, display: "block" }}>
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
                      style={{ height: 120, objectFit: "cover", cursor: "pointer" }}
                      onClick={() => setPreviewImage(preview.url)}
                    />
                    <ImageListItemBar
                      sx={{ background: "rgba(0,0,0,0.5)", pointerEvents: "none" }}
                      actionIcon={
                        <IconButton
                          size="small"
                          onClick={() => handleRemoveNewImage(idx)}
                          sx={{ color: "white", pointerEvents: "auto" }}
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
      <CategoryDialog open={categoryDialogOpen} onClose={() => setCategoryDialogOpen(false)} />

      {/* ==================== Seller Dialog ==================== */}
      <SellerDialog open={sellerDialogOpen} onClose={() => setSellerDialogOpen(false)} />

      {/* ==================== Auto Formula Dialog ==================== */}
      <Dialog open={formulaOpen} onClose={() => setFormulaOpen(false)} maxWidth="md" fullWidth>
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
              ).toLocaleString("th-TH", { minimumFractionDigits: 2 })}{" "}
              บาท
            </strong>
          </Alert>

          {/* Mode selector */}
          <FormControl sx={{ mb: 2 }}>
            <FormLabel sx={{ fontFamily: "Kanit", fontWeight: 600, fontSize: 14 }}>
              โหมดสเกลราคา
            </FormLabel>
            <RadioGroup row value={formulaMode} onChange={(e) => setFormulaMode(e.target.value)}>
              <FormControlLabel
                value="percent"
                control={
                  <Radio sx={{ color: PRIMARY_RED, "&.Mui-checked": { color: PRIMARY_RED } }} />
                }
                label="ลดเป็นเปอร์เซ็นต์ (%)"
                sx={{ "& .MuiFormControlLabel-label": { fontFamily: "Kanit", fontSize: 14 } }}
              />
              <FormControlLabel
                value="fixed"
                control={
                  <Radio sx={{ color: PRIMARY_RED, "&.Mui-checked": { color: PRIMARY_RED } }} />
                }
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
                  <TableCell sx={{ fontFamily: "Kanit", fontWeight: 600 }}>จำนวนขั้นต่ำ</TableCell>
                  <TableCell sx={{ fontFamily: "Kanit", fontWeight: 600 }}>จำนวนสูงสุด</TableCell>
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
                  const thbPrice =
                    parseFloat(form.sp_price_thb) || parseFloat(form.sp_base_price) || 0;
                  const previewPrice = getFormulaPreviewPrice(tier, thbPrice);
                  return (
                    <TableRow key={index}>
                      <TableCell sx={{ fontFamily: "Kanit" }}>{index + 1}</TableCell>
                      <TableCell>
                        <NumericTextField
                          size="small"
                          decimal={false}
                          value={tier.min_qty ?? ""}
                          onChange={(val) => handleFormulaTierQtyChange(index, "min_qty", val)}
                          inputProps={{ style: { fontFamily: "Kanit", fontSize: 13 } }}
                          sx={{ width: 100 }}
                        />
                      </TableCell>
                      <TableCell>
                        <NumericTextField
                          size="small"
                          decimal={false}
                          value={tier.max_qty ?? ""}
                          onChange={(val) => handleFormulaTierQtyChange(index, "max_qty", val)}
                          placeholder="ไม่จำกัด"
                          inputProps={{ style: { fontFamily: "Kanit", fontSize: 13 } }}
                          sx={{ width: 100 }}
                        />
                      </TableCell>
                      <TableCell>
                        <NumericTextField
                          size="small"
                          value={tier.discount ?? ""}
                          onChange={(val) => handleFormulaTierChange(index, val)}
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
                            ? previewPrice.toLocaleString("th-TH", { minimumFractionDigits: 2 })
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
          <Button onClick={() => setFormulaOpen(false)} sx={{ fontFamily: "Kanit" }}>
            ยกเลิก
          </Button>
          <Button
            variant="contained"
            startIcon={<MdAutoFixHigh />}
            onClick={() => {
              const thbPrice = parseFloat(form.sp_price_thb) || parseFloat(form.sp_base_price) || 0;
              handleApplyFormula(thbPrice);
            }}
            sx={{ fontFamily: "Kanit", bgcolor: PRIMARY_RED }}
          >
            ยืนยัน — สร้าง {formulaTiers.length} ขั้นราคา
          </Button>
        </DialogActions>
      </Dialog>
      {/* ==================== Image Preview Dialog ==================== */}
      <Dialog
        open={!!previewImage}
        onClose={() => setPreviewImage(null)}
        maxWidth="lg"
        onClick={() => setPreviewImage(null)}
        sx={{ "& .MuiDialog-paper": { bgcolor: "transparent", boxShadow: "none" } }}
      >
        <Box
          sx={{
            position: "relative",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            outline: "none",
          }}
        >
          <img
            src={previewImage}
            alt="Preview"
            style={{
              maxWidth: "90vw",
              maxHeight: "90vh",
              objectFit: "contain",
              borderRadius: 4,
            }}
          />
          <IconButton
            onClick={() => setPreviewImage(null)}
            sx={{
              position: "absolute",
              top: 10,
              right: 10,
              color: "white",
              bgcolor: "rgba(0,0,0,0.5)",
              "&:hover": { bgcolor: "rgba(0,0,0,0.7)" },
            }}
          >
            <MdClose />
          </IconButton>
        </Box>
      </Dialog>
    </Box>
  );
};

export default SupplierForm;
