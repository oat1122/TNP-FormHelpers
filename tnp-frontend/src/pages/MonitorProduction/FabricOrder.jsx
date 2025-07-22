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
import { useSelector } from "react-redux";
import { open_dialog_ok_timer, open_dialog_error } from "../../utils/dialog_swal2/alart_one_line";

const NoteIcon = styled(MdNotes)({ 
  fontSize: "1.25rem",
});

function FabricOrder({ data }) {
  const { refetch } = useGetAllSheetsQuery();
  const user = JSON.parse(localStorage.getItem("userData"));
  const item_lists = useSelector((state) => state.monitorProduction.note_lists);
  const [showTab, setShowTab] = useState(null);
  const [showNote, setShowNote] = useState(false);
  const orderDate = moment(data.order_start).format("DD/MM/yy");
  const receiveDate = moment(data.order_end).format("DD/MM/yy");

  const handleShow = () => setShowTab(!showTab);
  const handleNoteShow = () => {
    setShowNote(true);
  };
  const handleNoteClose = () => {
    setShowNote(false);
  };

  const handleDisabledNoteButton = () => {
    return (
      item_lists.every(
        (item) => item.pd_id !== data.pd_id || item.note_category !== "order"
      ) || item_lists.length === 0
    );
  };

  const SettingRow = () => {
    const [showOrderDate, setShowOrderDate] = useState(false);
    const [showReceiveDate, setShowReceiveDate] = useState(false);
    const [orderDatePick, setOrderDatePick] = useState(
      moment(data.order_start)
    );
    const [receiveDatePick, setReceiveDatePick] = useState(
      moment(data.order_end)
    );

    const handleOrderDShow = () => setShowOrderDate(true);
    const handleReceiveDShow = () => setShowReceiveDate(true);
    const handleOrderDClose = () => setShowOrderDate(false);
    const handleReceiveDClose = () => setShowReceiveDate(false);

    const handleChange = (event, name) => {
      if (name === "orderDate") {
        event === null ? setOrderDatePick(null) : setOrderDatePick(event);
      } else {
        event === null ? setReceiveDatePick(null) : setReceiveDatePick(event);
      }
    };

    const handleSubmitOrder = async (event) => {
      event.preventDefault();

      const dateValue =
        orderDatePick === null ? "" : orderDatePick.format("yy-MM-DD");

      try {
        const response = await axios.put(`production/${data.pd_id}`, {
          order_start: dateValue,
        });

        if (response.data.success) {
          // ปิด modal ก่อนแสดง toast เพื่อป้องกันการเลื่อนหน้า
          setShowOrderDate(false);
          
          // แสดง toast แทน Swal
          await open_dialog_ok_timer("Order date updated");
          
          refetch();
        } else {
          // ปิด modal ก่อนแสดง error toast
          setShowOrderDate(false);
          
          open_dialog_error("Error", response.data.error);
        }
      } catch (error) {
        // ปิด modal ก่อนแสดง error toast
        setShowOrderDate(false);
        
        open_dialog_error("Error", error.response?.data?.error || "เกิดข้อผิดพลาดในการบันทึก");
      }
    };

    const handleSubmitReceive = async (event) => {
      event.preventDefault();

      const dateValue =
        receiveDatePick === null ? "" : receiveDatePick.format("yy-MM-DD");

      try {
        const response = await axios.put(`production/${data.pd_id}`, {
          order_end: dateValue,
        });

        if (response.data.success) {
          // ปิด modal ก่อนแสดง toast เพื่อป้องกันการเลื่อนหน้า
          setShowReceiveDate(false);
          
          // แสดง toast แทน Swal
          await open_dialog_ok_timer("Order date updated");
          
          refetch();
        } else {
          // ปิด modal ก่อนแสดง error toast
          setShowReceiveDate(false);
          
          open_dialog_error("Error", response.data.error);
        }
      } catch (error) {
        // ปิด modal ก่อนแสดง error toast
        setShowReceiveDate(false);
        
        open_dialog_error("Error", error.response?.data?.error || "เกิดข้อผิดพลาดในการบันทึก");
      }
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
                <Modal.Title className="mx-auto">Order Start Date</Modal.Title>
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
                  Order Finished Date
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
            <ProductionNote pd_id={data.pd_id} category="order"/>
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
            id={`btn-check-order-${data.pd_id}`}
            autoComplete="off"
            name="showTab"
            onChange={handleShow}
          />
          <label
            className="btn setting px-1 py-0 border-0"
            htmlFor={`btn-check-order-${data.pd_id}`}
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
        <Button className="btn btn-modal-factory-disabled py-1" disabled>
          0
        </Button>
        {showTab ? (
          <SettingRow />
        ) : (
          <>
            <div className="content-date text-start rounded-start ms-2 ps-2 w-25">
              <label className="title">สั่งผ้า</label>
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
              data.status === 2 ? (
                <>
                  <Button
                    className="btn-view-note py-0 px-2"
                    onClick={handleNoteShow}
                    disabled={handleDisabledNoteButton()}
                  >
                    <NoteIcon />
                  </Button>
                  <Modal
                    show={showNote}
                    onHide={handleNoteClose}
                    size="lg"
                    className="modal-note"
                  >
                    <ProductionNote
                      pd_id={data.pd_id}
                      category="order"
                    />
                  </Modal>
                </>
              ) : (
                <>
                  <input
                    type="checkbox"
                    className="btn-check"
                    id={`btn-check-order-${data.pd_id}`}
                    autoComplete="off"
                    name="showTab"
                    onChange={handleShow}
                  />
                  <label
                    className="btn setting px-1 py-0 border-0"
                    htmlFor={`btn-check-order-${data.pd_id}`}
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

export default FabricOrder;
