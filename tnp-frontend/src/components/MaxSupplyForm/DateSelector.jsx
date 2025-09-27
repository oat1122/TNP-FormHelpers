import { Schedule, Warning } from "@mui/icons-material";
import { Card, CardContent, Typography, Grid, Alert } from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import React from "react";

const DateSelector = ({ formData, errors, onInputChange, language = "th", t = (key) => key }) => {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom className={language === "my" ? "myanmar-text" : ""}>
          <Schedule sx={{ mr: 1, verticalAlign: "middle" }} />
          {t("scheduleTime")}
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <DatePicker
              label={t("startDateCurrent")}
              value={formData.start_date}
              onChange={(date) => onInputChange("start_date", date)}
              slotProps={{
                textField: {
                  fullWidth: true,
                  error: !!errors.start_date,
                  helperText: errors.start_date || t("startDateHelper"),
                  className: language === "my" ? "myanmar-text" : "",
                },
              }}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <DatePicker
              label={t("expectedCompletionDate")}
              value={formData.expected_completion_date}
              onChange={(date) => onInputChange("expected_completion_date", date)}
              slotProps={{
                textField: {
                  fullWidth: true,
                  error: !!errors.expected_completion_date,
                  helperText: errors.expected_completion_date,
                  className: language === "my" ? "myanmar-text" : "",
                },
              }}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <DatePicker
              label={t("dueDate")}
              value={formData.due_date}
              onChange={(date) => onInputChange("due_date", date)}
              slotProps={{
                textField: {
                  fullWidth: true,
                  error: !!errors.due_date,
                  helperText: errors.due_date || t("dueDateFromNewWorks"),
                  className: language === "my" ? "myanmar-text" : "",
                },
              }}
            />
          </Grid>
        </Grid>

        {formData.expected_completion_date &&
          formData.due_date &&
          formData.expected_completion_date.isAfter(formData.due_date) && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              <Warning sx={{ mr: 1 }} />
              <span className={language === "my" ? "myanmar-text" : ""}>
                {language === "th"
                  ? "วันที่คาดว่าจะเสร็จเกินกำหนดส่งมอบจาก NewWorksNet กรุณาตรวจสอบอีกครั้ง"
                  : "NewWorksNet မှ ပေးပို့ချိန်ထက် ပြီးမြောက်ရန် မျှော်လင့်သောရက်စွဲ ကျော်လွန်နေသည် ပြန်လည်စစ်ဆေးပေးပါ"}
              </span>
            </Alert>
          )}
      </CardContent>
    </Card>
  );
};

export default DateSelector;
