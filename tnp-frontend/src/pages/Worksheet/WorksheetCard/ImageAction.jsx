import {
  Grid,
  IconButton,
  useState,
  open_dialog_error,
  open_dialog_ok_timer,
  dialog_confirm_yes_no,
  axios,
  open_dialog_loading,
  Box,
} from "../../../utils/import_lib.js";
import { MdOutlineAddPhotoAlternate, MdOutlineDriveFileRenameOutline, MdDeleteOutline } from "react-icons/md";
import { useGetAllWorksheetQuery } from "../../../features/Worksheet/worksheetApi";
import ImagesDialog from "./ImagesDialog.jsx";
import styles from "../Worksheet.module.css";

function ImageAction({ data, user }) {
  const [openDialog, setOpenDialog] = useState(false);
  const { refetch } = useGetAllWorksheetQuery();

  const handleOpenDialog = () => {
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleDisableBtn = () => {
    if (user.role !== "admin") {
      return false;
    } else if (data.creator_name !== user.user_uuid) {
      return false;
    } else {
      return true;
    }
  };

  const handleUploadDisableBtn = () => {
    if (data.images === "") {
      if (
        data.creator_name === user.user_uuid ||
        (user.role !== "admin" && data.creator_name === "")
      ) {
        return false;
      } else if (user.role === "admin" && data.creator_name !== "") {
        return false;
      } else {
        return true;
      }
    } else {
      return true;
    }
  };

  const handleDeleteImage = async () => {
    const confirm = await dialog_confirm_yes_no(`กรุณายืนยันการลบรูปงาน ${data.work_name}`);

    const formData = new FormData();
    formData.append("worksheet_id", data.worksheet_id);
    formData.append("is_delete", "1");

    if (confirm) {
      open_dialog_loading();

      axios
        .post(`/worksheet-upload-image`, formData)
        .then((res) => {
          console.log(res.data.status);
          refetch();
          open_dialog_ok_timer("Images deleted", "");
        })
        .catch((res) => {
          open_dialog_error(res.message, res);
          console.error(res);
        });
    }
  };

  return (
    <>
      <ImagesDialog
        is_upload={true}
        openDialog={openDialog}
        handleCloseDialog={handleCloseDialog}
        data={data}
      />

      {data.images !== "" ? (
        <Box className={styles.gridContainerActionBtn}>
          <IconButton
            aria-label="change-image"
            disabled={handleDisableBtn()}
            onClick={handleOpenDialog}
            >
            <MdOutlineDriveFileRenameOutline />
          </IconButton>
          <IconButton
            aria-label="delete-image"
            disabled={handleDisableBtn()}
            onClick={handleDeleteImage}
            >
            <MdDeleteOutline />
          </IconButton>
        </Box>
      ) : (
        <Grid
          container
          className={styles.gridContainerUpload}
        >
          <Grid size={{ xs: "auto", }}>
            <IconButton
              aria-label="upload-image"
              disabled={handleUploadDisableBtn()}
              onClick={handleOpenDialog}
            >
              <MdOutlineAddPhotoAlternate />
            </IconButton>
          </Grid>
        </Grid>
      )}
    </>
  );
}

export default ImageAction;
