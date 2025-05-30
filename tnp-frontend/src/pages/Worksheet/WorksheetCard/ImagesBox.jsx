import {
  useState,
  Box,
  CardMedia,
  CardActionArea,
} from "../../../utils/import_lib";
import ImageAction from "./ImageAction";
import ImagesDialog from "./ImagesDialog";

function ImagesBox({ data, user }) {
  const initImage = import.meta.env.VITE_IMAGE_SHIRT_MOCKUP;
  const renderedImage = data.images ? data.images : initImage;

  const [openDialog, setOpenDialog] = useState(false);

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  return (
    <>
      <ImagesDialog
        is_upload={false}
        openDialog={openDialog}
        handleCloseDialog={handleCloseDialog}
        data={data}
      />

      <Box sx={{ position: "relative", mb: 1 }}>
        <CardActionArea
          sx={{ height: 320 }}
          disabled={!data.images}
          onClick={() => setOpenDialog(true)}
        >
          <CardMedia
            component="img"
            image={renderedImage}
            alt={`${data.work_name}-images`}
            // sx={{ maxHeight: 250 }}
          />
        </CardActionArea>
        {(user.role === "graphic" || user.role === "admin") && (data.status.code !== 3 && data.status.code !== 4) ? (
          <ImageAction data={data} user={user} />
        ) : null}
      </Box>
    </>
  );
}

export default ImagesBox;
