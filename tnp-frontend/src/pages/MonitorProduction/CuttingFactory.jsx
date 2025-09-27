import "./FabricOrder.css";
import { useState } from "react";
import { Modal, Col, Button, Form, Spinner } from "react-bootstrap";
import { useGetFactoryQuery, useGetAllSheetsQuery } from "../../api/slice";
import axios from "../../api/axios";
import Swal from "sweetalert2";

function CuttingFactory({ data }) {
  const user = JSON.parse(localStorage.getItem("userData"));
  const { refetch } = useGetAllSheetsQuery();
  const { data: myData, isLoading } = useGetFactoryQuery();
  const [radioCutting, setRadioCutting] = useState(Number(data.cutting_factory));
  const [showModal, setShowModal] = useState(false);

  const handleShowModal = () => setShowModal(true);
  const handleCloseModal = () => setShowModal(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      const response = await axios.put(`production/${data.pd_id}`, {
        cutting_factory: radioCutting,
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
        title: "Error",
        text: error.response.data.error,
      });
    }
  };

  return (
    <>
      <Button
        className="btn btn-secondary text-dark btn-modal-factory py-1"
        onClick={handleShowModal}
        disabled={
          (user.role !== "manager" && user.role !== "production") || data.status === 2
            ? true
            : false
        }
      >
        {data.cutting_factory === null ? 0 : data.cutting_factory}
      </Button>
      <Modal
        show={showModal}
        onHide={handleCloseModal}
        className="mt-3 mt-lg-5 modal-factory"
        dialogClassName="modal-w"
      >
        <form onSubmit={handleSubmit}>
          <Modal.Header className="py-1">
            <Modal.Title className="mx-auto">Cutting Factory</Modal.Title>
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
                  className={`my-2 fs-4 ${Number(radioCutting) === radio.factory_id ? "highlight" : ""}`}
                  key={index}
                >
                  <Form.Check
                    type="radio"
                    id={`radio-cutting-${index}`}
                    name="cutting_factory"
                    label={`${radio.factory_no} - ${radio.factory_name}`}
                    value={radio.factory_id}
                    checked={Number(radioCutting) === radio.factory_id}
                    onChange={(e) => setRadioCutting(e.target.value)}
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
    </>
  );
}

export default CuttingFactory;
