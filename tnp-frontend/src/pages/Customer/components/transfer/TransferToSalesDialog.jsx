import React from "react";
import PropTypes from "prop-types";

import { useTransferToSalesMutation } from "../../../../features/Customer/customerTransferApi";
import { CUSTOMER_CHANNEL } from "../../constants/customerChannel";
import TransferDialog from "./TransferDialog";

/**
 * TransferToSalesDialog - Wrapper for transferring customers to Sales team
 *
 * This is a thin wrapper around TransferDialog that:
 * - Sets targetChannel to CUSTOMER_CHANNEL.SALES
 * - Uses useTransferToSalesMutation hook
 */
const TransferToSalesDialog = ({ open, onClose, customer, salesUsers = [], onSuccess }) => {
  const transferMutation = useTransferToSalesMutation();

  return (
    <TransferDialog
      open={open}
      onClose={onClose}
      customer={customer}
      usersList={salesUsers}
      onSuccess={onSuccess}
      targetChannel={CUSTOMER_CHANNEL.SALES}
      transferMutation={transferMutation}
    />
  );
};

TransferToSalesDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  customer: PropTypes.shape({
    cus_id: PropTypes.string,
    cus_name: PropTypes.string,
    cus_company: PropTypes.string,
    cus_channel: PropTypes.number,
  }),
  salesUsers: PropTypes.arrayOf(
    PropTypes.shape({
      user_id: PropTypes.number,
      username: PropTypes.string,
      user_firstname: PropTypes.string,
      user_lastname: PropTypes.string,
    })
  ),
  onSuccess: PropTypes.func,
};

export default TransferToSalesDialog;
