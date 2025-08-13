import React, { useState, useEffect } from 'react';
import moment from 'moment';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Typography,
    Box,
    Card,
    CardContent,
    Chip,
    Avatar,
    Button,
    IconButton,
    Collapse,
    Alert,
    Skeleton,
    Divider,
    Stack,
    Badge
} from '@mui/material';
import {
    Close as CloseIcon,
    StickyNote2 as NotesIcon,
    Person as PersonIcon,
    Schedule as ScheduleIcon,
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon,
    Warning as WarningIcon,
    CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

// Styled Components
const StyledDialog = styled(Dialog)(({ theme }) => ({
    '& .MuiPaper-root': {
        borderRadius: '16px',
        boxShadow: '0 24px 48px rgba(144, 15, 15, 0.12)',
        border: '1px solid rgba(144, 15, 15, 0.1)',
    },
}));

const StyledDialogTitle = styled(DialogTitle)(({ theme }) => ({
    background: 'linear-gradient(135deg, #900F0F 0%, #B20000 100%)',
    color: '#FFFFFF',
    padding: '20px 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
}));

const NoteCard = styled(Card)(({ theme, noteType }) => {
    const colors = {
        1: { // Sale
            background: 'linear-gradient(135deg, rgba(33, 150, 243, 0.05) 0%, rgba(33, 150, 243, 0.1) 100%)',
            border: '2px solid #2196F3',
            chip: '#2196F3'
        },
        2: { // Price
            background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.05) 0%, rgba(76, 175, 80, 0.1) 100%)',
            border: '2px solid #4CAF50',
            chip: '#4CAF50'
        }
    };

    const colorSet = colors[noteType] || colors[1];

    return {
        background: colorSet.background,
        border: colorSet.border,
        borderRadius: '12px',
        marginBottom: '16px',
        transition: 'all 0.3s ease-in-out',
        '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: `0 8px 24px ${colorSet.chip}20`,
        },
    };
});

const NoteChip = styled(Chip)(({ theme, noteType }) => {
    const colors = {
        1: '#2196F3', // Sale - Blue
        2: '#4CAF50'  // Price - Green
    };

    const bgColor = colors[noteType] || '#757575';

    return {
        backgroundColor: bgColor,
        color: '#FFFFFF',
        fontWeight: 600,
        fontSize: '0.75rem',
        '& .MuiChip-icon': {
            color: '#FFFFFF',
        },
    };
});

const SectionHeader = styled(Box)(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 0',
    marginBottom: '12px',
    borderBottom: '2px solid #F0F0F0',
}));

const PricingRequestNotesModal = ({ open, onClose, pricingRequestId, workName = 'ไม่ระบุ' }) => {
    const [notesData, setNotesData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [expandedSections, setExpandedSections] = useState({
        sale: true,
        price: true
    });
    // show only the latest note by default; allow expanding to full history per section
    const [showHistory, setShowHistory] = useState({ sale: false, price: false });

    // Fetch notes when modal opens
    useEffect(() => {
        if (open && pricingRequestId) {
            fetchNotes();
        }
    }, [open, pricingRequestId]);

    const fetchNotes = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(
                `${import.meta.env.VITE_END_POINT_URL}/pricing-requests/${pricingRequestId}/notes`,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('authToken') || localStorage.getItem('token')}`,
                    },
                }
            );

            const data = await response.json();

            if (data.success) {
                setNotesData(data.data);
            } else {
                setError(data.message || 'เกิดข้อผิดพลาดในการดึงข้อมูล');
            }
        } catch (err) {
            console.error('Error fetching notes:', err);
            setError('เกิดข้อผิดพลาดในการเชื่อมต่อ');
        } finally {
            setLoading(false);
        }
    };

    const toggleSection = (section) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    const toggleHistory = (section) => {
        setShowHistory(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    const formatNoteText = (text) => {
        return text?.split('\n').map((line, index) => (
            <Typography key={index} variant="body2" sx={{ mb: index < text.split('\n').length - 1 ? 1 : 0 }}>
                {line}
            </Typography>
        ));
    };

        const renderNoteSection = (title, notes, noteType, sectionKey) => {
        const isExpanded = expandedSections[sectionKey];
        const noteTypeLabels = {
            1: 'Sale',
            2: 'Price'
        };
                // Sort by newest first (align with PricingNote components)
                const sorted = Array.isArray(notes)
                    ? notes.slice().sort((a, b) => new Date(b.prn_created_date || b.created_at || 0) - new Date(a.prn_created_date || a.created_at || 0))
                    : [];
                const hasMoreThanOne = sorted.length > 1;
                const visibleNotes = showHistory[sectionKey] ? sorted : sorted.slice(0, 1);

        return (
            <Box key={sectionKey} sx={{ mb: 3 }}>
                <SectionHeader>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography variant="h6" fontWeight={600} color="#900F0F">
                            {title}
                        </Typography>
                        <Badge badgeContent={notes.length} color="primary">
                            <NotesIcon color="action" />
                        </Badge>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {hasMoreThanOne && (
                            <Button size="small" variant="text" onClick={() => toggleHistory(sectionKey)} sx={{ textTransform: 'none', color: '#900F0F' }}>
                                {showHistory[sectionKey] ? 'ซ่อนประวัติ' : 'ดูประวัติ'}
                            </Button>
                        )}
                        <IconButton
                            onClick={() => toggleSection(sectionKey)}
                            sx={{ color: '#900F0F' }}
                        >
                            {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        </IconButton>
                    </Box>
                </SectionHeader>

                <Collapse in={isExpanded}>
                    {notes.length === 0 ? (
                        <Alert 
                            severity="info" 
                            sx={{ 
                                bgcolor: 'rgba(33, 150, 243, 0.05)',
                                border: '1px solid rgba(33, 150, 243, 0.2)'
                            }}
                        >
                            <Typography variant="body2">
                                ไม่มี{title}สำหรับงานนี้
                            </Typography>
                        </Alert>
                    ) : (
                        <Stack spacing={2}>
                            {visibleNotes.map((note, index) => (
                                <NoteCard key={note.prn_id} noteType={noteType}>
                                    <CardContent sx={{ p: 3 }}>
                                        {/* Header */}
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <NoteChip
                                                    noteType={noteType}
                                                    label={noteTypeLabels[noteType]}
                                                    size="small"
                                                    icon={<PersonIcon />}
                                                />
                                                <Typography variant="body2" color="text.secondary">
                                                    โดย {note.created_by_name || note.created_name || note.user_name || 'ไม่ระบุ'}
                                                </Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <ScheduleIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                                <Typography variant="caption" color="text.secondary">
                                                    {note.prn_created_date
                                                      ? moment(note.prn_created_date).format('DD/MM HH:mm')
                                                      : (note.formatted_date || '')}
                                                </Typography>
                                            </Box>
                                        </Box>

                                        {/* Content */}
                                        <Box sx={{ 
                                            bgcolor: '#FFFFFF', 
                                            p: 2, 
                                            borderRadius: '8px',
                                            border: '1px solid rgba(0,0,0,0.1)'
                                        }}>
                                            {formatNoteText(note.prn_text)}
                                        </Box>
                                    </CardContent>
                                </NoteCard>
                            ))}
                        </Stack>
                    )}
                </Collapse>
            </Box>
        );
    };

    const renderContent = () => {
        if (loading) {
            return (
                <Box sx={{ p: 2 }}>
                    {[1, 2, 3].map((i) => (
                        <Box key={i} sx={{ mb: 2 }}>
                            <Skeleton variant="rectangular" height={60} sx={{ borderRadius: 1, mb: 1 }} />
                            <Skeleton variant="rectangular" height={100} sx={{ borderRadius: 1 }} />
                        </Box>
                    ))}
                </Box>
            );
        }

        if (error) {
            return (
                <Alert 
                    severity="error" 
                    sx={{ m: 2 }}
                    icon={<WarningIcon />}
                    action={
                        <Button onClick={fetchNotes} size="small">
                            ลองใหม่
                        </Button>
                    }
                >
                    <Typography variant="body2">{error}</Typography>
                </Alert>
            );
        }

        if (!notesData) {
            return (
                <Alert severity="info" sx={{ m: 2 }}>
                    <Typography variant="body2">ไม่พบข้อมูล Notes</Typography>
                </Alert>
            );
        }

        const { sale_notes, price_notes, summary } = notesData;

        return (
            <Box sx={{ maxHeight: '70vh', overflow: 'auto', p: 1 }}>
                {/* Summary Card */}
                <Card sx={{ 
                    mb: 3,
                    background: 'linear-gradient(135deg, rgba(144, 15, 15, 0.05) 0%, rgba(227, 98, 100, 0.05) 100%)',
                    border: '2px solid #E36264'
                }}>
                    <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="h6" fontWeight={600} color="#900F0F">
                                📋 สรุป Notes สำหรับงาน: {workName}
                            </Typography>
                            <Chip 
                                label={`${summary.total_notes} Notes ทั้งหมด`}
                                sx={{ bgcolor: '#900F0F', color: '#FFFFFF', fontWeight: 600 }}
                            />
                        </Box>
                        <Box sx={{ display: 'flex', gap: 3, mt: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Avatar sx={{ bgcolor: '#2196F3', width: 24, height: 24, fontSize: '0.8rem' }}>
                                    {summary.sale_count}
                                </Avatar>
                                <Typography variant="body2">Sale Notes</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Avatar sx={{ bgcolor: '#4CAF50', width: 24, height: 24, fontSize: '0.8rem' }}>
                                    {summary.price_count}
                                </Avatar>
                                <Typography variant="body2">Price Notes</Typography>
                            </Box>
                        </Box>
                    </CardContent>
                </Card>

                {/* Notes Sections */}
                {renderNoteSection('📞 Sale Notes', sale_notes, 1, 'sale')}
                {renderNoteSection('💰 Price Notes', price_notes, 2, 'price')}

                {summary.total_notes === 0 && (
                    <Alert 
                        severity="info" 
                        sx={{ 
                            mt: 2,
                            bgcolor: 'rgba(144, 15, 15, 0.05)',
                            border: '1px solid rgba(144, 15, 15, 0.2)'
                        }}
                        icon={<CheckCircleIcon />}
                    >
                        <Typography variant="body1" fontWeight={600}>
                            ไม่มี Notes สำหรับงานนี้
                        </Typography>
                        <Typography variant="body2">
                            งานนี้ยังไม่มีการบันทึก Notes จากทีม Sale หรือ Price
                        </Typography>
                    </Alert>
                )}
            </Box>
        );
    };

    return (
        <StyledDialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: {
                    maxHeight: '85vh',
                    bgcolor: '#FAFAFA'
                }
            }}
        >
            <StyledDialogTitle>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: '#FFFFFF', color: '#900F0F' }}>
                        <NotesIcon />
                    </Avatar>
                    <Box>
                        <Typography variant="h6" fontWeight={600}>
                            📝 Pricing Request Notes
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.9 }}>
                            ประวัติการบันทึกและความเห็นของทีมงาน
                        </Typography>
                    </Box>
                </Box>
                <IconButton 
                    onClick={onClose}
                    sx={{ color: '#FFFFFF' }}
                >
                    <CloseIcon />
                </IconButton>
            </StyledDialogTitle>

            <DialogContent sx={{ p: 0 }}>
                {renderContent()}
            </DialogContent>

            <DialogActions sx={{ p: 3, bgcolor: '#F8F9FA', borderTop: '1px solid #E0E0E0' }}>
                <Button
                    onClick={onClose}
                    variant="contained"
                    sx={{
                        background: 'linear-gradient(135deg, #900F0F 0%, #B20000 100%)',
                        color: '#FFFFFF',
                        borderRadius: '12px',
                        padding: '10px 24px',
                        fontWeight: 600,
                        '&:hover': {
                            background: 'linear-gradient(135deg, #B20000 0%, #E36264 100%)',
                        },
                    }}
                >
                    ปิด
                </Button>
            </DialogActions>
        </StyledDialog>
    );
};

export default PricingRequestNotesModal;
