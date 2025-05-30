import {
  useSelector,
  TextField,
  Grid,
} from "../../../utils/import_lib";

function ScreenSect({ handleInputChange }) {
  const inputList = useSelector((state) => state.worksheet.inputList);

  return (
    <Grid container spacing={0}>
      <Grid size={{ xs: 4, md: "grow", }} p={1}>
        <TextField
          type="text"
          fullWidth
          variant="outlined"
          name="screen_point"
          label="สกรีน"
          value={inputList.screen_point}
          onChange={handleInputChange}
        />
      </Grid>
      <Grid size={{ xs: 4, md: "grow", }} p={1}>
        <TextField
          type="text"
          fullWidth
          variant="outlined"
          name="screen_flex"
          label="เฟล็กซ์"
          value={inputList.screen_flex}
          onChange={handleInputChange}
        />
      </Grid>
      <Grid size={{ xs: 4, md: "grow", }} p={1}>
        <TextField
          type="text"
          fullWidth
          variant="outlined"
          name="screen_dft"
          label="ดีเอฟที"
          value={inputList.screen_dft}
          onChange={handleInputChange}
        />
      </Grid>
      <Grid size={{ xs: 6, md: "grow", }} p={1}>
        <TextField
          type="text"
          fullWidth
          variant="outlined"
          name="screen_label"
          label="ลาเบล"
          value={inputList.screen_label}
          onChange={handleInputChange}
        />
      </Grid>
      <Grid size={{ xs: 6, md: "grow", }} p={1}>
        <TextField
          type="text"
          fullWidth
          variant="outlined"
          name="screen_embroider"
          label="ปัก"
          value={inputList.screen_embroider}
          onChange={handleInputChange}
        />
      </Grid>
    </Grid>
  );
}

export default ScreenSect;
