import { Assignment as AssignmentIcon } from "@mui/icons-material";
import { Box, FormControlLabel, Radio, RadioGroup, TextField, Typography } from "@mui/material";

import { InfoCard } from "../../../../PricingIntegration/components/styles/quotationFormStyles";
import DialogSectionHeader from "../subcomponents/DialogSectionHeader";
import { DEFAULT_DELIVERY_NOTES_TEXT } from "../utils/editDialogConstants";

/**
 * Section หมายเหตุท้ายใบส่งของ — toggle default text vs custom + TextField.
 * เดิม inline ~80 บรรทัดใน shell.
 */
const NotesSection = ({ notesSource, onNotesSourceChange, formState, onFieldChange, canEdit }) => (
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
        <RadioGroup value={notesSource} onChange={onNotesSourceChange} row>
          <FormControlLabel
            value="default"
            control={<Radio disabled={!canEdit} />}
            label="ใช้ข้อความมาตรฐาน"
            disabled={!canEdit}
          />
          <FormControlLabel
            value="custom"
            control={<Radio disabled={!canEdit} />}
            label="กำหนดข้อความเอง"
            disabled={!canEdit}
          />
        </RadioGroup>
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
          {notesSource === "default"
            ? "ใช้ข้อความเงื่อนไขการรับประกันและดูแลสินค้ามาตรฐาน"
            : "กำหนดข้อความหมายเหตุเฉพาะสำหรับใบส่งของนี้"}
        </Typography>
      </Box>

      <InfoCard sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
          {notesSource === "default" ? "ข้อความมาตรฐาน" : "ข้อความที่กำหนด"}
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
            {notesSource === "default" ? DEFAULT_DELIVERY_NOTES_TEXT : formState.notes || "-"}
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
          disabled={!canEdit}
          placeholder="ระบุข้อความหมายเหตุ..."
          helperText="ข้อความที่จะแสดงในใบส่งของ เช่น เงื่อนไขการรับประกัน การดูแลสินค้า"
        />
      )}
    </Box>
  </DialogSectionHeader>
);

export default NotesSection;
