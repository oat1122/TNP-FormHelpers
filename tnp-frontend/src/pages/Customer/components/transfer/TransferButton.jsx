import React, { useMemo } from "react";
import PropTypes from "prop-types";
import { Button, Tooltip } from "@mui/material";
import { MdSwapHoriz, MdHistory } from "react-icons/md";

import {
  TRANSFER_ROLES,
  canUserTransfer,
  getTransferButtonConfig,
} from "../../constants/customerChannel";

/**
 * TransferButton
 *
 * Smart button component ที่แสดงตาม Role ของ user
 * - Admin: ปุ่มสีม่วง "โอนลูกค้า" + ปุ่มประวัติ
 * - Head Online: ปุ่มสีส้ม "โอนไป Sales" (ไม่มีปุ่มประวัติ)
 * - Head Offline: ปุ่มสีฟ้า "โอนไป Online" (ไม่มีปุ่มประวัติ)
 * - Other roles: ไม่แสดง
 *
 * History button is ADMIN ONLY
 */
const TransferButton = ({
  userRole,
  customerChannel,
  onTransferClick,
  onHistoryClick,
  disabled = false,
  size = "small",
  variant = "contained",
}) => {
  // Get button config based on role
  const buttonConfig = useMemo(() => getTransferButtonConfig(userRole), [userRole]);

  // Check if user can transfer this customer
  const transferInfo = useMemo(
    () => canUserTransfer(userRole, customerChannel),
    [userRole, customerChannel]
  );

  // History button is ADMIN ONLY
  const showHistory = userRole === TRANSFER_ROLES.ADMIN;

  // Don't render if role can't transfer
  if (!buttonConfig.show) {
    return null;
  }

  // Determine if button should be disabled
  const isDisabled = disabled || !transferInfo.canTransfer;

  // Get tooltip text
  const getTooltipText = () => {
    if (!transferInfo.canTransfer) {
      if (userRole === TRANSFER_ROLES.HEAD_ONLINE) {
        return "สามารถโอนได้เฉพาะลูกค้าช่อง Online";
      }
      if (userRole === TRANSFER_ROLES.HEAD_OFFLINE) {
        return "สามารถโอนได้เฉพาะลูกค้าช่อง Sales";
      }
      return "ไม่สามารถโอนลูกค้านี้ได้";
    }
    return buttonConfig.label;
  };

  return (
    <>
      {/* Transfer Button */}
      <Tooltip title={getTooltipText()} arrow>
        <span>
          <Button
            variant={variant}
            color={buttonConfig.color}
            size={size}
            disabled={isDisabled}
            onClick={() => onTransferClick(transferInfo.direction)}
            startIcon={<MdSwapHoriz />}
            sx={{
              mr: showHistory ? 1 : 0,
              opacity: isDisabled ? 0.5 : 1,
            }}
          >
            {buttonConfig.label}
          </Button>
        </span>
      </Tooltip>

      {/* History Button - ADMIN ONLY */}
      {showHistory && onHistoryClick && (
        <Tooltip title="ดูประวัติการโอน" arrow>
          <Button
            variant="outlined"
            color="inherit"
            size={size}
            onClick={onHistoryClick}
            startIcon={<MdHistory />}
          >
            ประวัติ
          </Button>
        </Tooltip>
      )}
    </>
  );
};

TransferButton.propTypes = {
  userRole: PropTypes.string.isRequired,
  customerChannel: PropTypes.number.isRequired,
  onTransferClick: PropTypes.func.isRequired,
  onHistoryClick: PropTypes.func,
  disabled: PropTypes.bool,
  size: PropTypes.oneOf(["small", "medium", "large"]),
  variant: PropTypes.oneOf(["text", "outlined", "contained"]),
};

export default TransferButton;
