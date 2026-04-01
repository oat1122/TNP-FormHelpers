import { Alert, Box, TextField, Typography } from "@mui/material";
import { useEffect, useRef } from "react";

const normalizeValue = (value) => (value || "").trim();

const NotebookNoteField = ({
  title,
  description,
  name,
  value,
  onChange,
  onBlur,
  placeholder,
  resetKey,
  onDraftChange,
  inputRef,
  minRows = 4,
  readOnly = false,
}) => {
  const lastCommittedValueRef = useRef(value || "");
  const latestValueRef = useRef(value || "");

  useEffect(() => {
    latestValueRef.current = value || "";
  }, [value]);

  useEffect(() => {
    lastCommittedValueRef.current = latestValueRef.current;
    onDraftChange?.(null);
  }, [resetKey, onDraftChange]);

  const handleBlur = (event) => {
    if (readOnly) {
      return;
    }

    onBlur?.(event);

    const nextValue = event.target.value || "";
    if (
      normalizeValue(nextValue) &&
      normalizeValue(nextValue) !== normalizeValue(lastCommittedValueRef.current)
    ) {
      onDraftChange?.({
        fieldName: name,
        label: title,
        value: nextValue,
        createdAt: new Date(),
      });
      return;
    }

    onDraftChange?.(null);
  };

  return (
    <Box
      sx={{
        p: { xs: 2, md: 2.25 },
        borderRadius: 3,
        border: "1px solid",
        borderColor: "divider",
        bgcolor: "background.paper",
        boxShadow: "0 10px 26px rgba(15, 23, 42, 0.05)",
      }}
    >
      <Typography variant="subtitle1" fontWeight={700}>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
        {description}
      </Typography>

      <TextField
        fullWidth
        multiline
        minRows={minRows}
        maxRows={12}
        name={name}
        value={value || ""}
        onChange={onChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        inputRef={inputRef}
        InputProps={{ readOnly }}
        sx={{ "& .MuiOutlinedInput-root": { alignItems: "flex-start" } }}
      />

      {!readOnly &&
        normalizeValue(value) &&
        normalizeValue(value) !== normalizeValue(lastCommittedValueRef.current) && (
          <Alert severity="warning" sx={{ mt: 1.5, borderRadius: 2 }}>
            Draft note update is ready and will appear in the activity timeline after save.
          </Alert>
        )}
    </Box>
  );
};

export default NotebookNoteField;
