import { TextField, InputAdornment } from "@mui/material";
import { MdSearch } from "react-icons/md";

/**
 * SearchBar - Reusable search input component with debouncing
 */
const SearchBar = ({ value, onChange, placeholder = "ค้นหา..." }) => {
  return (
    <TextField
      size="small"
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      sx={{ flex: 1, fontFamily: "Kanit" }}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <MdSearch size={20} />
          </InputAdornment>
        ),
        style: { fontFamily: "Kanit", fontSize: 14 },
      }}
    />
  );
};

export default SearchBar;
