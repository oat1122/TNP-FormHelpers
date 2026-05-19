import { Assignment as AssignmentIcon } from "@mui/icons-material";
import { Box, FormControlLabel, Radio, RadioGroup, TextField, Typography } from "@mui/material";

import { InfoCard } from "../../../../PricingIntegration/components/styles/quotationFormStyles";
import DialogSectionHeader from "../subcomponents/DialogSectionHeader";
import { DEFAULT_DELIVERY_NOTES_TEXT } from "../utils/createDialogConstants";

/**
 * Section หมายเหตุสำหรับใบส่งของ — radio default/custom + preview + TextField.
 * เดิม inline ~90 บรรทัด.
 */
const NotesSection = ({ formState, onFieldChange }) => {
  const notesSource = formState.notesSource || "default";

  const handleNotesSourceRadio = (event) => {
    const value = event.target.value;
    onFieldChange("notesSource")({ target: { value } });
    if (value === "default") {
      onFieldChange("notes")({ target: { value: DEFAULT_DELIVERY_NOTES_TEXT } });
    }
  };

  return (
    <DialogSectionHeader
      icon={AssignmentIcon}
      title="หมายเหตุสำหรับใบส่งของ"
      subtitle="ข้อความที่จะแสดงในใบส่งของ"
    >
      <Box sx={{ p: 3 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            เลือกประเภทหมายเหตุ
          </Typography>
          <RadioGroup value={notesSource} onChange={handleNotesSourceRadio} row>
            <FormControlLabel value="default" control={<Radio />} label="ใช้ข้อความมาตรฐาน" />
            <FormControlLabel value="custom" control={<Radio />} label="กำหนดข้อความเอง" />
          </RadioGroup>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
            {notesSource === "custom"
              ? "กำหนดข้อความหมายเหตุเฉพาะสำหรับใบส่งของนี้"
              : "ใช้ข้อความเงื่อนไขการรับประกันและดูแลสินค้ามาตรฐาน"}
          </Typography>
        </Box>

        <InfoCard sx={{ p: 2, mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
            {notesSource === "custom" ? "ข้อความที่กำหนด" : "ข้อความมาตรฐาน"}
          </Typography>
          <Box
            sx={{
              p: 2,
              bgcolor: "grey.50",
              borderRadius: 1,
              border: "1px solid",
              borderColor: "grey.200",
            }}
          >
            <Typography variant="body2" sx={{ whiteSpace: "pre-line", color: "text.secondary" }}>
              {notesSource === "custom" ? formState.notes || "-" : DEFAULT_DELIVERY_NOTES_TEXT}
            </Typography>
          </Box>
        </InfoCard>

        {notesSource === "custom" && (
          <TextField
            label="หมายเหตุ"
            value={formState.notes}
            onChange={onFieldChange("notes")}
            fullWidth
            multiline
            minRows={6}
            size="small"
            placeholder="ระบุข้อความหมายเหตุ..."
            helperText="ข้อความที่จะแสดงในใบส่งของ เช่น เงื่อนไขการรับประกัน การดูแลสินค้า"
          />
        )}
      </Box>
    </DialogSectionHeader>
  );
};

export default NotesSection;
