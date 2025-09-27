import "./ScreenBlock.css";
import moment from "moment";
import { useState } from "react";
import { Stack, Modal, Col, ToggleButton, Button } from "react-bootstrap";
import { RiSettings3Fill } from "react-icons/ri";
import Swal from "sweetalert2";

import axios from "../../api/axios";
import { useGetAllSheetsQuery, useGetDftListQuery } from "../../api/slice";

function ScreenBlock({ data }) {
  const { refetch } = useGetAllSheetsQuery();
  const { data: myData } = useGetDftListQuery();
  const user = JSON.parse(localStorage.getItem("userData"));
  const [showModal, setShowModal] = useState(false);
  const [radioDFT, setRadioDFT] = useState(data.dft_block);

  const handleShowModal = () => setShowModal(true);
  const handleCloseModal = () => {
    setShowModal(false);
    setRadioDFT(data.dft_block);
  };

  const saveDate = data.dft_date ? moment(data.dft_date).format("DD/MM/yy") : null;

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      const response = await axios.post(`updateBlock/${data.pd_id}`, {
        dft_block: radioDFT,
        dft_date: moment().format("yy-MM-DD"),
      });

      if (response.data.success) {
        await Swal.fire({
          icon: "success",
          title: "DFT block updated",
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
    <div className={`screen-block my-2 ${data.dft === null && `text-secondary`}`}>
      <Stack direction="horizontal" gap={0}>
        <Button className="btn btn-modal-factory-disabled py-1" disabled>
          0
        </Button>
        <div className="content-date text-start rounded-start ms-2 ps-2 w-50">
          <label className="title">ไฟล์ DFT</label>
        </div>
        <div className="content-date w-100 text-end rounded-end">
          {data.dft === 1 && (
            <>
              <label>{saveDate === "Invalid date" ? "" : saveDate}</label>
              <label className="title ps-1 pe-3">
                {data.dft_block !== null && ` | ${data.dft_block}`}
              </label>
            </>
          )}
          {user.role !== "graphic" || data.status === 2 || data.dft === null ? null : (
            <>
              <input
                type="checkbox"
                className="btn-check"
                id={`btn-check-dft-${data.pd_id}`}
                autoComplete="off"
                name="showTab"
                onChange={handleShowModal}
              />
              <label
                className="btn setting px-1 py-0 border-0"
                htmlFor={`btn-check-dft-${data.pd_id}`}
              >
                <RiSettings3Fill />
              </label>
            </>
          )}
        </div>
      </Stack>
      <Modal show={showModal} onHide={handleCloseModal} size="md" className="modal-embroid">
        <form onSubmit={handleSubmit}>
          <Modal.Header className="py-1">
            <Modal.Title className="mx-auto">DFT File</Modal.Title>
          </Modal.Header>
          <Modal.Body className="py-3 py-md-4 py-lg-5 text-center">
            {myData &&
              myData.map((radio, index) => (
                <Col className="d-inline mx-1" key={index}>
                  <ToggleButton
                    id={`radio-dft-${index}`}
                    type="radio"
                    variant="outline-secondary"
                    name="radio"
                    className="col-10 col-md-3 mx-2 my-2 my-lg-0 px-0 py-3 toggle-screen"
                    value={radio}
                    checked={radioDFT === radio}
                    onChange={(e) => setRadioDFT(e.currentTarget.value)}
                  >
                    <h1>{radio}</h1>
                    {radio === "IN"
                      ? "ทำเสร็จแล้ว"
                      : radio === "OUT"
                        ? "ส่งออกไม่ได้ทำ"
                        : radio === "EDIT" && "กำลังแก้ไข"}
                  </ToggleButton>
                </Col>
              ))}
          </Modal.Body>
          <Modal.Footer className="text-center col-12 py-3">
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
