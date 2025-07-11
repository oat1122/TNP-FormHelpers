import React from 'react';
import { Box, Typography, Tooltip } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { format, differenceInDays } from 'date-fns';

const TimelineBar = ({ timeline, rowIndex }) => {
  const navigate = useNavigate();
  const event = timeline.event;
  const duration = differenceInDays(new Date(event.expected_completion_date), new Date(event.start_date)) + 1;
  
  return (
    <Tooltip
      title={
        <Box sx={{ p: 1 }}>
          <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5 }}>
            {event.title}
          </Typography>
          <Typography variant="caption" display="block" sx={{ opacity: 0.9 }}>
            👤 {event.customer_name}
          </Typography>
          <Typography variant="caption" display="block" sx={{ opacity: 0.9 }}>
            📅 {format(new Date(event.start_date), 'dd/MM')} - {format(new Date(event.expected_completion_date), 'dd/MM')}
          </Typography>
          <Typography variant="caption" display="block" sx={{ opacity: 0.9 }}>
            📦 {event.total_quantity} ตัว • {duration} วัน
          </Typography>
        </Box>
      }
      placement="top"
      arrow
      enterDelay={300}
    >
      <Box
        onClick={() => navigate(`/max-supply/edit/${event.id}`)}
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
        {/* จุดเริ่มต้น (วงกลมสีฟ้า) */}
        <Box
          sx={{
            position: 'absolute',
            left: 8,
            top: 6,
            width: 8,
            height: 8,
            bgcolor: '#0ea5e9',
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
            bgcolor: '#0ea5e9',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            px: 1.5,
            boxShadow: '0 2px 8px rgba(14, 165, 233, 0.3)',
            border: '1px solid rgba(255,255,255,0.2)',
            transition: 'all 0.2s ease',
            '&:hover': {
              transform: 'translateY(-50%) scale(1.02)',
              boxShadow: '0 4px 16px rgba(14, 165, 233, 0.4)',
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
            {event.title}
          </Typography>
        </Box>
      </Box>
    </Tooltip>
  );
};

export default TimelineBar; 