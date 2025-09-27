import { Row, Col } from "react-bootstrap";
import { TextareaAutosize, Button } from "@mui/material";
import { useState } from "react";
import "./ProductionNote.css";

function NoteCreate({ onCreate }) {
  const [noteDescr, setNoteDescr] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    setNoteDescr("");
    onCreate(noteDescr);
  };

  return (
    <div className="note-create">
      <form onSubmit={handleSubmit}>
        <Row className="pe-lg-3">
          <Col xs={12} lg={11}>
            <TextareaAutosize
              className="form-control textarea-post"
              placeholder="กรอกรายละเอียดงาน"
              value={noteDescr}
              onChange={(event) => setNoteDescr(event.target.value)}
              required
            />
          </Col>
          <Col xs={12} lg={1} className="text-end ps-lg-0 mt-3 mt-lg-0">
            <Button
              variant="contained"
              className="btn btn-post col-4 col-md-3 col-lg-8"
              type="submit"
            >
              POST
            </Button>
          </Col>
        </Row>
      </form>
    </div>
  );
}

export default NoteCreate;
