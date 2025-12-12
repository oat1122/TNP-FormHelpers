import React from "react";
import PropTypes from "prop-types";

import { useTransferToOnlineMutation } from "../../../../features/Customer/customerTransferApi";
import { CUSTOMER_CHANNEL } from "../../constants/customerChannel";
import TransferDialog from "./TransferDialog";

/**
 * TransferToOnlineDialog - Wrapper for transferring customers to Online team
 *
 * This is a thin wrapper around TransferDialog that:
 * - Sets targetChannel to CUSTOMER_CHANNEL.ONLINE
 * - Uses useTransferToOnlineMutation hook
 */
const TransferToOnlineDialog = ({ open, onClose, customer, onlineUsers = [], onSuccess }) => {
  const transferMutation = useTransferToOnlineMutation();

  return (
    <TransferDialog
      open={open}
      onClose={onClose}
      customer={customer}
      usersList={onlineUsers}
      onSuccess={onSuccess}
      targetChannel={CUSTOMER_CHANNEL.ONLINE}
      transferMutation={transferMutation}
    />
  );
};

TransferToOnlineDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  customer: PropTypes.shape({
    cus_id: PropTypes.string,
    cus_name: PropTypes.string,
    cus_company: PropTypes.string,
    cus_channel: PropTypes.number,
  }),
  onlineUsers: PropTypes.arrayOf(
    PropTypes.shape({
      user_id: PropTypes.number,
      username: PropTypes.string,
      user_firstname: PropTypes.string,
      user_lastname: PropTypes.string,
    })
  ),
  onSuccess: PropTypes.func,
};

export default TransferToOnlineDialog;
