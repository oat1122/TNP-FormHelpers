import React from 'react';
import { Alert, Box, Typography } from '@mui/material';
import { useGetRandomMessageQuery } from '../feedbackApi';

/**
 * Component to display a random encouraging message
 */
const EncouragingMessage = ({ category }) => {
  const { data: message, isLoading, isError } = useGetRandomMessageQuery(category);

  if (isLoading) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary" fontStyle="italic">
          Loading a cheerful message for you...
        </Typography>
      </Box>
    );
  }

  if (isError || !message) {
    return null;
  }

  return (
    <Alert 
      severity="success" 
      icon={false}
      sx={{ 
        mb: 3, 
        borderRadius: 2, 
        backgroundColor: '#e8f5e9', 
        '& .MuiAlert-message': {
          width: '100%',
          textAlign: 'center',
          fontWeight: 'medium',
          fontStyle: 'italic'
        }
      }}
    >
      {message.content}
    </Alert>
  );
};

export default EncouragingMessage;
