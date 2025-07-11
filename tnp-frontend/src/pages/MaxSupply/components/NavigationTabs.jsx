import React from 'react';
import { Box, Tab, Tabs } from '@mui/material';
import { Dashboard, CalendarToday, Assignment } from '@mui/icons-material';

const NavigationTabs = ({ currentTab, setCurrentTab }) => {
  const tabs = [
    { label: 'Dashboard', icon: <Dashboard /> },
    { label: 'Calendar', icon: <CalendarToday /> },
    { label: 'Manager', icon: <Assignment /> },
  ];

  return (
    <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
      <Tabs 
        value={currentTab} 
        onChange={(e, newValue) => setCurrentTab(newValue)}
        sx={{
          '& .MuiTab-root': {
            textTransform: 'none',
            fontSize: '1rem',
            fontWeight: 500,
          }
        }}
      >
        {tabs.map((tab, index) => (
          <Tab 
            key={index}
            icon={tab.icon} 
            label={tab.label} 
            iconPosition="start"
            sx={{ minHeight: 48 }}
          />
        ))}
      </Tabs>
    </Box>
  );
};

export default NavigationTabs; 