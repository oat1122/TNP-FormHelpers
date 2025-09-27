import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Controller } from "react-hook-form";
import { MdClose, MdCloudUpload } from "react-icons/md";
import initImage from "../../../../assets/img/t-shirt_mockup-v2.jpg";
import { setImagePreviewForm } from "../../../../features/Pricing/pricingSlice";
import {
  Box,
  Button,
  CardMedia,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid2 as Grid,
  IconButton,
  styled,
} from "@mui/material";
import { fileToBase64 } from "../../../../utils/utilityFunction";

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

function ImagesDialog(props) {
  const dispatch = useDispatch();

  const [imagePreviewInDialog, setImagePreviewInDialog] = useState("");
  const imagePreview = useSelector((state) => state.pricing.imagePreview);

  const renderedImage = imagePreviewInDialog ? imagePreviewInDialog : initImage;

  const handlePreviewImage = (e) => {
    setImagePreviewInDialog(URL.createObjectURL(e.target.files[0]));
  };

  const handleClose = () => {
    setImagePreviewInDialog("");
    props.handleClose();
  };

  const handleSubmit = (e) => {
    dispatch(setImagePreviewForm(imagePreviewInDialog));
    setImagePreviewInDialog("");
    props.handleClose();
  };

  useEffect(() => {
    setImagePreviewInDialog(imagePreview);
  }, [props.openDialog]);

  return (
    <>
      {props.is_upload ? (
        <Dialog open={props.openDialog} fullWidth>
          <DialogTitle>อัพโหลดรูปภาพ</DialogTitle>
          <DialogContent>
            <Box>
              <CardMedia component="img" image={imagePreviewInDialog} />

              <Controller
                name="pr_image"
                control={props.control}
                defaultValue={null}
                render={({ field: { onChange } }) => (
                  <Button
                    fullWidth
                    component="label"
                    role={undefined}
                    variant="contained"
                    color="grey"
                    tabIndex={-1}
                    startIcon={<MdCloudUpload style={{ marginRight: 2 }} />}
                    sx={{ alignItems: "center", marginTop: 4 }}
                  >
                    เลือกรูปภาพ
                    <VisuallyHiddenInput
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files[0];
                        const fileBase64 = await fileToBase64(file);
                        if (fileBase64) {
                          onChange(fileBase64); // ส่งไฟล์เข้า react-hook-form
                          handlePreviewImage(e); // เรียกฟังก์ชัน preview เพิ่มเติม (ถ้ามี)
                        }
                      }}
                    />
                  </Button>
                )}
              />
            </Box>
          </DialogContent>
          <DialogActions disableSpacing sx={{ paddingInline: { xs: 4, sm: 2, md: 0 } }}>
            <Grid
              container
              spacing={{ xs: 0, sm: 1 }}
              sx={{ width: "100%", justifyContent: "center" }}
            >
              <Grid size={{ xs: 12, sm: 6, md: 4 }} p={1} mt={{ xs: 0, md: 1 }}>
                <Button fullWidth onClick={handleSubmit} variant="contained" color="error">
                  บันทึก
                </Button>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }} p={1} mt={{ xs: 0, md: 1 }}>
                <Button fullWidth variant="outlined" color="error" onClick={handleClose}>
                  ยกเลิก
                </Button>
              </Grid>
            </Grid>
          </DialogActions>
        </Dialog>
      ) : (
        <Dialog open={props.openDialog} onClose={props.handleClose} maxWidth="lg">
          <DialogTitle>
            <label>รูปภาพ</label>
            <IconButton
              aria-label="close"
              onClick={props.handleClose}
              sx={(theme) => ({
                position: "absolute",
                right: 8,
                top: 18,
                color: theme.palette.grey[500],
              })}
            >
              <MdClose />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers>
            <CardMedia component="img" image={renderedImage} alt={`${renderedImage}-images`} />
          </DialogContent>
          <DialogActions></DialogActions>
        </Dialog>
      )}
    </>
  );
}

export default ImagesDialog;
