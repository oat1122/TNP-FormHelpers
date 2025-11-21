import React, { useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  LinearProgress,
  Alert,
  CircularProgress,
} from "@mui/material";
import { CheckCircle, Error as ErrorIcon, Sync } from "@mui/icons-material";
import {
  useGetSyncJobStatusQuery,
  accountingApi,
} from "../../../../features/Accounting/accountingApi";
import { showSuccess, showError } from "../../utils/accountingToast";
import { tokens } from "../../PricingIntegration/components/quotation/styles/quotationTheme";

/**
 * SyncProgressDialog Component
 *
 * Memory-safe polling dialog that tracks background sync job progress
 * Automatically stops polling when dialog closes to prevent memory leaks
 * Invalidates cache and shows toast notification on completion
 *
 * @param {boolean} open - Dialog open state
 * @param {function} onClose - Close handler
 * @param {string} syncJobId - Sync job ID to track
 */
const SyncProgressDialog = ({ open, syncJobId, onClose }) => {
  const dispatch = useDispatch();
  const autoCloseTimerRef = useRef(null);
  const hasNotifiedRef = useRef(false);

  // Polling query with conditional activation
  const {
    data: jobData,
    isLoading,
    error,
  } = useGetSyncJobStatusQuery(syncJobId, {
    skip: !open || !syncJobId,
    pollingInterval: open && syncJobId ? 2000 : 0, // Poll every 2s only when dialog is open
    refetchOnMountOrArgChange: true,
  });

  const job = jobData?.data;
  const status = job?.status || "pending";
  const progress = job?.progress_current || 0;
  const total = job?.progress_total || 0;
  const progressPercentage = total > 0 ? Math.round((progress / total) * 100) : 0;
  const isCompleted = status === "completed";
  const isFailed = status === "failed";
  const isProcessing = status === "processing";

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (autoCloseTimerRef.current) {
        clearTimeout(autoCloseTimerRef.current);
      }
    };
  }, []);

  // Handle completion/failure
  useEffect(() => {
    if (!job || hasNotifiedRef.current) return;

    if (isCompleted) {
      hasNotifiedRef.current = true;

      // Invalidate cache to force refresh
      dispatch(accountingApi.util.invalidateTags(["Invoice", "Quotation", "SyncJob"]));

      showSuccess("ซิงค์ข้อมูลเสร็จสมบูรณ์! ใบแจ้งหนี้ทั้งหมดได้รับการอัปเดตแล้ว", {
        duration: 4000,
      });

      // Auto-close after 3 seconds
      autoCloseTimerRef.current = setTimeout(() => {
        onClose();
        hasNotifiedRef.current = false;
      }, 3000);
    } else if (isFailed) {
      hasNotifiedRef.current = true;

      showError(
        job.error_message || "การซิงค์ข้อมูลล้มเหลว กรุณาลองใหม่อีกครั้งหรือติดต่อผู้ดูแลระบบ",
        { duration: 6000 }
      );

      // Auto-close after 5 seconds
      autoCloseTimerRef.current = setTimeout(() => {
        onClose();
        hasNotifiedRef.current = false;
      }, 5000);
    }
  }, [isCompleted, isFailed, job, dispatch, onClose]);

  const getStatusIcon = () => {
    if (isCompleted) return <CheckCircle sx={{ fontSize: 48, color: "#4caf50" }} />;
    if (isFailed) return <ErrorIcon sx={{ fontSize: 48, color: "#f44336" }} />;
    return (
      <Sync sx={{ fontSize: 48, color: tokens.primary, animation: "spin 2s linear infinite" }} />
    );
  };

  const getStatusText = () => {
    if (isCompleted) return "ซิงค์เสร็จสมบูรณ์";
    if (isFailed) return "การซิงค์ล้มเหลว";
    if (isProcessing) return "กำลังซิงค์ข้อมูล...";
    return "กำลังเตรียมการซิงค์...";
  };

  const getStatusColor = () => {
    if (isCompleted) return "#4caf50";
    if (isFailed) return "#f44336";
    return tokens.primary;
  };

  return (
    <>
      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
      <Dialog
        open={open}
        onClose={isCompleted || isFailed ? onClose : undefined}
        maxWidth="sm"
        fullWidth
        disableEscapeKeyDown={!isCompleted && !isFailed}
      >
        <DialogTitle sx={{ textAlign: "center", pb: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            ซิงค์ข้อมูลไปยังใบแจ้งหนี้
          </Typography>
        </DialogTitle>

        <DialogContent sx={{ p: 3 }}>
          {isLoading && !job ? (
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", py: 3 }}>
              <CircularProgress size={48} />
              <Typography variant="body2" sx={{ mt: 2, color: tokens.textSecondary }}>
                กำลังโหลดข้อมูล...
              </Typography>
            </Box>
          ) : error ? (
            <Alert severity="error">
              ไม่สามารถโหลดสถานะการซิงค์ได้:{" "}
              {error?.data?.message || error?.message || "เกิดข้อผิดพลาด"}
            </Alert>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              {/* Status Icon */}
              <Box sx={{ mb: 2 }}>{getStatusIcon()}</Box>

              {/* Status Text */}
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  color: getStatusColor(),
                  mb: 3,
                }}
              >
                {getStatusText()}
              </Typography>

              {/* Progress Bar */}
              {!isFailed && (
                <Box sx={{ width: "100%", mb: 2 }}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      mb: 1,
                    }}
                  >
                    <Typography variant="body2" sx={{ color: tokens.textSecondary }}>
                      ความคืบหน้า
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {progress} / {total} ใบ ({progressPercentage}%)
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant={
                      isCompleted ? "determinate" : isProcessing ? "determinate" : "indeterminate"
                    }
                    value={progressPercentage}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: tokens.border,
                      "& .MuiLinearProgress-bar": {
                        backgroundColor: getStatusColor(),
                        borderRadius: 4,
                      },
                    }}
                  />
                </Box>
              )}

              {/* Error Message */}
              {isFailed && job?.error_message && (
                <Alert severity="error" sx={{ width: "100%", mt: 2 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                    รายละเอียดข้อผิดพลาด:
                  </Typography>
                  <Typography variant="body2">{job.error_message}</Typography>
                </Alert>
              )}

              {/* Processing Info */}
              {isProcessing && (
                <Alert severity="info" sx={{ width: "100%", mt: 2 }}>
                  <Typography variant="body2">
                    กระบวนการนี้อาจใช้เวลาสักครู่ โปรดรอจนกว่าจะเสร็จสมบูรณ์
                    คุณสามารถปิดหน้าต่างนี้ได้ ระบบจะทำงานในพื้นหลังต่อไป
                  </Typography>
                </Alert>
              )}

              {/* Completion Info */}
              {isCompleted && (
                <Alert severity="success" sx={{ width: "100%", mt: 2 }}>
                  <Typography variant="body2">
                    อัปเดตข้อมูลใบแจ้งหนี้ทั้งหมด {total} ใบเรียบร้อยแล้ว
                    หน้าต่างนี้จะปิดอัตโนมัติใน 3 วินาที
                  </Typography>
                </Alert>
              )}
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SyncProgressDialog;
