import {
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Business as BusinessIcon,
  Edit as EditIcon,
} from "@mui/icons-material";
import { Box, CardActions, Avatar, Stack, Collapse, Button } from "@mui/material";
import { memo, useMemo, useState, useCallback } from "react";

// 🎨 Import TNP Styled Components สำหรับ UI ที่อ่านง่าย
import {
  TNPCard,
  TNPCardContent,
  TNPHeading,
  TNPSubheading,
  TNPBodyText,
  TNPPRNumber,
  TNPStatusChip,
  TNPCountChip,
  TNPPrimaryButton,
  TNPSecondaryButton,
  TNPListItem,
  TNPDivider,
} from "./styles/StyledComponents";
import { sortPricingRequestsByLatest } from "./utils/sortUtils";

/**
 *  PricingRequestCard Component
 *
 * แสดงการ์สำหรับแต่ละลูกค้าที่มี pricing requests
 *
 * @param {Object} props
 * @param {Object} props.group - ข้อมูลกลุ่ม pricing requests ของลูกค้า
 * @param {string} props.group._customerId - ID ลูกค้า
 * @param {Object} props.group.customer - ข้อมูลลูกค้า (cus_company, cus_firstname, cus_lastname)
 * @param {Array} props.group.requests - รายการ pricing requests (pr_id, pr_no, pr_work_name, pr_status, is_quoted)
 * @param {number} props.group.total_count - จำนวน requests ทั้งหมด
 * @param {number} props.group.quoted_count - จำนวน requests ที่มีใบเสนอราคา
 * @param {boolean} props.group.is_quoted - สถานะว่าทุก requests มีใบเสนอราคาหรือไม่
 * @param {Object} props.group.status_counts - จำนวนแยกตามสถานะ
 * @param {Function} props.onCreateQuotation - ฟังก์ชันสำหรับสร้างใบเสนอราคา
 * @param {Function} props.onViewDetails - ฟังก์ชันสำหรับดูรายละเอียด
 */
const PricingRequestCard = ({ group, onCreateQuotation, onEditCustomer }) => {
  const [expanded, setExpanded] = useState(false);

  // 🎨 Helper Functions for Status Management
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

  // 🔍 Helper Function to get display PR number with fallback
  const getPRDisplayNumber = (req) => {
    return req.pr_no || req.pr_number || req.pr_id?.slice(-8) || "N/A";
  };

  // 🏷️ Helper Function to determine primary status for display
  const getPrimaryStatus = (req) => {
    if (req.is_quoted) {
      return {
        label: "มีใบเสนอราคาแล้ว",
        color: "warning",
        showIcon: false,
      };
    }

    if (req.pr_status) {
      return {
        label: req.pr_status,
        color: getStatusColor(req.pr_status),
        showIcon: true,
      };
    }

    return null;
  };

  // 🧮 Sort requests by latest and compute visible subsets
  const sortedRequests = useMemo(
    () => sortPricingRequestsByLatest(group.requests || []),
    [group.requests]
  );
  const latestThree = useMemo(() => sortedRequests.slice(0, 3), [sortedRequests]);
  const hasMore = (group?.requests?.length || 0) > 3;
  // A11y: link toggle button to collapsible content
  const collapseId = useMemo(
    () =>
      `pr-extra-${group?._customerId || group?.customer?.id || group?.customer_id || "unknown"}`,
    [group]
  );
  // Stable callbacks for actions
  const handleEdit = useCallback(() => onEditCustomer?.(group), [onEditCustomer, group]);
  const handleCreate = useCallback(() => onCreateQuotation(group), [onCreateQuotation, group]);

  return (
    <TNPCard>
      <TNPCardContent>
        {/* 👤 Customer Info - ปรับปรุงให้อ่านง่ายและสวยงาม */}
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
            <TNPHeading variant="h6" component="h3">
              {group.customer?.cus_company || "ไม่ระบุบริษัท"}
            </TNPHeading>
            <TNPSubheading>
              {[group.customer?.cus_firstname, group.customer?.cus_lastname]
                .filter(Boolean)
                .join(" ") || "ไม่ระบุชื่อ"}
            </TNPSubheading>
          </Box>
        </Box>

        {/* 📊 Summary Chips - ปรับปรุงให้เป็นระบบและอ่านง่าย */}
        <Stack direction="row" spacing={1} flexWrap="wrap" mb={2.5}>
          <TNPCountChip label={`ทั้งหมด ${group.total_count} งาน`} size="small" />
          {Object.entries(group.status_counts).map(([status, count]) => (
            <TNPStatusChip
              key={status}
              label={`${status} (${count})`}
              size="small"
              statuscolor={getStatusColor(status)}
            />
          ))}
          {group.quoted_count > 0 && (
            <TNPStatusChip
              label={`มีใบเสนอราคา ${group.quoted_count} งาน`}
              statuscolor="warning"
              size="small"
            />
          )}
        </Stack>

        <TNPDivider />

        {/*  List of Pricing Requests - ปรับปรุงให้อ่านง่ายขึ้น */}
        <Stack spacing={0.5} component="ul" role="list" sx={{ px: 0, mx: 0 }}>
          {latestThree.map((req) => {
            const primaryStatus = getPrimaryStatus(req);
            return (
              <TNPListItem key={req.pr_id} role="listitem" sx={{ px: 0, mx: 0 }}>
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
                    <TNPPRNumber
                      sx={{
                        lineHeight: 1.2,
                        fontSize: "0.875rem",
                        fontWeight: 600,
                        margin: 0,
                        padding: 0,
                      }}
                    >
                      #{getPRDisplayNumber(req)}
                    </TNPPRNumber>
                    <TNPBodyText
                      sx={{
                        lineHeight: 1.3,
                        fontSize: "0.875rem",
                        color: "text.secondary",
                        margin: 0,
                        padding: 0,
                      }}
                    >
                      {req.pr_work_name || "ไม่ระบุชื่องาน"}
                    </TNPBodyText>
                  </Box>
                  {primaryStatus && (
                    <TNPStatusChip
                      label={primaryStatus.label}
                      statuscolor={primaryStatus.color}
                      size="small"
                      icon={
                        primaryStatus.showIcon ? (
                          <CheckCircleIcon sx={{ fontSize: "0.75rem" }} />
                        ) : undefined
                      }
                      sx={{
                        flexShrink: 0,
                        height: 24,
                        fontSize: "0.75rem",
                        alignSelf: "flex-start",
                      }}
                    />
                  )}
                </Box>
              </TNPListItem>
            );
          })}

          {/* Additional items with smooth animation */}
          {hasMore && (
            <Collapse in={expanded} timeout={250} unmountOnExit id={collapseId}>
              <Box mt={0.25} sx={{ px: 0, mx: 0 }}>
                {sortedRequests.slice(3).map((req) => {
                  const primaryStatus = getPrimaryStatus(req);
                  return (
                    <TNPListItem key={req.pr_id} role="listitem" sx={{ mb: 0.5, px: 0, mx: 0 }}>
                      <Box
                        display="flex"
                        alignItems="flex-start"
                        justifyContent="space-between"
                        minHeight="48px"
                        py={0.75}
                        px={1.25}
                        sx={{ width: "100%" }}
                      >
                        <Box
                          display="flex"
                          flexDirection="column"
                          flex={1}
                          gap={0.25}
                          sx={{ pr: 1.5 }}
                        >
                          <TNPPRNumber
                            sx={{
                              lineHeight: 1.2,
                              fontSize: "0.875rem",
                              fontWeight: 600,
                              margin: 0,
                              padding: 0,
                            }}
                          >
                            #{getPRDisplayNumber(req)}
                          </TNPPRNumber>
                          <TNPBodyText
                            sx={{
                              lineHeight: 1.3,
                              fontSize: "0.875rem",
                              color: "text.secondary",
                              margin: 0,
                              padding: 0,
                            }}
                          >
                            {req.pr_work_name || "ไม่ระบุชื่องาน"}
                          </TNPBodyText>
                        </Box>
                        {primaryStatus && (
                          <TNPStatusChip
                            label={primaryStatus.label}
                            statuscolor={primaryStatus.color}
                            size="small"
                            icon={
                              primaryStatus.showIcon ? (
                                <CheckCircleIcon sx={{ fontSize: "0.75rem" }} />
                              ) : undefined
                            }
                            sx={{
                              flexShrink: 0,
                              height: 24,
                              fontSize: "0.75rem",
                              alignSelf: "flex-start",
                            }}
                          />
                        )}
                      </Box>
                    </TNPListItem>
                  );
                })}
              </Box>
            </Collapse>
          )}
        </Stack>

        {/* See more / Collapse toggle */}
        {hasMore && (
          <Box mt={1} sx={{ display: "flex", justifyContent: "center" }}>
            <Button
              size="small"
              onClick={() => setExpanded((v) => !v)}
              aria-controls={collapseId}
              aria-expanded={expanded}
              aria-label={expanded ? "Hide more requests" : "Show more requests"}
              sx={{
                mt: 0.5,
                textTransform: "none",
                transition: "all 200ms ease",
              }}
            >
              {expanded ? "แสดงน้อยลง" : "ดูเพิ่มเติม"}
            </Button>
          </Box>
        )}
      </TNPCardContent>

      <TNPDivider />

      <CardActions sx={{ p: 2.5, justifyContent: "space-between", bgcolor: "background.light" }}>
        <Box sx={{ display: "flex", gap: 1 }}>
          <TNPSecondaryButton
            size="medium"
            startIcon={<EditIcon />}
            onClick={handleEdit}
            aria-label="Edit customer"
          >
            แก้ไขลูกค้า
          </TNPSecondaryButton>
        </Box>
        <TNPPrimaryButton
          variant="contained"
          size="medium"
          startIcon={<AssignmentIcon />}
          onClick={handleCreate}
          aria-label="Create quotation"
          disabled={group.is_quoted}
        >
          สร้างใบเสนอราคา
        </TNPPrimaryButton>
      </CardActions>
    </TNPCard>
  );
};

// � ป้องกันการ re-render ที่ไม่จำเป็นด้วย React.memo
// Component จะ re-render เฉพาะเมื่อ props เปลี่ยนแปลงเท่านั้น
export default memo(PricingRequestCard);
