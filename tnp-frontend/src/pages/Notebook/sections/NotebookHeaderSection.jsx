import { Box, Button, Chip, Stack, Tab, Tabs, Typography } from "@mui/material";
import { MdFileDownload } from "react-icons/md";
import { RiAddLine } from "react-icons/ri";

const NotebookHeaderSection = ({
  total,
  onOpenExport,
  onAdd,
  onAddCustomerCare,
  onAddPersonalActivity,
  disableExport,
  canCreateCustomerCare = false,
  scopeFilter = "all",
  onScopeChange,
  showScopeTabs = false,
  showAllScopeTab = false,
  canSelfReport = false,
}) => (
  <Box
    sx={{
      display: "flex",
      flexDirection: { xs: "column", lg: "row" },
      gap: 2,
      justifyContent: "space-between",
      mb: 2,
    }}
  >
    <Box sx={{ minWidth: 0 }}>
      <Typography variant="h5" component="h1" fontWeight="bold" color="text.secondary">
        รายการที่จดบันทึก
      </Typography>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mt: 1, flexWrap: "wrap" }}>
        <Chip label={`ทั้งหมด ${total || 0} รายการ`} color="default" variant="outlined" />
      </Stack>

      {showScopeTabs ? (
        <Tabs
          value={scopeFilter}
          onChange={(_, value) => onScopeChange?.(value)}
          sx={{ mt: 1.5, minHeight: 40 }}
        >
          {showAllScopeTab ? <Tab value="all" label="ทั้งหมด" sx={{ minHeight: 40 }} /> : null}
          <Tab value="queue" label="คิวกลาง" sx={{ minHeight: 40 }} />
          <Tab value="mine" label="ลูกค้าของฉัน" sx={{ minHeight: 40 }} />
        </Tabs>
      ) : null}
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
        {canSelfReport ? "Export PDF Report" : "Export ข้อมูล"}
      </Button>
      <Button
        variant="contained"
        startIcon={<RiAddLine />}
        onClick={onAdd}
        sx={{ bgcolor: "#d32f2f", "&:hover": { bgcolor: "#b71c1c" } }}
      >
        จดบันทึก
      </Button>
      <Button
        variant="contained"
        onClick={onAddPersonalActivity}
        sx={{ bgcolor: "#ed6c02", "&:hover": { bgcolor: "#c77700" } }}
      >
        ธุระส่วนตัว
      </Button>
      {canCreateCustomerCare ? (
        <Button
          variant="contained"
          onClick={onAddCustomerCare}
          sx={{ bgcolor: "#00695c", "&:hover": { bgcolor: "#004d40" } }}
        >
          ดูแลลูกค้า
        </Button>
      ) : null}
    </Stack>
  </Box>
);

export default NotebookHeaderSection;
