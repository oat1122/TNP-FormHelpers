import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Button,
} from "@mui/material";
import { useState } from "react";

import { useGetNotebookKpiSummaryQuery } from "../../../features/Customer/customerApi";
import NotebookHistoryDialog from "../components/NotebookHistoryDialog";

const NotebookReportSection = ({ sourceFilter, globalPeriodFilter, isTeamView }) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [selectedUserName, setSelectedUserName] = useState("");
  const [selectedActionFilter, setSelectedActionFilter] = useState(null);

  const {
    data: summaryData,
    isLoading,
    isFetching,
  } = useGetNotebookKpiSummaryQuery({
    period: globalPeriodFilter.mode,
    start_date: globalPeriodFilter.startDate,
    end_date: globalPeriodFilter.endDate,
    source_filter: sourceFilter,
    user_id: isTeamView ? null : undefined, // depending if we want all or just current user
  });

  const handleRowClick = (user_id, user_name, action = null) => {
    setSelectedUserId(user_id);
    setSelectedUserName(user_name);
    setSelectedActionFilter(action);
    setDialogOpen(true);
  };

  const tableData = summaryData?.data || [];

  return (
    <Box sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h6" sx={{ mb: 2, fontFamily: "Kanit", fontWeight: "bold" }}>
        รายงานสมุดจดบันทึก (Notebook Report)
      </Typography>

      <Paper elevation={1} sx={{ p: 2, borderRadius: 2 }}>
        {isLoading || isFetching ? (
          <Box display="flex" justifyContent="center" p={4}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer>
            <Table size="medium">
              <TableHead>
                <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                  <TableCell sx={{ fontFamily: "Kanit", fontWeight: "bold" }}>รายชื่อ</TableCell>
                  <TableCell align="center" sx={{ fontFamily: "Kanit", fontWeight: "bold" }}>
                    เพิ่มลูกค้า (รายการ)
                  </TableCell>
                  <TableCell align="center" sx={{ fontFamily: "Kanit", fontWeight: "bold" }}>
                    อัพเดทลูกค้า (ครั้ง)
                  </TableCell>
                  <TableCell align="center" sx={{ fontFamily: "Kanit", fontWeight: "bold" }}>
                    รายละเอียด
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tableData.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      align="center"
                      sx={{ py: 3, fontFamily: "Kanit", color: "text.secondary" }}
                    >
                      ไม่มีข้อมูลในช่วงเวลานี้
                    </TableCell>
                  </TableRow>
                ) : (
                  tableData.map((row) => (
                    <TableRow key={row.user_id} hover>
                      <TableCell sx={{ fontFamily: "Kanit" }}>{row.user_name}</TableCell>
                      <TableCell align="center" sx={{ fontFamily: "Kanit" }}>
                        {row.added_count > 0 ? (
                          <Button
                            variant="text"
                            onClick={() => handleRowClick(row.user_id, row.user_name, "created")}
                            sx={{
                              minWidth: 0,
                              p: 0,
                              fontFamily: "Kanit",
                              textDecoration: "underline",
                            }}
                          >
                            {row.added_count}
                          </Button>
                        ) : (
                          row.added_count
                        )}
                      </TableCell>
                      <TableCell align="center" sx={{ fontFamily: "Kanit" }}>
                        {row.updated_count > 0 ? (
                          <Button
                            variant="text"
                            onClick={() => handleRowClick(row.user_id, row.user_name, "updated")}
                            sx={{
                              minWidth: 0,
                              p: 0,
                              fontFamily: "Kanit",
                              textDecoration: "underline",
                            }}
                          >
                            {row.updated_count}
                          </Button>
                        ) : (
                          row.updated_count
                        )}
                      </TableCell>
                      <TableCell align="center">
                        <Button
                          variant="outlined"
                          size="small"
                          sx={{ textTransform: "none", fontFamily: "Kanit", borderRadius: 2 }}
                          onClick={() => handleRowClick(row.user_id, row.user_name)}
                        >
                          ดูประวัติ
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* History Dialog */}
      <NotebookHistoryDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        userId={selectedUserId}
        userName={selectedUserName}
        periodFilter={globalPeriodFilter}
        sourceFilter={sourceFilter}
        actionFilter={selectedActionFilter}
      />
    </Box>
  );
};

export default NotebookReportSection;
