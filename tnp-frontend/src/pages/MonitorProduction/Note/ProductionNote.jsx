import "./ProductionNote.css";
import moment from "moment";
import { Modal } from "react-bootstrap";
import { useAddNewNoteMutation, useDelNoteMutation, useGetAllNotesQuery } from "../../../api/slice";
import NoteCreate from "./NoteCreate";
import NoteList from "./NoteList";
import { useSelector, useDispatch } from "react-redux";
import { setNoteList } from "../../../features/MonitorProduction/monitorProductionSlice";

function ProductionNote({ pd_id, category }) {
  const user = JSON.parse(localStorage.getItem("userData"));
  const item_lists = useSelector((state) => state.monitorProduction.note_lists);
  const { refetch } = useGetAllNotesQuery();
  const [addNewNote] = useAddNewNoteMutation();
  const [delNote] = useDelNoteMutation();
  const dispatch = useDispatch();

  const currentDate = moment().format("YYYY-MM-DD HH:mm:ss");

  const createNote = async (noteDescr) => {
    const formData = {
      pd_id: pd_id,
      user_id: user.user_id,
      note_category: category,
      note_descr: noteDescr,
      note_datetime: currentDate,
    };

    const updatedDescr = [
      ...item_lists,
      {
        pd_id: pd_id,
        note_category: category,
        username: user.username,
        note_descr: noteDescr,
        note_datetime: currentDate,
      },
    ];

    dispatch(setNoteList(updatedDescr));

    await addNewNote(formData)
      .unwrap()
      .then((response) => {
        console.log(response.message);
        refetch();
      })
      .catch(({ response }) => {
        console.log(response.data.message);
      });
  };

  const deleteNote = async (note_id) => {
    const updatedDescr = item_lists.filter((note) => {
      return note.note_id !== note_id;
    });

    dispatch(setNoteList(updatedDescr));

    await delNote(note_id)
      .unwrap()
      .then((response) => {
        console.log(response.message);
      })
      .catch(({ response }) => {
        refetch();
        console.log(response.data.message);
      });
  };

  const noteTitleMap = {
    order: "สั่งผ้า",
    dyeing: "ย้อมผ้า",
    cutting: "ตัดผ้า",
    sewing: "เย็บผ้า",
    received: "ผ้าเข้า",
    example: "ตัวอย่าง",
    general: "ทั่วไป",
  };

  const noteTitle = "บันทึก" + noteTitleMap[category];

  return (
    <div className="production-note">
      <Modal.Header className="py-1" closeButton>
        <Modal.Title as={"h2"} style={{ fontWeight: "bold", letterSpacing: "0.1rem" }}>
          {noteTitle}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="m-3 pt-0">
        {user.role === "manager" || user.role === "production" || user.role === "graphic" ? (
          <>
            <NoteCreate onCreate={createNote} pd_id={pd_id} />
            <hr className="d-lg-none " />
          </>
        ) : null}
        <NoteList pd_id={pd_id} onDel={deleteNote} category={category} />
      </Modal.Body>
    </div>
  );
}

export default ProductionNote;
