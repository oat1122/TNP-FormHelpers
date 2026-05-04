import {
  Box,
  Chip,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";

const InvoiceCardCompanySelector = ({
  invoice,
  companies,
  currentCompany,
  loadingCompanies,
  updatingCompany,
  onCompanyChange,
}) => (
  <Box mb={2.5}>
    <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
      เลือกบริษัทที่ออกเอกสาร
    </Typography>
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
      <FormControl
        size="small"
        sx={{ minWidth: 200 }}
        disabled={loadingCompanies || updatingCompany}
      >
        <InputLabel id={`company-select-label-${invoice.id}`}>บริษัท</InputLabel>
        <Select
          labelId={`company-select-label-${invoice.id}`}
          value={companies.find((c) => c.id === invoice.company_id) ? invoice.company_id : ""}
          label="บริษัท"
          onChange={(e) => onCompanyChange(e.target.value)}
          renderValue={(val) => {
            const found = companies.find((c) => c.id === val);
            return found ? found.short_code || found.name : "ไม่ระบุ";
          }}
        >
          {companies.map((c) => (
            <MenuItem key={c.id} value={c.id}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {c.short_code || c.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {c.name}
                </Typography>
              </Stack>
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {currentCompany && (
        <Tooltip title={`บริษัทปัจจุบัน: ${currentCompany.name}`}>
          <Chip
            size="small"
            color="primary"
            variant="outlined"
            label={currentCompany.short_code || currentCompany.name}
          />
        </Tooltip>
      )}

      {(loadingCompanies || updatingCompany) && <CircularProgress size={18} />}
    </Box>

    <Typography
      variant="caption"
      sx={{ fontSize: "0.75rem", color: "text.secondary", mt: 0.5, display: "block" }}
    >
      หมายเหตุ: เลขที่เอกสารจะถูกสร้างหลังจากกดอนุมัติ
      และสามารถเปลี่ยนบริษัทได้เฉพาะก่อนอนุมัติเท่านั้น
    </Typography>
  </Box>
);

export default InvoiceCardCompanySelector;
