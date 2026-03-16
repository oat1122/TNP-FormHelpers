import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Typography,
  Box,
  Stack,
  CircularProgress,
  List,
  ListItem,
  Divider,
} from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";
import dayjs from "dayjs";

import { useGetNotebookKpiDetailsQuery } from "../../../features/Customer/customerApi";

const NotebookHistoryDialog = ({
  open,
  onClose,
  userId,
  userName,
  periodFilter,
  sourceFilter,
}) => {
  const { data: detailsData, isLoading, isFetching } = useGetNotebookKpiDetailsQuery(
    {
      period: periodFilter?.mode,
      start_date: periodFilter?.startDate,
      end_date: periodFilter?.endDate,
      source_filter: sourceFilter,
      user_id: userId,
    },
    { skip: !open || !userId }
  );

  const histories = detailsData?.data || [];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ m: 0, p: 2, fontFamily: "Kanit", display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" component="div" sx={{ fontFamily: "Kanit", fontWeight: 'bold' }}>
          ประวัติการอัพเดท Notebook: {userName}
        </Typography>
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {isLoading || isFetching ? (
          <Box display="flex" justifyContent="center" p={4}>
            <CircularProgress />
          </Box>
        ) : histories.length === 0 ? (
          <Typography textAlign="center" color="text.secondary" sx={{ py: 4, fontFamily: "Kanit" }}>
            ไม่พบประวัติการอัพเดทข้อมูลสำหรับช่วงเวลานี้
          </Typography>
        ) : (
          <List sx={{ width: '100%', bgcolor: 'background.paper', p: 0 }}>
            {histories.map((history, index) => {
              // Parse changes
              const changes = [];
              if (history.action_type === "updated" && history.new_values) {
                try {
                  const newVals = JSON.parse(history.new_values);
                  Object.entries(newVals).forEach(([key, val]) => {
                    // Ignore metadata updates that users don't care about
                    if (["updated_by", "created_by"].includes(key)) return;
                    changes.push(`${key}: ${val}`);
                  });
                } catch (e) {
                  // Ignore parse errors
                }
              }

              return (
                <React.Fragment key={history.history_id}>
                  <ListItem sx={{ flexDirection: 'column', alignItems: 'flex-start', py: 2 }}>
                    
                    {/* Customer Context */}
                    <Box mb={1} width="100%">
                      <Typography variant="subtitle2" sx={{ fontFamily: "Kanit", fontWeight: "bold", color: "primary.main" }}>
                        ลูกค้า: {history.nb_customer_name || 'ไม่ระบุชื่อ'}
                        {history.nb_contact_number ? ` (${history.nb_contact_number})` : ""}
                      </Typography>
                    </Box>

                    {/* Like the provided HTML snippet */}
                    <Box sx={{ p: 1.5, bgcolor: '#f8f9fa', borderRadius: 1, width: '100%' }}>
                      <Stack direction="row" spacing={1} alignItems="center" mb={0.5}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontFamily: "Kanit" }}>
                          {dayjs(history.created_at).format("DD MMM YYYY HH:mm")}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontFamily: "Kanit" }}>
                          · {history.action_type === 'created' ? 'เพิ่มข้อมูลใหม่' : 'อัพเดท'}
                        </Typography>
                      </Stack>
                      
                      {history.action_type === 'created' ? (
                        <Typography variant="body2" sx={{ fontFamily: "Kanit", whiteSpace: "pre-wrap" }}>
                          สร้างข้อมูล Notebook ใหม่
                        </Typography>
                      ) : (
                        <Typography variant="body2" sx={{ fontFamily: "Kanit", whiteSpace: "pre-wrap", color: "text.primary" }}>
                          {changes.length > 0 ? changes.join(", ") : "อัพเดทข้อมูลทั่วไป"}
                        </Typography>
                      )}
                    </Box>
                  </ListItem>
                  {index < histories.length - 1 && <Divider component="li" />}
                </React.Fragment>
              );
            })}
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} sx={{ fontFamily: "Kanit" }}>
          ปิด
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default NotebookHistoryDialog;
