/**
 * DuplicateCheckForm.jsx - Standalone form สำหรับตรวจสอบข้อมูลลูกค้าซ้ำ
 *
 * ให้ผู้ใช้กรอกเบอร์โทรและ/หรือชื่อบริษัท เพื่อเช็คว่ามีข้อมูลซ้ำในระบบหรือไม่
 * ก่อนสร้างลูกค้าใหม่
 *
 * @param {boolean} open - Dialog open state
 * @param {function} onClose - Callback when dialog closes
 */
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Grid,
  Alert,
  Divider,
  CircularProgress,
  Chip,
  InputAdornment,
  IconButton,
} from "@mui/material";
import { MdSearch, MdClose, MdPhone, MdBusiness, MdPerson, MdCheckCircle } from "react-icons/md";

import { useDuplicateCheckForm } from "../../hooks/form/useDuplicateCheckForm";
import { StyledTextField, FORM_THEME } from "./ui/FormFields";

const PRIMARY_RED = FORM_THEME.PRIMARY_RED;

/**
 * ResultCard - แสดงข้อมูลลูกค้าที่ซ้ำแต่ละราย
 */
const ResultCard = ({ customer }) => (
  <Box
    sx={{
      p: 2,
      bgcolor: "white",
      borderRadius: 1,
      border: "1px solid #e0e0e0",
      "&:hover": { borderColor: PRIMARY_RED, bgcolor: "#fffaf9" },
      transition: "all 0.2s",
    }}
  >
    <Grid container spacing={1}>
      <Grid item xs={12} sm={6}>
        <Typography variant="caption" color="text.secondary" sx={{ fontFamily: "Kanit" }}>
          ชื่อลูกค้า
        </Typography>
        <Typography variant="body2" sx={{ fontFamily: "Kanit", fontWeight: 600 }}>
          {customer.cus_name || "-"}
        </Typography>
      </Grid>

      {customer.cus_company && (
        <Grid item xs={12} sm={6}>
          <Typography variant="caption" color="text.secondary" sx={{ fontFamily: "Kanit" }}>
            บริษัท
          </Typography>
          <Typography variant="body2" sx={{ fontFamily: "Kanit" }}>
            {customer.cus_company}
          </Typography>
        </Grid>
      )}

      <Grid item xs={12} sm={6}>
        <Typography variant="caption" color="text.secondary" sx={{ fontFamily: "Kanit" }}>
          เบอร์โทร
        </Typography>
        <Typography variant="body2" sx={{ fontFamily: "Kanit" }}>
          {customer.cus_tel_1 || "-"}
        </Typography>
      </Grid>

      <Grid item xs={12} sm={6}>
        <Typography variant="caption" color="text.secondary" sx={{ fontFamily: "Kanit" }}>
          ผู้ดูแลลูกค้า
        </Typography>
        <Typography
          variant="body2"
          sx={{ fontFamily: "Kanit", color: PRIMARY_RED, fontWeight: 500 }}
        >
          {customer.sales_fullname || customer.sales_name || "ไม่มีผู้ดูแล"}
        </Typography>
      </Grid>
    </Grid>
  </Box>
);

/**
 * ResultSection - แสดงผลลัพธ์การค้นหาแต่ละประเภท
 */
const ResultSection = ({ title, icon, results, isLoading }) => {
  if (isLoading) {
    return (
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, py: 2 }}>
        <CircularProgress size={20} sx={{ color: PRIMARY_RED }} />
        <Typography variant="body2" sx={{ fontFamily: "Kanit", color: "text.secondary" }}>
          กำลังตรวจสอบ{title}...
        </Typography>
      </Box>
    );
  }

  if (results === null) return null;

  return (
    <Box sx={{ mb: 2 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
        {icon}
        <Typography variant="subtitle2" sx={{ fontFamily: "Kanit", fontWeight: 600 }}>
          {title}
        </Typography>
        <Chip
          size="small"
          label={results.length > 0 ? `พบ ${results.length} รายการ` : "ไม่พบซ้ำ"}
          color={results.length > 0 ? "warning" : "success"}
          sx={{ fontFamily: "Kanit", fontSize: 12 }}
        />
      </Box>

      {results.length > 0 ? (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {results.map((customer, idx) => (
            <ResultCard key={customer.cus_id || idx} customer={customer} />
          ))}
        </Box>
      ) : (
        <Alert
          severity="success"
          icon={<MdCheckCircle size={20} />}
          sx={{ fontFamily: "Kanit" }}
        >
          ไม่พบข้อมูลซ้ำในระบบ
        </Alert>
      )}
    </Box>
  );
};

const DuplicateCheckForm = ({ open, onClose }) => {
  const {
    phoneInput,
    setPhoneInput,
    companyInput,
    setCompanyInput,
    phoneResults,
    companyResults,
    hasResults,
    isCheckingPhone,
    isCheckingCompany,
    isSearching,
    phoneError,
    companyError,
    handleCheckPhone,
    handleCheckCompany,
    handleCheckBoth,
    resetForm,
  } = useDuplicateCheckForm();

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !isSearching) {
      e.preventDefault();
      handleCheckBoth();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          overflow: "hidden",
          maxHeight: "90vh",
        },
      }}
    >
      {/* Header */}
      <DialogTitle
        sx={{
          bgcolor: PRIMARY_RED,
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          py: 1.5,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <MdSearch size={24} />
          <Typography variant="h6" sx={{ fontFamily: "Kanit", fontWeight: 600 }}>
            ตรวจสอบข้อมูลซ้ำ
          </Typography>
        </Box>
        <IconButton onClick={handleClose} sx={{ color: "white" }} size="small">
          <MdClose size={20} />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: { xs: 2, sm: 3 }, bgcolor: "#fafafa" }}>
        {/* Description */}
        <Typography
          variant="body2"
          sx={{ fontFamily: "Kanit", color: "text.secondary", mb: 2.5 }}
        >
          กรอกเบอร์โทรและ/หรือชื่อบริษัทเพื่อตรวจสอบว่ามีข้อมูลซ้ำในระบบหรือไม่
        </Typography>

        {/* Input Fields */}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          {/* Phone Input */}
          <Grid item xs={12}>
            <StyledTextField
              mode="create"
              name="phone"
              label="เบอร์โทร"
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
              onKeyDown={handleKeyDown}
              error={!!phoneError}
              helperText={phoneError || "กรอกเบอร์โทรอย่างน้อย 9 หลัก"}
              placeholder="เช่น 0812345678"
              InputProps={{
                style: { fontFamily: "Kanit", fontSize: 14 },
                startAdornment: (
                  <InputAdornment position="start">
                    <MdPhone size={18} color={PRIMARY_RED} />
                  </InputAdornment>
                ),
                endAdornment: phoneInput && (
                  <InputAdornment position="end">
                    <Button
                      size="small"
                      onClick={handleCheckPhone}
                      disabled={isCheckingPhone}
                      sx={{
                        fontFamily: "Kanit",
                        fontSize: 12,
                        minWidth: "auto",
                        color: PRIMARY_RED,
                      }}
                    >
                      {isCheckingPhone ? <CircularProgress size={16} /> : "ตรวจสอบ"}
                    </Button>
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          {/* Company Input */}
          <Grid item xs={12}>
            <StyledTextField
              mode="create"
              name="company"
              label="ชื่อบริษัท"
              value={companyInput}
              onChange={(e) => setCompanyInput(e.target.value)}
              onKeyDown={handleKeyDown}
              error={!!companyError}
              helperText={companyError || "กรอกชื่อบริษัทอย่างน้อย 3 ตัวอักษร"}
              placeholder="เช่น บริษัท ABC จำกัด"
              InputProps={{
                style: { fontFamily: "Kanit", fontSize: 14 },
                startAdornment: (
                  <InputAdornment position="start">
                    <MdBusiness size={18} color={PRIMARY_RED} />
                  </InputAdornment>
                ),
                endAdornment: companyInput && (
                  <InputAdornment position="end">
                    <Button
                      size="small"
                      onClick={handleCheckCompany}
                      disabled={isCheckingCompany}
                      sx={{
                        fontFamily: "Kanit",
                        fontSize: 12,
                        minWidth: "auto",
                        color: PRIMARY_RED,
                      }}
                    >
                      {isCheckingCompany ? <CircularProgress size={16} /> : "ตรวจสอบ"}
                    </Button>
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
        </Grid>

        {/* Check All Button */}
        <Button
          variant="contained"
          fullWidth
          onClick={handleCheckBoth}
          disabled={isSearching || (!phoneInput.trim() && !companyInput.trim())}
          startIcon={isSearching ? <CircularProgress size={18} color="inherit" /> : <MdSearch size={18} />}
          sx={{
            fontFamily: "Kanit",
            fontWeight: 600,
            bgcolor: PRIMARY_RED,
            "&:hover": { bgcolor: "#d32f2f" },
            mb: 2,
          }}
        >
          {isSearching ? "กำลังตรวจสอบ..." : "ตรวจสอบทั้งหมด"}
        </Button>

        {/* Results Section */}
        {(hasResults || isSearching) && (
          <>
            <Divider sx={{ mb: 2 }} />

            <Typography
              variant="subtitle1"
              sx={{ fontFamily: "Kanit", fontWeight: 600, mb: 2 }}
            >
              ผลการตรวจสอบ
            </Typography>

            {/* Phone Results */}
            <ResultSection
              title="เบอร์โทร"
              icon={<MdPhone size={18} color={PRIMARY_RED} />}
              results={phoneResults}
              isLoading={isCheckingPhone}
            />

            {/* Company Results */}
            <ResultSection
              title="ชื่อบริษัท"
              icon={<MdBusiness size={18} color={PRIMARY_RED} />}
              results={companyResults}
              isLoading={isCheckingCompany}
            />
          </>
        )}
      </DialogContent>

      {/* Actions */}
      <DialogActions sx={{ p: 2, borderTop: "1px solid #e0e0e0" }}>
        {hasResults && (
          <Button
            variant="outlined"
            onClick={resetForm}
            sx={{ fontFamily: "Kanit", mr: "auto" }}
          >
            ล้างผลลัพธ์
          </Button>
        )}
        <Button
          variant="outlined"
          color="error"
          onClick={handleClose}
          sx={{ fontFamily: "Kanit" }}
        >
          ปิด
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DuplicateCheckForm;
