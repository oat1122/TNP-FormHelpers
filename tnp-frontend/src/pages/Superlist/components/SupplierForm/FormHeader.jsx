import { Box, Typography, Button, IconButton, CircularProgress } from "@mui/material";
import { MdArrowBack, MdSave } from "react-icons/md";
import { PRIMARY_RED } from "../../utils";

/**
 * FormHeader - Header bar with back button, title, and save button
 */
const FormHeader = ({ isCreate, isEdit, isView, saving, onSave, onBack }) => {
  const title = isCreate ? "เพิ่มสินค้าใหม่" : isEdit ? "แก้ไขสินค้า" : "รายละเอียดสินค้า";

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        mb: 3,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <IconButton onClick={onBack}>
          <MdArrowBack />
        </IconButton>
        <Typography variant="h5" sx={{ fontFamily: "Kanit", fontWeight: 600, color: PRIMARY_RED }}>
          {title}
        </Typography>
      </Box>
      {!isView && (
        <Button
          variant="contained"
          startIcon={saving ? <CircularProgress size={16} /> : <MdSave />}
          onClick={onSave}
          disabled={saving}
          sx={{ fontFamily: "Kanit", bgcolor: PRIMARY_RED }}
        >
          บันทึก
        </Button>
      )}
    </Box>
  );
};

export default FormHeader;
