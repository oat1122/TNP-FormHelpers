/**
 * DeliveryNotePDFMenu Component
 * PDF download menu with header type selection (based on Invoice pattern)
 */

import React from "react";
import {
  Menu,
  MenuItem,
  Checkbox,
  ListItemText,
  Divider,
  Typography,
  Button,
  Tooltip,
} from "@mui/material";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { useDeliveryNotePDFDownload } from "../hooks/useDeliveryNotePDFDownload";

const DeliveryNotePDFMenu = ({ deliveryNote, onDownloadPDF, onPreviewPDF }) => {
  const {
    downloadAnchorEl,
    selectedHeaders,
    headerOptions,
    toggleHeader,
    handleDownloadClick,
    handlePreviewClick,
    handleCloseMenu,
    handleConfirmDownload,
  } = useDeliveryNotePDFDownload(deliveryNote, onDownloadPDF, onPreviewPDF);

  if (!deliveryNote) return null;

  return (
    <>
      <Tooltip title="Preview PDF">
        <Button
          size="small"
          startIcon={<VisibilityIcon fontSize="small" />}
          onClick={handlePreviewClick}
          sx={{ mr: 1 }}
        >
          Preview
        </Button>
      </Tooltip>

      <Tooltip title="Download PDF">
        <Button
          size="small"
          startIcon={<PictureAsPdfIcon fontSize="small" />}
          onClick={handleDownloadClick}
        >
          PDF
        </Button>
      </Tooltip>

      <Menu
        anchorEl={downloadAnchorEl}
        open={Boolean(downloadAnchorEl)}
        onClose={handleCloseMenu}
      >
        <Typography
          variant="body1"
          sx={{ px: 2, py: 1, fontWeight: 500 }}
          tabIndex={0}
        >
          เลือกประเภทหัวกระดาษ
        </Typography>
        <Divider />

        {headerOptions.map((header) => (
          <MenuItem key={header} dense onClick={() => toggleHeader(header)}>
            <Checkbox
              size="small"
              checked={selectedHeaders.includes(header)}
              color="primary"
            />
            <ListItemText primary={header} />
          </MenuItem>
        ))}

        <Divider />
        <MenuItem onClick={handleConfirmDownload}>
          <Typography variant="body1">ดาวน์โหลด (PDF)</Typography>
        </MenuItem>
      </Menu>
    </>
  );
};

export default DeliveryNotePDFMenu;
