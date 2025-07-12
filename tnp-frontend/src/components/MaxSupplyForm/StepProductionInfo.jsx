import React from 'react';
import {
  Grid,
} from '@mui/material';
import {
  ShirtTypeSelector,
  ProductionTypeSelector,
  WorkCalculationCard,
  SizeBreakdownTable,
  PrintLocationCard,
} from './';

const StepProductionInfo = ({ 
  formData, 
  errors, 
  shirtTypes, 
  productionTypes,
  sizeOptions,
  selectedWorksheet,
  onInputChange, 
  onSizeBreakdown,
  onSizeQuantityChange,
  onPrintLocationChange 
}) => {
  // Check if data is auto-filled from worksheet
  const isAutoFilled = Boolean(selectedWorksheet && formData.worksheet_id);
  
  return (
    <Grid container spacing={3}>
      {/* Shirt Type */}
      <Grid item xs={12} md={6}>
        <ShirtTypeSelector
          formData={formData}
          errors={errors}
          shirtTypes={shirtTypes}
          onInputChange={onInputChange}
        />
      </Grid>

      {/* Production Type */}
      <Grid item xs={12} md={6}>
        <ProductionTypeSelector
          formData={formData}
          errors={errors}
          productionTypes={productionTypes}
          onInputChange={onInputChange}
        />
      </Grid>

      {/* Work Calculation Section */}
      <Grid item xs={12}>
        <WorkCalculationCard
          formData={formData}
          isAutoFilled={isAutoFilled}
        />
      </Grid>

      {/* Size Selection */}
      <Grid item xs={12}>
        <SizeBreakdownTable
          formData={formData}
          errors={errors}
          sizeOptions={sizeOptions}
          selectedWorksheet={selectedWorksheet}
          isAutoFilled={isAutoFilled}
          onSizeBreakdown={onSizeBreakdown}
          onSizeQuantityChange={onSizeQuantityChange}
        />
      </Grid>

      {/* Print Locations */}
      <Grid item xs={12}>
        <PrintLocationCard
          formData={formData}
          onPrintLocationChange={onPrintLocationChange}
        />
      </Grid>
    </Grid>
  );
};

export default StepProductionInfo; 