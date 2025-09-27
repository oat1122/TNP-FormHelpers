import {
  useState,
  useDispatch,
  useNavigate,
  Grid,
  IconButton,
  Swal,
  open_dialog_loading,
  dialog_delete_by_id,
  open_dialog_error,
  open_dialog_ok_timer,
  dialog_confirm_yes_no,
} from "../../../utils/import_lib";
import {
  setItem,
  setIsDuplicate,
  resetInputList,
} from "../../../features/Worksheet/worksheetSlice";
import {
  useDelWorksheetMutation,
  useUpdateWorksheetStatusMutation,
} from "../../../features/Worksheet/worksheetApi";
import { BsFileEarmarkPdf } from "react-icons/bs";
import { HiOutlineHandRaised } from "react-icons/hi2";
import { FaRegThumbsUp, FaRegThumbsDown } from "react-icons/fa";
import {
  MdTaskAlt,
  MdOutlinePeopleAlt,
  MdOutlineDriveFileRenameOutline,
  MdDeleteOutline,
  MdContentCopy,
} from "react-icons/md";
import AssignmentDialog from "./AssignmentDialog";

function ActionButton({ data, isSuccess, handleGenPdf }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("userData"));
  const [delWorksheet] = useDelWorksheetMutation();
  const [updateWorksheetStatus] = useUpdateWorksheetStatusMutation();
  const [openDialogAssign, setOpenDialogAssign] = useState(false);
  const [saveLoadingAssign, setSaveLoadingAssign] = useState(false);
  const isOwner = data.nws_created_by === user.user_uuid; // verify the worksheet owner
  let contentConfirmBtn;
  let contentActionBtn;

  const handleDialogAssignOpen = () => {
    dispatch(setItem(data));
    setOpenDialogAssign(true);
  };

  const handleDialogAssignClose = () => {
    setOpenDialogAssign(false);
    setSaveLoadingAssign(false);
    dispatch(resetInputList());
  };

  const handleDisableConfirmBtn = () => {
    if (user.role === "sale" && user.user_uuid === data.nws_created_by) {
      return false;
    } else if (user.role === "manager") {
      return false;
    } else {
      return true;
    }
  };

  const handleEditWorksheet = async () => {
    navigate(`/worksheet-update/${data.worksheet_id}`);
  };

  const handleDeleteWorksheet = async () => {
    const confirm = await dialog_delete_by_id(
      `Are you sure you want to delete the '${data.work_name}'?`
    );

    if (confirm) {
      open_dialog_loading();

      try {
        const response = await delWorksheet(data.worksheet_id);

        if (response.data.status === "ok" && isSuccess) {
          open_dialog_ok_timer(`Work name ${data.work_name} is deleted`);
        } else {
          open_dialog_error(response.data.message);
        }
      } catch (error) {
        console.error(error);
        open_dialog_error(error);
        Swal.close();
      }
    }
  };

  const handleConfirm = async (action) => {
    const confirm = await dialog_confirm_yes_no(
      `Do you want to ${action} the '${data.work_name}' worksheet ?`
    );

    const data_input = {
      worksheet_id: data.worksheet_id,
      user_id: user.user_id,
      action: action,
    };

    if (confirm) {
      open_dialog_loading();

      try {
        const response = await updateWorksheetStatus(data_input);

        if (response.data.status === "ok" && isSuccess) {
          if (action === "edit") {
            open_dialog_ok_timer(`Please wait for manager approve.`);
          } else if (action === "approve" || action === "disapprove") {
            open_dialog_ok_timer(`Work name ${data.work_name} is ${action}.`);
          } else {
            open_dialog_ok_timer(`Work name ${data.work_name} is confirmed.`);
          }
        }
      } catch (error) {
        console.error(error);
        open_dialog_error(error);
        Swal.close();
      }
    }
  };

  const handleDuplicate = async () => {
    const confirm = await dialog_confirm_yes_no(
      `Do you want to copy the '${data.work_name}' worksheet ?`
    );

    if (confirm) {
      dispatch(setItem(data));
      dispatch(setIsDuplicate(true));
      navigate(`/worksheet-create/${data.type_shirt}`);
    }
  };

  if ((isOwner && user.role === "sale") || user.role === "admin") {
    if (data.status.code === 1 || user.role === "admin") {
      contentActionBtn = (
        <>
          <IconButton
            aria-label="edit"
            onClick={handleEditWorksheet}
            data-testid="edit-sheet-button"
          >
            <MdOutlineDriveFileRenameOutline />
          </IconButton>
          <IconButton aria-label="delete" onClick={handleDeleteWorksheet}>
            <MdDeleteOutline />
          </IconButton>
          <IconButton aria-label="duplicate" onClick={handleDuplicate}>
            <MdContentCopy style={{ fontSize: "1.35rem" }} />
          </IconButton>
        </>
      );

      contentConfirmBtn = (
        <IconButton
          aria-label="confirm-worksheet"
          disabled={handleDisableConfirmBtn()}
          onClick={() => handleConfirm("confirm")}
        >
          <MdTaskAlt />
        </IconButton>
      );
    } else if (data.status.code === 2) {
      contentActionBtn = (
        <IconButton aria-label="edit" onClick={handleEditWorksheet} data-testid="edit-sheet-button">
          <MdOutlineDriveFileRenameOutline />
        </IconButton>
      );
    } else if (data.status.code === 3 || data.status.code === 5) {
      contentConfirmBtn = (
        <IconButton aria-label="access" onClick={() => handleConfirm("edit")}>
          <HiOutlineHandRaised />
        </IconButton>
      );
    } else if (data.status.code === 6) {
      contentActionBtn = (
        <IconButton aria-label="edit" onClick={handleEditWorksheet} data-testid="edit-sheet-button">
          <MdOutlineDriveFileRenameOutline />
        </IconButton>
      );

      contentConfirmBtn = (
        <IconButton
          aria-label="confirm-worksheet"
          disabled={handleDisableConfirmBtn()}
          onClick={() => handleConfirm("confirm")}
        >
          <MdTaskAlt />
        </IconButton>
      );
    }
  } else if (user.role === "manager") {
    if (data.status.code === 2 || data.status.code === 5) {
      contentConfirmBtn = (
        <IconButton
          aria-label="confirm-worksheet"
          disabled={handleDisableConfirmBtn()}
          onClick={() => handleConfirm("confirm")}
        >
          <MdTaskAlt />
        </IconButton>
      );
    } else if (data.status.code === 4) {
      contentConfirmBtn = (
        <>
          <IconButton aria-label="approve" onClick={() => handleConfirm("approve")}>
            <FaRegThumbsUp />
          </IconButton>
          <IconButton aria-label="disapprove" onClick={() => handleConfirm("disapprove")}>
            <FaRegThumbsDown />
          </IconButton>
        </>
      );
    }
  }

  return (
    <>
      <AssignmentDialog
        open={openDialogAssign}
        saveLoading={saveLoadingAssign}
        setSaveLoading={setSaveLoadingAssign}
        handleClose={handleDialogAssignClose}
      />

      <Grid container alignItems="center" justifyContent="space-between" marginY={1} paddingX={2}>
        <Grid size={{ xl: 8 }}>
          {(user.role === "graphic" || user.role === "admin") &&
          data.status.code !== 3 &&
          data.status.code !== 4 ? (
            <IconButton
              aria-label="assign"
              onClick={handleDialogAssignOpen}
              disabled={
                !(
                  user.role === "admin" ||
                  data.creator_name === "" ||
                  data.creator_name === user.user_uuid
                )
              }
            >
              <MdOutlinePeopleAlt />
            </IconButton>
          ) : null}
          {contentConfirmBtn}
          {contentActionBtn}
        </Grid>
        <Grid size={{ xl: 4 }} textAlign="end">
          <IconButton aria-label="worksheet-preview" onClick={() => handleGenPdf("work_sheet")}>
            <BsFileEarmarkPdf />
          </IconButton>
        </Grid>
      </Grid>
    </>
  );
}

export default ActionButton;
