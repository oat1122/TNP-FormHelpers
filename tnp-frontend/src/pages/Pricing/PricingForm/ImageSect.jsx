import { useState } from "react";
import { useSelector } from "react-redux";
import {
  Box,
  CardActionArea,
  CardMedia,
  Typography,
} from "@mui/material";
import Grid from "@mui/material/Grid";

import ImageActionBtn from "./ImageSect/ImageActionBtn.jsx";
import ImagesDialog from "./ImageSect/ImagesDialog.jsx";
import initImage from "../../../assets/img/t-shirt_mockup-v2.jpg";

function ImageSect(props) {
  const user = JSON.parse(localStorage.getItem("userData"));
  const imagePreview = useSelector((state) => state.pricing.imagePreview);
  const mode = useSelector((state) => state.pricing.mode);
  const [openDialog, setOpenDialog] = useState(false);
  const renderedImage = imagePreview ? imagePreview : initImage;

  const handleClose = () => {
    setOpenDialog(false);
  };

  return (
    <>
      <ImagesDialog
        is_upload={false}
        openDialog={openDialog}
        handleClose={handleClose}
        setValue={props.setValue}
        control={props.control}
      />

      <Typography variant="h5" color="error" ml={1} mb={1}>
        รูปภาพ
      </Typography>
      <Grid container spacing={1}>
        <Grid size={{ xs: 12 }} p={1} sx={{ justifyItems: 'center', height: { xs: 'auto', xl: 300 }, maxHeight: 300, }}>
          <Box sx={{ position: "relative", mb: 1, maxHeight: 300, }}>
            <CardActionArea
              sx={ !imagePreview ? { opacity: 0.6 } : null }
              disabled={!imagePreview}
              onClick={() => setOpenDialog(true)}
            >
              <CardMedia
                component="img"
                image={renderedImage}
                sx={{ maxHeight: { xs: 200, lg: 300}, }}
              />
            </CardActionArea>
            { (user.role === "admin" || user.role === "sale") && mode !== "view" ? (
              <ImageActionBtn user={props.user} setValue={props.setValue} control={props.control} />
            ) : null}
          </Box>
        </Grid>
      </Grid>
    </>
  );
}

export default ImageSect;
