import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import {
  Button,
  Divider,
  Grid2 as Grid,
  OutlinedInput,
  styled,
  InputLabel,
  IconButton,
} from "@mui/material";
import moment from "moment";
import { MdHistory } from "react-icons/md";

const StyledOutlinedInput = styled(OutlinedInput)(({ theme }) => ({
  backgroundColor: theme.vars.palette.grey.outlinedInput,

  "& fieldset": {
    borderColor: theme.vars.palette.grey.outlinedInput,
  },

  "&.Mui-disabled": {
    "& .MuiOutlinedInput-notchedOutline": {
      borderColor: theme.vars.palette.grey.outlinedInput,
    },

    "& .MuiOutlinedInput-input": {
      WebkitTextFillColor: theme.vars.palette.text.primary,
    },
  },
}));

const StyledLabel = styled(InputLabel)(({ theme }) => ({
  color: theme.vars.palette.grey.dark,
  fontFamily: "Kanit",
  fontSize: 16,
  alignContent: "center",
  textAlign: "center",
}));

const StyledGridRow = styled(Grid)(({ theme }) => ({
  backgroundColor: theme.vars.palette.grey.main,
  borderRadius: theme.vars.shape.borderRadius,
  alignContent: "center",
  maxHeight: 34,
}));

const StyledGridCol = styled(Grid)(({ theme }) => ({
  backgroundColor: theme.vars.palette.grey.main,
  borderRadius: theme.vars.shape.borderRadius,
  minHeight: 78,
  paddingInline: 8,
}));

const VerticalDivider = styled(Divider)(({ theme }) => ({
  marginInline: 0,
  marginTop: 10,
  marginBottom: 22,
  borderBottomWidth: 2,
  borderColor: theme.vars.palette.grey[500],
}));

function NoteManager(props) {
  const noteManager = props.getValues("note_manager");
  const mode = useSelector((state) => state.pricing.mode);
  const user = JSON.parse(localStorage.getItem("userData"));
  const [noteDescr, setNoteDescr] = useState("");
  const [disabledBtn, setDisabledBtn] = useState(true);
  let content;

  const handleSubmit = () => {
    props.onCreate(noteDescr, 3);
    setNoteDescr("");
  };

  if (noteManager.length > 0) {
    const latestNote = noteManager.reduce((latest, current) => {
      return new Date(current.prn_created_date) > new Date(latest.prn_created_date)
        ? current
        : latest;
    });

    content = (
      <>
        <div style={{ whiteSpace: 'pre-wrap' }}>{latestNote.prn_text}</div>
        <div style={{ fontSize: 14 }}>
          <label style={{ textTransform: "capitalize" }}>{latestNote.created_name}</label>
          <label style={{ marginInline: 6 }} >|</label>
          <label>{moment(latestNote.prn_created_date).format("DD/MM HH:mm")}</label>
        </div>
      </>
    )
  }

  useEffect(() => {

    if (noteDescr.length > 0) {
      setDisabledBtn(false);
    } else {
      setDisabledBtn(true);
    }

  }, [noteDescr])

  return (
    <>
      <Grid container spacing={2}>

        <Grid size={12}>

          <StyledGridRow
            container
            spacing={0}
            sx={{
              paddingInline: { xs: 2, sm: 1, lg: 2, xl: 1, }
            }}
          >

            <Grid size={1}></Grid>
            <Grid size={10}>
              <StyledLabel sx={{ textTransform: 'uppercase', height: 40, }}>note manager</StyledLabel>
            </Grid>
            <Grid size={1} sx={{ textAlign: 'end' }}>
              <IconButton
                onClick={() => props.onOpen(3)}
                sx={(theme) => ({
                  color: theme.vars.palette.grey.dark,
                })}
              >
                <MdHistory />
              </IconButton>
            </Grid>

          </StyledGridRow>
          
        </Grid>

         {/* ------ note content ------ */}
         <StyledGridCol size={{ xs: 12 }}>
            <StyledLabel
              sx={{ 
                maxHeight: '100%',
                minHeight: 78,
                textAlign: 'start',
                padding: 1,
              }}
            >
            {content}
            </StyledLabel>
          </StyledGridCol>

        {/* ------ start textfield and button ------ */}
        { (mode !== "view") && ["production", "manager", "admin"].includes(user?.role) ? (

        <Grid size={12}>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 9, md: 10, lg: 9, }}>
              <StyledOutlinedInput
                fullWidth
                multiline
                maxRows={4}
                size="small"
                value={noteDescr}
                onChange={(e) => setNoteDescr(e.target.value)}
              />
            </Grid>

            <Grid  size={{ xs: 12, sm: 3, md: 2, lg: 3, }}>
              <Button
                fullWidth
                onClick={handleSubmit}
                variant="contained"
                color="error"
                disabled={disabledBtn}
                sx={{
                  height: 40,
                }}
              >
                เพิ่มโน๊ต
              </Button>
            </Grid>
          </Grid>

        </Grid>

        ) : null}
        {/* ------ end textfield and button ------ */}

      </Grid>

    </>
  );
}

export default NoteManager;
