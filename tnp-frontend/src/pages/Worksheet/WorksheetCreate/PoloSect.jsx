import {
  useState,
  useDispatch,
  useSelector,
  Collapse,
  Typography,
  Grid,
  IconButton,
  Select,
  MenuItem,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Checkbox,
  InputAdornment,
  OutlinedInput,
  styled,
  Divider,
} from "../../../utils/import_lib";
import { MdAdd, MdDelete, MdExpandLess, MdExpandMore } from "react-icons/md";
import {
  collarList,
  collarTypeList,
  placketList,
  buttonList,
  sleeveList,
  pocketList,
  positionList,
} from "../../../data/poloList";
import {
  addRowPoloEmbroider,
  deleteRowPoloEmbroider,
  setPoloChecked,
} from "../../../features/Worksheet/worksheetSlice";

const VerticalDivider = styled(Divider)(({ theme }) => ({
  marginInline: 0,
  marginTop: 10,
  borderBottomWidth: 2,
  borderColor: theme.vars.palette.grey[500],
}));

function PoloSect({ handleInputChange }) {
  const dispatch = useDispatch();
  const inputList = useSelector((state) => state.worksheet.inputList);
  const poloEmbroider = inputList.polo_embroider;
  const [expandedCollar, setExpandedCollar] = useState(false);
  const [expandedSleeve, setExpandedSleeve] = useState(false);
  const [expandedOther, setExpandedOther] = useState(false);

  const addRow = () => {
    if (poloEmbroider.length < 10) {
      dispatch(addRowPoloEmbroider());
    }
  };

  const deleteRow = (index) => {
    dispatch(deleteRowPoloEmbroider(index));
  };

  const handleChecked = (e) => {
    const { name, checked } = e.target;
    dispatch(setPoloChecked({ name, checked }));
  };

  return (
    <>
      <Grid container spacing={1}>
        <Grid size={{ xs: 12, lg: 2 }} p={1}>
          <Typography variant="h6" color="grey.600">
            ส่วนคอปก
            <IconButton onClick={() => setExpandedCollar(!expandedCollar)}>
              {expandedCollar ? <MdExpandLess /> : <MdExpandMore />}
            </IconButton>
          </Typography>
        </Grid>
      </Grid>

      <Collapse in={!expandedCollar} timeout="auto" unmountOnExit>
        <Grid container spacing={1} alignItems="center">
          <Grid size={{ xs: 6, md: 3 }} p={1}>
            <FormControl fullWidth>
              <InputLabel id="demo-simple-select-label">รูปแบบปก</InputLabel>
              <Select
                fullWidth
                variant="outlined"
                size="small"
                label="รูปแบบปก"
                name="collar"
                value={inputList.collar}
                onChange={(e) => handleInputChange(e)}
              >
                {collarList.map((item, index) => (
                  <MenuItem key={index} value={item.value}>
                    {item.title}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 6, md: 3 }} p={1}>
            <FormControl fullWidth>
              <InputLabel id="demo-simple-select-label">ชนิดคอปก</InputLabel>
              <Select
                fullWidth
                variant="outlined"
                size="small"
                label="ชนิดคอปก"
                name="collar_type"
                value={inputList.collar_type}
                onChange={(e) => handleInputChange(e)}
              >
                {collarTypeList.map((item, index) => (
                  <MenuItem key={index} value={item.value}>
                    {item.title}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {inputList.collar_type === 0 && (
            <Grid size={{ xs: 12, md: 6 }} p={1}>
              <TextField
                fullWidth
                type="text"
                variant="outlined"
                label="ชนิดปกคออื่นๆ"
                name="other_collar_type"
                value={inputList.other_collar_type}
                onChange={(e) => handleInputChange(e)}
              />
            </Grid>
          )}

          <Grid
            size={{
              xs: 12,
              md: inputList.collar_type == 0 ? 12 : 6,
            }}
            p={1}
          >
            <TextField
              fullWidth
              multiline
              type="text"
              variant="outlined"
              maxRows={10}
              label="รายละเอียดชนิดปกคอ"
              name="collar_type_detail"
              value={inputList.collar_type_detail}
              onChange={(e) => handleInputChange(e)}
            />
          </Grid>

          <Grid
            size={{
              xs: 12,
              sm: inputList.placket == 0 ? 4 : 12,
              md: 3,
            }}
            p={1}
          >
            <FormControl fullWidth>
              <InputLabel>รูปแบบสาป</InputLabel>
              <Select
                fullWidth
                variant="outlined"
                size="small"
                label="รูปแบบสาป"
                name="placket"
                value={inputList.placket}
                onChange={(e) => handleInputChange(e)}
              >
                {placketList.map((item, index) => (
                  <MenuItem key={index} value={item.value}>
                    {item.title}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          {inputList.placket === 0 && (
            <Grid
              size={{
                xs: 12,
                sm: inputList.placket == 0 ? 8 : 12,
                md: inputList.placket == 0 ? 9 : 12,
              }}
              p={1}
            >
              <TextField
                fullWidth
                type="text"
                variant="outlined"
                label="ชื่อรูปแบบสาป"
                name="other_placket"
                value={inputList.other_placket}
                onChange={(e) => handleInputChange(e)}
              />
            </Grid>
          )}

          <Grid
            size={{
              xs: 12,
              md: inputList.placket == 0 ? 6 : 4.5,
            }}
            p={1}
          >
            <TextField
              fullWidth
              multiline
              type="text"
              maxRows={4}
              label="สาปนอก"
              placeholder="รายละเอียดสาปนอก"
              name="outer_placket_detail"
              value={inputList.outer_placket_detail}
              onChange={(e) => handleInputChange(e)}
              disabled={!inputList.outer_placket}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="start">
                      <Checkbox
                        color="error"
                        id="outerPlacketChecked"
                        name="outer_placket"
                        checked={inputList.outer_placket}
                        onChange={handleChecked}
                      />
                    </InputAdornment>
                  ),
                },
              }}
              sx={{
                "& .MuiFormLabel-root": {
                  pt: 0.5,
                },
              }}
            />
          </Grid>

          <Grid
            size={{
              xs: 12,
              md: inputList.placket == 0 ? 6 : 4.5,
            }}
            p={1}
          >
            <TextField
              fullWidth
              multiline
              type="text"
              maxRows={4}
              label="สาปใน"
              placeholder="รายละเอียดสาปใน"
              name="inner_placket_detail"
              value={inputList.inner_placket_detail}
              onChange={(e) => handleInputChange(e)}
              disabled={!inputList.inner_placket}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="start">
                      <Checkbox
                        color="error"
                        id="innerPlacketChecked"
                        name="inner_placket"
                        checked={inputList.inner_placket}
                        onChange={handleChecked}
                      />
                    </InputAdornment>
                  ),
                },
              }}
              sx={{
                "& .MuiFormLabel-root": {
                  pt: 0.5,
                },
              }}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 4, md: 3 }} p={1}>
            <FormControl fullWidth>
              <InputLabel>กระดุม</InputLabel>
              <Select
                fullWidth
                variant="outlined"
                size="small"
                label="กระดุม"
                name="button"
                value={inputList.button}
                onChange={(e) => handleInputChange(e)}
              >
                {buttonList.map((item, index) => (
                  <MenuItem key={index} value={item.value}>
                    {item.title}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          {inputList.button === 0 && (
            <Grid size={{ xs: 12, sm: 8, md: 4.5 }} p={1}>
              <TextField
                fullWidth
                type="text"
                variant="outlined"
                label="รายละเอียดกระดุม"
                name="other_button"
                value={inputList.other_button}
                onChange={(e) => handleInputChange(e)}
              />
            </Grid>
          )}

          <Grid
            size={{
              xs: 12,
              sm: inputList.button == 0 ? 12 : 8,
              md: inputList.button == 0 ? 4.5 : 9,
            }}
            p={1}
          >
            <TextField
              fullWidth
              type="text"
              variant="outlined"
              label="สีกระดุม"
              name="button_color"
              value={inputList.button_color}
              onChange={(e) => handleInputChange(e)}
            />
          </Grid>
        </Grid>
      </Collapse>

      <Grid container spacing={1}>
        <Grid size={{ xs: 12, lg: 2 }} p={1} mt={2}>
          <Typography variant="h6" color="grey.600">
            ส่วนแขน
            <IconButton onClick={() => setExpandedSleeve(!expandedSleeve)}>
              {expandedSleeve ? <MdExpandLess /> : <MdExpandMore />}
            </IconButton>
          </Typography>
        </Grid>
      </Grid>

      <Collapse in={!expandedSleeve} timeout="auto" unmountOnExit>
        <Grid container spacing={1} alignItems="center">
          <Grid size={{ xs: 12, md: 3 }} p={1}>
            <FormControl fullWidth>
              <InputLabel id="demo-simple-select-label">รูปแบบแขน</InputLabel>
              <Select
                fullWidth
                variant="outlined"
                size="small"
                label="รูปแบบแขน"
                name="sleeve"
                value={inputList.sleeve}
                onChange={(e) => handleInputChange(e)}
              >
                {sleeveList.map((item, index) => (
                  <MenuItem key={index} value={item.value}>
                    {item.title}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, md: 9 }} p={1}>
            <TextField
              fullWidth
              multiline
              type="text"
              maxRows={4}
              label="รายละเอียดส่วนแขน"
              name="sleeve_detail"
              value={inputList.sleeve_detail}
              onChange={(e) => handleInputChange(e)}
            />
          </Grid>
        </Grid>
      </Collapse>

      <Grid container spacing={1}>
        <Grid size={{ xs: 12, lg: 2 }} p={1} mt={2}>
          <Typography variant="h6" color="grey.600">
            ส่วนอื่น
            <IconButton onClick={() => setExpandedOther(!expandedOther)}>
              {expandedOther ? <MdExpandLess /> : <MdExpandMore />}
            </IconButton>
          </Typography>
        </Grid>
      </Grid>

      <Collapse in={!expandedOther} timeout="auto" unmountOnExit>
        <Grid container spacing={1} alignItems="center">
          <Grid size={{ xs: 12, md: 3 }} p={1}>
            <FormControl fullWidth>
              <InputLabel id="demo-simple-select-label">รูปแบบกระเป๋า</InputLabel>
              <Select
                fullWidth
                variant="outlined"
                size="small"
                label="รูปแบบกระเป๋า"
                name="pocket"
                value={inputList.pocket}
                onChange={(e) => handleInputChange(e)}
              >
                {pocketList.map((item, index) => (
                  <MenuItem key={index} value={item.value}>
                    {item.title}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, md: 9 }} p={1}>
            <TextField
              type="text"
              fullWidth
              multiline
              maxRows={4}
              label="รายละเอียดกระเป๋า"
              name="pocket_detail"
              value={inputList.pocket_detail}
              onChange={(e) => handleInputChange(e)}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 4 }} p={1}>
            <TextField
              fullWidth
              multiline
              type="text"
              maxRows={4}
              label="ชายซ้อน / ชายเบิล"
              placeholder="รายละเอียดชายเสื้อ"
              name="bottom_hem_detail"
              value={inputList.bottom_hem_detail}
              onChange={(e) => handleInputChange(e)}
              disabled={!inputList.bottom_hem}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="start">
                      <Checkbox
                        color="error"
                        id="bottomHemChecked"
                        name="bottom_hem"
                        checked={inputList.bottom_hem}
                        onChange={handleChecked}
                      />
                    </InputAdornment>
                  ),
                },
              }}
              sx={{
                "& .MuiFormLabel-root": {
                  pt: 0.5,
                },
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }} p={1}>
            <TextField
              fullWidth
              multiline
              type="text"
              maxRows={4}
              label="วงพระจันทร์"
              placeholder="รายละเอียดวงพระจันทร์"
              name="back_seam_detail"
              value={inputList.back_seam_detail}
              onChange={(e) => handleInputChange(e)}
              disabled={!inputList.back_seam}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="start">
                      <Checkbox
                        color="error"
                        id="backSeamChecked"
                        name="back_seam"
                        checked={inputList.back_seam}
                        onChange={handleChecked}
                      />
                    </InputAdornment>
                  ),
                },
              }}
              sx={{
                "& .MuiFormLabel-root": {
                  pt: 0.5,
                },
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }} p={1}>
            <TextField
              fullWidth
              multiline
              type="text"
              maxRows={4}
              label="ผ่าข้างชายเสื้อ"
              placeholder="รายละเอียดการผ่าข้าง"
              name="side_vents_detail"
              value={inputList.side_vents_detail}
              onChange={(e) => handleInputChange(e)}
              disabled={!inputList.side_vents}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="start">
                      <Checkbox
                        color="error"
                        id="sideVentsChecked"
                        name="side_vents"
                        checked={inputList.side_vents}
                        onChange={handleChecked}
                      />
                    </InputAdornment>
                  ),
                },
              }}
              sx={{
                "& .MuiFormLabel-root": {
                  pt: 0.5,
                },
              }}
            />
          </Grid>

          <Grid size={{ xs: 12 }} p={1} sx={{ display: { xs: "block", md: "none" } }}>
            <VerticalDivider variant="middle" />
          </Grid>

          <Grid size={{ xs: 12 }} p={1} pb={0}>
            <Grid container spacing={1} alignItems="center">
              <Grid size={{ xs: "auto" }} p={1} mt={{ xs: 0, lg: 2 }}>
                <Typography variant="h6" color="grey.600">
                  ตำแหน่งลายปัก
                </Typography>
              </Grid>
              <Grid size={{ xs: "auto" }} p={1} ml={1} mt={{ xs: 0, lg: 2 }}>
                <Button
                  variant="contained"
                  color="grey"
                  startIcon={<MdAdd />}
                  onClick={addRow}
                  disabled={poloEmbroider.length === 10}
                >
                  เพิ่ม
                </Button>
              </Grid>
            </Grid>
          </Grid>

          <Grid size={{ xs: 12 }} p={1} pt={0}>
            {poloEmbroider.map((row, index) => (
              <div key={index}>
                <Grid container mt={2} alignItems="center">
                  <Grid
                    size={{ xs: 2, sm: 1 }}
                    p={1}
                    // mt={{ xs: 0 }}
                    textAlign="center"
                    alignItems="center"
                  >
                    <Typography variant="h6">{index + 1}</Typography>
                  </Grid>
                  <Grid size={{ xs: 10, sm: 4 }} p={1}>
                    <FormControl fullWidth>
                      <InputLabel>ตำแหน่ง</InputLabel>
                      <Select
                        fullWidth
                        variant="outlined"
                        size="small"
                        label="ตำแหน่ง"
                        name="embroider_position"
                        value={row.embroider_position}
                        onChange={(e) => handleInputChange(e, index)}
                      >
                        {positionList.map((item, index) => (
                          <MenuItem key={index} value={item.value}>
                            {item.title}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }} p={1}>
                    <TextField
                      fullWidth
                      multiline
                      type="text"
                      maxRows={4}
                      label="ขนาดของลายปัก"
                      name="embroider_size"
                      value={row.embroider_size}
                      onChange={(e) => handleInputChange(e, index)}
                    />
                  </Grid>

                  {poloEmbroider.length > 1 && (
                    <Grid size={{ xs: 12, sm: 1 }} p={1} textAlign="center">
                      <Button
                        variant="contained"
                        color="error"
                        onClick={() => deleteRow(index)}
                        sx={{
                          minWidth: { xs: "100%", md: "60%" },
                        }}
                      >
                        <MdDelete style={{ fontSize: "1.45rem" }} />
                      </Button>
                    </Grid>
                  )}
                </Grid>

                <Grid
                  size={{ xs: 12 }}
                  p={1}
                  sx={{
                    display: {
                      xs:
                        poloEmbroider.length > 1 && poloEmbroider.length !== index + 1
                          ? "block"
                          : "none",
                      sm: "none",
                    },
                  }}
                >
                  <VerticalDivider variant="middle" />
                </Grid>
              </div>
            ))}
          </Grid>
        </Grid>
      </Collapse>
    </>
  );
}

export default PoloSect;
