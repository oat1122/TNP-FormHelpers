import { styled } from '@mui/material/styles';
import { Box, Card, Dialog, DialogTitle, Paper } from '@mui/material';
import { colors } from './DesignSystem';
export { TNPPrimaryButton as PrimaryButton, TNPSecondaryButton as SecondaryButton } from './StyledComponents';

export const StyledPaper = styled(Paper)(() => ({
    background: 'linear-gradient(135deg, #FFFFFF 0%, #F8F9FA 100%)',
    borderRadius: 16,
    boxShadow: '0 8px 32px rgba(144, 15, 15, 0.08)',
    border: '1px solid rgba(144, 15, 15, 0.1)',
    overflow: 'hidden',
}));

export const SectionHeader = styled(Box)(() => ({
    background: `linear-gradient(135deg, ${colors.primary.main} 0%, ${colors.secondary.main} 100%)`,
    color: colors.primary.contrast,
    padding: '16px 24px',
    margin: '-1px -1px 24px -1px',
    borderRadius: '16px 16px 0 0',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
}));

export const InfoCard = styled(Card)(() => ({
    backgroundColor: '#F8F9FA',
    border: `1px solid ${colors.status.error}`,
    borderRadius: 12,
    '& .MuiCardContent-root': {
        padding: 20,
        '&:last-child': {
            paddingBottom: 20,
        },
    },
}));

export const StyledDialog = styled(Dialog)(() => ({
    '& .MuiDialog-paper': {
        borderRadius: 16,
        maxWidth: '1000px',
        width: '90vw',
        maxHeight: '90vh',
        background: 'linear-gradient(135deg, #FFFFFF 0%, #F8F9FA 100%)',
        boxShadow: '0 24px 48px rgba(144, 15, 15, 0.15)',
    },
}));

export const StyledDialogTitle = styled(DialogTitle)(() => ({
    background: `linear-gradient(135deg, ${colors.primary.main} 0%, ${colors.secondary.main} 100%)`,
    color: colors.primary.contrast,
    padding: '24px 32px',
    position: 'relative',
    '& .MuiTypography-root': {
        fontSize: '1.5rem',
        fontWeight: 600,
    },
}));

export const SelectionCard = styled(Card)(({ selected }) => ({
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    border: selected ? `2px solid ${colors.primary.main}` : '1px solid #E5E7EB',
    backgroundColor: selected ? 'rgba(144, 15, 15, 0.02)' : '#FFFFFF',
    transform: selected ? 'translateY(-2px)' : 'translateY(0)',
    boxShadow: selected
        ? '0 8px 25px rgba(144, 15, 15, 0.15)'
        : '0 2px 8px rgba(0, 0, 0, 0.08)',
    '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: '0 12px 32px rgba(144, 15, 15, 0.2)',
        borderColor: selected ? colors.primary.main : colors.secondary.main,
    },
}));

export const CustomerInfoCard = styled(Paper)(() => ({
    background: 'linear-gradient(135deg, #F8F9FA 0%, #FFFFFF 100%)',
    border: `1px solid ${colors.status.error}`,
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    position: 'relative',
    '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 4,
        background: `linear-gradient(90deg, ${colors.primary.main} 0%, ${colors.secondary.main} 100%)`,
        borderRadius: '12px 12px 0 0',
    },
}));
