import { MdAdd, MdDelete } from "react-icons/md";

import { useGetShirtPatternQuery } from "../../../features/Worksheet/worksheetApi";
import {
  setInputPattern,
  setErrorMsg,
  addExtraSize,
  deleteRowPatternSize,
  setExtraSizes,
} from "../../../features/Worksheet/worksheetSlice";
import {
  useEffect,
  useDispatch,
  useSelector,
  useState,
  TextField,
  FormGroup,
  Grid,
  Typography,
  Divider,
  Autocomplete,
  FormControlLabel,
  Button,
  Select,
  MenuItem,
  FormControl,
  FormLabel,
  RadioGroup,
  Radio,
  InputLabel,
} from "../../../utils/import_lib";

function PatternSect() {
  const dispatch = useDispatch();
  const { data } = useGetShirtPatternQuery();
  const inputList = useSelector((state) => state.worksheet.inputList);
  const extraSizes = useSelector((state) => state.worksheet.extraSizes);
  const sumQuantity = useSelector((state) => state.worksheet.sumQuantity);
  const sumQuantityMen = useSelector((state) => state.worksheet.sumQuantityMen);
  const sumQuantityWomen = useSelector((state) => state.worksheet.sumQuantityWomen);
  const [extrSizeSelected, setExtrSizeSelected] = useState("");
  const [itemList, setItemList] = useState([]);
  const [itemLoading, setItemLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  let inputFieldBox;

  const renderedInputField = (items, pattern_type) => {
    return items.map((item, index) => (
      <div key={index}>
        <Grid container spacing={1} my={1} key={index} alignItems="center">
          <Grid size={{ xs: 12, md: 1, lg: 1 }} p={1} py={{ xs: 0, lg: 1 }} textAlign="center">
            <Typography
              variant="h6"
              sx={(theme) => ({
                backgroundColor: {
                  xs: theme.vars.palette.grey[50],
                  md: "unset",
                },
                py: 0.5,
              })}
            >
              {item.size_name.toUpperCase()}
            </Typography>
          </Grid>
          <Grid size={{ xs: 6, sm: 4, md: 3 }} p={1}>
            <TextField
              required
              fullWidth
              type="number"
              variant="outlined"
              label="รอบอก"
              name={`${pattern_type}_chest_${item.size_name.toLowerCase()}`}
              value={item.chest}
              onChange={(e) =>
                dispatch(
                  setInputPattern({
                    name: e.target.name,
                    value: e.target.value,
                    index,
                  })
                )
              }
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 4, md: 3 }} p={1}>
            <TextField
              required
              fullWidth
              type="number"
              variant="outlined"
              label="ความยาว"
              name={`${pattern_type}_long_${item.size_name.toLowerCase()}`}
              value={item.long}
              onChange={(e) =>
                dispatch(
                  setInputPattern({
                    name: e.target.name,
                    value: e.target.value,
                    index,
                  })
                )
              }
            />
          </Grid>

          <Divider
            flexItem
            orientation="vertical"
            sx={{
              mx: { sm: 0, md: 2, lg: 4 },
              display: { xs: "none", sm: "block" },
            }}
          />

          <Grid size={{ xs: 12, sm: "grow", md: 3 }} p={1}>
            <TextField
              required
              fullWidth
              type="text"
              variant="outlined"
              label="จำนวน"
              name={`${pattern_type}_quantity_${item.size_name.toLowerCase()}`}
              value={item.quantity}
              onChange={(e) =>
                dispatch(
                  setInputPattern({
                    name: e.target.name,
                    value: e.target.value,
                    index,
                  })
                )
              }
            />
          </Grid>
          <Grid size={{ xs: 12, md: 1 }} p={1} textAlign="center">
            {items.length > 1 && (
              <Button
                size="large"
                variant="contained"
                color="error"
                onClick={() => handleRemoveSize(index, pattern_type, item.size_name)}
                sx={{
                  minWidth: { xs: "100%", md: "60%" },
                }}
              >
                <MdDelete style={{ fontSize: "1.45rem" }} />
              </Button>
            )}
          </Grid>
        </Grid>

        <Divider
          variant="middle"
          sx={(theme) => ({
            mx: 1,
            my: 2,
            borderBottomWidth: 2,
            borderColor: theme.vars.palette.grey[500],
            display: { xs: "block", md: "none" },
          })}
        />
      </div>
    ));
  };

  const renderedInputSummary = (pattern_type) => {
    const title = pattern_type == "men" ? "จำนวนรวมแพทเทิร์นชาย" : "จำนวนรวมแพทเทิร์นหญิง";

    return (
      <Grid container spacing={1} alignItems="center">
        <Grid
          size={{ xs: 12, md: 7 }}
          sx={{
            px: 1,
          }}
        >
          <Typography
            variant="h6"
            sx={(theme) => ({
              backgroundColor: {
                xs: theme.vars.palette.grey[50],
                md: "unset",
              },
              color: theme.palette.grey[700],
              borderRadius: theme.vars.shape.borderRadius,
              py: 0.5,
              display: { md: "none" },
            })}
            align="center"
          >
            {title}
          </Typography>
        </Grid>

        <Divider
          orientation="vertical"
          flexItem
          sx={{ mx: { md: 2, lg: 4 }, display: { xs: "none", md: "block" } }}
        />

        <Grid size={{ xs: 12, md: 3 }} p={1}>
          <TextField
            fullWidth
            variant="outlined"
            label="รวม"
            value={sumQuantity[pattern_type]}
            disabled
          />
        </Grid>
      </Grid>
    );
  };

  const handleAddSize = () => {
    dispatch(addExtraSize(extrSizeSelected));

    // remove array after add extra size.
    const updatedExtraSizes = extraSizes.filter((item) => item !== extrSizeSelected);
    dispatch(setExtraSizes(updatedExtraSizes));

    setExtrSizeSelected("");
  };

  const handleRemoveSize = (index, pattern_type, size_name) => {
    dispatch(deleteRowPatternSize({ index, pattern_type, size_name }));
  };

  const handleChangePattern = (e, newVal, isInput) => {
    if (isInput) {
      dispatch(setInputPattern({ name: "pattern_name", value: newVal }));
    } else {
      const pattern_name_r = newVal ? newVal.pattern_name : "";
      const pattern_type_r = newVal ? newVal.pattern_type : inputList.pattern_type;
      const pattern_sizes_r = newVal ? newVal.pattern_sizes : inputList.pattern_sizes;

      dispatch(setInputPattern({ name: "pattern_name", value: pattern_name_r }));
      dispatch(setInputPattern({ name: "pattern_type", value: pattern_type_r }));
      dispatch(setInputPattern({ name: "pattern_sizes", value: pattern_sizes_r }));
    }
  };

  useEffect(() => {
    if (data) {
      setItemList(data.data);

      if (data.data.length === 0) {
        setItemLoading(false);
      }
    }
  }, [data]);

  useEffect(() => {
    if (Number(inputList.total_quantity) !== Number(sumQuantity.total)) {
      setHasError(true);
    } else {
      setHasError(false);
    }
  }, [inputList.total_quantity, sumQuantity.total]);

  if (Number(inputList.pattern_type) === 2) {
    const menSizes = renderedInputField(inputList.pattern_sizes.men, "men");
    const womenSizes = renderedInputField(inputList.pattern_sizes.women, "women");

    inputFieldBox = (
      <>
        <Typography variant="h6" color="grey.500" ml={1}>
          Men
        </Typography>
        {menSizes}
        {renderedInputSummary("men")}
        <Divider
          variant="middle"
          sx={(theme) => ({
            mx: 1,
            my: 2,
            borderBottomWidth: 2,
            borderColor: theme.vars.palette.grey[500],
          })}
        />

        <Typography variant="h6" color="grey.500" ml={1}>
          Women
        </Typography>
        {womenSizes}
        {renderedInputSummary("women")}
        <Divider
          variant="middle"
          sx={(theme) => ({
            mx: 1,
            my: 2,
            borderBottomWidth: 2,
            borderColor: theme.vars.palette.grey[500],
            display: { md: "none" },
          })}
        />
      </>
    );
  } else {
    inputFieldBox = renderedInputField(inputList.pattern_sizes, "unisex");
  }

  return (
    <>
      <Grid container alignItems="center">
        <Grid p={1} size={{ xs: "auto" }}>
          <Typography variant="h6" color="grey.800" my={0}>
            ประเภท
          </Typography>
        </Grid>
        <Grid p={1} size={{ xs: "auto" }}>
          <FormGroup row>
            <RadioGroup
              row
              aria-labelledby="demo-row-radio-buttons-group-label"
              name="pattern_type"
              value={inputList.pattern_type}
              onChange={(e) =>
                dispatch(
                  setInputPattern({
                    name: e.target.name,
                    value: e.target.value,
                  })
                )
              }
            >
              <FormControlLabel value={1} control={<Radio color="error" />} label="Unisex" />
              <FormControlLabel value={2} control={<Radio color="error" />} label="Men/Women" />
            </RadioGroup>
          </FormGroup>
        </Grid>
        <Grid size={{ xs: 12, md: "grow" }} p={1} pt={{ xs: 0, sm: 1 }}>
          <Autocomplete
            freeSolo
            loading={itemLoading}
            options={itemList.map((option) => option)}
            getOptionLabel={(option) => option.pattern_name}
            onChange={(e, newVal) => handleChangePattern(e, newVal, false)}
            value={
              itemList.find((option) => option.pattern_name === inputList.pattern_name) || null
            }
            isOptionEqualToValue={(option, value) => option.pattern_name === value.pattern_name}
            renderInput={(params) => (
              <TextField {...params} required name="pattern_name" label="ชื่อแพทเทิร์น" />
            )}
            inputValue={inputList.pattern_name}
            onInputChange={(e, inputNewVal) => handleChangePattern(e, inputNewVal, true)}
          />
        </Grid>
      </Grid>
      <Divider
        variant="middle"
        sx={(theme) => ({
          mx: 1,
          my: 2,
          borderBottomWidth: 2,
          borderColor: theme.vars.palette.grey[500],
        })}
      />

      {inputFieldBox}
      <Divider
        variant="middle"
        sx={(theme) => ({
          mx: 1,
          my: 3,
          borderBottomWidth: 2,
          borderColor: theme.vars.palette.grey[500],
          display: { xs: "none", md: "block" },
        })}
      />

      <Grid container spacing={1} alignItems="center">
        <Grid
          size={{ xs: 12 }}
          p={1}
          sx={{
            paddingBottom: { xs: 0 },
            display: { xs: "block", md: "none" },
          }}
        >
          <TextField
            fullWidth
            variant="outlined"
            label="รวมทั้งหมด"
            value={sumQuantity.total}
            color={hasError ? "error" : "primary"}
            focused={hasError}
            slotProps={{
              input: {
                readOnly: true,
              },
            }}
          />
          <Divider
            variant="middle"
            sx={(theme) => ({
              mx: 0,
              mt: 3,
              borderBottomWidth: 2,
              borderColor: theme.vars.palette.grey[500],
              display: { xs: "block", md: "none" },
            })}
          />
        </Grid>

        <Grid size={{ xs: "auto", sm: 3, md: 2 }} p={1} textAlign="center">
          <Typography variant="h6" color="grey.800" my={2}>
            ไซซ์เพิ่มเติม
          </Typography>
        </Grid>
        <Grid size={{ xs: 5, sm: 7, md: 3 }} p={1}>
          <FormControl fullWidth size="small">
            <InputLabel id="demo-simple-select-helper-label">ไซซ์เพิ่มเติม</InputLabel>
            <Select
              labelId="demo-simple-select-helper-label"
              value={extrSizeSelected}
              onChange={(e) => setExtrSizeSelected(e.target.value)}
              fullWidth
              variant="outlined"
              name="extra_size"
              size="small"
              label="ไซซ์เพิ่มเติม"
            >
              <MenuItem value="" disabled>
                ไซซ์เพิ่มเติม
              </MenuItem>
              {/* Add predefined sizes as options */}
              {extraSizes.map((size, index) => (
                <MenuItem key={index} value={size}>
                  {size.toUpperCase()}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid size={{ xs: "auto", sm: 2, md: 2 }} p={1}>
          <Button
            variant="contained"
            color="grey"
            startIcon={<MdAdd />}
            onClick={handleAddSize}
            disabled={extrSizeSelected === ""}
          >
            เพิ่ม
          </Button>
        </Grid>
        <Divider
          flexItem
          orientation="vertical"
          sx={{
            mx: { sm: 0, md: 2, lg: 4 },
            display: { xs: "none", md: "block" },
          }}
        />

        <Grid
          size={{ xs: 3, sm: "grow", md: 3 }}
          p={1}
          sx={{ display: { xs: "none", md: "block" } }}
        >
          <TextField
            fullWidth
            variant="outlined"
            label="รวมทั้งหมด"
            value={sumQuantity.total}
            slotProps={{
              input: {
                readOnly: true,
              },
            }}
            color={hasError ? "error" : "primary"}
            focused={hasError}
            sx={(theme) => ({
              "& input": {
                fontFamily: "Kanit",
                WebkitTextFillColor: (theme.vars || theme).palette.text.secondary,
              },
            })}
          />
        </Grid>
      </Grid>
    </>
  );
}

export default PatternSect;
