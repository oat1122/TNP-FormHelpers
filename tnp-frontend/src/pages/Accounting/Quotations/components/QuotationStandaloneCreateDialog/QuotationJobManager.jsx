import React, { useCallback } from "react";
import {
  Box,
  Button,
  IconButton,
  Paper,
  TextField,
  Typography,
  Grid,
  Divider,
  Chip,
  MenuItem,
  Tooltip,
} from "@mui/material";
import { Add as AddIcon, DeleteOutline as DeleteIcon } from "@mui/icons-material";

// Helper for currency
const formatTHB = (value) => {
  return new Intl.NumberFormat("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value || 0);
};

// Helper for sanitizing input
const sanitizeDecimal = (value) => {
  if (value == null || value === "") return "";
  let str = String(value).replace(/[^0-9.]/g, "");
  const parts = str.split(".");
  if (parts.length > 2) {
    str = parts[0] + "." + parts.slice(1).join("");
  }
  return str;
};

const sanitizeInt = (value) => {
  if (value == null || value === "") return "";
  return String(value).replace(/[^0-9]/g, "");
};

/**
 * JobCard Component
 * Manages a single job and its size rows.
 */
const JobCard = ({ job, index, onChangeJob, onDeleteJob, errors }) => {
  const handleJobFieldChange = (field, value) => {
    onChangeJob(job.id, { ...job, [field]: value });
  };

  const handleAddSizeRow = () => {
    const newRow = {
      id: `row_${Date.now()}`,
      size: "",
      quantity: 1,
      unit_price: 0,
      notes: "",
    };
    onChangeJob(job.id, { ...job, sizeRows: [...job.sizeRows, newRow] });
  };

  const handleDeleteSizeRow = (rowId) => {
    const newRows = job.sizeRows.filter((r) => r.id !== rowId);
    onChangeJob(job.id, { ...job, sizeRows: newRows });
  };

  const handleChangeSizeRow = (rowId, field, value) => {
    let processedValue = value;
    if (field === "quantity") processedValue = sanitizeInt(value);
    if (field === "unit_price") processedValue = sanitizeDecimal(value);

    const newRows = job.sizeRows.map((r) =>
      r.id === rowId ? { ...r, [field]: processedValue } : r
    );
    onChangeJob(job.id, { ...job, sizeRows: newRows });
  };

  const totalQty = job.sizeRows.reduce((sum, row) => sum + Number(row.quantity || 0), 0);
  const itemTotal = job.sizeRows.reduce(
    (sum, row) => sum + Number(row.quantity || 0) * Number(row.unit_price || 0),
    0
  );

  return (
    <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
      {/* Job Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Typography variant="subtitle1" fontWeight={700}>
            งานที่ {index + 1}
          </Typography>
          <TextField
            label="ชื่องาน"
            size="small"
            value={job.work_name}
            onChange={(e) => handleJobFieldChange("work_name", e.target.value)}
            placeholder="กรุณาระบุชื่องาน"
            required
            error={!!errors[`jobs.${index}.work_name`]}
          />
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Chip
            label={`${totalQty} ${job.unit || "ชิ้น"}`}
            size="small"
            color="primary"
            variant="outlined"
          />
          <Tooltip title="ลบงานนี้">
            <IconButton color="error" size="small" onClick={onDeleteJob}>
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Job Details */}
      <Grid container spacing={1.5}>
        <Grid item xs={12} md={3}>
          <TextField
            label="แพทเทิร์น"
            size="small"
            fullWidth
            value={job.pattern}
            onChange={(e) => handleJobFieldChange("pattern", e.target.value)}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <TextField
            label="ประเภทผ้า"
            size="small"
            fullWidth
            value={job.fabric_type}
            onChange={(e) => handleJobFieldChange("fabric_type", e.target.value)}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <TextField
            label="สี"
            size="small"
            fullWidth
            value={job.color}
            onChange={(e) => handleJobFieldChange("color", e.target.value)}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <TextField
            label="หน่วย"
            size="small"
            fullWidth
            select
            value={job.unit}
            onChange={(e) => handleJobFieldChange("unit", e.target.value)}
          >
            <MenuItem value="ชิ้น">ชิ้น</MenuItem>
            <MenuItem value="ตัว">ตัว</MenuItem>
            <MenuItem value="ชุด">ชุด</MenuItem>
            <MenuItem value="แผ่น">แผ่น</MenuItem>
            <MenuItem value="เมตร">เมตร</MenuItem>
            <MenuItem value="กิโลกรัม">กิโลกรัม</MenuItem>
          </TextField>
        </Grid>
      </Grid>

      {/* Size Rows */}
      <Box sx={{ mt: 2, p: 1.5, border: "1px dashed", borderColor: "divider", borderRadius: 1 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
          <Typography variant="subtitle2">แยกตามขนาด</Typography>
          <Button size="small" startIcon={<AddIcon />} onClick={handleAddSizeRow}>
            เพิ่มแถว
          </Button>
        </Box>
        <Grid container spacing={1} sx={{ px: 0.5, pb: 0.5, alignItems: "center" }}>
          <Grid item xs={12} md={3}>
            <Typography variant="caption" color="text.secondary">
              ขนาด
            </Typography>
          </Grid>
          <Grid item xs={6} md={2.5}>
            <Typography variant="caption" color="text.secondary">
              จำนวน
            </Typography>
          </Grid>
          <Grid item xs={6} md={2.5}>
            <Typography variant="caption" color="text.secondary">
              ราคาต่อหน่วย
            </Typography>
          </Grid>
          <Grid item xs={10} md={2}>
            <Typography variant="caption" color="text.secondary">
              ยอดรวม
            </Typography>
          </Grid>
          <Grid item xs={2} md={1.5}></Grid>
        </Grid>

        {job.sizeRows.map((row, rowIndex) => {
          const subtotal = (row.quantity || 0) * (row.unit_price || 0);
          return (
            <React.Fragment key={row.id}>
              <Grid container spacing={1} sx={{ mb: 1.5, alignItems: "center" }}>
                <Grid item xs={12} md={3}>
                  <TextField
                    label="ขนาด"
                    size="small"
                    fullWidth
                    value={row.size}
                    onChange={(e) => handleChangeSizeRow(row.id, "size", e.target.value)}
                  />
                </Grid>
                <Grid item xs={6} md={2.5}>
                  <TextField
                    label="จำนวน"
                    size="small"
                    fullWidth
                    type="number"
                    value={row.quantity}
                    onChange={(e) => handleChangeSizeRow(row.id, "quantity", e.target.value)}
                    error={!!errors[`jobs.${index}.rows.${rowIndex}.quantity`]}
                  />
                </Grid>
                <Grid item xs={6} md={2.5}>
                  <TextField
                    label="ราคาต่อหน่วย"
                    size="small"
                    fullWidth
                    value={row.unit_price}
                    onChange={(e) => handleChangeSizeRow(row.id, "unit_price", e.target.value)}
                    error={!!errors[`jobs.${index}.rows.${rowIndex}.unit_price`]}
                  />
                </Grid>
                <Grid item xs={10} md={2}>
                  <Box sx={{ p: 1, textAlign: "right", borderRadius: 1, bgcolor: "grey.100" }}>
                    <Typography variant="body2" fontWeight={600}>
                      {formatTHB(subtotal)}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={2} md={1.5} sx={{ textAlign: "center" }}>
                  <Tooltip title="ลบแถว">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDeleteSizeRow(row.id)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="หมายเหตุ (บรรทัดนี้)"
                    size="small"
                    fullWidth
                    value={row.notes}
                    onChange={(e) => handleChangeSizeRow(row.id, "notes", e.target.value)}
                  />
                </Grid>
              </Grid>
            </React.Fragment>
          );
        })}
      </Box>

      {/* Job Total */}
      <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 1.5, pr: 1.5 }}>
        <Box
          sx={{
            p: 1.5,
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 1.5,
            textAlign: "right",
            minWidth: 200,
          }}
        >
          <Typography variant="caption" color="text.secondary">
            ยอดรวมงานนี้
          </Typography>
          <Typography variant="h6" fontWeight={700}>
            {formatTHB(itemTotal)}
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
};

/**
 * QuotationJobManager Component
 * Manages a list of JobCards.
 */
const QuotationJobManager = ({ jobs = [], onChange, errors = {} }) => {
  const handleAddJob = useCallback(() => {
    const newJob = {
      id: `job_${Date.now()}`,
      work_name: "",
      pattern: "",
      fabric_type: "",
      color: "",
      unit: "ตัว",
      sizeRows: [
        {
          id: `row_${Date.now()}`,
          size: "",
          quantity: 1,
          unit_price: 0,
          notes: "",
        },
      ],
    };
    onChange([...jobs, newJob]);
  }, [jobs, onChange]);

  const handleDeleteJob = useCallback(
    (jobId) => {
      const newJobs = jobs.filter((j) => j.id !== jobId);
      onChange(newJobs);
    },
    [jobs, onChange]
  );

  const handleChangeJob = useCallback(
    (jobId, updatedJob) => {
      const newJobs = jobs.map((j) => (j.id === jobId ? updatedJob : j));
      onChange(newJobs);
    },
    [jobs, onChange]
  );

  return (
    <Box>
      {jobs.map((job, index) => (
        <JobCard
          key={job.id}
          job={job}
          index={index}
          onChangeJob={handleChangeJob}
          onDeleteJob={() => handleDeleteJob(job.id)}
          errors={errors}
        />
      ))}
      <Button
        variant="outlined"
        startIcon={<AddIcon />}
        onClick={handleAddJob}
        fullWidth
        sx={{ mt: 2 }}
      >
        เพิ่มงาน
      </Button>
    </Box>
  );
};

export default QuotationJobManager;
