import { Row, Col } from "react-bootstrap";
import moment from "moment";
import { BsTrash3 } from "react-icons/bs";
import "./ProductionNote.css";
import { dialog_delete_by_id } from "../../../utils/dialog_swal2/dialog_delete_by_id";

function NoteShow({ note, onDel }) {
  const user = JSON.parse(localStorage.getItem("userData"));

  const handleDelete = async () => {
    const confirm = await dialog_delete_by_id(`ยืนยันการลบบันทึก ${note.note_descr} ?`);

    if (confirm) {
      onDel(note.note_id);
    }
  };

  return (
    <div className="note-show">
      <Row className="row-post mt-3 py-2 mx-0 d-flex align-items-center">
        <Col md={11}>
          <Row>
            <Col md={12} lg={user.username === note.username ? 9 : 10}>
              <label>{note.note_descr}</label>
            </Col>
          </Row>
          <Row className="d-flex justify-content-between">
            <Col md={6} className="d-flex justify-content-end flex-column">
              <label className="fs-6">
                {note.username.toUpperCase() +
                  " | " +
                  moment(note.note_datetime).format("DD/MM HH:mm")}
              </label>
            </Col>
          </Row>
        </Col>
        {(user.role === "manager" || user.role === "production" || user.role === "graphic") && (
          <>
            <Col md={1} className="d-none d-lg-inline">
              <button className="btn" variant="outlined" onClick={handleDelete}>
                <BsTrash3 />
              </button>
            </Col>
            <Col md={12} className="d-lg-none d-flex justify-content-end">
              <button className="btn" variant="outlined" onClick={handleDelete}>
                <BsTrash3 />
              </button>
            </Col>
          </>
        )}
      </Row>
    </div>
  );
}

export default NoteShow;
