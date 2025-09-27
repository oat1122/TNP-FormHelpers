import "./ScreenBlock.css";
import { useState } from "react";
import { RiSettings3Fill } from "react-icons/ri";
import { useGetAllSheetsQuery, useGetFactoryQuery } from "../../api/slice";
import { Stack, Modal, Col, Button, Form, Spinner } from "react-bootstrap";
import axios from "../../api/axios";
import moment from "moment";
import Swal from "sweetalert2";

function ScreenBlock({ data }) {
  const { refetch } = useGetAllSheetsQuery();
  const { data: myData, isLoading } = useGetFactoryQuery();
  const user = JSON.parse(localStorage.getItem("userData"));
  const [showModal, setShowModal] = useState(false);
  const [radioEmbroid, setRadioEmbroid] = useState(Number(data.embroid_factory));

  const handleShowModal = () => setShowModal(true);
  const handleCloseModal = () => {
    setShowModal(false);
    setRadioEmbroid(Number(data.embroid_factory));
  };

  const saveDate = data.embroid_date ? moment(data.embroid_date).format("DD/MM/yy") : null;

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      const response = await axios.post(`updateBlock/${data.pd_id}`, {
        embroid_factory: radioEmbroid,
        embroid_date: moment().format("yy-MM-DD"),
      });

      if (response.data.success) {
        await Swal.fire({
          icon: "success",
          title: "Tailoring factory updated",
          showConfirmButton: false,
          timer: 1500,
        });
        refetch();
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: response.data.error,
        });
      }

      setShowModal(false);
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Errorr",
        text: error.message,
      });
    }
  };

  return (
    <div className={`screen-block my-2 ${data.embroid === null && `text-secondary`}`}>
      <Stack direction="horizontal" gap={0}>
        <Button
          className={`btn btn-secondary text-secondary py-1 ${data.embroid !== null ? `btn-modal-factory` : `btn-modal-factory-disabled`}`}
          disabled
        >
          {data.embroid_factory === null ? 0 : data.embroid_factory}
        </Button>
        <div className="content-date text-start rounded-start ms-2 ps-2 w-100">
          <label className="title">บล็อคปัก</label>
        </div>
        <div className="content-date w-100 text-end rounded-end">
          <label className="pe-3">{saveDate === "Invalid date" ? "" : saveDate}</label>
          {user.role !== "graphic" || data.status === 2 || data.embroid === null ? null : (
            <>
              <input
                type="checkbox"
                className="btn-check"
                id={`btn-check-embroid-${data.pd_id}`}
                autoComplete="off"
                name="showTab"
                onChange={handleShowModal}
              />
              <label
                className="btn setting px-1 py-0 border-0"
                htmlFor={`btn-check-embroid-${data.pd_id}`}
              >
                <RiSettings3Fill />
              </label>
            </>
          )}
        </div>
      </Stack>
      <Modal
        show={showModal}
        onHide={handleCloseModal}
        className="mt-3 mt-lg-5 modal-factory"
        dialogClassName="modal-w"
      >
        <form onSubmit={handleSubmit}>
          <Modal.Header className="py-1">
            <Modal.Title className="mx-auto">Embroid Block</Modal.Title>
          </Modal.Header>
          <Modal.Body className="px-4 py-2">
            {isLoading ? (
              <div className="w-100 text-center">
                <Spinner animation="border" variant="danger" role="status" />
              </div>
            ) : (
              myData &&
              myData.map((radio, index) => (
                <Col
                  className={`my-2 fs-4 ${
                    Number(radioEmbroid) === radio.factory_no ? "highlight" : ""
                  }`}
                  key={index}
                >
                  <Form.Check
                    type="radio"
                    id={`radio-embroid-${index}`}
                    name="embroid_factory"
                    label={`${radio.factory_no} - ${radio.factory_name}`}
                    value={radio.factory_no}
                    checked={Number(radioEmbroid) === radio.factory_no}
                    onChange={(e) => setRadioEmbroid(e.target.value)}
                  />
                </Col>
              ))
            )}
          </Modal.Body>
          <Modal.Footer className="text-center py-3">
            <Button type="submit" variant="danger" className="col-12 col-md-5 mx-md-2">
              save
            </Button>
            <Button
              variant="outline-danger"
              onClick={handleCloseModal}
              className="col-12 col-md-5 mx-md-2"
            >
              close
            </Button>
          </Modal.Footer>
        </form>
      </Modal>
    </div>
  );
}

export default ScreenBlock;
