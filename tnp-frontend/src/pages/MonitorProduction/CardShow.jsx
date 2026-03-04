import "./GridCard.css";
import { useState, useEffect } from "react";
import { Col, Card, Modal, Button, Row } from "react-bootstrap";
import { useDispatch } from "react-redux";
import Swal from "sweetalert2";

import CompleteProcess from "./CompleteProcess";
import CuttingOrder from "./CuttingOrder";
import DftBlock from "./DftBlock";
import DyeingOrder from "./DyeingOrder";
import EmbroidBlock from "./EmbroidBlock";
import ExamOrder from "./ExamOrder";
import FabricOrder from "./FabricOrder";
import FabricReceived from "./FabricReceived";
import GeneralNote from "./Note/GeneralNote";
import ProductionCost from "./ProductionCost";
import ScreenBlock from "./ScreenBlock";
import SelectProcess from "./SelectProcess";
import SewingOrder from "./SewingOrder";
import axios from "../../api/axios";
import { useGetCostsQuery, useGetAllNotesQuery } from "../../api/slice";
import CountdownTimer from "../../components/CountDownTimer";
import { setNoteList } from "../../features/MonitorProduction/monitorProductionSlice";
import { open_dialog_loading } from "../../utils/import_lib";

function CardShow({ data }) {
  const user = JSON.parse(localStorage.getItem("userData"));
  const dispatch = useDispatch();
  const initImage = import.meta.env.VITE_IMAGE_SHIRT_MOCKUP;

  // เช็คการดึงข้อมูลใบงานมาจากระบบใหม่หรือไม่
  const isWsNew = data.new_worksheet_id ? true : false;

  const { data: myData } = useGetCostsQuery(data.pd_id);
  const { data: dataNote } = useGetAllNotesQuery();
  const [showImage, setShowImage] = useState(false);
  const [contentModal, setContentModal] = useState(null);
  const [pdfUrlToRevoke, setPdfUrlToRevoke] = useState(null);

  const handleClose = () => {
    setShowImage(false);
    setContentModal(null);
    if (pdfUrlToRevoke) {
      URL.revokeObjectURL(pdfUrlToRevoke);
      setPdfUrlToRevoke(null);
    }
  };
  const handleShow = async () => {
    open_dialog_loading();

    if (isWsNew) {
      await handleGenPdf();
    } else {
      const pdfUrl = `https://izasskobibe.com/worksheets/preview.php?view=${data.worksheet_id}`;
      setContentModal(
        <div
          style={{
            width: "100%",
            height: "100%",
            minHeight: "80vh",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div className="text-center mb-2">
            <a href={pdfUrl} target="_blank" rel="noreferrer" className="btn btn-primary">
              <svg
                stroke="currentColor"
                fill="currentColor"
                strokeWidth="0"
                viewBox="0 0 16 16"
                height="1em"
                width="1em"
                xmlns="http://www.w3.org/2000/svg"
                className="me-2"
              >
                <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"></path>
                <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"></path>
              </svg>
              เปิดดูไฟล์ PDF / ดาวน์โหลด (สำหรับมือถือ)
            </a>
          </div>
          <iframe src={pdfUrl} width="100%" style={{ flexGrow: 1, border: "none" }}></iframe>
        </div>
      );
    }

    setShowImage(true);
    Swal.close();
  };

  const handleDisplayImg = () => {
    let result = initImage;

    if (data.picture) {
      // ถ้าดึงข้อมูลมาจากใบงานเก่า ให้นำค่าของ 'picture' มาใช้ได้เลย
      if (isWsNew) {
        result = data.picture;
      } else {
        result = `https://izasskobibe.com/worksheets/img/${data.picture}`;
      }
    }

    return result;
  };

  const handleGenPdf = async () => {
    const input = {
      sheet_type: "work_sheet",
      worksheet_id: data.worksheet_id,
      user_role: user.role,
    };

    try {
      const response = await axios.post("/worksheet-gen-pdf", input, {
        responseType: "blob",
      });

      // Create a blob from the response data
      const pdfBlob = new Blob([response.data], { type: "application/pdf" });
      const blobUrl = URL.createObjectURL(pdfBlob);
      setPdfUrlToRevoke(blobUrl);

      setContentModal(
        <div
          style={{
            width: "100%",
            height: "100%",
            minHeight: "80vh",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div className="text-center mb-2">
            <a
              href={blobUrl}
              target="_blank"
              rel="noreferrer"
              download={`worksheet_${data.worksheet_id}.pdf`}
              className="btn btn-primary"
            >
              <svg
                stroke="currentColor"
                fill="currentColor"
                strokeWidth="0"
                viewBox="0 0 16 16"
                height="1em"
                width="1em"
                xmlns="http://www.w3.org/2000/svg"
                className="me-2"
              >
                <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"></path>
                <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"></path>
              </svg>
              เปิดดูไฟล์ PDF / ดาวน์โหลด (สำหรับมือถือ)
            </a>
          </div>
          <iframe src={blobUrl} width="100%" style={{ flexGrow: 1, border: "none" }}></iframe>
        </div>
      );
    } catch (err) {
      console.error("Error downloading the PDF:", err);
      Swal.close();
    }
  };

  useEffect(() => {
    if (dataNote) {
      dispatch(setNoteList(dataNote));
    }
  }, [dataNote, dispatch]);

  return (
    <Col className="card-show px-0 px-md-2">
      <Card>
        <Card.Body className="text-center py-1 mt-2">
          <Card.Title className="fs-5 mb-0">
            {data.work_name} | {data.username}
          </Card.Title>
          <Card.Title className="fs-6">
            จำนวน {data.quantity} |{" "}
            <label className="text-due-date">DUE DATE : {data.due_date}</label>
          </Card.Title>
        </Card.Body>
        <Card.Body className="py-0 text-center" style={{ position: "relative" }}>
          <Button className="p-0 border-0" onClick={handleShow} variant="link">
            <Card.Img
              // src={`https://izasskobibe.com/worksheets/img/${data.picture}`}
              src={handleDisplayImg()}
            />
            <Card.ImgOverlay className="d-flex justify-content-end align-items-end">
              <Card.Text className="px-3">
                {data.production_type === 1
                  ? "ตัดเย็บก่อนสกรีน"
                  : data.production_type === 2
                    ? "สกรีนก่อนตัดเย็บ"
                    : null}
              </Card.Text>
            </Card.ImgOverlay>
          </Button>
          <Modal show={showImage} onHide={handleClose} size="lg" fullscreen>
            <Modal.Header className="py-1" closeButton>
              <Modal.Title as={"h2"} style={{ fontWeight: "bold" }}>
                Worksheet Preview
              </Modal.Title>
            </Modal.Header>
            <Modal.Body>{contentModal}</Modal.Body>
          </Modal>
        </Card.Body>
        <Card.Body className="px-1 px-md-3">
          {data.status === 0 && (user.role === "manager" || user.role === "production") ? (
            <>
              <CountdownTimer data={data} />
              <SelectProcess data={data} />
            </>
          ) : data.status === 0 ? (
            <>
              <h4 className="text-center fw-bold">Waiting Work Start...</h4>
              <CountdownTimer data={data} />
            </>
          ) : (
            <>
              <Row xs={user.role === "manager" ? 2 : 12}>
                {user.role === "manager" && <ProductionCost myData={myData} pd_id={data.pd_id} />}
                <GeneralNote pd_id={data.pd_id} />
              </Row>
              <ExamOrder data={data} />
              <hr />
              <FabricOrder data={data} />
              <DyeingOrder data={data} />
              <CuttingOrder data={data} />
              <SewingOrder data={data} />
              <FabricReceived data={data} />
              <hr />
              <EmbroidBlock data={data} />
              <ScreenBlock data={data} />
              <DftBlock data={data} />
              <CompleteProcess data={data} />
            </>
          )}
        </Card.Body>
      </Card>
    </Col>
  );
}

export default CardShow;
