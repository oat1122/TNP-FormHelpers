import React from 'react';
import {
  Grid,
} from '@mui/material';
import {
  WorksheetSelector,
  BasicInfoForm,
  SampleImageCard,
  NewWorksInfoCard,
  DateSelector,
} from './';

const StepBasicInfo = ({ 
  formData, 
  errors, 
  worksheetOptions, 
  worksheetLoading, 
  selectedWorksheet,
  onInputChange, 
  onWorksheetSelect, 
  onRefreshWorksheets,
  priorityLevels 
}) => {
  return (
    <Grid container spacing={3}>
      {/* Worksheet Selection */}
      <Grid item xs={12}>
        <WorksheetSelector
          selectedWorksheet={selectedWorksheet}
          worksheetOptions={worksheetOptions}
          worksheetLoading={worksheetLoading}
          onWorksheetSelect={onWorksheetSelect}
          onRefreshWorksheets={onRefreshWorksheets}
          errors={errors}
        />
      </Grid>

      {/* Basic Information */}
      <Grid item xs={12}>
        <BasicInfoForm
          formData={formData}
          errors={errors}
          priorityLevels={priorityLevels}
          onInputChange={onInputChange}
        />
      </Grid>

      {/* Sample Image */}
      <Grid item xs={12}>
        <SampleImageCard sampleImage={formData.sample_image} />
      </Grid>

      {/* NewWorksNet Additional Info */}
      <Grid item xs={12}>
        <NewWorksInfoCard formData={formData} />
      </Grid>

      {/* Dates */}
      <Grid item xs={12}>
        <DateSelector
          formData={formData}
          errors={errors}
          onInputChange={onInputChange}
        />
      </Grid>
    </Grid>
  );
};

export default StepBasicInfo; 