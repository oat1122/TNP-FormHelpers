import { Assignment as AssignmentIcon } from "@mui/icons-material";
import { Box, Button, DialogActions, Typography } from "@mui/material";

import { PrimaryButton } from "../../../styles/quotationFormStyles";

const DialogFooterActions = ({ selectedCount, totalCount, isSubmitting, onClose, onSubmit }) => (
  <DialogActions sx={{ p: 2 }}>
    <Box display="flex" justifyContent="space-between" alignItems="center" width="100%">
      <Typography variant="caption" color="text.secondary">
        {selectedCount > 0 && `เลือกแล้ว ${selectedCount} งาน จากทั้งหมด ${totalCount} งาน`}
      </Typography>
      <Box display="flex" gap={1}>
        <Button onClick={onClose} disabled={isSubmitting}>
          ยกเลิก
        </Button>
        <PrimaryButton
          onClick={onSubmit}
          disabled={isSubmitting || selectedCount === 0}
          startIcon={<AssignmentIcon />}
        >
          {isSubmitting ? "กำลังสร้าง…" : `สร้างใบเสนอราคา (${selectedCount} งาน)`}
        </PrimaryButton>
      </Box>
    </Box>
  </DialogActions>
);

export default DialogFooterActions;
