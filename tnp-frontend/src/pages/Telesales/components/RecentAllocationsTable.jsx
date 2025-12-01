import React from "react";
import {
  Card,
  CardHeader,
  CardContent,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Typography,
  Chip,
  Skeleton,
  Divider,
} from "@mui/material";
import dayjs from "dayjs";
import { getSourceDisplayName, getSourceColor } from "../../../features/Customer/customerUtils";

/**
 * Recent Allocations Table component
 * Shows the last 5 customer allocations with mobile-responsive column hiding
 *
 * @param {Object} props
 * @param {Array} props.data Array of recent allocation objects
 * @param {boolean} props.loading Loading state
 */
const RecentAllocationsTable = ({ data, loading }) => {
  const allocations = data || [];
  const isEmpty = !loading && allocations.length === 0;

  return (
    <Card elevation={2}>
      <CardHeader title="ลูกค้าที่จัดสรรล่าสุด" subheader="5 รายการล่าสุด" />
      <Divider />
      <CardContent sx={{ p: 0 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>ชื่อลูกค้า</TableCell>
              <TableCell>แหล่งที่มา</TableCell>
              <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>จัดสรรโดย</TableCell>
              <TableCell>จัดสรรเมื่อ</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              // Loading skeletons
              [...Array(5)].map((_, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Skeleton variant="text" width="80%" />
                  </TableCell>
                  <TableCell>
                    <Skeleton variant="rounded" width={80} height={24} />
                  </TableCell>
                  <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>
                    <Skeleton variant="text" width="70%" />
                  </TableCell>
                  <TableCell>
                    <Skeleton variant="text" width="90%" />
                  </TableCell>
                </TableRow>
              ))
            ) : isEmpty ? (
              // Empty state
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    ยังไม่มีการจัดสรร
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              // Data rows
              allocations.map((allocation, index) => (
                <TableRow
                  key={allocation.cus_id || index}
                  hover
                  sx={{ "&:last-child td": { borderBottom: 0 } }}
                >
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>
                      {allocation.cus_name || "-"}
                    </Typography>
                  </TableCell>

                  <TableCell>
                    <Chip
                      variant="outlined"
                      size="small"
                      label={getSourceDisplayName(allocation.cus_source)}
                      sx={{
                        bgcolor: `${getSourceColor(allocation.cus_source)}20`,
                        borderColor: getSourceColor(allocation.cus_source),
                        fontWeight: 500,
                      }}
                    />
                  </TableCell>

                  <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>
                    <Typography variant="body2">{allocation.allocated_by_name || "-"}</Typography>
                  </TableCell>

                  <TableCell>
                    <Typography variant="caption" color="text.secondary">
                      {allocation.cus_allocated_at
                        ? dayjs(allocation.cus_allocated_at).format("DD/MM/YY HH:mm")
                        : "-"}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default RecentAllocationsTable;
