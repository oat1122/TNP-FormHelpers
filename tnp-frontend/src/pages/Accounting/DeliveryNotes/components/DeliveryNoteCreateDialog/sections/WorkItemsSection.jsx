import { Assignment as AssignmentIcon } from "@mui/icons-material";
import {
  Box,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";

import { InfoCard } from "../../../../PricingIntegration/components/styles/quotationFormStyles";
import InvoiceItemsTable from "../../InvoiceItemsTable";
import DialogSectionHeader from "../subcomponents/DialogSectionHeader";

/**
 * Section รายการงาน — แสดง InvoiceItemsTable เมื่อ invoice มี items
 * หรือ fallback เป็น manual form (ชื่องาน + จำนวน) + single-row table preview.
 */
const WorkItemsSection = ({ invoice, formState, source, onFieldChange, onUpdateItems }) => {
  const hasInvoiceItems = (invoice?.items?.length ?? 0) > 0;

  return (
    <DialogSectionHeader
      icon={AssignmentIcon}
      title="รายการงาน"
      subtitle="ข้อมูลงานและจำนวนที่จัดส่ง"
    >
      <Box sx={{ p: 3 }}>
        {!hasInvoiceItems && (
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} md={8}>
              <TextField
                label="ชื่องาน"
                value={formState.work_name}
                onChange={onFieldChange("work_name")}
                fullWidth
                size="small"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                label="จำนวน"
                value={formState.quantity}
                onChange={onFieldChange("quantity")}
                fullWidth
                size="small"
              />
            </Grid>
          </Grid>
        )}

        {hasInvoiceItems ? (
          <InvoiceItemsTable invoice={invoice} onUpdateItems={onUpdateItems} />
        ) : (
          <InfoCard>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>รายการ</TableCell>
                  <TableCell align="center">จำนวน</TableCell>
                  <TableCell align="right">หมายเหตุ</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>
                      {formState.work_name || source?.item_name || source?.work_name || "-"}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="body2">{formState.quantity || "1"}</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" color="text.secondary">
                      {formState.notes || "-"}
                    </Typography>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </InfoCard>
        )}
      </Box>
    </DialogSectionHeader>
  );
};

export default WorkItemsSection;
