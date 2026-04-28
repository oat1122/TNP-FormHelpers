import { Alert, Box, Divider, TextField, Typography } from "@mui/material";

import { PAYMENT_TERMS } from "../../../../shared/constants/paymentTerms";
import QuotationJobManager from "../QuotationJobManager";

const isCreditTerm = (type) => type === PAYMENT_TERMS.CREDIT_30 || type === PAYMENT_TERMS.CREDIT_60;

const JobsStep = ({ formData, errors, onChange, onJobsChange }) => {
  const isCredit = isCreditTerm(formData.payment_terms);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Divider sx={{ my: 2 }} />
      <Typography variant="h6">รายการงาน</Typography>
      {errors.jobs && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {errors.jobs}
        </Alert>
      )}
      <QuotationJobManager jobs={formData.jobs} onChange={onJobsChange} errors={errors} />

      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
        <TextField
          label="เงื่อนไขการชำระเงิน"
          value={formData.payment_terms}
          onChange={(e) => onChange("payment_terms", e.target.value)}
          fullWidth
          size="small"
          select
          SelectProps={{ native: true }}
        >
          <option value={PAYMENT_TERMS.CREDIT_30}>เครดิต 30 วัน</option>
          <option value={PAYMENT_TERMS.CREDIT_60}>เครดิต 60 วัน</option>
          <option value={PAYMENT_TERMS.CASH}>เงินสด</option>
          <option value={PAYMENT_TERMS.OTHER}>อื่นๆ (กำหนดเอง)</option>
        </TextField>

        {isCredit && (
          <TextField
            label="วันครบกำหนด"
            type="date"
            value={formData.due_date}
            onChange={(e) => onChange("due_date", e.target.value)}
            fullWidth
            size="small"
            InputLabelProps={{ shrink: true }}
          />
        )}
      </Box>

      {formData.payment_terms === PAYMENT_TERMS.OTHER && (
        <TextField
          label="เงื่อนไขการชำระเงิน (กำหนดเอง)"
          value={formData.payment_terms_custom}
          onChange={(e) => onChange("payment_terms_custom", e.target.value)}
          fullWidth
          placeholder="เช่น จ่าย 50% ก่อนเริ่มงาน, ส่วนที่เหลือ 30 วัน"
          size="small"
          required
        />
      )}

      <TextField
        label="ประเภทหัวกระดาษ"
        value={formData.document_header_type}
        onChange={(e) => onChange("document_header_type", e.target.value)}
        fullWidth
        select
        SelectProps={{ native: true }}
        size="small"
      >
        <option value="ต้นฉบับ">ต้นฉบับ</option>
        <option value="สำเนา">สำเนา</option>
      </TextField>

      <TextField
        label="หมายเหตุ"
        value={formData.notes}
        onChange={(e) => onChange("notes", e.target.value)}
        fullWidth
        multiline
        rows={2}
        placeholder="หมายเหตุเพิ่มเติม..."
        size="small"
      />
    </Box>
  );
};

export default JobsStep;
