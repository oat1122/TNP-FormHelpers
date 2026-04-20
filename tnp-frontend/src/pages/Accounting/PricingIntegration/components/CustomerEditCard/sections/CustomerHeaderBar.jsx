import {
  Edit as EditIcon,
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
  Save as SaveIcon,
  Business as BusinessIcon,
} from "@mui/icons-material";
import { Box, CircularProgress, IconButton, Typography } from "@mui/material";

import {
  CancelButton,
  CustomerHeader,
  EditButton,
  SaveButton,
  expandButtonSx,
  primaryIconSx,
} from "../styles/customerEditStyles";

const CustomerHeaderBar = ({
  isEditing,
  isExpanded,
  isHydrating,
  isSaving,
  onToggleExpand,
  onEdit,
  onCancel,
  onSave,
}) => (
  <CustomerHeader>
    <Box display="flex" alignItems="center" gap={2}>
      <BusinessIcon sx={primaryIconSx} />
      <Box>
        <Typography variant="h6" sx={{ color: primaryIconSx.color, fontWeight: 600 }}>
          ข้อมูลลูกค้า
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {isEditing
            ? isHydrating
              ? "กำลังดึงข้อมูลล่าสุด..."
              : "กำลังแก้ไขข้อมูล"
            : "คลิกเพื่อแก้ไขข้อมูลลูกค้า"}
        </Typography>
      </Box>
    </Box>

    <Box display="flex" gap={1}>
      {!isEditing && (
        <>
          <IconButton onClick={onToggleExpand} sx={expandButtonSx}>
            {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
          <EditButton onClick={onEdit}>
            <EditIcon />
          </EditButton>
        </>
      )}

      {isEditing && (
        <Box display="flex" gap={1}>
          <SaveButton
            onClick={onSave}
            disabled={isSaving || isHydrating}
            startIcon={
              isSaving || isHydrating ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <SaveIcon />
              )
            }
          >
            {isSaving ? "กำลังบันทึก..." : isHydrating ? "กำลังโหลด..." : "บันทึก"}
          </SaveButton>
          <CancelButton onClick={onCancel} disabled={isSaving || isHydrating}>
            ยกเลิก
          </CancelButton>
        </Box>
      )}
    </Box>
  </CustomerHeader>
);

export default CustomerHeaderBar;
