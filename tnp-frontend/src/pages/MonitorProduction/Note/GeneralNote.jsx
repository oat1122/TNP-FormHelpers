import { useState } from "react";
import { Button, Chip } from "@mui/material";
import { Modal } from "react-bootstrap";
import ProductionNote from "./ProductionNote";
import "./GeneralNote.css";
import { MdNotes } from "react-icons/md";
import { useSelector, useDispatch } from "react-redux";
import { useGetAllNotesQuery } from "../../../api/slice";

function GeneralNote({ pd_id }) {
  const [showNote, setShowNote] = useState(false);
  const { data: dataNote, refetch } = useGetAllNotesQuery();
  const user = JSON.parse(localStorage.getItem("userData"));
  const item_lists = useSelector((state) => state.monitorProduction.note_lists);
  const dispatch = useDispatch();

  const handleNoteShow = () => {
    console.log("note show");
    setShowNote(true);
  };
  const handleNoteClose = () => {
    setShowNote(false);
  };

  const renderedGeneralNote = () => {
    if (!item_lists || item_lists.length === 0) {
      return <Chip className="justify-content-center" label="Loading..." />;
    }

    const generalNotes = item_lists
      .filter((note) => note.note_category === "general" && note.pd_id === pd_id)
      .sort((a, b) => new Date(b.note_datetime) - new Date(a.note_datetime))
      .map((item) => item.note_descr);

    const lastNote = generalNotes.length > 0 ? generalNotes[0] : null;

    const resultNote =
      lastNote !== null && lastNote.length > 40 ? lastNote.substring(0, 40) + "..." : lastNote;

    return resultNote !== null ? (
      <Chip deleteIcon={<MdNotes />} onDelete={handleNoteShow} label={resultNote} />
    ) : (
      <Chip label=" " />
    );
  };

  return (
    <div className="general-note">
      <Modal show={showNote} onHide={handleNoteClose} size="lg" className="mt-5 modal-note">
        <ProductionNote pd_id={pd_id} category="general" />
      </Modal>
      {user.role === "manager" || user.role === "production" || user.role === "graphic" ? (
        <>
          <Button className="text-center ps-2 btn fs-5 rounded-2" onClick={handleNoteShow}>
            บันทึกทั่วไป
          </Button>
        </>
      ) : (
        renderedGeneralNote()
      )}
    </div>
  );
}

export default GeneralNote;
