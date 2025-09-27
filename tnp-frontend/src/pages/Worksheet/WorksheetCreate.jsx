import { DatePicker } from "@mui/x-date-pickers";
import { AdapterMoment } from "@mui/x-date-pickers/AdapterMoment";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";

import CustomerSect from "./WorksheetCreate/CustomerSect";
import ExampleSect from "./WorksheetCreate/ExampleSect";
import FabricSect from "./WorksheetCreate/FabricSect";
import OrderSect from "./WorksheetCreate/OrderSect";
import PatternSect from "./WorksheetCreate/PatternSect";
import PoloSect from "./WorksheetCreate/PoloSect";
import ScreenSect from "./WorksheetCreate/ScreenSect";
import TitleBar from "../../components/TitleBar";
import {
  useAddWorksheetMutation,
  useUpdateWorksheetMutation,
  useGetAllWorksheetQuery,
  useGetWorksheetQuery,
} from "../../features/Worksheet/worksheetApi";
import {
  setInputList,
  setDateInput,
  resetInputList,
  setItem,
} from "../../features/Worksheet/worksheetSlice";
import { validateValue } from "../../features/Worksheet/worksheetUtils";
import {
  useState,
  useEffect,
  useDispatch,
  useSelector,
  useNavigate,
  useParams,
  AppBar,
  Container,
  Toolbar,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  Grid,
  Divider,
  CircularProgress,
  Box,
  styled,
  moment,
  open_dialog_error,
  open_dialog_ok_timer,
  open_dialog_loading,
} from "../../utils/import_lib";

const VerticalDivider = styled(Divider)(({ theme }) => ({
  marginInline: 0,
  marginBlock: 24,
  borderBottomWidth: 2,
  borderColor: theme.vars.palette.grey[500],
}));

function WorksheetCreate() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id, typeShirt } = useParams();
  const inputList = useSelector((state) => state.worksheet.inputList);
  const sumQuantity = useSelector((state) => state.worksheet.sumQuantity);
  const [orderLoading, setOrderLoading] = useState(true);
  const [titleTypeShirt, setTitleTypeShirt] = useState(typeShirt);
  const user = JSON.parse(localStorage.getItem("userData"));

  const [saveLoading, setSaveLoading] = useState(false);
  const {
    data: worksheetItem,
    error,
    isLoading,
    isSuccess,
  } = useGetWorksheetQuery(id, { skip: !id });
  const [addWorksheet] = useAddWorksheetMutation();
  const [updateWorksheet] = useUpdateWorksheetMutation();

  const handleInputChange = (e, index = null) => {
    const { name, value } = e.target;
    dispatch(setInputList({ name: name, value: value, index: index }));
  };

  const handleDateChange = (val_date, is_due_date) => {
    const payloadData = {
      value: val_date ? val_date.format("YYYY-MM-DD") : "",
      is_due_date,
    };
    dispatch(setDateInput(payloadData));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // console.log('handleSubmit input : ', inputList)
    // return;

    // check some value before create or update data.
    const hasError = validateValue({ inputList, sumQuantity });

    if (hasError !== "") {
      open_dialog_error(hasError);
    } else {
      open_dialog_loading();

      try {
        let res;

        if (id) {
          res = await updateWorksheet(inputList);
        } else {
          res = await addWorksheet(inputList);
        }

        if (res.data.status === "ok") {
          open_dialog_ok_timer("บันทึกข้อมูลสำเร็จ").then((result) => {
            dispatch(resetInputList());
            navigate("/worksheet"); // default-path : /worksheet
          });
        } else {
          setSaveLoading(false);
          open_dialog_error(res.data.message);
          console.error(res.data);
        }
      } catch (error) {
        setSaveLoading(false);
        open_dialog_error(error.message, error);
        console.error(error);
      }
    }
  };

  const handleCancel = () => {
    dispatch(resetInputList());
    navigate("/worksheet"); // default-path : /worksheet
  };

  useEffect(() => {
    if (id && worksheetItem) {
      dispatch(setItem(worksheetItem.data));
      setTitleTypeShirt(worksheetItem.data.type_shirt);
      setOrderLoading(false);
    } else if (error) {
      console.error("Error fetching worksheet item:", error);
    }
  }, [id, isSuccess]);

  useEffect(() => {
    if (!id) {
      dispatch(setInputList({ name: "type_shirt", value: typeShirt, index: null }));

      [
        { name: "user_id", value: user.user_id },
        { name: "nws_created_by", value: user.user_uuid },
        { name: "nws_updated_by", value: user.user_uuid },
      ].forEach(({ name, value }) => {
        dispatch(setInputList({ name, value, index: null }));
      });

      setTitleTypeShirt(typeShirt);
      setOrderLoading(false);
    }
  }, []);

  return (
    <div className="worksheet-create" style={{ backgroundColor: "#fafaf9" }}>
      <TitleBar title={`${id ? "Edit" : "Create"} Worksheet`} />
      <AppBar position="static" sx={{ bgcolor: "#d9d9d9" }} elevation={0}>
        <Container maxWidth="xxl">
          <Toolbar
            disableGutters
            variant="dense"
            sx={{ display: "flex", justifyContent: "flex-end" }}
          >
            <Typography variant="h6" className="title-shirt">
              {titleTypeShirt === "polo-shirt" ? "polo shirt" : "t-shirt"}
            </Typography>
          </Toolbar>
        </Container>
      </AppBar>

      {isLoading ? (
        <Container maxWidth="xxl">
          <Box textAlign="center" marginTop={5}>
            <CircularProgress color="error" size={60} />
          </Box>
        </Container>
      ) : (
        <Container maxWidth="xxl" sx={{ marginBottom: "1.5rem" }}>
          <form onSubmit={handleSubmit}>
            <Card
              sx={(theme) => ({
                minWidth: 275,
                marginTop: 3,
                borderRadius: `calc(${theme.vars.shape.borderRadius} * 2)`, // Access `shape` directly from `theme`
              })}
            >
              <CardContent>
                <Typography variant="h5" color="error" ml={1}>
                  รายละเอียดงาน
                </Typography>
                <Grid container spacing={1}>
                  <Grid size={{ xs: 12, lg: 6 }} p={1}>
                    <TextField
                      required
                      variant="outlined"
                      label="ชื่องาน"
                      name="work_name"
                      value={inputList.work_name}
                      onChange={handleInputChange}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, lg: 3 }} p={1}>
                    <TextField
                      required
                      type="text"
                      variant="outlined"
                      label="จำนวนที่สั่งผลิต"
                      placeholder="0"
                      name="total_quantity"
                      value={inputList.total_quantity}
                      onChange={handleInputChange}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, lg: 3 }} p={1}>
                    <LocalizationProvider dateAdapter={AdapterMoment}>
                      <DatePicker
                        label="วันส่งงาน"
                        slotProps={{ textField: { required: true } }}
                        format="DD/MM/YYYY"
                        name="due_date"
                        value={inputList.due_date ? moment(inputList.due_date) : null}
                        onChange={(val_date) => handleDateChange(val_date, true)}
                        sx={{
                          "& .Mui-readOnly": {
                            backgroundColor: "unset",
                          },
                        }}
                      />
                    </LocalizationProvider>
                  </Grid>
                </Grid>
                <VerticalDivider variant="middle" />

                <CustomerSect handleInputChange={handleInputChange} inputList={inputList} />
                <VerticalDivider variant="middle" />

                <Typography variant="h5" color="error" ml={1}>
                  รายละเอียดผ้า
                </Typography>
                <FabricSect handleInputChange={handleInputChange} />
                <VerticalDivider variant="middle" />

                <Typography variant="h5" color="error" ml={1}>
                  แพทเทิร์นเสื้อ
                </Typography>
                <PatternSect />
                <VerticalDivider variant="middle" />

                <Typography variant="h5" color="error" ml={1}>
                  การสกรีน
                </Typography>
                <ScreenSect handleInputChange={handleInputChange} />
                <VerticalDivider variant="middle" />

                {titleTypeShirt == "polo-shirt" && (
                  <>
                    <Typography variant="h5" color="error" ml={1}>
                      การตัดเย็บ
                    </Typography>
                    <PoloSect handleInputChange={handleInputChange} />
                    <VerticalDivider variant="middle" />
                  </>
                )}

                <Typography variant="h5" color="error" ml={1}>
                  จำนวนเสื้อตัวอย่าง
                </Typography>
                <ExampleSect handleInputChange={handleInputChange} />
                <VerticalDivider variant="middle" />

                <Grid container spacing={1}>
                  <Grid size={{ xs: 12 }} p={1}>
                    <TextField
                      fullWidth
                      multiline
                      type="text"
                      maxRows={4}
                      variant="outlined"
                      label="หมายเหตุ"
                      name="worksheet_note"
                      value={inputList.worksheet_note}
                      onChange={handleInputChange}
                    />
                  </Grid>
                </Grid>
                <VerticalDivider variant="middle" />

                <Typography variant="h5" color="error" ml={1}>
                  ใบสั่งงาน
                </Typography>
                <OrderSect handleInputChange={handleInputChange} orderLoading={orderLoading} />
                <VerticalDivider variant="middle" />

                <Grid container spacing={1} justifyContent="center">
                  <Grid size={{ xs: 12, sm: 6, md: 4 }} p={1} mt={{ xs: 0, md: 1 }}>
                    <Button
                      fullWidth
                      type="submit"
                      variant="contained"
                      color="error"
                      disabled={saveLoading}
                    >
                      บันทึก
                    </Button>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 4 }} p={1} mt={{ xs: 0, md: 1 }}>
                    <Button fullWidth variant="outlined" color="error" onClick={handleCancel}>
                      ยกเลิก
                    </Button>
                  </Grid>
                </Grid>
                <Divider variant="middle" sx={{ my: 2 }} />
              </CardContent>
            </Card>
          </form>
        </Container>
      )}
    </div>
  );
}

export default WorksheetCreate;
