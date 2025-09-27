import "./GridCard.css";
import { useState, useEffect } from "react";
import { Col, Card, Modal, Button, Row } from "react-bootstrap";
import SelectProcess from "./SelectProcess";
import ProductionCost from "./ProductionCost";
import FabricOrder from "./FabricOrder";
import DyeingOrder from "./DyeingOrder";
import CuttingOrder from "./CuttingOrder";
import SewingOrder from "./SewingOrder";
import FabricReceived from "./FabricReceived";
import EmbroidBlock from "./EmbroidBlock";
import ScreenBlock from "./ScreenBlock";
import DftBlock from "./DftBlock";
import CompleteProcess from "./CompleteProcess";
import { useGetCostsQuery, useGetAllNotesQuery } from "../../api/slice";
import ExamOrder from "./ExamOrder";
import CountdownTimer from "../../components/CountDownTimer";
import { useDispatch } from "react-redux";
import { setNoteList } from "../../features/MonitorProduction/monitorProductionSlice";
import GeneralNote from "./Note/GeneralNote";
import axios from "../../api/axios";
import Swal from "sweetalert2";
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

  const handleClose = () => {
    setShowImage(false);
    setContentModal(null);
  };
  const handleShow = async () => {
    open_dialog_loading();

    if (isWsNew) {
      await handleGenPdf();
    } else {
      setContentModal(
        <iframe
          src={`https://izasskobibe.com/worksheets/preview.php?view=${data.worksheet_id}`}
          width="100%"
          height="100%"
          onLoad={(e) => {
            URL.revokeObjectURL(e.target.src); // Clean up the blob URL
          }}
        ></iframe>
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

      setContentModal(
        <iframe
          src={blobUrl}
          width="100%"
          height="100%"
          onLoad={(e) => {
            URL.revokeObjectURL(e.target.src); // Clean up the blob URL
          }}
        ></iframe>
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
