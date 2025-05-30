import {
  Box,
  Divider,
  useDispatch,
  useSelector,
  TextField,
  Typography,
  Grid,
  moment,
} from "../../../utils/import_lib";
import { AdapterMoment } from "@mui/x-date-pickers/AdapterMoment";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers";
import { setDateInput, setInputExample } from "../../../features/Worksheet/worksheetSlice";

function ExampleSect({ handleInputChange }) {
  const dispatch = useDispatch();
  const inputList = useSelector((state) => state.worksheet.inputList);
  let content;

  const renderedExampleQty = (items, pattern_type) => {
    return items.map((item, index) => (
      <Grid key={index} size={{ xs: 6, sm: 4, lg: 2, }} p={1}>
        <TextField
          type="text"
          fullWidth
          name={`${pattern_type}_example_${item.ex_size_name}`}
          label={item.ex_size_name.toUpperCase()}
          value={item.ex_quantity}
          onChange={(e) => dispatch(setInputExample({name: e.target.name, value: e.target.value, index}))}
        />
      </Grid>
    ))
  } 

  if (Number(inputList.pattern_type) === 2) {
    const menSizes = renderedExampleQty(inputList.example_quantity.men, 'men');
    const womenSizes = renderedExampleQty(inputList.example_quantity.women, 'women');

    content = (
      <Box sx={{ mt: 1 }}>
        {menSizes.length > 0 && (
          <>
            <Typography variant="h6" color="grey.500" sx={{ mb: 1, ml: 1 }}>
              Men
            </Typography>
            <Grid container spacing={2}>
              {menSizes}
            </Grid>
            <Divider variant="middle" 
              sx={(theme) => ({ 
                mx: 1, 
                my: 2, 
                borderBottomWidth: 2,
                borderColor: theme.vars.palette.grey[500]
              })} 
            />
          </>
        )}

        {womenSizes.length > 0 && (
          <>
            <Typography variant="h6" color="grey.500" sx={{ mb: 1, ml: 1 }}>
              Women
            </Typography>
            <Grid container spacing={2}>
              {womenSizes}
            </Grid>
          </>
        )}
      </Box>
    )
    
  } else {

    content = (
      <Grid container spacing={1}>
        {renderedExampleQty(inputList.example_quantity, 'unisex')}
      </Grid>
    )
  }

  const handleDateChange = (val_date, is_due_date) => {
    const payloadData = {
      value: val_date ? val_date.format("YYYY-MM-DD") : "",
      is_due_date,
    };
    dispatch(setDateInput(payloadData));
  };

  return (
    <>
      <Grid container spacing={1}>
        <Grid size={{ xs:12, sm: 4, lg:2, }} p={1}>
          <LocalizationProvider dateAdapter={AdapterMoment}>
            <DatePicker
              label="วันส่งตัวอย่าง"
              slotProps={{
                textField: { fullWidth: true },
                actionBar: {
                  actions: ["clear"],
                },
              }}
              format="DD/MM/YYYY"
              name="exam_date"
              value={inputList.exam_date ? moment(inputList.exam_date) : null}
              onChange={(val_selected) => handleDateChange(val_selected, false)}
              sx={{
                "& .Mui-readOnly": {
                  backgroundColor: "unset",
                },
              }}
            />
          </LocalizationProvider>
        </Grid>
      </Grid>
      {content}
    </>
  );
}

export default ExampleSect;
