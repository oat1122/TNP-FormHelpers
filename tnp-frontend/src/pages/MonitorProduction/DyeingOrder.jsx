import "./FabricOrder.css";
import { useState } from "react";
import { styled } from "@mui/material";
import { Stack, Modal, Button } from "react-bootstrap";
import { RiSettings3Fill } from "react-icons/ri";
import { IoIosCloseCircleOutline } from "react-icons/io";
import { MdNotes } from "react-icons/md";
import { AdapterMoment } from "@mui/x-date-pickers/AdapterMoment";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { StaticDatePicker } from "@mui/x-date-pickers/StaticDatePicker";
import ProductionNote from "./Note/ProductionNote";
import { useGetAllSheetsQuery, useGetNotesQuery } from "../../api/slice";
import axios from "../../api/axios";
import moment from "moment";
import Swal from "sweetalert2";
import { useSelector } from "react-redux";

const NoteIcon = styled(MdNotes)({ 
  fontSize: "1.25rem",
});

function DyeingOrder({ data }) {
  const { refetch } = useGetAllSheetsQuery();
  const { data: myData, refetch: noteRefetch } = useGetNotesQuery(data.pd_id);
  const user = JSON.parse(localStorage.getItem("userData"));
  const item_lists = useSelector((state) => state.monitorProduction.note_lists);
  const [showTab, setShowTab] = useState(null);
  const [showNote, setShowNote] = useState(false);
  const orderDate = moment(data.dyeing_start).format("DD/MM/yy");
  const receiveDate = moment(data.dyeing_end).format("DD/MM/yy");

  const handleShow = () => setShowTab(!showTab);
  const handleNoteShow = () => setShowNote(true);
  const handleNoteClose = () => {
    setShowNote(false);
  };

  const handleDisabledNoteButton = () => {
    return item_lists.every(item => item.pd_id !== data.pd_id || item.note_category !== 'dyeing') || item_lists.length === 0;
  }

  const SettingRow = () => {
    const [showOrderDate, setShowOrderDate] = useState(false);
    const [showReceiveDate, setShowReceiveDate] = useState(false);
    const [orderDatePick, setOrderDatePick] = useState(moment(data.dyeing_start));
    const [receiveDatePick, setReceiveDatePick] = useState(moment(data.dyeing_end));
    const handleOrderDShow = () => setShowOrderDate(true);
    const handleReceiveDShow = () => setShowReceiveDate(true);
    const handleOrderDClose = () => setShowOrderDate(false);
    const handleReceiveDClose = () => setShowReceiveDate(false);

    const handleChange = (event, name) => {
      if (name === "orderDate") {
        event === null
          ? setOrderDatePick(null)
          : setOrderDatePick(event);
      } else {
        event === null
          ? setReceiveDatePick(null)
          : setReceiveDatePick(event);
      }
    };

    const handleSubmitOrder = async (event) => {
      event.preventDefault();

      const dateValue = orderDatePick === null ? '' : orderDatePick.format("yy-MM-DD"); 
      
      try {
        const response = await axios.put(`production/${data.pd_id}`, {
          dyeing_start: dateValue
        });
        
        if (response.data.success) {
          await Swal.fire({
            icon: "success",
            title: "Dyeing date updated",
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
        
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: error.response.data.error,
        });
      }
      
      setShowOrderDate(false);
    };

    const handleSubmitReceive = async (event) => {
      event.preventDefault();

      const dateValue = receiveDatePick === null ? '' : receiveDatePick.format("yy-MM-DD"); 

      try {
        const response = await axios.put(`production/${data.pd_id}`, {
          dyeing_end: dateValue
        });
        
        if (response.data.success) {
          await Swal.fire({
            icon: "success",
            title: "Dyeing date updated",
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
        
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: error.response.data.error,
        });
      }
      
      setShowOrderDate(false);
    };

    return (
      <>
        <div className="content-setting rounded-start border-end w-100 ms-2">
          <Button
            className="btn btn-setting py-0 px-1"
            onClick={handleOrderDShow}
          >
            วันสั่ง
          </Button>
          <Modal
            show={showOrderDate}
            onHide={handleOrderDClose}
            size="md"
            className="modal-date"
            centered
          >
            <form onSubmit={handleSubmitOrder}>
              <Modal.Header className="py-1">
                <Modal.Title className="mx-auto">Dyeing Start Date</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <LocalizationProvider dateAdapter={AdapterMoment}>
                  <StaticDatePicker
                    onChange={(e) => handleChange(e, "orderDate")}
                    value={orderDatePick}
                    slotProps={{
                      actionBar: {
                        actions: ["clear", "today"],
                      },
                      toolbar: {
                        hidden: true,
                      },
                    }}
                    className="date-picker"
                  />
                </LocalizationProvider>
              </Modal.Body>
              <Modal.Footer>
                <Button
                  type="submit"
                  className="col-5 mx-auto"
                  variant="danger"
                >
                  save
                </Button>
                <Button
                  onClick={handleOrderDClose}
                  className="col-5 mx-auto"
                  variant="outline-danger"
                >
                  close
                </Button>
              </Modal.Footer>
            </form>
          </Modal>
        </div>
        <div className="content-setting border-end w-100">
          <Button
            className="btn-setting py-0 px-1"
            onClick={handleReceiveDShow}
          >
            วันที่ได้รับ
          </Button>
          <Modal
            show={showReceiveDate}
            onHide={handleReceiveDClose}
            size="md"
            className="modal-date"
            centered
          >
            <form onSubmit={handleSubmitReceive}>
              <Modal.Header className="py-1">
                <Modal.Title className="mx-auto">
                  Dyeing Finished Date
                </Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <LocalizationProvider dateAdapter={AdapterMoment}>
                  <StaticDatePicker
                    onChange={(e) => handleChange(e, "receivedDate")}
                    value={receiveDatePick}
                    slotProps={{
                      actionBar: {
                        actions: ["clear", "today"],
                      },
                      toolbar: {
                        hidden: true,
                      },
                    }}
                    className="date-picker"
                  />
                </LocalizationProvider>
              </Modal.Body>
              <Modal.Footer>
                <Button
                  type="submit"
                  className="col-5 mx-auto"
                  variant="danger"
                >
                  save
                </Button>
                <Button
                  onClick={handleReceiveDClose}
                  className="btn col-5 mx-auto"
                  variant="outline-danger"
                >
                  close
                </Button>
              </Modal.Footer>
            </form>
          </Modal>
        </div>
        <div className="content-setting border-end w-100">
          <Button className="btn-setting py-0 px-0" onClick={handleNoteShow}>
            บันทึก
          </Button>
          <Modal
            show={showNote}
            onHide={handleNoteClose}
            size="lg"
            className="mt-5 modal-note"
          >
            <ProductionNote pd_id={data.pd_id} category="dyeing" />
          </Modal>
        </div>
        <div className="content-setting w-100">
          <Button className="btn-setting py-0 px-2" disabled>
            ประวัติ
          </Button>
        </div>
        <div className="content-setting rounded-end">
          <input
            type="checkbox"
            className="btn-check"
            id={`btn-check-dyeing-${data.pd_id}`}
            autoComplete="off"
            name="showTab"
            onChange={handleShow}
          />
          <label
            className="btn setting px-1 py-0 border-0"
            htmlFor={`btn-check-dyeing-${data.pd_id}`}
          >
            {showTab ? <IoIosCloseCircleOutline /> : <RiSettings3Fill />}
          </label>
        </div>
      </>
    );
  };

  return (
    <div className="fabric-order my-2">
      <Stack direction="horizontal" gap={0}>
      <Button className="btn btn-modal-factory-disabled py-1" disabled>0</Button>
        {showTab ? (
          <SettingRow />
        ) : (
          <>
            <div className="content-date text-start rounded-start ms-2 ps-2 w-25">
              <label className="title">ย้อมผ้า</label>
            </div>
            <div className="content-date text-end w-100 rounded-end">
              <label>{orderDate === "Invalid date" ? "" : orderDate}</label>
              <label className="mx-1">
                {orderDate !== "Invalid date" || receiveDate !== "Invalid date"
                  ? "|"
                  : null}
              </label>
              <label className="fw-bold pe-3">
                {receiveDate === "Invalid date" ? "" : receiveDate}
              </label>
              {(user.role !== "manager" && user.role !== "production") ||
              data.status === 2 ? 
              <>
                <Button className="btn-view-note py-0 px-2" onClick={handleNoteShow} disabled={handleDisabledNoteButton()}>
                  <NoteIcon />
                </Button>
                <Modal
                  show={showNote}
                  onHide={handleNoteClose}
                  size="lg"
                  className="modal-note"
                >
                  <ProductionNote pd_id={data.pd_id} category="dyeing" />
                </Modal>
              </> 
              : (
                <>
                  <input
                    type="checkbox"
                    className="btn-check"
                    id={`btn-check-dyeing-${data.pd_id}`}
                    autoComplete="off"
                    name="showTab"
                    onChange={handleShow}
                  />
                  <label
                    className="btn setting px-1 py-0 border-0"
                    htmlFor={`btn-check-dyeing-${data.pd_id}`}
                  >
                    {showTab ? (
                      <IoIosCloseCircleOutline />
                    ) : (
                      <RiSettings3Fill />
                    )}
                  </label>
                </>
              )}
            </div>
          </>
        )}
      </Stack>
    </div>
  );
}

export default DyeingOrder;
