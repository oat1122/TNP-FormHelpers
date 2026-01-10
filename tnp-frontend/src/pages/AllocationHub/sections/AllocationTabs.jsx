import React from "react";
import PropTypes from "prop-types";
import { Paper, Tabs, Tab } from "@mui/material";
import { Phone as PhoneIcon, SwapHoriz as TransferIcon } from "@mui/icons-material";

/**
 * AllocationTabs - Tab navigation for telesales/transferred customers
 */
const AllocationTabs = ({ activeTab, onTabChange, telesalesCount, transferredCount }) => {
  return (
    <Paper elevation={2} sx={{ mb: 3 }}>
      <Tabs
        value={activeTab}
        onChange={onTabChange}
        variant="fullWidth"
        sx={{
          "& .MuiTab-root": {
            fontWeight: "bold",
            fontSize: "1rem",
          },
        }}
      >
        <Tab
          icon={<PhoneIcon />}
          iconPosition="start"
          label={`ลูกค้าจาก Telesales (${telesalesCount})`}
          aria-label="ลูกค้าจาก Telesales"
        />
        <Tab
          icon={<TransferIcon />}
          iconPosition="start"
          label={`ลูกค้าที่ถูกโยน (${transferredCount})`}
          aria-label="ลูกค้าที่ถูกโยน"
        />
      </Tabs>
    </Paper>
  );
};

AllocationTabs.propTypes = {
  activeTab: PropTypes.number.isRequired,
  onTabChange: PropTypes.func.isRequired,
  telesalesCount: PropTypes.number.isRequired,
  transferredCount: PropTypes.number.isRequired,
};

export default AllocationTabs;
