import {
  axios,
  Grid,
  Card,
  CardHeader,
  CardContent,
  IconButton,
  Typography,
  Swal,
  open_dialog_loading,
  open_dialog_error,
} from "../../utils/import_lib";
import "./Worksheet.css";
import { MdOutlineDescription } from "react-icons/md";
import ImagesBox from "./WorksheetCard/ImagesBox";
import ActionButton from "./WorksheetCard/ActionButton";

function WorksheetCard({ data, index, isSuccess }) {
  const user = JSON.parse(localStorage.getItem("userData"));

  const handleLabelStatus = (status) => {
    switch (status) {
      case "Complete":
        return "#04B32E";
      case "Waiting Manager":
        return "#4fc3f7";
      case "Waiting Manager Approve":
        return "#4fc3f7";
      case "Editing":
        return "#fdd835";
      default:
        return "#757575";
    }
  };

  const handleGenPdf = async (sheet_type) => {
    const input = {
      sheet_type,
      worksheet_id: data.worksheet_id,
      user_role: user.role,
    };

    open_dialog_loading();

    try {
      const response = await axios.post("/worksheet-gen-pdf", input, {
        responseType: "blob",
      });

      // Create a blob from the response data
      const pdfBlob = new Blob([response.data], { type: "application/pdf" });
      const blobUrl = URL.createObjectURL(pdfBlob);
      window.open(blobUrl);

      Swal.close();
    } catch (err) {
      console.error("Error downloading the PDF:", err);
      open_dialog_error(err)
      // Swal.close();
    }
  };

  const cardHeader = (
    <>
      <Typography
        variant="body1"
        textAlign="center"
        letterSpacing={1}
        lineHeight={1}
        data-testid="work_id-card-header"
      >
        {data.work_id}
      </Typography>
      <Typography
        variant="h5"
        textAlign="center"
        letterSpacing={1}
        lineHeight={1}
      >
        <label data-testid="work_name-card-header">{data.work_name}</label>
        <label className="px-2">|</label>
        <label data-testid="sales_name-card-header">{data.sales_name}</label>
      </Typography>
      <Typography
        variant="body1"
        textAlign="center"
        letterSpacing={1}
        lineHeight={1}
      >
        {data.cus_name}
      </Typography>
    </>
  );

  return (
    <>
      <Card className="worksheet-card" style={{ padding: 0 }}>
        <CardHeader style={{ paddingBottom: 5 }} title={cardHeader} />
        <CardContent style={{ paddingBlock: 0, paddingInline: 5 }}>
          <ImagesBox data={data} user={user}/>
          <Grid container paddingX={2}>
            <Grid size={6}>
              <Typography variant="h6">Due Date</Typography>
            </Grid>
            <Grid size={6} justifyItems="end">
              <Typography variant="h6">{data.due_date}</Typography>
            </Grid>
          </Grid>
          <Grid container paddingX={2}>
            <Grid size={6}>
              <Typography variant="h6">Ex Date</Typography>
            </Grid>
            <Grid size={6} justifyItems="end">
              <Typography variant="h6">{data.exam_date}</Typography>
            </Grid>
          </Grid>
          <Grid container paddingX={2}>
            <Grid size={12}>
              <Grid 
                container 
                sx={(theme) => ({ 
                  borderBottom: 2, 
                  paddingBottom: 0.5,
                  borderColor: theme.vars.palette.grey[300],
                  pb: 0.5,
                })}
              >
                <Grid size={6}>
                  <Typography variant="h6">Quantity</Typography>
                </Grid>
                <Grid size={6} justifyItems="end">
                  <Typography variant="h6">{data.total_quantity}</Typography>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
          <Grid container paddingX={2}>
            <Grid size={12}>
              <Grid
                container
                justifyContent="space-between"
                sx={(theme) => ({ 
                  borderBottom: 2, 
                  paddingBottom: 0.5,
                  borderColor: theme.vars.palette.grey[300],
                  py: 1,
                })}
              >
                <Grid size="auto">
                  <Typography variant="h6">Status</Typography>
                </Grid>
                <Grid size="grow" justifyItems="end">
                  <Typography
                    color={handleLabelStatus(data.status.title)}
                    variant="h6"
                  >
                    {data.status.title}
                  </Typography>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
          <Grid container paddingX={2}>
            <Grid size={12}>
              <Grid
                container
                justifyContent="space-between"
                alignItems="center"
                sx={(theme) => ({ 
                  borderBottom: 2, 
                  borderColor: theme.vars.palette.grey[300],
                  py: 0.2,
                })}
              >
                <Grid size={6}>
                  <Typography variant="h6">Order</Typography>
                </Grid>
                <Grid size={6} textAlign="end">
                  <IconButton
                    aria-label="order-sheet"
                    onClick={() => handleGenPdf("order_sheet")}
                  >
                    <MdOutlineDescription />
                  </IconButton>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
          {/* Render action button */}
          <ActionButton data={data} isSuccess={isSuccess} handleGenPdf={handleGenPdf}  />
        </CardContent>
      </Card>
    </>
  );
}

export default WorksheetCard;
