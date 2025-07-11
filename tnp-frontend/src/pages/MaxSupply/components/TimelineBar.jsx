import React from 'react';
import { Box, Typography, Tooltip } from '@mui/material';
import { format, differenceInDays } from 'date-fns';

const TimelineBar = ({ timeline, rowIndex, onClick }) => {
  const event = timeline.event;
  const duration = differenceInDays(new Date(event.expected_completion_date), new Date(event.start_date)) + 1;
  
  // Production type colors and icons
  const productionTypeConfig = {
    screen: { color: '#0ea5e9', icon: '📺', label: 'Screen Printing' },
    dtf: { color: '#f59e0b', icon: '📱', label: 'DTF' },
    sublimation: { color: '#8b5cf6', icon: '⚽', label: 'Sublimation' },
    embroidery: { color: '#10b981', icon: '🧵', label: 'Embroidery' },
  };

  const typeConfig = productionTypeConfig[event.production_type] || productionTypeConfig.screen;

  const handleClick = (e) => {
    e.stopPropagation();
    if (onClick) {
      onClick(event);
    }
  };
  
  return (
    <Tooltip
      title={
        <Box sx={{ p: 1 }}>
          <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5 }}>
            {typeConfig.icon} {event.title}
          </Typography>
          <Typography variant="caption" display="block" sx={{ opacity: 0.9 }}>
            👤 {event.customer_name || 'ไม่ระบุลูกค้า'}
          </Typography>
          <Typography variant="caption" display="block" sx={{ opacity: 0.9 }}>
            📅 {format(new Date(event.start_date), 'dd/MM')} - {format(new Date(event.expected_completion_date), 'dd/MM')}
          </Typography>
          <Typography variant="caption" display="block" sx={{ opacity: 0.9 }}>
            📦 {event.total_quantity || 0} ตัว • {duration} วัน
          </Typography>
          <Typography variant="caption" display="block" sx={{ opacity: 0.9 }}>
            🏷️ {typeConfig.label}
          </Typography>
        </Box>
      }
      placement="top"
      arrow
      enterDelay={300}
    >
      <Box
        onClick={handleClick}
        sx={{
          position: 'absolute',
          left: `${(timeline.startCol / 7) * 100}%`,
          width: `${(timeline.width / 7) * 100}%`,
          height: 20,
          top: 30 + rowIndex * 25,
          cursor: 'pointer',
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        {/* จุดเริ่มต้น (วงกลมตามสีประเภทงาน) */}
        <Box
          sx={{
            position: 'absolute',
            left: 8,
            top: 6,
            width: 8,
            height: 8,
            bgcolor: typeConfig.color,
            borderRadius: '50%',
            border: '2px solid white',
            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
            zIndex: 15,
          }}
        />
        
        {/* Timeline bar */}
        <Box
          sx={{
            position: 'absolute',
            left: '4px',
            right: '4px',
            top: '50%',
            transform: 'translateY(-50%)',
            height: 20,
            bgcolor: typeConfig.color,
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            px: 1.5,
            boxShadow: `0 2px 8px ${typeConfig.color}50`,
            border: '1px solid rgba(255,255,255,0.2)',
            transition: 'all 0.2s ease',
            '&:hover': {
              transform: 'translateY(-50%) scale(1.02)',
              boxShadow: `0 4px 16px ${typeConfig.color}66`,
            },
          }}
        >
          <Typography
            variant="caption"
            sx={{
              color: 'white',
              fontWeight: 600,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              fontSize: '0.75rem',
              textShadow: '0 1px 2px rgba(0,0,0,0.2)',
            }}
          >
            {typeConfig.icon} {event.title}
          </Typography>
        </Box>
      </Box>
    </Tooltip>
  );
};

export default TimelineBar; 