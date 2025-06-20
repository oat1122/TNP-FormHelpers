import React, { useState } from 'react';
import { 
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Avatar,
  Box,
  Button,
  Chip,
  Divider,
  Grid,
  Paper,
  TextField,
  Typography 
} from '@mui/material';
import { BsChevronDown, BsPaperclip, BsReply, BsCheckCircle, BsXCircle } from 'react-icons/bs';
import toast from 'react-hot-toast';
import { useAddAdminResponseMutation, useUpdateResolvedStatusMutation } from '../feedbackApi';

const FeedbackReportItem = ({ report }) => {
  const [expanded, setExpanded] = useState(false);
  const [adminResponse, setAdminResponse] = useState('');
  
  const [addAdminResponse, { isLoading: isResponseLoading }] = useAddAdminResponseMutation();
  const [updateResolvedStatus, { isLoading: isStatusLoading }] = useUpdateResolvedStatusMutation();
  
  // Format date helper function to replace date-fns
  const formatDate = (dateString, includeTime = false) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    
    const options = { 
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    };
    
    if (includeTime) {
      options.hour = 'numeric';
      options.minute = 'numeric';
      options.hour12 = true;
    }
    
    return new Intl.DateTimeFormat('en-US', options).format(date);
  };

  const handleExpand = () => {
    setExpanded(!expanded);
  };

  const handleAdminResponseSubmit = async () => {
    if (!adminResponse.trim()) {
      toast.error('Response cannot be empty');
      return;
    }

    try {
      await addAdminResponse({
        id: report.id,
        admin_response: adminResponse
      }).unwrap();
      
      toast.success('Response added successfully');
      setAdminResponse('');
    } catch (error) {
      toast.error('Failed to add response');
      console.error('Error adding admin response:', error);
    }
  };

  const handleToggleResolved = async () => {
    try {
      await updateResolvedStatus({
        id: report.id,
        resolved: !report.resolved
      }).unwrap();
      
      toast.success(`Report marked as ${report.resolved ? 'unresolved' : 'resolved'}`);
    } catch (error) {
      toast.error('Failed to update status');
      console.error('Error updating resolved status:', error);
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'bug': return '#f44336'; // Red
      case 'feature': return '#4caf50'; // Green
      case 'improvement': return '#2196f3'; // Blue
      default: return '#ff9800'; // Orange
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#f44336'; // Red
      case 'medium': return '#ff9800'; // Orange
      case 'low': return '#4caf50'; // Green
      default: return '#ff9800'; // Orange
    }
  };

  return (
    <Accordion 
      expanded={expanded}
      onChange={handleExpand}
      sx={{ 
        mb: 2, 
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: '8px !important',
        '&:before': { display: 'none' },
        boxShadow: expanded ? 3 : 1,
      }}
    >
      <AccordionSummary
        expandIcon={<BsChevronDown />}
        sx={{ 
          borderBottom: expanded ? '1px solid' : 'none',
          borderColor: 'divider',
          borderRadius: '8px !important',
          bgcolor: report.resolved ? 'rgba(76, 175, 80, 0.08)' : 'transparent',
        }}
      >
        <Grid container spacing={2} alignItems="center">
          <Grid item>
            {report.is_anonymous ? (
              <Avatar sx={{ bgcolor: '#9e9e9e' }}>A</Avatar>
            ) : (
              <Avatar sx={{ bgcolor: 'primary.main' }}>
                {report.user?.name?.charAt(0) || 'U'}
              </Avatar>
            )}
          </Grid>
          
          <Grid item xs>
            <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
              {report.title}
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
              <Chip 
                label={report.category.charAt(0).toUpperCase() + report.category.slice(1)} 
                size="small"
                sx={{ 
                  backgroundColor: `${getCategoryColor(report.category)}1A`, // 10% opacity
                  color: getCategoryColor(report.category),
                  fontWeight: 'medium',
                }}
              />
              
              <Chip 
                label={report.priority.charAt(0).toUpperCase() + report.priority.slice(1)} 
                size="small"
                sx={{ 
                  backgroundColor: `${getPriorityColor(report.priority)}1A`, // 10% opacity
                  color: getPriorityColor(report.priority),
                  fontWeight: 'medium',
                }}
              />
              
              {report.resolved && (
                <Chip 
                  icon={<BsCheckCircle />} 
                  label="Resolved" 
                  size="small"
                  sx={{ 
                    backgroundColor: 'rgba(76, 175, 80, 0.1)',
                    color: '#2e7d32',
                    fontWeight: 'medium',
                  }}
                />
              )}
              
              {report.attachments?.length > 0 && (
                <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary' }}>
                  <BsPaperclip size={14} style={{ marginRight: 4 }} />
                  <Typography variant="caption">
                    {report.attachments.length} {report.attachments.length === 1 ? 'attachment' : 'attachments'}
                  </Typography>
                </Box>
              )}
            </Box>
          </Grid>
            <Grid item>
            <Typography variant="caption" color="text.secondary">
              {formatDate(report.created_at)}
            </Typography>
          </Grid>
        </Grid>
      </AccordionSummary>
      
      <AccordionDetails sx={{ pt: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
              {report.description}
            </Typography>
          </Grid>
          
          {report.attachments?.length > 0 && (
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Attachments:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {report.attachments.map((attachment, index) => (
                  <Button 
                    key={index}
                    variant="outlined"
                    size="small"
                    href={attachment.url}
                    target="_blank"
                    startIcon={<BsPaperclip />}
                    sx={{ textTransform: 'none' }}
                  >
                    {attachment.name}
                  </Button>
                ))}
              </Box>
            </Grid>
          )}
          
          {report.admin_response && (
            <Grid item xs={12}>
              <Paper 
                elevation={0}
                sx={{
                  p: 2,
                  mt: 2,
                  bgcolor: 'primary.light',
                  color: 'primary.contrastText',
                  borderRadius: 2
                }}
              >
                <Typography variant="subtitle2" gutterBottom>
                  Admin Response:
                </Typography>
                <Typography variant="body2">
                  {report.admin_response}
                </Typography>                <Typography variant="caption" sx={{ display: 'block', mt: 1, textAlign: 'right' }}>
                  {formatDate(report.admin_response_at, true)}
                </Typography>
              </Paper>
            </Grid>
          )}
          
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Button
                variant={report.resolved ? "outlined" : "contained"}
                color={report.resolved ? "success" : "primary"}
                startIcon={report.resolved ? <BsXCircle /> : <BsCheckCircle />}
                onClick={handleToggleResolved}
                disabled={isStatusLoading}
              >
                {report.resolved ? 'Mark as Unresolved' : 'Mark as Resolved'}
              </Button>
            </Box>
            
            {!report.admin_response && (
              <>
                <Typography variant="subtitle2" sx={{ mt: 3, mb: 1 }}>
                  Add Admin Response:
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  placeholder="Type your response here..."
                  value={adminResponse}
                  onChange={(e) => setAdminResponse(e.target.value)}
                  sx={{ mb: 2 }}
                />
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    variant="contained"
                    startIcon={<BsReply />}
                    onClick={handleAdminResponseSubmit}
                    disabled={isResponseLoading || !adminResponse.trim()}
                  >
                    {isResponseLoading ? 'Sending...' : 'Send Response'}
                  </Button>
                </Box>
              </>
            )}
          </Grid>
        </Grid>
      </AccordionDetails>
    </Accordion>
  );
};

export default FeedbackReportItem;
