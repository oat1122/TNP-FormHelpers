import { Box, Button, Chip, Stack, Typography } from "@mui/material";
import { MdFileDownload } from "react-icons/md";
import { RiAddLine } from "react-icons/ri";

const NotebookHeaderSection = ({ total, isRefreshing, onOpenExport, onAdd, disableExport }) => (
  <Box
    sx={{
      display: "flex",
      flexDirection: { xs: "column", lg: "row" },
      gap: 2,
      justifyContent: "space-between",
      mb: 2,
    }}
  >
    <Box>
      <Typography variant="h5" component="h1" fontWeight="bold" color="text.secondary">
        รายการที่จดบันทึก
      </Typography>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mt: 1, flexWrap: "wrap" }}>
        <Chip label={`ทั้งหมด ${total || 0} รายการ`} color="default" variant="outlined" />
        <Chip
          label={isRefreshing ? "กำลังอัปเดตข้อมูล" : "ข้อมูลพร้อมใช้งาน"}
          color={isRefreshing ? "info" : "success"}
          variant="outlined"
        />
      </Stack>
    </Box>

    <Stack
      direction={{ xs: "column", sm: "row" }}
      spacing={1}
      sx={{ alignSelf: { lg: "flex-start" } }}
    >
      <Button
        variant="outlined"
        startIcon={<MdFileDownload />}
        onClick={onOpenExport}
        disabled={disableExport}
        sx={{ borderColor: "#1976d2", color: "#1976d2" }}
      >
        Export ข้อมูล
      </Button>
      <Button
        variant="contained"
        startIcon={<RiAddLine />}
        onClick={onAdd}
        sx={{ bgcolor: "#d32f2f", "&:hover": { bgcolor: "#b71c1c" } }}
      >
        จดบันทึก
      </Button>
    </Stack>
  </Box>
);

export default NotebookHeaderSection;
