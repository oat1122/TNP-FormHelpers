import { useEffect, useRef, useMemo } from "react";
import { useSelector } from "react-redux";
import {
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid2 as Grid,
  IconButton,
  InputLabel,
  styled,
  Typography,
} from "@mui/material";
import { MdClose } from "react-icons/md";
import moment from "moment";
import { amber, brown } from "@mui/material/colors";

const StyledGridCol = styled(Grid)(({ theme }) => ({
  backgroundColor: theme.vars.palette.grey.main,
  borderRadius: theme.vars.shape.borderRadius,
  minHeight: 78,
  paddingInline: 8,
}));

const StyledLabel = styled(InputLabel)(({ theme }) => ({
  color: theme.vars.palette.grey.dark,
  fontFamily: "Kanit",
  fontSize: 16,
  alignContent: "center",
  textAlign: "center",
}));

const StyledChip = styled(Chip)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius,
  backgroundColor: amber[100],
  color: brown[500],
  fontSize: 14,
  fontFamily: "Kanit",
  letterSpacing: 1,
  marginTop: 2,
}));

function NoteHistoryDialog(props) {
  const keyTitleMap = {
    1: "note sales",
    2: "price",
    3: "note manager",
  };

  const keyStateMap = {
    1: "note_sales",
    2: "note_price",
    3: "note_manager",
  };
  const descriptionElementRef = useRef(null);
  const notesRaw = props.getValues(keyStateMap[props.noteType]);
  const notes = Array.isArray(notesRaw) ? notesRaw : [];

  const sortedNotes = useMemo(() => {
    return notes
      .slice()
      .sort(
        (a, b) => new Date(b.prn_created_date) - new Date(a.prn_created_date)
      );
  }, [notes]);

  const renderedNote = (data, index) => (
    <StyledGridCol size={12} key={index}>
      <StyledLabel
        sx={{
          maxHeight: "100%",
          minHeight: 78,
          textAlign: "start",
          padding: 1,
        }}
      >
        <div style={{ whiteSpace: "pre-wrap" }}>{data.prn_text}</div>
        <div style={{ fontSize: 14 }}>
          <label style={{ textTransform: "capitalize" }}>
            {data.created_name}
          </label>
          <label style={{ marginInline: 6 }}>|</label>
          <label>{moment(data.prn_created_date).format("DD/MM HH:mm")}</label>
        </div>

        {/* -------- แสดงเมื่อเพิ่มโน๊ตใหม่ แต่ยังไม่บันทึกฟอร์ม     -------- */}
        {!data?.prn_id ? (
          <StyledChip label="(ยังไม่ได้บันทึก)" />
        ) : null}
      </StyledLabel>
    </StyledGridCol>
  );

  useEffect(() => {
    if (props.open) {
      const { current: descriptionElement } = descriptionElementRef;
      if (descriptionElement !== null) {
        descriptionElement.focus();
      }
    }
  }, [props.open]);

  return (
    <div>
      <Dialog
        open={props.open}
        onClose={props.onClose}
        scroll="paper"
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle
          id="scroll-dialog-title"
          sx={{ textTransform: "capitalize" }}
        >
          {keyTitleMap[props.noteType]}
        </DialogTitle>
        <IconButton
          aria-label="close"
          onClick={props.onClose}
          sx={(theme) => ({
            position: "absolute",
            right: 8,
            top: 18,
            color: theme.palette.grey[500],
          })}
        >
          <MdClose />
        </IconButton>
        <DialogContent ref={descriptionElementRef} tabIndex={-1} dividers>
          <Grid container spacing={3}>
            {sortedNotes.length > 0 ? 
              sortedNotes.map((item, index) => renderedNote(item, index))
              : (
                <Grid size={12} sx={{ textAlign: "center" }}>
                  <Typography variant="body2" sx={{ fontSize: 16, }} >ไม่มีข้อมูล</Typography>
                </Grid>
              )
            }
          </Grid>
        </DialogContent>
        <DialogActions></DialogActions>
      </Dialog>
    </div>
  );
}

export default NoteHistoryDialog;
