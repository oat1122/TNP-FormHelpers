import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import AssignmentIcon from "@mui/icons-material/Assignment";
import { MenuItem, TextField } from "@mui/material";

const DOCUMENT_TYPE_OPTIONS = [
  { value: "quotation", label: "ใบเสนอราคา", icon: AssignmentIcon },
  { value: "invoice", label: "ใบแจ้งหนี้", icon: AccountBalanceIcon },
];

const DocumentTypeSelector = ({ value, onChange }) => {
  return (
    <TextField
      select
      size="small"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      label="ประเภทเอกสาร"
      sx={{
        minWidth: 200,
        bgcolor: "background.paper",
      }}
    >
      {DOCUMENT_TYPE_OPTIONS.map((opt) => {
        const Icon = opt.icon;
        return (
          <MenuItem key={opt.value} value={opt.value}>
            <Icon fontSize="small" sx={{ mr: 1, verticalAlign: "middle" }} />
            {opt.label}
          </MenuItem>
        );
      })}
    </TextField>
  );
};

export default DocumentTypeSelector;
