import React from 'react';
import { 
  Box,
  Tab,
  Tabs,
  Typography,
  Container,
  Paper
} from '@mui/material';
import { BsFileEarmarkText, BsListUl, BsBarChartLine, BsChatSquareQuote } from 'react-icons/bs';
import { useDispatch, useSelector } from 'react-redux';
import { selectActiveFeedbackTab, setActiveFeedbackTab } from './feedbackSlice';
import FeedbackForm from './components/FeedbackForm';
import FeedbackReportList from './components/FeedbackReportList';
import FeedbackStatistics from './components/FeedbackStatistics';
import EncouragingMessageManagement from './components/EncouragingMessageManagement';
import AttachmentPreview from './components/AttachmentPreview';

// Custom TabPanel component
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`feedback-tabpanel-${index}`}
      aria-labelledby={`feedback-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index) {
  return {
    id: `feedback-tab-${index}`,
    'aria-controls': `feedback-tabpanel-${index}`,
  };
}

const FeedbackPage = () => {
  const dispatch = useDispatch();
  const activeTab = useSelector(selectActiveFeedbackTab);
  
  const handleTabChange = (event, newValue) => {
    dispatch(setActiveFeedbackTab(newValue));
  };
    return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Attachment Preview Dialog */}
      <AttachmentPreview />
      
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography 
          variant="h3" 
          component="h1" 
          sx={{ 
            fontWeight: 'bold',
            color: 'primary.main',
            mb: 1
          }}
        >
          Feedback Portal
        </Typography>
        <Typography variant="h6" sx={{ color: 'text.secondary', fontWeight: 'normal' }}>
          Help us improve by sharing your thoughts and suggestions!
        </Typography>
      </Box>

      <Paper 
        sx={{ 
          borderRadius: 2,
          boxShadow: 2,
          mb: 4
        }}
      >
        <Tabs 
          value={activeTab}
          onChange={handleTabChange}
          variant="fullWidth"
          textColor="primary"
          indicatorColor="primary"
          aria-label="feedback portal tabs"
        >
          <Tab
            icon={<BsFileEarmarkText />}
            iconPosition="start"
            label="Submit Feedback"
            value="submit"
            {...a11yProps(0)}
          />
          <Tab
            icon={<BsListUl />}
            iconPosition="start"
            label="View Reports"
            value="list"
            {...a11yProps(1)}
          />
          <Tab
            icon={<BsBarChartLine />}
            iconPosition="start"
            label="Statistics"
            value="statistics"
            {...a11yProps(2)}
          />
          <Tab
            icon={<BsChatSquareQuote />}
            iconPosition="start"
            label="Encouraging Messages"
            value="messages"
            {...a11yProps(3)}
          />
        </Tabs>
      </Paper>

      <TabPanel value={activeTab} index="submit">
        <FeedbackForm />
      </TabPanel>
      
      <TabPanel value={activeTab} index="list">
        <FeedbackReportList />
      </TabPanel>
      
      <TabPanel value={activeTab} index="statistics">
        <FeedbackStatistics />
      </TabPanel>
      
      <TabPanel value={activeTab} index="messages">
        <EncouragingMessageManagement />
      </TabPanel>
    </Container>
  );
};

export default FeedbackPage;
