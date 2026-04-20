import {
  Assignment as AssignmentIcon,
  Business as BusinessIcon,
  CheckCircle as CheckCircleIcon,
  Edit as EditIcon,
} from "@mui/icons-material";
import { Avatar, Box, Button, CardActions, Collapse, Stack, Typography } from "@mui/material";
import { memo, useCallback, useMemo, useState } from "react";

import { sortPricingRequestsByLatest } from "./utils/sortUtils";
import {
  accountingCardDividerSx,
  AccountingCard,
  AccountingCardContent,
  AccountingCountChip,
  AccountingListItem,
  AccountingPrimaryButton,
  AccountingSecondaryButton,
  AccountingStatusChip,
  PricingPRNumber,
} from "../../shared/styles/accountingCardStyles";
import { tokens } from "../../shared/styles/tokens";

const headingSx = {
  fontWeight: 600,
  fontFamily: "'Kanit', sans-serif",
  color: tokens.textPrimary,
  fontSize: "1.1rem",
  lineHeight: 1.3,
};

const subheadingSx = {
  fontFamily: "'Kanit', sans-serif",
  color: tokens.textSecondary,
  fontSize: "0.875rem",
};

const bodyTextSx = {
  fontFamily: "'Kanit', sans-serif",
  color: tokens.textSecondary,
  fontSize: "0.875rem",
  lineHeight: 1.3,
  margin: 0,
  padding: 0,
};

const prNumberSx = {
  lineHeight: 1.2,
  fontSize: "0.875rem",
  fontWeight: 600,
  margin: 0,
  padding: 0,
};

const chipSx = {
  flexShrink: 0,
  height: 24,
  fontSize: "0.75rem",
  alignSelf: "flex-start",
};

const getStatusColor = (status) => {
  const statusMap = {
    complete: "success",
    ได้ราคาแล้ว: "success",
    pending: "warning",
    รอทำราคา: "warning",
    in_progress: "info",
    กำลังทำราคา: "info",
    submitted: "primary",
    ส่งคำขอสร้างใบเสนอราคาแล้ว: "primary",
  };
  return statusMap[status?.toLowerCase()] || "primary";
};

const getPRDisplayNumber = (req) => req.pr_no || req.pr_number || req.pr_id?.slice(-8) || "N/A";

const getPrimaryStatus = (req) => {
  if (req.is_quoted) {
    return { label: "มีใบเสนอราคาแล้ว", color: "warning", showIcon: false };
  }
  if (req.pr_status) {
    return { label: req.pr_status, color: getStatusColor(req.pr_status), showIcon: true };
  }
  return null;
};

const RequestListItem = ({ req, showBottomMargin = false }) => {
  const primaryStatus = getPrimaryStatus(req);
  return (
    <AccountingListItem role="listitem" sx={{ mb: showBottomMargin ? 0.5 : 0, px: 0, mx: 0 }}>
      <Box
        display="flex"
        alignItems="flex-start"
        justifyContent="space-between"
        minHeight="48px"
        py={0.75}
        px={1.25}
        sx={{ width: "100%" }}
      >
        <Box display="flex" flexDirection="column" flex={1} gap={0.25} sx={{ pr: 1.5 }}>
          <PricingPRNumber sx={prNumberSx}>#{getPRDisplayNumber(req)}</PricingPRNumber>
          <Typography sx={bodyTextSx}>{req.pr_work_name || "ไม่ระบุชื่องาน"}</Typography>
        </Box>
        {primaryStatus && (
          <AccountingStatusChip
            label={primaryStatus.label}
            statuscolor={primaryStatus.color}
            size="small"
            icon={
              primaryStatus.showIcon ? <CheckCircleIcon sx={{ fontSize: "0.75rem" }} /> : undefined
            }
            sx={chipSx}
          />
        )}
      </Box>
    </AccountingListItem>
  );
};

const PricingRequestCard = ({ group, onCreateQuotation, onEditCustomer }) => {
  const [expanded, setExpanded] = useState(false);

  const sortedRequests = useMemo(
    () => sortPricingRequestsByLatest(group.requests || []),
    [group.requests]
  );
  const latestThree = useMemo(() => sortedRequests.slice(0, 3), [sortedRequests]);
  const hasMore = (group?.requests?.length || 0) > 3;

  const collapseId = useMemo(
    () =>
      `pr-extra-${group?._customerId || group?.customer?.id || group?.customer_id || "unknown"}`,
    [group]
  );

  const handleEdit = useCallback(() => onEditCustomer?.(group), [onEditCustomer, group]);
  const handleCreate = useCallback(() => onCreateQuotation(group), [onCreateQuotation, group]);

  return (
    <AccountingCard>
      <AccountingCardContent>
        <Box display="flex" alignItems="center" mb={2.5}>
          <Avatar
            role="presentation"
            aria-hidden="true"
            sx={{
              bgcolor: "secondary.main",
              width: 48,
              height: 48,
              mr: 2,
              boxShadow: "0 2px 8px rgba(178, 0, 0, 0.2)",
            }}
          >
            <BusinessIcon sx={{ fontSize: "1.5rem" }} />
          </Avatar>
          <Box flex={1}>
            <Typography variant="h6" component="h3" sx={headingSx}>
              {group.customer?.cus_company || "ไม่ระบุบริษัท"}
            </Typography>
            <Typography sx={subheadingSx}>
              {[group.customer?.cus_firstname, group.customer?.cus_lastname]
                .filter(Boolean)
                .join(" ") || "ไม่ระบุชื่อ"}
            </Typography>
          </Box>
        </Box>

        <Stack direction="row" spacing={1} flexWrap="wrap" mb={2.5}>
          <AccountingCountChip label={`ทั้งหมด ${group.total_count} งาน`} size="small" />
          {Object.entries(group.status_counts).map(([status, count]) => (
            <AccountingStatusChip
              key={status}
              label={`${status} (${count})`}
              size="small"
              statuscolor={getStatusColor(status)}
            />
          ))}
          {group.quoted_count > 0 && (
            <AccountingStatusChip
              label={`มีใบเสนอราคา ${group.quoted_count} งาน`}
              statuscolor="warning"
              size="small"
            />
          )}
        </Stack>

        <Box component="hr" sx={accountingCardDividerSx} />

        <Stack spacing={0.5} component="ul" role="list" sx={{ px: 0, mx: 0 }}>
          {latestThree.map((req) => (
            <RequestListItem key={req.pr_id} req={req} />
          ))}

          {hasMore && (
            <Collapse in={expanded} timeout={250} unmountOnExit id={collapseId}>
              <Box mt={0.25} sx={{ px: 0, mx: 0 }}>
                {sortedRequests.slice(3).map((req) => (
                  <RequestListItem key={req.pr_id} req={req} showBottomMargin />
                ))}
              </Box>
            </Collapse>
          )}
        </Stack>

        {hasMore && (
          <Box mt={1} sx={{ display: "flex", justifyContent: "center" }}>
            <Button
              size="small"
              onClick={() => setExpanded((v) => !v)}
              aria-controls={collapseId}
              aria-expanded={expanded}
              aria-label={expanded ? "Hide more requests" : "Show more requests"}
              sx={{ mt: 0.5, textTransform: "none", transition: "all 200ms ease" }}
            >
              {expanded ? "แสดงน้อยลง" : "ดูเพิ่มเติม"}
            </Button>
          </Box>
        )}
      </AccountingCardContent>

      <Box component="hr" sx={accountingCardDividerSx} />

      <CardActions sx={{ p: 2.5, justifyContent: "space-between", bgcolor: "background.light" }}>
        <Box sx={{ display: "flex", gap: 1 }}>
          <AccountingSecondaryButton
            size="medium"
            startIcon={<EditIcon />}
            onClick={handleEdit}
            aria-label="Edit customer"
          >
            แก้ไขลูกค้า
          </AccountingSecondaryButton>
        </Box>
        <AccountingPrimaryButton
          variant="contained"
          size="medium"
          startIcon={<AssignmentIcon />}
          onClick={handleCreate}
          aria-label="Create quotation"
          disabled={group.is_quoted}
        >
          สร้างใบเสนอราคา
        </AccountingPrimaryButton>
      </CardActions>
    </AccountingCard>
  );
};

export default memo(PricingRequestCard);
