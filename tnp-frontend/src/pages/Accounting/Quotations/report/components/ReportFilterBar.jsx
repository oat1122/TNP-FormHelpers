import SearchIcon from "@mui/icons-material/Search";
import {
  Box,
  Divider,
  FormControl,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
} from "@mui/material";

import ReportDateNavigator from "./ReportDateNavigator";
import ReportExportButton from "./ReportExportButton";

const ReportFilterBar = ({ dateFilter, report }) => (
  <Paper
    elevation={0}
    sx={{ p: 2, mb: 2.5, border: "1px solid", borderColor: "divider", borderRadius: 2 }}
  >
    <ReportDateNavigator dateFilter={dateFilter} />

    <Divider sx={{ mb: 2, borderColor: "divider" }} />

    <Stack direction={{ xs: "column", sm: "row" }} flexWrap="wrap" gap={2} alignItems="center">
      {report.companies.length > 0 && (
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>บริษัท</InputLabel>
          <Select
            value={report.companyId}
            onChange={(e) => report.setCompanyId(e.target.value)}
            label="บริษัท"
          >
            <MenuItem value="">ทั้งหมด</MenuItem>
            {report.companies.map((c) => (
              <MenuItem key={c.id} value={c.id}>
                {c.name || c.company_name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      <Box component="form" onSubmit={report.handleSearchSubmit}>
        <TextField
          size="small"
          placeholder="ค้นหาเลขที่, ลูกค้า, โปรเจ็ค..."
          value={report.searchInput}
          onChange={(e) => report.setSearchInput(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
          sx={{ minWidth: 240 }}
        />
      </Box>

      <Box sx={{ ml: "auto" }}>
        <ReportExportButton
          filters={report.queryParams}
          disabled={report.isLoading || report.isFetching}
        />
      </Box>
    </Stack>
  </Paper>
);

export default ReportFilterBar;
