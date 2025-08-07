import React, { useState } from 'react';
import { 
    IconButton, 
    Tooltip, 
    Badge, 
    Chip,
    Box
} from '@mui/material';
import { 
    StickyNote2 as NotesIcon,
    Visibility as ViewIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import PricingRequestNotesModal from './PricingRequestNotesModal';

// Styled Components
const StyledIconButton = styled(IconButton)(({ theme }) => ({
    backgroundColor: '#FFFFFF',
    border: '2px solid #FF9800',
    color: '#FF9800',
    borderRadius: '12px',
    padding: '8px',
    transition: 'all 0.3s ease-in-out',
    '&:hover': {
        backgroundColor: 'rgba(255, 152, 0, 0.05)',
        transform: 'translateY(-2px)',
        boxShadow: '0 8px 16px rgba(255, 152, 0, 0.3)',
    },
}));

const NotesChip = styled(Chip)(({ theme }) => ({
    backgroundColor: '#FF9800',
    color: '#FFFFFF',
    fontSize: '0.75rem',
    fontWeight: 600,
    height: '24px',
    '& .MuiChip-icon': {
        color: '#FFFFFF',
        fontSize: '16px'
    },
}));

const PricingRequestNotesButton = ({ 
    pricingRequestId, 
    workName, 
    notesCount = 0,
    variant = 'icon', // 'icon' | 'chip'
    size = 'medium' // 'small' | 'medium' | 'large'
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
    if (variant === 'chip') {
        return (
            <>
                <Tooltip title={`ดู Notes สำหรับงาน: ${workName}`} arrow>
                    <NotesChip
                        icon={<ViewIcon />}
                        label={`${notesCount} Notes`}
                        onClick={handleClick}
                        clickable
                        size={size}
                    />
                </Tooltip>
                <PricingRequestNotesModal
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
                    color="primary"
                    anchorOrigin={{
                        vertical: 'top',
                        horizontal: 'right',
                    }}
                    sx={{
                        '& .MuiBadge-badge': {
                            backgroundColor: '#4CAF50',
                            color: '#FFFFFF',
                            fontWeight: 600
                        }
                    }}
                >
                    <StyledIconButton
                        onClick={handleClick}
                        size={size}
                    >
                        <NotesIcon />
                    </StyledIconButton>
                </Badge>
            </Tooltip>
            <PricingRequestNotesModal
                open={modalOpen}
                onClose={handleClose}
                pricingRequestId={pricingRequestId}
                workName={workName}
            />
        </>
    );
};

export default PricingRequestNotesButton;
