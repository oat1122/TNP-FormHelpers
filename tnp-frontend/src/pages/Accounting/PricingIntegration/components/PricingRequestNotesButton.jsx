import { StickyNote2 as NotesIcon, Visibility as ViewIcon } from "@mui/icons-material";
import { IconButton, Tooltip, Badge, Chip } from "@mui/material";
import { styled } from "@mui/material/styles";
import { useState } from "react";

import PricingRequestNotesDialog from "./PricingRequestNotesDialog";
import { tokens } from "../../shared/styles/tokens";

const StyledIconButton = styled(IconButton)(() => ({
  backgroundColor: tokens.white,
  border: `2px solid ${tokens.warning}`,
  color: tokens.warning,
  borderRadius: "12px",
  padding: "8px",
  transition: "all 0.3s ease-in-out",
  "&:hover": {
    backgroundColor: "rgba(255, 152, 0, 0.05)",
    transform: "translateY(-2px)",
    boxShadow: "0 8px 16px rgba(255, 152, 0, 0.3)",
  },
}));

const NotesChip = styled(Chip)(() => ({
  backgroundColor: tokens.warning,
  color: tokens.white,
  fontSize: "0.75rem",
  fontWeight: 600,
  height: "24px",
  "& .MuiChip-icon": {
    color: tokens.white,
    fontSize: "16px",
  },
}));

const PricingRequestNotesButton = ({
  pricingRequestId,
  workName,
  notesCount = 0,
  variant = "icon", // 'icon' | 'chip'
  size = "medium", // 'small' | 'medium' | 'large'
  showCount = true,
}) => {
  const [modalOpen, setModalOpen] = useState(false);

  const handleClick = () => {
    setModalOpen(true);
  };

  const handleClose = () => {
    setModalOpen(false);
  };

  // ถ้าไม่มี pricing request ID ให้ซ่อน
  if (!pricingRequestId) {
    return null;
  }

  // Render แบบ Chip
  if (variant === "chip") {
    return (
      <>
        <Tooltip title={`ดู Notes สำหรับงาน: ${workName}`} arrow>
          <NotesChip
            icon={<ViewIcon />}
            label={showCount ? `${notesCount} Notes` : "Notes"}
            onClick={handleClick}
            clickable
            size={size}
          />
        </Tooltip>
        <PricingRequestNotesDialog
          open={modalOpen}
          onClose={handleClose}
          pricingRequestId={pricingRequestId}
          workName={workName}
        />
      </>
    );
  }

  // Render แบบ Icon Button (default)
  return (
    <>
      <Tooltip title={`ดู Notes สำหรับงาน: ${workName}`} arrow>
        <Badge
          badgeContent={notesCount}
          invisible={!showCount}
          color="primary"
          anchorOrigin={{
            vertical: "top",
            horizontal: "right",
          }}
          sx={{
            "& .MuiBadge-badge": {
              backgroundColor: tokens.successBright,
              color: tokens.white,
              fontWeight: 600,
            },
          }}
        >
          <StyledIconButton onClick={handleClick} size={size}>
            <NotesIcon />
          </StyledIconButton>
        </Badge>
      </Tooltip>
      <PricingRequestNotesDialog
        open={modalOpen}
        onClose={handleClose}
        pricingRequestId={pricingRequestId}
        workName={workName}
      />
    </>
  );
};

export default PricingRequestNotesButton;
