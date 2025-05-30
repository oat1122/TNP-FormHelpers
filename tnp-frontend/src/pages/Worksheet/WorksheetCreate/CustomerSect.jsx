import {
  useState,
  useSelector,
  Button,
  Grid,
  TextField,
  Typography,
} from "../../../utils/import_lib";
import CustomerSectDialog from "./CustomerSectDialog.jsx";
import { MdManageSearch } from "react-icons/md";

function CustomerSect({ handleInputChange }) {
  const inputList = useSelector((state) => state.worksheet.inputList);
  const [openDialog, setOpenDialog] = useState(false);

  const handleClose = () => {
    setOpenDialog(false);
  };

  const handleDisableInput = () => {
    if (String(inputList.work_id).length > 8 || (inputList.is_duplicate)) {
      return true
    } else {
      return false
    }
  }

  return (
    <>
      <CustomerSectDialog open={openDialog} close={handleClose} />

      <Typography variant="h5" color="error" ml={1}>
        ข้อมูลลูกค้า 
        <Button 
          variant="contained"
          color="grey"
          disabled={handleDisableInput()}
          onClick={() => setOpenDialog(true)} 
          sx={{
            marginLeft: 2,
            minWidth: "fit-content",
          }}
        >
          <MdManageSearch style={{ fontSize: '1.5rem' }} />
        </Button>
      </Typography>
      <Grid container spacing={1}>
        <Grid size={{ xs: 12, lg: 6 }} p={1}>
          <TextField
            fullWidth
            variant="outlined"
            label="ชื่อลูกค้า"
            name="cus_name"
            value={inputList.cus_name}
            onChange={handleInputChange}
            disabled
          />
        </Grid>
        <Grid size={{ xs: 12, lg: 6 }} p={1}>
          <TextField
            fullWidth
            variant="outlined"
            label="ชื่อบริษัท"
            name="cus_company"
            value={inputList.cus_company}
            onChange={handleInputChange}
            disabled
            />
        </Grid>
      </Grid>
      <Grid container spacing={1}>
        <Grid size={{ xs: 12 }} p={1} mt={1}>
          <TextField
            multiline
            className="form-control form-textarea"
            label="ที่อยู่"
            name="cus_address"
            value={inputList.cus_address}
            onChange={handleInputChange}
            maxRows={3}
            disabled
            />
        </Grid>
      </Grid>
      <Grid container spacing={1}>
        <Grid size={{ xs: 12, sm: 6 }} p={1} mt={1}>
          <TextField
            fullWidth
            variant="outlined"
            type="tel"
            label="เบอร์โทรศัพท์"
            name="cus_tel_1"
            value={inputList.cus_tel_1}
            onChange={handleInputChange}
            disabled
            />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }} p={1} mt={{ xs: 0, sm: 1 }}>
          <TextField
            fullWidth
            variant="outlined"
            type="email"
            label="อีเมล"
            name="cus_email"
            value={inputList.cus_email}
            onChange={handleInputChange}
            placeholder="example@email.com"
            disabled
          />
        </Grid>
      </Grid>
    </>
  );
}

export default CustomerSect;
