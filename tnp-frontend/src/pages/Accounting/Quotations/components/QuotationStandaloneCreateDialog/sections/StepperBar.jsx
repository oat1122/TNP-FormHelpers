import { Step, StepLabel, Stepper } from "@mui/material";

import { STEP_LABELS } from "../utils/standaloneFormDefaults";

const StepperBar = ({ activeStep }) => (
  <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
    {STEP_LABELS.map((label) => (
      <Step key={label}>
        <StepLabel>{label}</StepLabel>
      </Step>
    ))}
  </Stepper>
);

export default StepperBar;
