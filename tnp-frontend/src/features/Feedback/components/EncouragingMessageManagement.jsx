import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormHelperText,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Switch,
  TextField,
  Typography
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { BsPlus, BsPencil, BsTrash } from 'react-icons/bs';
import toast from 'react-hot-toast';
import {
  useGetAllMessagesQuery,
  useCreateMessageMutation,
  useUpdateMessageMutation,
  useToggleMessageStatusMutation
} from '../feedbackApi';

const EncouragingMessageManagement = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMessage, setEditingMessage] = useState(null);
  
  const { data: messages, isLoading } = useGetAllMessagesQuery();
  const [createMessage, { isLoading: isCreating }] = useCreateMessageMutation();
  const [updateMessage, { isLoading: isUpdating }] = useUpdateMessageMutation();
  const [toggleMessageStatus, { isLoading: isToggling }] = useToggleMessageStatusMutation();
  
  const { control, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      content: '',
      category: '',
      is_active: true
    }
  });
  
  const openDialog = (message = null) => {
    setEditingMessage(message);
    
    if (message) {
      reset({
        content: message.content,
        category: message.category,
        is_active: message.is_active
      });
    } else {
      reset({
        content: '',
        category: '',
        is_active: true
      });
    }
    
    setDialogOpen(true);
  };
  
  const closeDialog = () => {
    setDialogOpen(false);
    setEditingMessage(null);
  };
  
  const handleToggleActive = async (id) => {
    try {
      await toggleMessageStatus(id).unwrap();
      toast.success('Message status updated');
    } catch (error) {
      toast.error('Failed to update message status');
      console.error('Error toggling message status:', error);
    }
  };
  
  const onSubmit = async (data) => {
    try {
      if (editingMessage) {
        await updateMessage({
          id: editingMessage.id,
          ...data
        }).unwrap();
        toast.success('Message updated successfully');
      } else {
        await createMessage(data).unwrap();
        toast.success('Message created successfully');
      }
      
      closeDialog();
    } catch (error) {
      toast.error(`Failed to ${editingMessage ? 'update' : 'create'} message`);
      console.error('Error saving message:', error);
    }
  };

  return (
    <>
      <Card sx={{ mb: 3, borderRadius: 2, boxShadow: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" component="h2" sx={{ fontWeight: 'medium', color: 'primary.main' }}>
              Encouraging Messages
            </Typography>
            
            <Button
              variant="contained"
              startIcon={<BsPlus />}
              onClick={() => openDialog()}
            >
              Add New Message
            </Button>
          </Box>
          
          {isLoading ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography>Loading messages...</Typography>
            </Box>
          ) : messages?.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography>No encouraging messages found. Add some to display to users!</Typography>
            </Box>
          ) : (
            <Grid container spacing={2}>
              {messages?.map((message) => (
                <Grid item xs={12} key={message.id}>
                  <Paper
                    elevation={1}
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      bgcolor: message.is_active ? 'white' : '#f5f5f5',
                      opacity: message.is_active ? 1 : 0.7,
                      border: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    <Box>
                      <Typography
                        variant="body1"
                        sx={{
                          fontStyle: 'italic',
                          color: message.is_active ? 'text.primary' : 'text.secondary',
                        }}
                      >
                        "{message.content}"
                      </Typography>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                        {message.category && (
                          <Typography
                            variant="caption"
                            sx={{
                              mr: 2,
                              px: 1,
                              py: 0.5,
                              borderRadius: 1,
                              bgcolor: 'primary.light',
                              color: 'primary.contrastText',
                            }}
                          >
                            {message.category.charAt(0).toUpperCase() + message.category.slice(1)}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={message.is_active}
                            onChange={() => handleToggleActive(message.id)}
                            disabled={isToggling}
                          />
                        }
                        label={message.is_active ? "Active" : "Inactive"}
                      />
                      
                      <IconButton
                        color="primary"
                        onClick={() => openDialog(message)}
                        size="small"
                      >
                        <BsPencil />
                      </IconButton>
                    </Box>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          )}
        </CardContent>
      </Card>
      
      <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogTitle>
            {editingMessage ? 'Edit Encouraging Message' : 'Add New Encouraging Message'}
          </DialogTitle>
          
          <DialogContent sx={{ pt: 2 }}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Controller
                  name="content"
                  control={control}
                  rules={{ 
                    required: 'Message content is required',
                    minLength: {
                      value: 10,
                      message: 'Message must be at least 10 characters'
                    }
                  }}
                  render={({ field }) => (
                    <TextField
                      label="Message Content"
                      fullWidth
                      multiline
                      rows={3}
                      error={!!errors.content}
                      helperText={errors.content?.message}
                      {...field}
                    />
                  )}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Controller
                  name="category"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel id="category-label">Category (Optional)</InputLabel>
                      <Select
                        labelId="category-label"
                        id="category"
                        label="Category (Optional)"
                        {...field}
                      >
                        <MenuItem value="">All Categories</MenuItem>
                        <MenuItem value="bug">Bug Report</MenuItem>
                        <MenuItem value="feature">Feature Request</MenuItem>
                        <MenuItem value="improvement">Improvement Suggestion</MenuItem>
                        <MenuItem value="other">Other</MenuItem>
                      </Select>
                      <FormHelperText>
                        Leave empty to show for all categories
                      </FormHelperText>
                    </FormControl>
                  )}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Controller
                  name="is_active"
                  control={control}
                  render={({ field: { value, onChange } }) => (
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={value}
                          onChange={(e) => onChange(e.target.checked)}
                        />
                      }
                      label="Active (message will be shown to users)"
                    />
                  )}
                />
              </Grid>
            </Grid>
          </DialogContent>
          
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={closeDialog}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={isCreating || isUpdating}
            >
              {isCreating || isUpdating ? 'Saving...' : 'Save'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </>
  );
};

export default EncouragingMessageManagement;
