import { useGetUserByRoleQuery } from "../../../features/globalApi";
import { useUpdateWorksheetMutation } from "../../../features/Worksheet/worksheetApi";
import { setInputList } from "../../../features/Worksheet/worksheetSlice";
import {
  useEffect,
  useSelector,
  useState,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  useDispatch,
  CircularProgress,
  Swal,
  open_dialog_error,
  open_dialog_ok_timer,
  open_dialog_loading,
} from "../../../utils/import_lib";

function AssignmentDialog({ open, saveLoading, setSaveLoading, handleClose }) {
  const dispatch = useDispatch();
  const [creatorList, setCreatorList] = useState([]);
  const [managerList, setManagerList] = useState([]);
  const [productionList, setProductionList] = useState([]);
  const user = JSON.parse(localStorage.getItem("userData"));
  const inputList = useSelector((state) => state.worksheet.inputList);
  const { data, error, isLoading } = useGetUserByRoleQuery(null, { skip: !open });
  const [updateWorksheet] = useUpdateWorksheetMutation();

  const handleChange = (e) => {
    const { name, value } = e.target;
    dispatch(setInputList({ name: name, value: value, index: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaveLoading(true);

    try {
      const res = await updateWorksheet(inputList);

      if (res.data.status === "ok") {
        open_dialog_ok_timer("Worksheet Saved success", "");
        handleClose();
        setSaveLoading(false);
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
  };

  useEffect(() => {
    if (user.role === "graphic") {
      dispatch(
        setInputList({
          name: "creator_name",
          value: user.user_uuid,
          index: null,
        })
      );
    }
  }, [open]);

  useEffect(() => {
    if (data) {
      setCreatorList(data.graphic_role);
      setManagerList(data.manager_role);
      setProductionList(data.production_role);
      Swal.close();
    } else if (isLoading) {
      open_dialog_loading();
    } else if (error) {
      open_dialog_error("Get User by role Error", error.data?.message);
      console.error("Get User by role Error: ", error);
    }
  }, [data, isLoading]);

  return (
    <div>
      <Dialog open={open} fullWidth disableEscapeKeyDown>
        <form onSubmit={handleSubmit}>
          <DialogTitle>
            <b>Work Name :</b> {inputList.work_name}
          </DialogTitle>
          <DialogContent>
            <Box>
              <FormControl fullWidth sx={{ m: 1 }}>
                <InputLabel id="creator-name-select-label">Creator Name</InputLabel>
                <Select
                  labelId="creator-name-select-label"
                  id="creator-name-select"
                  value={inputList.creator_name}
                  label="Creator Name"
                  name="creator_name"
                  onChange={handleChange}
                  readOnly={user.role === "admin" ? false : true}
                  sx={{ textTransform: "capitalize" }}
                >
                  <MenuItem disabled value="">
                    Creator Name
                  </MenuItem>
                  {creatorList &&
                    creatorList.map((item, index) => (
                      <MenuItem
                        key={item.user_uuid + index}
                        value={item.user_uuid}
                        sx={{ textTransform: "capitalize" }}
                      >
                        {item.user_nickname}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
              <FormControl fullWidth sx={{ m: 1 }}>
                <InputLabel id="manager-name-select-label">Manager Name</InputLabel>
                <Select
                  labelId="manager-name-select-label"
                  id="manager-name-select"
                  value={inputList.manager_name}
                  label="Manager Name"
                  name="manager_name"
                  onChange={handleChange}
                  sx={{ textTransform: "capitalize" }}
                >
                  <MenuItem disabled value="">
                    Manager Name
                  </MenuItem>
                  {managerList &&
                    managerList.map((item, index) => (
                      <MenuItem
                        key={item.user_uuid + index}
                        value={item.user_uuid}
                        sx={{ textTransform: "capitalize" }}
                      >
                        {item.user_nickname}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
              <FormControl fullWidth sx={{ m: 1 }}>
                <InputLabel id="production-name-select-label">Production Name</InputLabel>
                <Select
                  labelId="production-name-select-label"
                  id="production-name-select"
                  value={inputList.production_name}
                  label="Production Name"
                  name="production_name"
                  onChange={handleChange}
                  sx={{ textTransform: "capitalize" }}
                >
                  <MenuItem disabled value="">
                    Production Name
                  </MenuItem>
                  {productionList &&
                    productionList.map((item, index) => (
                      <MenuItem
                        key={item.user_uuid + index}
                        value={item.user_uuid}
                        sx={{ textTransform: "capitalize" }}
                      >
                        {item.user_nickname}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button type="submit" disabled={saveLoading}>
              Save
              {saveLoading && <CircularProgress size={18} sx={{ marginLeft: 1 }} />}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </div>
  );
}

export default AssignmentDialog;
