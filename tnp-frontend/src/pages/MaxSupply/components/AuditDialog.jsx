import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  Chip,
  Divider,
  IconButton,
  Paper,
  Stack,
} from '@mui/material';
import { MdClose, MdHistory } from 'react-icons/md';
import { IoPersonCircle } from 'react-icons/io5';
import moment from 'moment';

// API
import { useMaxSupplyAuditLogs } from '../../../features/MaxSupply/maxSupplyApi';

// Utils
import { getStatusConfig, getPriorityConfig } from '../../../features/MaxSupply/maxSupplyUtils';

const AuditDialog = ({ open, onClose, maxSupplyId, title = "ประวัติการแก้ไข" }) => {
  const { data: auditLogs = [], isLoading, error } = useMaxSupplyAuditLogs(maxSupplyId);

  const formatAction = (action) => {
    const actions = {
      created: { label: 'สร้าง', color: 'success', icon: '➕' },
      updated: { label: 'แก้ไข', color: 'info', icon: '✏️' },
      deleted: { label: 'ลบ', color: 'error', icon: '🗑️' },
      status_changed: { label: 'เปลี่ยนสถานะ', color: 'warning', icon: '🔄' },
    };
    
    return actions[action] || { label: action, color: 'default', icon: '📝' };
  };

  const renderChangeDetails = (log) => {
    if (!log.formatted_changes || Object.keys(log.formatted_changes).length === 0) {
      return (
        <Typography variant="body2" color="text.secondary">
          {log.description}
        </Typography>
      );
    }

    return (
      <Box sx={{ mt: 1 }}>
        {Object.entries(log.formatted_changes).map(([field, change]) => (
          <Box key={field} sx={{ mb: 1 }}>
            <Typography variant="caption" sx={{ fontWeight: 'bold', textTransform: 'capitalize' }}>
              {field.replace('_', ' ')}:
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              {change.from && (
                <Chip
                  label={`จาก: ${change.from}`}
                  size="small"
                  variant="outlined"
                  color="error"
                />
              )}
              <Typography variant="caption">→</Typography>
              <Chip
                label={`เป็น: ${change.to}`}
                size="small"
                variant="outlined"
                color="success"
              />
            </Box>
          </Box>
        ))}
      </Box>
    );
  };

  const renderLogItem = (log) => {
    const actionConfig = formatAction(log.action);
    
    return (
      <ListItem key={log.id} alignItems="flex-start" sx={{ px: 0 }}>
        <Paper
          sx={{
            width: '100%',
            p: 2,
            border: '1px solid',
            borderColor: 'divider',
            '&:hover': {
              boxShadow: 1,
            },
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
            {/* Action Icon */}
            <Box
              sx={{
                minWidth: 40,
                height: 40,
                borderRadius: '50%',
                backgroundColor: `${actionConfig.color}.light`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.2rem',
              }}
            >
              {actionConfig.icon}
            </Box>

            {/* Content */}
            <Box sx={{ flex: 1 }}>
              {/* Header */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Chip
                  label={actionConfig.label}
                  color={actionConfig.color}
                  size="small"
                  variant="outlined"
                />
                <Typography variant="body2" color="text.secondary">
                  {moment(log.created_at).format('DD/MM/YYYY HH:mm:ss')}
                </Typography>
              </Box>

              {/* User Info */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <IoPersonCircle size={20} />
                <Typography variant="body2" color="text.secondary">
                  {log.user?.name || 'Unknown User'}
                </Typography>
                {log.ip_address && (
                  <Typography variant="caption" color="text.disabled">
                    ({log.ip_address})
                  </Typography>
                )}
              </Box>

              {/* Changes */}
              {renderChangeDetails(log)}
            </Box>
          </Box>
        </Paper>
      </ListItem>
    );
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { maxHeight: '80vh' }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <MdHistory size={24} />
          <Typography variant="h6" component="span">
            {title}
          </Typography>
          <IconButton
            onClick={onClose}
            sx={{ ml: 'auto' }}
            size="small"
          >
            <MdClose />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        {isLoading && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography>กำลังโหลดข้อมูล...</Typography>
          </Box>
        )}

        {error && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography color="error">
              เกิดข้อผิดพลาดในการโหลดข้อมูล
            </Typography>
          </Box>
        )}

        {!isLoading && !error && (
          <>
            {auditLogs.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography color="text.secondary">
                  ไม่มีประวัติการแก้ไข
                </Typography>
              </Box>
            ) : (
              <List sx={{ py: 0 }}>
                {auditLogs.map((log, index) => (
                  <React.Fragment key={log.id}>
                    {renderLogItem(log)}
                    {index < auditLogs.length - 1 && <Divider sx={{ my: 2 }} />}
                  </React.Fragment>
                ))}
              </List>
            )}
          </>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} variant="contained">
          ปิด
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AuditDialog;
