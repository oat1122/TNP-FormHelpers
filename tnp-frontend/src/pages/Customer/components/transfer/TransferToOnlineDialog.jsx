import React from "react";
import PropTypes from "prop-types";

import { useTransferToOnlineMutation } from "../../../../features/Customer/customerTransferApi";
import { CUSTOMER_CHANNEL } from "../../constants/customerChannel";
import TransferDialog from "./TransferDialog";

/**
 * TransferToOnlineDialog - Wrapper for transferring customers to Online team
 *
 * Transfers always go to pool - no user selection needed.
 */
const TransferToOnlineDialog = ({ open, onClose, customer, onSuccess }) => {
  const transferMutation = useTransferToOnlineMutation();

  return (
    <TransferDialog
      open={open}
      onClose={onClose}
      customer={customer}
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
  onSuccess: PropTypes.func,
};

export default TransferToOnlineDialog;
