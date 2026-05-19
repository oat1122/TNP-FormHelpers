import { Assignment as AssignmentIcon } from "@mui/icons-material";
import { Box } from "@mui/material";

import DialogSectionHeader from "../subcomponents/DialogSectionHeader";
import NoteItemsTable from "../subcomponents/NoteItemsTable";

/**
 * Section แสดงตารางรายการงาน — wrap NoteItemsTable พร้อม header.
 */
const ItemsSection = ({ groups, setGroups, invoiceNumber, canEdit }) => (
  <DialogSectionHeader
    icon={AssignmentIcon}
    title="รายการงาน"
    subtitle="ข้อมูลงานและจำนวนที่จัดส่ง"
  >
    <Box sx={{ p: 3 }}>
      <NoteItemsTable
        groups={groups}
        setGroups={setGroups}
        invoiceNumber={invoiceNumber}
        canEdit={canEdit}
      />
    </Box>
  </DialogSectionHeader>
);

export default ItemsSection;
