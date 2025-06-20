import React, { useState } from 'react';
import { 
  Box, 
  Button, 
  Card, 
  CardContent,
  Chip,
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Pagination,
  Paper,
  Select,
  TextField,
  Typography 
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { BsSearch, BsXCircle, BsFilter, BsCheckCircle, BsExclamationCircle } from 'react-icons/bs';
import { useGetFeedbackReportsQuery } from '../feedbackApi';
import { selectActiveFilter, updateFilter, resetFilter } from '../feedbackSlice';
import FeedbackReportItem from './FeedbackReportItem';

const FeedbackReportList = () => {
  const dispatch = useDispatch();
  const activeFilter = useSelector(selectActiveFilter);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  // Get data with RTK Query
  const { data, isLoading, isFetching } = useGetFeedbackReportsQuery({
    page,
    per_page: perPage,
    category: activeFilter.category,
    priority: activeFilter.priority,
    resolved: activeFilter.resolved,
    search: activeFilter.search,
  });

  const handleFilterChange = (field, value) => {
    dispatch(updateFilter({ [field]: value }));
    setPage(1); // Reset to first page when filter changes
  };

  const handleClearFilters = () => {
    dispatch(resetFilter());
    setPage(1);
  };

  const handlePageChange = (event, newPage) => {
    setPage(newPage);
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
    <Card sx={{ mb: 3, borderRadius: 2, boxShadow: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" component="h2" sx={{ fontWeight: 'medium', color: 'primary.main' }}>
            Feedback Reports
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              size="small"
              onClick={handleClearFilters}
              startIcon={<BsXCircle />}
              disabled={!activeFilter.category && !activeFilter.priority && !activeFilter.resolved && !activeFilter.search}
            >
              Clear Filters
            </Button>
          </Box>
        </Box>

        <Paper elevation={0} sx={{ p: 2, mb: 3, backgroundColor: '#f5f5f5' }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                placeholder="Search reports..."
                value={activeFilter.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <BsSearch />
                    </InputAdornment>
                  ),
                  endAdornment: activeFilter.search && (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={() => handleFilterChange('search', '')}
                      >
                        <BsXCircle />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                size="small"
              />
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel id="category-filter-label">Category</InputLabel>
                <Select
                  labelId="category-filter-label"
                  id="category-filter"
                  value={activeFilter.category}
                  label="Category"
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  startAdornment={
                    <InputAdornment position="start">
                      <BsFilter />
                    </InputAdornment>
                  }
                >
                  <MenuItem value="">All Categories</MenuItem>
                  <MenuItem value="bug">Bug Report</MenuItem>
                  <MenuItem value="feature">Feature Request</MenuItem>
                  <MenuItem value="improvement">Improvement Suggestion</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel id="priority-filter-label">Priority</InputLabel>
                <Select
                  labelId="priority-filter-label"
                  id="priority-filter"
                  value={activeFilter.priority}
                  label="Priority"
                  onChange={(e) => handleFilterChange('priority', e.target.value)}
                  startAdornment={
                    <InputAdornment position="start">
                      <BsExclamationCircle />
                    </InputAdornment>
                  }
                >
                  <MenuItem value="">All Priorities</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="low">Low</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel id="resolved-filter-label">Status</InputLabel>
                <Select
                  labelId="resolved-filter-label"
                  id="resolved-filter"
                  value={activeFilter.resolved}
                  label="Status"
                  onChange={(e) => handleFilterChange('resolved', e.target.value)}
                  startAdornment={
                    <InputAdornment position="start">
                      <BsCheckCircle />
                    </InputAdornment>
                  }
                >
                  <MenuItem value="">All Statuses</MenuItem>
                  <MenuItem value="0">Open</MenuItem>
                  <MenuItem value="1">Resolved</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Paper>

        {isLoading ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography>Loading reports...</Typography>
          </Box>
        ) : data?.data?.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography>No feedback reports found matching your criteria.</Typography>
          </Box>
        ) : (
          <>
            <Box sx={{ mb: 3 }}>
              {data?.data?.map((report) => (
                <FeedbackReportItem key={report.id} report={report} />
              ))}
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Pagination
                count={data?.meta?.last_page || 1}
                page={page}
                onChange={handlePageChange}
                color="primary"
                disabled={isFetching}
              />
            </Box>
          </>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
          <FormControl sx={{ width: 100 }} size="small">
            <InputLabel>Per Page</InputLabel>
            <Select
              value={perPage}
              label="Per Page"
              onChange={(e) => {
                setPerPage(e.target.value);
                setPage(1);
              }}
            >
              <MenuItem value={5}>5</MenuItem>
              <MenuItem value={10}>10</MenuItem>
              <MenuItem value={25}>25</MenuItem>
              <MenuItem value={50}>50</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </CardContent>
    </Card>
  );
};

export default FeedbackReportList;
