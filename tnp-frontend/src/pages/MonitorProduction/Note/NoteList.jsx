import NoteShow from "./NoteShow";
import "./ProductionNote.css";
import { useSelector } from "react-redux";

function NoteList({ pd_id, onDel, category }) {
  const item_list = useSelector((state) => state.monitorProduction.note_lists);

  const sortedNotes = [...item_list].sort((a, b) => {
    return new Date(b.note_datetime) - new Date(a.note_datetime);
  });

  return (
    <div className="note-list">
      {sortedNotes
        .filter((note) => note.note_category === category && note.pd_id === pd_id)
        .map((note, index) => {
          return <NoteShow key={index} note={note} onDel={onDel} />;
        })}
    </div>
  );
}

export default NoteList;
