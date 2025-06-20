import React, { useState } from 'react';
import { 
  Box, 
  Button, 
  Card, 
  CardContent,
  Checkbox,
  FormControl,
  FormControlLabel,
  FormHelperText,
  Grid, 
  InputLabel,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';
import { BsUpload, BsX } from 'react-icons/bs';
import toast from 'react-hot-toast';

import { useCreateFeedbackReportMutation } from '../feedbackApi';
import { 
  selectFeedbackForm, 
  updateFeedbackForm, 
  clearFeedbackForm,
  addAttachment,
  removeAttachment,
  setPreviewAttachment
} from '../feedbackSlice';
import EncouragingMessage from './EncouragingMessage';

const FeedbackForm = () => {
  const dispatch = useDispatch();
  const feedbackForm = useSelector(selectFeedbackForm);
  const [createFeedback, { isLoading }] = useCreateFeedbackReportMutation();

  const { control, handleSubmit, formState: { errors }, reset, watch } = useForm({
    defaultValues: {
      category: feedbackForm.category || '',
      title: feedbackForm.title || '',
      description: feedbackForm.description || '',
      priority: feedbackForm.priority || 'medium',
      isAnonymous: feedbackForm.isAnonymous || false
    }
  });

  const [dragActive, setDragActive] = useState(false);
  const watchCategory = watch('category');

  const handleFormChange = (field, value) => {
    dispatch(updateFeedbackForm({ [field]: value }));
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files);
    }
  };

  const handleFileChange = (files) => {
    const fileList = Array.from(files);
    const validFiles = fileList.filter(file => {
      const isValid = file.size <= 5 * 1024 * 1024; // 5MB limit
      if (!isValid) {
        toast.error(`${file.name} is too large (max 5MB)`);
      }
      return isValid;
    });

    validFiles.forEach(file => {
      dispatch(addAttachment(file));
    });
  };

  const handleRemoveFile = (index) => {
    dispatch(removeAttachment(index));
  };

  const handlePreviewFile = (file) => {
    dispatch(setPreviewAttachment(file));
  };

  const onSubmit = async (data) => {
    try {
      const formData = new FormData();
      formData.append('category', data.category);
      formData.append('title', data.title);
      formData.append('description', data.description);
      formData.append('priority', data.priority);
      formData.append('is_anonymous', data.isAnonymous ? '1' : '0');
      
      // Append attachments if any
      feedbackForm.attachments.forEach(file => {
        formData.append('attachments[]', file);
      });

      await createFeedback(formData).unwrap();
      toast.success('Feedback submitted successfully!');
      
      // Reset form
      reset();
      dispatch(clearFeedbackForm());
    } catch (error) {
      toast.error('Failed to submit feedback. Please try again.');
      console.error('Error submitting feedback:', error);
    }
  };

  return (
    <Card sx={{ mb: 3, borderRadius: 2, boxShadow: 3 }}>
      <CardContent>
        <Typography variant="h5" component="h2" sx={{ mb: 2, fontWeight: 'medium', color: 'primary.main' }}>
          Submit Feedback or Report
        </Typography>
        
        <EncouragingMessage category={watchCategory} />
        
        <form onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <Controller
                name="category"
                control={control}
                rules={{ required: 'Category is required' }}
                render={({ field }) => (
                  <FormControl 
                    fullWidth
                    error={!!errors.category}
                  >
                    <InputLabel id="category-label">Category</InputLabel>
                    <Select
                      labelId="category-label"
                      id="category"
                      label="Category"
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        handleFormChange('category', e.target.value);
                      }}
                    >
                      <MenuItem value="bug">Bug Report</MenuItem>
                      <MenuItem value="feature">Feature Request</MenuItem>
                      <MenuItem value="improvement">Improvement Suggestion</MenuItem>
                      <MenuItem value="other">Other</MenuItem>
                    </Select>
                    {errors.category && (
                      <FormHelperText>{errors.category.message}</FormHelperText>
                    )}
                  </FormControl>
                )}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Controller
                name="priority"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel id="priority-label">Priority</InputLabel>
                    <Select
                      labelId="priority-label"
                      id="priority"
                      label="Priority"
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        handleFormChange('priority', e.target.value);
                      }}
                    >
                      <MenuItem value="low">Low</MenuItem>
                      <MenuItem value="medium">Medium</MenuItem>
                      <MenuItem value="high">High</MenuItem>
                    </Select>
                  </FormControl>
                )}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Controller
                name="title"
                control={control}
                rules={{ 
                  required: 'Title is required',
                  minLength: {
                    value: 5,
                    message: 'Title must be at least 5 characters'
                  }
                }}
                render={({ field }) => (
                  <TextField
                    id="title"
                    label="Title"
                    fullWidth
                    error={!!errors.title}
                    helperText={errors.title?.message}
                    {...field}
                    onChange={(e) => {
                      field.onChange(e);
                      handleFormChange('title', e.target.value);
                    }}
                  />
                )}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Controller
                name="description"
                control={control}
                rules={{ 
                  required: 'Description is required',
                  minLength: {
                    value: 20,
                    message: 'Description must be at least 20 characters'
                  }
                }}
                render={({ field }) => (
                  <TextField
                    id="description"
                    label="Description"
                    fullWidth
                    multiline
                    rows={5}
                    error={!!errors.description}
                    helperText={errors.description?.message}
                    {...field}
                    onChange={(e) => {
                      field.onChange(e);
                      handleFormChange('description', e.target.value);
                    }}
                  />
                )}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Paper
                sx={{
                  p: 2,
                  border: '2px dashed',
                  borderColor: dragActive ? 'primary.main' : 'divider',
                  borderRadius: 1,
                  backgroundColor: dragActive ? 'rgba(25, 118, 210, 0.08)' : 'transparent',
                  transition: 'all 0.2s ease-in-out',
                  textAlign: 'center',
                  cursor: 'pointer'
                }}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => document.getElementById('file-upload').click()}
              >
                <input
                  id="file-upload"
                  type="file"
                  multiple
                  style={{ display: 'none' }}
                  onChange={(e) => handleFileChange(e.target.files)}
                />
                <Box display="flex" alignItems="center" justifyContent="center" py={3}>
                  <BsUpload style={{ fontSize: 24, marginRight: 10 }} />
                  <Typography>
                    Drag files here or click to upload (Max: 5MB per file)
                  </Typography>
                </Box>
              </Paper>
            </Grid>
            
            {feedbackForm.attachments.length > 0 && (
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Attachments ({feedbackForm.attachments.length})
                </Typography>
                <Grid container spacing={1}>
                  {feedbackForm.attachments.map((file, index) => (
                    <Grid item xs={12} sm={6} md={4} key={`${file.name}-${index}`}>
                      <Paper
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          p: 1.5,
                          backgroundColor: 'background.default'
                        }}
                      >
                        <Typography 
                          variant="body2" 
                          onClick={() => handlePreviewFile(file)}
                          sx={{ 
                            cursor: 'pointer', 
                            textDecoration: 'underline',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            maxWidth: '80%'
                          }}
                        >
                          {file.name}
                        </Typography>
                        <BsX 
                          onClick={() => handleRemoveFile(index)} 
                          style={{ cursor: 'pointer', fontSize: 20 }}
                        />
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </Grid>
            )}
            
            <Grid item xs={12}>
              <Controller
                name="isAnonymous"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={field.value}
                        onChange={(e) => {
                          field.onChange(e);
                          handleFormChange('isAnonymous', e.target.checked);
                        }}
                      />
                    }
                    label="Submit anonymously (your name will not be visible to others)"
                  />
                )}
              />
            </Grid>
            
            <Grid item xs={12} textAlign="right">
              <Button
                type="submit"
                variant="contained"
                disabled={isLoading}
                sx={{ px: 4, py: 1, borderRadius: 2 }}
              >
                {isLoading ? 'Submitting...' : 'Submit Feedback'}
              </Button>
            </Grid>
          </Grid>
        </form>
      </CardContent>
    </Card>
  );
};

export default FeedbackForm;
