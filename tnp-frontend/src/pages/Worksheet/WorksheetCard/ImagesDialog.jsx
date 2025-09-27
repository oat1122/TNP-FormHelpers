import {
  useState,
  axios,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Box,
  Grid,
  CardMedia,
  IconButton,
  CircularProgress,
  styled,
  open_dialog_error,
  open_dialog_ok_timer,
} from "../../../utils/import_lib";
import { MdClose, MdCloudUpload } from "react-icons/md";
import { useGetAllWorksheetQuery } from "../../../features/Worksheet/worksheetApi";

const VisuallyHiddenInput = styled("input")({
  clip: "rect(0 0 0 0)",
  clipPath: "inset(50%)",
  height: 1,
  overflow: "hidden",
  position: "absolute",
  bottom: 0,
  left: 0,
  whiteSpace: "nowrap",
  width: 1,
});

function ImagesDialog({ is_upload, openDialog = false, handleCloseDialog, data }) {
  const [imageFile, setImageFile] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [saveLoading, setSaveLoading] = useState(false);
  const user = JSON.parse(localStorage.getItem("userData"));
  const { refetch } = useGetAllWorksheetQuery();

  const handlePreviewImage = (e) => {
    setImagePreview(URL.createObjectURL(e.target.files[0]));
    setImageFile(e.target.files[0]);
  };

  const handleClose = () => {
    setImageFile("");
    setImagePreview("");
    handleCloseDialog();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaveLoading(true);

    const formData = new FormData();
    formData.append("worksheet_id", data.worksheet_id);
    formData.append("images", imageFile);
    formData.append("creator_name", user.user_uuid);
    formData.append("is_delete", "0");

    await axios
      .post("/worksheet-upload-image", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
      .then(() => {
        open_dialog_ok_timer("Image uploaded successful", "");
        handleCloseDialog();
        setSaveLoading(false);
        refetch();
        setImageFile("");
      })
      .catch((res) => {
        open_dialog_error(res.message, res.response.data.message);
        console.error(res);
        setSaveLoading(false);
        handleCloseDialog();
        setImageFile("");
      });
  };

  return (
    <>
      {is_upload ? (
        <Dialog open={openDialog} fullWidth>
          <form onSubmit={handleSubmit}>
            <DialogTitle>
              <b>Upload Image :</b> {data.work_name}
            </DialogTitle>
            <DialogContent>
              <Box>
                <CardMedia component="img" image={imagePreview} />
                <Button
                  fullWidth
                  component="label"
                  role={undefined}
                  variant="contained"
                  color="grey"
                  tabIndex={-1}
                  startIcon={<MdCloudUpload style={{ marginRight: 2 }} />}
                  sx={{ alignItems: "center" }}
                >
                  เลือกรูปภาพ
                  <VisuallyHiddenInput type="file" onChange={handlePreviewImage} />
                </Button>
              </Box>
            </DialogContent>
            <DialogActions disableSpacing sx={{ paddingInline: { xs: 4, sm: 2, md: 0 } }}>
              <Grid
                container
                spacing={{ xs: 0, sm: 1 }}
                sx={{ width: "100%", justifyContent: "center" }}
              >
                <Grid size={{ xs: 12, sm: 6, md: 4 }} p={1} mt={{ xs: 0, md: 1 }}>
                  <Button
                    fullWidth
                    type="submit"
                    variant="contained"
                    color="error"
                    disabled={saveLoading}
                  >
                    บันทึก
                    {saveLoading && <CircularProgress size={18} sx={{ marginLeft: 1 }} />}
                  </Button>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 4 }} p={1} mt={{ xs: 0, md: 1 }}>
                  <Button
                    fullWidth
                    variant="outlined"
                    color="error"
                    disabled={saveLoading}
                    onClick={handleClose}
                  >
                    ยกเลิก
                  </Button>
                </Grid>
              </Grid>
            </DialogActions>
          </form>
        </Dialog>
      ) : (
        <Dialog
          open={openDialog}
          onClose={handleCloseDialog}
          maxWidth="lg"
          className="dialog-image-display"
        >
          <DialogTitle>
            <label>
              <b>Work Name :</b> {data.work_name}
            </label>
            <IconButton aria-label="close-dialog" onClick={handleCloseDialog}>
              <MdClose />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers>
            <CardMedia component="img" image={data.images} alt={`${data.work_name}-images`} />
          </DialogContent>
          <DialogActions></DialogActions>
        </Dialog>
      )}
    </>
  );
}

export default ImagesDialog;
