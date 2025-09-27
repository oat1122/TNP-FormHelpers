import { useState } from "react";
import { useFieldArray } from "react-hook-form";
import NoteSales from "./PricingNote/NoteSales";
import NotePrice from "./PricingNote/NotePrice";
import NoteManager from "./PricingNote/NoteManager";
import moment from "moment";
import NoteHistoryDialog from "./PricingNote/NoteHistoryDialog";

function NoteSect(props) {
  const user = JSON.parse(localStorage.getItem("userData"));
  const [openDialog, setOpenDialog] = useState(false); // note history dialog
  const [noteType, setNoteType] = useState("");

  const fieldArrays = {
    1: useFieldArray({ control: props.control, name: "note_sales" }),
    2: useFieldArray({ control: props.control, name: "note_price" }),
    3: useFieldArray({ control: props.control, name: "note_manager" }),
  };

  const handleDialogOpen = (noteType) => {
    setNoteType(noteType);
    setOpenDialog(true);
  };

  const handleDialogClose = () => {
    setOpenDialog(false);
  };

  const handleCreateNote = (noteDescr, noteType) => {
    const append = fieldArrays[noteType].append;

    const inputData = {
      prn_text: noteDescr,
      prn_note_type: noteType,
      prn_created_date: moment().format("YYYY-MM-DD HH:mm:ss"),
      prn_created_by: user.user_uuid,
      prn_updated_date: moment().format("YYYY-MM-DD HH:mm:ss"),
      prn_updated_by: user.user_uuid,
      created_name: user.user_nickname ?? "-",
    };

    append(inputData);
  };

  return (
    <>
      <NoteHistoryDialog
        open={openDialog}
        onClose={handleDialogClose}
        noteType={noteType}
        getValues={props.getValues}
      />

      <NoteSales
        onCreate={handleCreateNote}
        onOpen={handleDialogOpen}
        register={props.register}
        getValues={props.getValues}
      />

      <NotePrice
        onCreate={handleCreateNote}
        onOpen={handleDialogOpen}
        register={props.register}
        getValues={props.getValues}
      />

      {["production", "manager", "admin"].includes(user?.role) ? (
        <NoteManager
          onCreate={handleCreateNote}
          onOpen={handleDialogOpen}
          register={props.register}
          getValues={props.getValues}
        />
      ) : null}
    </>
  );
}

export default NoteSect;
