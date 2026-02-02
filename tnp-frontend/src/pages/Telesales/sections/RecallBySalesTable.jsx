import {
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Box,
  Chip,
  Skeleton,
} from "@mui/material";

/**
 * Recall Stats by Sales Table
 * Displays recall statistics breakdown by sales person
 *
 * @param {Object} props
 * @param {Array} props.data - Array of user recall stats
 * @param {boolean} props.isLoading - Loading state
 */
const RecallBySalesTable = ({ data = [], isLoading = false }) => {
  if (!isLoading && (!data || data.length === 0)) {
    return null;
  }

  return (
    <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom fontWeight={600} fontFamily="Kanit">
        ประสิทธิภาพการติดตามลูกค้า รายบุคคล (Recall Performance by Sales)
      </Typography>

      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontFamily: "Kanit", fontWeight: "bold" }}>พนักงานขาย</TableCell>
              <TableCell align="center" sx={{ fontFamily: "Kanit", fontWeight: "bold" }}>
                ลูกค้าทั้งหมด
              </TableCell>
              <TableCell
                align="center"
                sx={{ fontFamily: "Kanit", fontWeight: "bold", color: "error.main" }}
              >
                รอกด Recall (ตกเกณฑ์)
              </TableCell>
              <TableCell
                align="center"
                sx={{ fontFamily: "Kanit", fontWeight: "bold", color: "success.main" }}
              >
                อยู่ในเกณฑ์
              </TableCell>
              <TableCell
                align="center"
                sx={{ fontFamily: "Kanit", fontWeight: "bold", color: "info.main" }}
              >
                กด Recall (ในรอบนี้)
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading
              ? // Skeleton Rows
                [...Array(5)].map((_, index) => (
                  <TableRow key={`skeleton-${index}`}>
                    <TableCell>
                      <Box>
                        <Skeleton variant="text" width={120} height={24} />
                        <Skeleton variant="text" width={80} height={16} />
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Skeleton variant="text" width={40} sx={{ mx: "auto" }} />
                    </TableCell>
                    <TableCell align="center">
                      <Skeleton variant="circular" width={24} height={24} sx={{ mx: "auto" }} />
                    </TableCell>
                    <TableCell align="center">
                      <Skeleton variant="text" width={30} sx={{ mx: "auto" }} />
                    </TableCell>
                    <TableCell align="center">
                      <Skeleton variant="circular" width={24} height={24} sx={{ mx: "auto" }} />
                    </TableCell>
                  </TableRow>
                ))
              : // Data Rows
                data.map((user) => (
                  <TableRow key={user.user_id} hover>
                    <TableCell sx={{ fontFamily: "Kanit" }}>
                      <Box>
                        <Typography variant="body2" fontWeight={500}>
                          {user.full_name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {user.username}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="center" sx={{ fontFamily: "Kanit" }}>
                      {user.total_customers.toLocaleString()}
                    </TableCell>
                    <TableCell align="center" sx={{ fontFamily: "Kanit" }}>
                      <Chip
                        label={user.waiting_count.toLocaleString()}
                        size="small"
                        color={user.waiting_count > 0 ? "error" : "default"}
                        variant={user.waiting_count > 0 ? "filled" : "outlined"}
                      />
                    </TableCell>
                    <TableCell align="center" sx={{ fontFamily: "Kanit" }}>
                      <Typography color="success.main" fontWeight={500}>
                        {user.in_criteria_count.toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell align="center" sx={{ fontFamily: "Kanit" }}>
                      <Chip
                        label={user.recalls_made_count.toLocaleString()}
                        size="small"
                        color="info"
                        variant="outlined"
                      />
                    </TableCell>
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

export default RecallBySalesTable;
