import { MdAdd, MdDelete } from "react-icons/md";

import {
  addRowFabricCustomColor,
  deleteRowFabricCustomColor,
} from "../../../features/Worksheet/worksheetSlice";
import {
  useSelector,
  useDispatch,
  TextField,
  Grid,
  IconButton,
  Typography,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormGroup,
  Button,
  Box,
} from "../../../utils/import_lib";

function FabricSect({ handleInputChange }) {
  const dispatch = useDispatch();
  const inputList = useSelector((state) => state.worksheet.inputList);
  const fabricCustomRows = inputList.fabric_custom_color;

  const handleDisableInput = () => {
    if (String(inputList.work_id).length > 8 || inputList.is_duplicate) {
      return true;
    } else {
      return false;
    }
  };

  const handleRaidoChange = (event) => {
    handleInputChange(event);
  };

  const addRow = () => {
    dispatch(addRowFabricCustomColor());
  };

  const deleteRow = (index) => {
    dispatch(deleteRowFabricCustomColor(index));
  };

  return (
    <>
      <Grid container spacing={1}>
        <Grid size={{ xs: 12, sm: 6 }} p={1}>
          <TextField
            required
            fullWidth
            variant="outlined"
            label="ชนิดผ้า"
            name="fabric_name"
            onChange={handleInputChange}
            value={inputList.fabric_name}
            disabled={handleDisableInput()}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }} p={1}>
          <TextField
            fullWidth
            variant="outlined"
            label="เบอร์ผ้า"
            name="fabric_no"
            onChange={handleInputChange}
            value={inputList.fabric_no}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 4 }} p={1}>
          <TextField
            required
            fullWidth
            variant="outlined"
            label="สีผ้า"
            name="fabric_color"
            onChange={handleInputChange}
            value={inputList.fabric_color}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 4 }} p={1}>
          <TextField
            fullWidth
            variant="outlined"
            label="เบอร์สีผ้า"
            name="fabric_color_no"
            onChange={handleInputChange}
            value={inputList.fabric_color_no}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 4, lg: 4 }} p={1}>
          <TextField
            required
            fullWidth
            variant="outlined"
            label="ร้านตัดผ้า"
            name="fabric_factory"
            onChange={handleInputChange}
            value={inputList.fabric_factory}
          />
        </Grid>
      </Grid>
      <Grid container spacing={1}>
        <Grid
          p={1}
          size={{
            xs: 12,
            lg: 6,
          }}
        >
          <Box
            p={1}
            sx={(theme) => ({
              borderRadius: theme.vars.shape.borderRadius,
              boxShadow: "rgba(0, 0, 0, 0.1) 0px 1px 2px 0px",
            })}
          >
            <Grid container spacing={0} alignItems="center">
              <Grid
                p={1}
                size={{
                  xs: "auto",
                }}
              >
                <Typography variant="h6" color="grey.800" my={0}>
                  บุ๊งคอ
                </Typography>
              </Grid>
              <Grid
                p={1}
                size={{
                  xs: "auto",
                }}
              >
                <FormGroup row>
                  <RadioGroup
                    row
                    name="crewneck_selected"
                    value={inputList.crewneck_selected}
                    onChange={handleRaidoChange}
                  >
                    <FormControlLabel
                      value={0}
                      control={<Radio color="error" />}
                      label="เหมือนสีผ้า"
                    />
                    <FormControlLabel
                      value={1}
                      control={<Radio color="error" />}
                      label="ต่างกับสีผ้า"
                    />
                  </RadioGroup>
                </FormGroup>
              </Grid>
              {inputList.crewneck_selected == 1 && (
                <Grid size={{ xs: 12, sm: "grow" }} p={{ xs: 1, sm: 0 }} pr={{ md: 1 }}>
                  <TextField
                    required
                    fullWidth
                    variant="outlined"
                    label="สีบุ๊งคอ"
                    type="text"
                    name="crewneck_color"
                    onChange={handleInputChange}
                    value={inputList.crewneck_color}
                  />
                </Grid>
              )}
            </Grid>
          </Box>
        </Grid>
        <Grid
          size={{
            xs: 12,
            lg: 6,
          }}
          p={1}
        >
          <Box
            p={1}
            py={1.6}
            sx={(theme) => ({
              borderRadius: theme.vars.shape.borderRadius,
              boxShadow: "rgba(0, 0, 0, 0.1) 0px 1px 2px 0px",
            })}
          >
            <Grid container spacing={0} alignItems="center">
              <Grid size={{ xs: "auto" }} p={1} mr={1}>
                <Typography variant="h6" color="grey.800" my={0}>
                  ตัดต่อผ้า
                </Typography>
              </Grid>
              <Grid size={{ xs: "auto" }}>
                <Button
                  variant="contained"
                  color="grey"
                  startIcon={<MdAdd />}
                  onClick={addRow}
                  disabled={fabricCustomRows.length >= 4}
                >
                  เพิ่ม
                </Button>
              </Grid>
            </Grid>
            <Grid container spacing={0} alignItems="center">
              <Grid size={{ xs: 12 }}>
                {fabricCustomRows.map((row, index) => (
                  <Grid container my={1} alignItems="center" key={index}>
                    <Grid size={{ xs: 1, sm: 2, lg: 1 }} p={1} textAlign="center">
                      <Typography variant="h6">{index + 1}</Typography>
                    </Grid>
                    <Grid size={{ xs: 9, sm: 8, lg: 10 }} p={1}>
                      <TextField
                        required
                        fullWidth
                        type="text"
                        size="small"
                        variant="outlined"
                        label="สีผ้า"
                        name="fabric_custom_color"
                        value={row}
                        onChange={(e) => handleInputChange(e, index)}
                      />
                    </Grid>
                    <Grid size={{ xs: 2, lg: 1 }} p={1} textAlign="center">
                      <IconButton
                        aria-label="delete-fabric-custom"
                        color="error"
                        onClick={() => deleteRow(index)}
                      >
                        <MdDelete />
                      </IconButton>
                    </Grid>
                  </Grid>
                ))}
              </Grid>
            </Grid>
          </Box>
        </Grid>
      </Grid>
    </>
  );
}

export default FabricSect;
