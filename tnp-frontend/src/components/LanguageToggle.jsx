import React from 'react';
import {
  Box,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  Paper,
  useTheme,
  useMediaQuery,
  Tooltip,
} from '@mui/material';
import { Language, Translate } from '@mui/icons-material';

const LanguageToggle = ({ language, onLanguageChange, compact = false }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const handleLanguageChange = (event, newLanguage) => {
    if (newLanguage !== null) {
      // เพิ่ม haptic feedback สำหรับ mobile
      if ('vibrate' in navigator && isMobile) {
        navigator.vibrate(50); // vibrate for 50ms
      }
      onLanguageChange(newLanguage);
    }
  };

  if (compact || isMobile) {
    return (
      <Tooltip 
        title={language === 'th' ? 'เปลี่ยนภาษา' : 'ဘာသာစကားပြောင်းရန်'}
        arrow
        placement="left"
      >
        <Paper 
          elevation={3} 
          sx={{ 
            p: { xs: 0.5, sm: 1 }, 
            bgcolor: 'background.paper',
            borderRadius: { xs: 3, sm: 2 },
            display: 'inline-flex',
            alignItems: 'center',
            gap: { xs: 0.5, sm: 1 },
            minWidth: { xs: 'auto', sm: 'auto' },
            boxShadow: { xs: '0 4px 12px rgba(0,0,0,0.15)', sm: 'none' },
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              transform: { xs: 'scale(1.05)', sm: 'none' },
              boxShadow: { xs: '0 6px 16px rgba(0,0,0,0.2)', sm: 'none' }
            }
          }}
        >
          <Language 
            fontSize="small" 
            color="primary" 
            sx={{ 
              fontSize: { xs: '1rem', sm: '1.25rem' },
              display: { xs: 'none', sm: 'block' }
            }} 
          />
          <ToggleButtonGroup
            value={language}
            exclusive
            onChange={handleLanguageChange}
            size="small"
            aria-label="language selection"
            sx={{
              '& .MuiToggleButton-root': {
                px: { xs: 1, sm: 1.5 },
                py: { xs: 0.5, sm: 0.5 },
                fontSize: { xs: '0.7rem', sm: '0.75rem' },
                fontWeight: 'bold',
                border: 'none',
                minWidth: { xs: 32, sm: 40 },
                minHeight: { xs: 32, sm: 36 },
                borderRadius: { xs: 2, sm: 1 },
                transition: 'all 0.2s ease-in-out',
                '&.Mui-selected': {
                  bgcolor: 'primary.main',
                  color: 'white',
                  transform: { xs: 'scale(1.1)', sm: 'none' },
                  boxShadow: { xs: '0 2px 8px rgba(25, 118, 210, 0.3)', sm: 'none' },
                  '&:hover': {
                    bgcolor: 'primary.dark',
                  }
                },
                '&:hover': {
                  bgcolor: 'action.hover',
                  transform: { xs: 'scale(1.05)', sm: 'none' },
                },
                '&:active': {
                  transform: { xs: 'scale(0.95)', sm: 'none' },
                },
                // เพิ่ม touch target สำหรับ mobile
                '@media (pointer: coarse)': {
                  minHeight: 44,
                  minWidth: 44,
                }
              }
            }}
          >
            <ToggleButton 
              value="th"
              aria-label="Thai language"
            >
              {isMobile ? 'TH' : 'ไทย'}
            </ToggleButton>
            <ToggleButton 
              value="my"
              aria-label="Myanmar language"
            >
              {isMobile ? 'MM' : 'မြန်မာ'}
            </ToggleButton>
          </ToggleButtonGroup>
        </Paper>
      </Tooltip>
    );
  }

  return (
    <Paper 
      elevation={2} 
      sx={{ 
        p: 2, 
        bgcolor: 'background.paper',
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider'
      }}
    >
      <Box display="flex" alignItems="center" gap={2}>
        <Box display="flex" alignItems="center" gap={1}>
          <Translate color="primary" />
          <Typography variant="body2" fontWeight="medium" color="text.primary">
            ภาษา / ဘာသာစကား
          </Typography>
        </Box>
        
        <ToggleButtonGroup
          value={language}
          exclusive
          onChange={handleLanguageChange}
          size="small"
          sx={{
            '& .MuiToggleButton-root': {
              px: 2,
              py: 1,
              fontSize: '0.875rem',
              fontWeight: 'medium',
              minWidth: 60,
              border: '1px solid',
              borderColor: 'divider',
              '&.Mui-selected': {
                bgcolor: 'primary.main',
                color: 'white',
                borderColor: 'primary.main',
                '&:hover': {
                  bgcolor: 'primary.dark',
                }
              },
              '&:hover': {
                bgcolor: 'action.hover',
              }
            }
          }}
        >
          <ToggleButton value="th">
            <Box display="flex" alignItems="center" gap={1}>
              <span style={{ fontSize: '1.2em' }}>🇹🇭</span>
              <span>ไทย</span>
            </Box>
          </ToggleButton>
          <ToggleButton value="my">
            <Box display="flex" alignItems="center" gap={1}>
              <span style={{ fontSize: '1.2em' }}>🇲🇲</span>
              <span>မြန်မာ</span>
            </Box>
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>
    </Paper>
  );
};

export default LanguageToggle;
