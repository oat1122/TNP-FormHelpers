import {
  MdOutlineAddPhotoAlternate,
  MdOutlineDriveFileRenameOutline,
  MdDeleteOutline,
} from "react-icons/md";
import { useSelector, useDispatch } from "react-redux";

import ImagesDialog from "./ImagesDialog.jsx";
import { setImagePreviewForm } from "../../../../features/Pricing/pricingSlice.js";
import {
  Grid,
  IconButton,
  useState,
  dialog_confirm_yes_no,
  Box,
} from "../../../../utils/import_lib.js";
import styles from "../../Pricing.module.css";

function ImageActionBtn(props) {
  const dispatch = useDispatch();
  const [openDialog, setOpenDialog] = useState(false);
  const imagePreview = useSelector((state) => state.pricing.imagePreview);

  const handleOpenDialog = () => {
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleDeleteImage = async () => {
    const confirm = await dialog_confirm_yes_no(`กรุณายืนยันการลบรูปภาพ`);

    if (confirm) {
      props.setValue("pr_image", "");
      dispatch(setImagePreviewForm(""));
    }
  };

  return (
    <>
      <ImagesDialog
        is_upload={true}
        openDialog={openDialog}
        handleClose={handleCloseDialog}
        setValue={props.setValue}
        control={props.control}
      />

      {imagePreview !== "" ? (
        <Box className={styles.gridContainerActionBtn}>
          <IconButton aria-label="change-image" onClick={handleOpenDialog}>
            <MdOutlineDriveFileRenameOutline />
          </IconButton>
          <IconButton aria-label="delete-image" onClick={handleDeleteImage}>
            <MdDeleteOutline />
          </IconButton>
        </Box>
      ) : (
        <Grid container className={styles.gridContainerUpload}>
          <Grid size={{ xs: "auto" }}>
            <IconButton aria-label="upload-image" onClick={handleOpenDialog}>
              <MdOutlineAddPhotoAlternate />
            </IconButton>
          </Grid>
        </Grid>
      )}
    </>
  );
}

export default ImageActionBtn;
