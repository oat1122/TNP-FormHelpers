import { useState } from "react";
import { Card, Stack, Row, Col, Modal, ListGroup } from "react-bootstrap";
import Button from "@mui/material/Button";
import ToggleButton from "@mui/material/ToggleButton";
import "./ShowButton.css";
import { RiSettings3Fill } from "react-icons/ri";
import { IoIosCloseCircleOutline } from "react-icons/io";
import { BsPlusLg } from "react-icons/bs";
import { RxCounterClockwiseClock } from "react-icons/rx";
import { TextField, TextareaAutosize, Select } from "@mui/material";
import { AdapterMoment } from "@mui/x-date-pickers/AdapterMoment";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { StaticDatePicker } from "@mui/x-date-pickers/StaticDatePicker";
import { Link } from "react-router-dom";

function ShowButton({ id, onSubmit }) {
  const selectProcess = () => {
    const [checked_1, setChecked_1] = useState(null);
    const [checked_2, setChecked_2] = useState(null);
    const [productionType, setProductionType] = useState("");

    const handleChecked = (event) => {
      const check_name = event.target.name;
      const check_value = event.target.value;

      if (checked_1 !== id && check_name === "checked_1") {
        setChecked_1(id);
        setProductionType(check_value);
        onSubmit(productionType);
        console.log(productionType);
      } else if (checked_2 !== id && check_name === "checked_2") {
        setChecked_2(id);
        setProductionType(check_value);
        onSubmit(productionType);
      } else {
        setChecked_1(null);
        setChecked_2(null);
      }
    };

    return (
      <div className="select-process">
        <div className="row">
          <div className="col-6 pe-1">
            <input
              type="checkbox"
              className="btn-check"
              autoComplete="off"
              id={`btn-check-1-${id}`}
              checked={checked_1 === id ? true : false}
              disabled={checked_2 === id ? true : false}
              onChange={handleChecked}
              name="checked_1"
              value="1"
            />
            <label className="btn btn-choose p-2 p-md-3 p-lg-2" htmlFor={`btn-check-1-${id}`}>
              <h1 className="mb-0">1</h1>
              ตัดเย็บเป็นตัว
              <br />
              และนำมาปัก/สกรีน
            </label>
            {checked_1 === id ? screenPoint() : null}
          </div>
          <div className="col-6 ps-1">
            <input
              type="checkbox"
              className="btn-check"
              autoComplete="off"
              id={`btn-check-2-${id}`}
              checked={checked_2 === id ? true : false}
              disabled={checked_1 === id ? true : false}
              onChange={handleChecked}
              name="checked_2"
              value="2"
            />
            <label className="btn btn-choose p-2 p-md-3 p-lg-2" htmlFor={`btn-check-2-${id}`}>
              <h1 className="mb-0">2</h1>
              ตัด นำมาปัก/สกรีน
              <br />
              แล้วนำไปเย็บเป็นตัว
            </label>
            {checked_2 === id ? screenPoint() : null}
          </div>
        </div>
        {checked_1 || checked_2 ? <StartComplete /> : null}
      </div>
    );
  };

  const screenPoint = () => {
    return (
      <div
        className="btn-group-vertical"
        role="group"
        aria-label="Basic checkbox toggle button group"
      >
        <input
          type="checkbox"
          className="btn-check"
          id={`check-screen-${id}`}
          autoComplete="off"
          value="1"
          name="screen"
          onChange={(event) => onScreen(event.target.value)}
        />
        <label className="btn btn-toggle mt-2 px-4 py-1" htmlFor={`check-screen-${id}`}>
          มีสกรีน
        </label>
        <input
          type="checkbox"
          className="btn-check"
          id={`check-dft-${id}`}
          autoComplete="off"
          value="1"
          name="dft"
          onChange={(event) => onDft(event.target.value)}
        />
        <label className="btn btn-toggle mt-2 px-4 py-1" htmlFor={`check-dft-${id}`}>
          มี DFT
        </label>
        <input
          type="checkbox"
          className="btn-check"
          id={`check-embroid-${id}`}
          autoComplete="off"
          value="1"
          name="embroid"
          onChange={(event) => onEmbroid(event.target.value)}
        />
        <label className="btn btn-toggle mt-2 px-4 py-1" htmlFor={`check-embroid-${id}`}>
          มีปัก
        </label>
      </div>
    );
  };

  return <div>{selectProcess()}</div>;
}

export const ScreenPoint = (props) => {
  const { id, onScreen, onDft, onEmbroid } = props;

  return (
    <div
      className="btn-group-vertical"
      role="group"
      aria-label="Basic checkbox toggle button group"
    >
      <input
        type="checkbox"
        className="btn-check"
        id={`check-screen-${id}`}
        autoComplete="off"
        value="1"
        name="screen"
        onChange={(event) => onScreen(event.target.value)}
      />
      <label className="btn btn-toggle mt-2 px-4 py-1" htmlFor={`check-screen-${id}`}>
        มีสกรีน
      </label>
      <input
        type="checkbox"
        className="btn-check"
        id={`check-dft-${id}`}
        autoComplete="off"
        value="1"
        name="dft"
        onChange={(event) => onDft(event.target.value)}
      />
      <label className="btn btn-toggle mt-2 px-4 py-1" htmlFor={`check-dft-${id}`}>
        มี DFT
      </label>
      <input
        type="checkbox"
        className="btn-check"
        id={`check-embroid-${id}`}
        autoComplete="off"
        value="1"
        name="embroid"
        // checked={embroid}
        onChange={(event) => onEmbroid(event.target.value)}
        // onChange={handleChecked}
      />
      <label className="btn btn-toggle mt-2 px-4 py-1" htmlFor={`check-embroid-${id}`}>
        มีปัก
      </label>
    </div>
  );
};

export const StartComplete = () => (
  <Button type="submit" variant="outlined" className="col-5 btn-start mt-3">
    START
  </Button>
);

export const SelectProcess_2 = (props) => {
  const { id } = props;

  const [showCost, setShowCost] = useState(false);
  const [showTabSetting, setShowTabSetting] = useState(false);
  const [showEmbroidBlock, setShowEmbroidBlock] = useState(false);
  const [showScreenBlock, setShowScreenBlock] = useState(false);
  const [showDFTBlock, setShowDFTBlock] = useState(false);

  const [radioEmbroid, setRadioEmbroid] = useState(null);
  const [radioScreen, setRadioScreen] = useState(null);
  const [radioDFT, setRadioDFT] = useState(null);

  const embroidValue = [
    { name: "ส่งโรงเจี๊ยบ", value: "1" },
    { name: "ส่งโรงเอ็ม", value: "2" },
    { name: "ส่งโรงอื่นๆ", value: "3" },
  ];

  const screenValue = [
    { name: "ทำเสร็จแล้ว", value: "IN" },
    { name: "ส่งออกไม่ได้ทำ", value: "OUT" },
    { name: "กำลังแก้ไข", value: "EDIT" },
  ];

  const dftValue = [
    { name: "ทำเสร็จแล้ว", value: "IN" },
    { name: "ส่งออกไม่ได้ทำ", value: "OUT" },
    { name: "กำลังแก้ไข", value: "EDIT" },
  ];

  const handleShow = () => setShowCost(true);
  const handleClose = () => setShowCost(false);
  const handleEmbroidBlockClose = () => setShowEmbroidBlock(false);
  const handleEmbroidBlockShow = () => setShowEmbroidBlock(true);
  const handleScreenBlockClose = () => setShowScreenBlock(false);
  const handleScreenBlockShow = () => setShowScreenBlock(true);
  const handleDFTBlockClose = () => setShowDFTBlock(false);
  const handleDFTBlockShow = () => setShowDFTBlock(true);
  const handleSettingShow = () => {
    setShowTabSetting(!showTabSetting);
  };

  return (
    <ListGroup className="list-group-flush fs-5">
      <ListGroup.Item className="col-12 mx-auto">
        <Button className="card-text text-center ps-2 btn fs-5" onClick={handleShow}>
          ต้นทุนการผลิต
        </Button>
        <hr className="mt-1 mb-2" />
        <Modal show={showCost} onHide={handleClose} size="lg" className="modal-cost">
          <Modal.Header closeButton className="d-lg-none">
            {/* <Modal.Title>Modal heading</Modal.Title> */}
          </Modal.Header>

          <Modal.Body className="p-4">
            {/* <Row className="text-center row-cost" lg={12}> */}

            <Row key={id} className="text-center row-cost gx-4">
              <Col lg={3} className="d-none d-lg-block ps-5">
                <h4>ชื่อผ้า</h4>
              </Col>
              <Col lg={3} className="d-none d-lg-block">
                <h4>ร้านผ้า</h4>
              </Col>
              <Col lg={3} className="d-none d-lg-block">
                <h4>สีผ้า</h4>
              </Col>
              <Col lg={3} className="d-none d-lg-block">
                <h4>จำนวนที่ใช้/โล</h4>
              </Col>
              <Col lg={3} className="mt-2 d-flex ps-0">
                <h4 className="label-num px-3 mb-0"></h4>
                <TextField type="text" variant="outlined" className="form-control" />
              </Col>
              <Col lg={3} className="mt-2">
                <TextField type="text" variant="outlined" className="form-control" />
              </Col>
              <Col lg={3} className="mt-2">
                <TextField type="text" variant="outlined" className="form-control" />
              </Col>
              <Col lg={3} className="mt-2">
                <TextField type="text" variant="outlined" className="form-control" />
              </Col>

              <hr className="d-lg-none mt-4" />

              <Col lg={3} className="mt-3 d-flex ps-0">
                <h4 className="label-num px-3 mb-0"></h4>
                <TextField type="text" variant="outlined" className="form-control" />
              </Col>
              <Col lg={3} className="mt-3">
                <TextField type="text" variant="outlined" className="form-control" />
              </Col>
              <Col lg={3} className="mt-3">
                <TextField type="text" variant="outlined" className="form-control" />
              </Col>
              <Col lg={3} className="mt-3">
                <TextField type="text" variant="outlined" className="form-control" />
              </Col>
              <hr className="d-lg-none mt-4" />
              <Col lg={12} className="mt-3 ps-lg-5">
                <Button variant="outlined" className="btn btn-add col-12">
                  <BsPlusLg />
                </Button>
              </Col>
              {/* For Mobile and Tablet */}
              <hr className="d-lg-none mt-4" />
              <Col sm={12} lg={9} className="mt-2 d-lg-none">
                <h4 className="pt-1">รวมทั้งหมด</h4>
              </Col>
              <Col sm={12} lg={3} className="ps-lg-3 mt-2 d-lg-none">
                <TextField type="text" variant="outlined" className="form-control" disabled />
              </Col>
              <Row className="mt-5 gx-4 row-sum d-none d-lg-flex">
                <Col sm={12} lg={9} className="text-lg-end">
                  <h4 className="pt-1">รวมทั้งหมด</h4>
                </Col>
                <Col lg={3} className="ps-lg-3">
                  <TextField type="text" variant="outlined" className="form-control" disabled />
                </Col>
              </Row>
            </Row>
          </Modal.Body>
        </Modal>

        <Button className="btn card-link">
          <RiSettings3Fill />
        </Button>
        <Card.Text className="ps-2 setting">
          <Stack direction="horizontal" gap={1}>
            <label>สั่งผ้า</label>
            <label className="ms-auto label-sm">21/11/2022 |</label>
            <label className="me-2">28/11/2022</label>
          </Stack>
        </Card.Text>
        <Button className="btn card-link">
          <RiSettings3Fill />
        </Button>
        <Card.Text className="ps-2 setting">
          <Stack direction="horizontal" gap={1}>
            <label>ย้อมผ้า</label>
          </Stack>
        </Card.Text>
        <input
          type="checkbox"
          className="btn-check"
          id="btn-check-setting"
          autoComplete="off"
          onChange={handleSettingShow}
        />
        <label className="btn btn-setting" htmlFor="btn-check-setting">
          {showTabSetting ? <IoIosCloseCircleOutline /> : <RiSettings3Fill />}
        </label>

        {showTabSetting ? (
          <ShowSetting />
        ) : (
          <Card.Text className="ps-2 setting">
            <Stack direction="horizontal" gap={1}>
              <label>ตัด</label>
            </Stack>
          </Card.Text>
        )}

        <Card.Text className="ps-2 setting" style={{ opacity: "0.2" }}>
          <Stack direction="horizontal" gap={1}>
            <label>เย็บ</label>
          </Stack>
        </Card.Text>

        <hr className="mt-1 mb-2" />
        <Button className="btn card-link" onClick={handleEmbroidBlockShow}>
          <RiSettings3Fill />
        </Button>

        <Modal
          show={showEmbroidBlock}
          onHide={handleEmbroidBlockClose}
          size="md"
          className="modal-embroid"
        >
          <Modal.Header className="justify-content-end border border-0 py-0 px-1">
            <Modal.Title>
              <Link to="/showlog" target="_blank">
                <Button className="btn-log">
                  <RxCounterClockwiseClock />
                </Button>
              </Link>
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="pt-0 pb-5 text-center">
            {embroidValue.map((radio, idx) => (
              <Col className="d-inline mx-1">
                <ToggleButton
                  key={idx}
                  id={`radio-${idx}`}
                  type="radio"
                  variant="outline-secondary"
                  name="radio"
                  className="col-4 col-md-3 mx-2 pb-3 mt-3 mt-lg-0"
                  value={radio.value}
                  checked={radioEmbroid === radio.value}
                  onChange={(e) => setRadioEmbroid(e.currentTarget.value)}
                >
                  <h1>{radio.value}</h1>
                  {radio.name}
                </ToggleButton>
              </Col>
            ))}
          </Modal.Body>
        </Modal>
        <Card.Text className="ps-2 setting">
          <Stack direction="horizontal" gap={1}>
            <label>บล็อคปัก</label>
          </Stack>
        </Card.Text>

        <Button className="btn card-link" onClick={handleScreenBlockShow}>
          <RiSettings3Fill />
        </Button>
        <Modal
          show={showScreenBlock}
          onHide={handleScreenBlockClose}
          size="md"
          className="modal-embroid"
        >
          <Modal.Header className="justify-content-end border border-0 py-0 px-1">
            <Modal.Title>
              <Link to="/showlog" target="_blank">
                <Button className="btn-log">
                  <RxCounterClockwiseClock />
                </Button>
              </Link>
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="pt-0 pb-5 text-center">
            {screenValue.map((radio, idx) => (
              <Col className="d-inline mx-1">
                <ToggleButton
                  key={idx}
                  id={`radio-${idx}`}
                  type="radio"
                  variant="outline-secondary"
                  name="radio"
                  className="col-4 col-md-3 mx-2 pb-3 mt-3 mt-lg-0"
                  value={radio.value}
                  checked={radioScreen === radio.value}
                  onChange={(e) => setRadioScreen(e.currentTarget.value)}
                >
                  <h1>{radio.value}</h1>
                  {radio.name}
                </ToggleButton>
              </Col>
            ))}
          </Modal.Body>
        </Modal>
        <Card.Text className="ps-2 setting">
          <Stack direction="horizontal" gap={1}>
            <label>บล็อคสกรีน</label>
          </Stack>
        </Card.Text>

        <Button className="btn card-link" onClick={handleDFTBlockShow}>
          <RiSettings3Fill />
        </Button>
        <Modal show={showDFTBlock} onHide={handleDFTBlockClose} size="md" className="modal-embroid">
          <Modal.Header className="justify-content-end border border-0 py-0 px-1">
            <Modal.Title>
              <Link to="/showlog" target="_blank">
                <Button className="btn-log">
                  <RxCounterClockwiseClock />
                </Button>
              </Link>
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="pt-0 pb-5 text-center">
            {screenValue.map((radio, idx) => (
              <Col className="d-inline mx-1">
                <ToggleButton
                  key={idx}
                  id={`radio-${idx}`}
                  type="radio"
                  variant="outline-secondary"
                  name="radio"
                  className="col-4 col-md-3 mx-2 pb-3 mt-3 mt-lg-0"
                  value={radio.value}
                  checked={radioDFT === radio.value}
                  onChange={(e) => setRadioDFT(e.currentTarget.value)}
                >
                  <h1>{radio.value}</h1>
                  {radio.name}
                </ToggleButton>
              </Col>
            ))}
          </Modal.Body>
        </Modal>
        <Card.Text className="ps-2 setting">
          <Stack direction="horizontal" gap={1}>
            <label>ไฟล์ DFT</label>
          </Stack>
        </Card.Text>
      </ListGroup.Item>
    </ListGroup>
  );
};

const ButtonFill = () => (
  <div className="App mt-4 text-center">
    <Button variant="contained" className="btn-filter me-4 col-5 col-md-4 col-lg-3 col-xl-2">
      All
    </Button>
    <Button variant="contained" className="btn-filter col-5 col-md-4 col-lg-3 col-xl-2">
      MY WORK
    </Button>
  </div>
);

const ShowSetting = () => {
  const [showOrderDate, setShowOrderDate] = useState(false);
  const [showReceiveDate, setShowReceiveDate] = useState(false);
  const [showNote, setShowNote] = useState(false);

  const [orderDatePick, setOrderDatePick] = useState(null);
  const [receiveDatePick, setReceiveDatePick] = useState(null);

  const handleOrderDClose = () => setShowOrderDate(false);
  const handleOrderDShow = () => setShowOrderDate(true);
  const handleReceiveDClose = () => setShowReceiveDate(false);
  const handleReceiveDShow = () => setShowReceiveDate(true);
  const handleNoteClose = () => setShowNote(false);
  const handleNoteShow = () => setShowNote(true);

  return (
    <Card.Text className="ps-0 fs-6 setting">
      <Stack direction="horizontal" gap={0}>
        <button
          className="btn btn-edit p-0 mx-auto"
          style={{
            borderTopLeftRadius: "1rem",
            borderBottomLeftRadius: "1rem",
          }}
          onClick={handleOrderDShow}
        >
          วันสั่ง
        </button>

        <Modal
          show={showOrderDate}
          onHide={handleOrderDClose}
          size="md"
          className="modal-order-date"
          centered
        >
          <Modal.Header className="text-center">
            <Modal.Title>Fabric Order Date</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <LocalizationProvider dateAdapter={AdapterMoment}>
              <StaticDatePicker
                onChange={(newValue) => setOrderDatePick(newValue)}
                value={orderDatePick}
                renderInput={(params) => <TextField {...params} />}
                componentsProps={{
                  actionBar: {
                    actions: ["today"],
                  },
                }}
                toolbarFormat="DD MMM YYYY"
                inputFormat="DD/MM/YYYY"
              />
            </LocalizationProvider>
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="contained"
              onClick={handleOrderDClose}
              size="small"
              className="btn btn-order-date col-5 mx-auto"
            >
              Save
            </Button>
            <Button
              variant="outlined"
              onClick={handleOrderDClose}
              className="btn btn-order-date-outlined col-5 mx-auto"
            >
              Close
            </Button>
          </Modal.Footer>
        </Modal>

        <div className="vr"></div>
        <button className="btn btn-edit p-0 mx-auto" onClick={handleReceiveDShow}>
          วันที่ได้รับ
        </button>
        <Modal
          show={showReceiveDate}
          onHide={handleReceiveDClose}
          size="md"
          className="modal-order-date"
          centered
        >
          <Modal.Header className="text-center">
            <Modal.Title>Fabric Receive Date</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <LocalizationProvider dateAdapter={AdapterMoment}>
              <StaticDatePicker
                onChange={(newValue) => setReceiveDatePick(newValue)}
                value={receiveDatePick}
                renderInput={(params) => <TextField {...params} />}
                componentsProps={{
                  actionBar: {
                    actions: ["today"],
                  },
                }}
                toolbarFormat="DD MMM YYYY"
                inputFormat="DD/MM/YYYY"
              />
            </LocalizationProvider>
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="contained"
              onClick={handleReceiveDClose}
              size="small"
              className="btn btn-order-date col-5 mx-auto"
            >
              Save
            </Button>
            <Button
              variant="outlined"
              onClick={handleReceiveDClose}
              className="btn btn-order-date-outlined col-5 mx-auto"
            >
              Close
            </Button>
          </Modal.Footer>
        </Modal>

        <div className="vr"></div>
        <button className="btn btn-edit p-0 mx-auto" onClick={handleNoteShow}>
          บันทึก
        </button>
        <Modal show={showNote} onHide={handleNoteClose} size="lg" className="mt-5 modal-note">
          <Modal.Body className="m-3">
            <Row className="pe-lg-3">
              <Col xs={12} lg={11}>
                <TextareaAutosize
                  className="form-control textarea-post"
                  placeholder="กรอกรายละเอียดงาน"
                />
              </Col>
              <Col xs={12} lg={1} className="text-end ps-lg-0 mt-3 mt-lg-0">
                <Button variant="contained" className="btn btn-post col-4 col-md-3 col-lg-8">
                  POST
                </Button>
              </Col>
            </Row>
            <hr className="d-lg-none " />
            <Row className="row-post mt-3 py-2">
              <Col lg={10}>
                <label>
                  Lorem Ipsum
                  <br />
                  Lorem Ipsum คือ เนื้อหาจำลองแบบเรียบๆ ที่ใช้กันในธุรกิจงานพิมพ์หรืองานเรียงพิมพ์
                </label>
              </Col>
              <Col lg={2} className="d-flex align-items-end justify-content-end flex-column">
                <label className="fs-6" style={{ lineHeight: "0.5rem" }}>
                  YING
                </label>
                <label style={{ fontSize: "1.25rem" }}>12.08</label>
              </Col>
            </Row>
          </Modal.Body>
        </Modal>

        <div className="vr"></div>
        <Link
          className="btn btn-edit p-0 mx-auto"
          style={{
            borderTopRightRadius: "1rem",
            borderBottomRightRadius: "1rem",
          }}
          //   onClick={handleLogShow}
          to="/showlog"
          target="_blank"
        >
          ประวัติ
        </Link>
      </Stack>
    </Card.Text>
  );
};

export default ShowButton;
