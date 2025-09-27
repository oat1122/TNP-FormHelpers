import { useState } from "react";
import { Modal, Row, Col, Form, Button } from "react-bootstrap";
import { IoAlbumsOutline } from "react-icons/io5";

export const ModalProfit = ({ fabric, shirtCost }) => {
  const [screenCostModal, setScreenCostModal] = useState(""); // State screen cost in modal
  const [percentPriceModal, setPercentPriceModal] = useState(""); // State percent shirt price in modal
  const [show, setShow] = useState(false); // State show / hide fabric detail modal
  const handleModalClose = () => setShow(false); // Close fabric detail modal
  const handleModalShow = () => setShow(true); // Show fabric detail modal

  // Shirt price for display in modal
  const shirtPriceModal = isNaN(percentPriceModal)
    ? shirtCost
    : percentPriceModal === "100"
      ? (shirtCost * 100) / 1
      : Math.round((shirtCost * 100) / (100 - percentPriceModal) + Number(screenCostModal));

  // Shirt price
  const shirtPrice = isNaN(fabric.shirt_price_percent)
    ? shirtCost
    : fabric.shirt_price_percent === "100"
      ? (shirtCost * 100) / 1
      : Math.round((shirtCost * 100) / (100 - fabric.shirt_price_percent));

  const profit = Math.round(shirtPrice - shirtCost);

  const profitPercent =
    shirtPrice && shirtCost && Math.round(((shirtPrice - shirtCost) / shirtCost) * 100) + "%";

  // Profit price for render
  const renderedPriceProfit = (decrement) => {
    const shirtPrice = Math.round((shirtCost * 100) / (100 - decrement));
    const profit = shirtPrice - shirtCost;
    const profitPercent =
      shirtPrice && shirtCost && Math.round(((shirtPrice - shirtCost) / shirtCost) * 100) + "%";

    return (
      <>
        <Col lg="2" className="bg-dark rounded-3 m-2">
          <span className="font-24 fw-bold">{decrement}%</span>
        </Col>
        <Col lg="2" className="m-2">
          <Form.Control type="number" value={shirtPrice} readOnly className="fw-bold bg-gray" />
        </Col>
        <Col lg="2" className="m-2">
          <Form.Control type="number" value={profit} readOnly className="fw-bold bg-gray" />
        </Col>
        <Col lg="2" className="m-2">
          <Form.Control type="text" value={profitPercent} readOnly className="fw-bold bg-gray" />
        </Col>
      </>
    );
  };

  // Loop profit price columns
  const renderedPriceProfitColumns = (count) => {
    const columns = [];

    for (let i = 0, x = 40; i < count; i++, x -= 5) {
      columns.push(
        <Row className="d-flex justify-content-center text-white text-center" key={i}>
          {renderedPriceProfit(x)}
        </Row>
      );
    }

    return columns;
  };

  return (
    <>
      <Button
        variant="dark"
        onClick={handleModalShow}
        className="rounded-3 p-1 me-1 btn-action"
        title="Show profit window"
      >
        <IoAlbumsOutline size={22} />
      </Button>
      <Modal show={show} onHide={handleModalClose} size="xl" className="price-profit">
        <Modal.Body className="py-lg-5">
          <Row className="d-flex justify-content-center m-lg-3">
            <Col lg="9" className="bg-dark rounded-3">
              <span className="font-38 text-white">
                {fabric.fabric_name || ""}
                <small className="font-24 ms-2">{fabric.fabric_name_tnp || ""}</small>
                <small className="font-24"> | {fabric.supplier || ""}</small>
              </span>
            </Col>
          </Row>
          <Row className="d-flex justify-content-center text-white text-center mt-lg-5">
            <Col lg="2 m-2"></Col>
            <Col lg="2" className="bg-dark rounded-3 m-2">
              <span className="font-24 fw-bold">PRICE</span>
            </Col>
            <Col lg="2" className="bg-dark rounded-3 m-2">
              <span className="font-24 fw-bold">PROFIT</span>
            </Col>
            <Col lg="2" className="bg-dark rounded-3 m-2">
              <span className="font-24 fw-bold">PERCENTAGE</span>
            </Col>
          </Row>
          <Row className="d-flex justify-content-center text-white text-center">
            <Col lg="2" className="bg-dark rounded-3 m-2">
              <span className="font-24 fw-bold">DEFAULT</span>
            </Col>
            <Col lg="2" className="m-2">
              <Form.Control type="number" value={shirtPrice} readOnly className="fw-bold bg-gray" />
            </Col>
            <Col lg="2" className="m-2">
              <Form.Control type="number" value={profit} readOnly className="fw-bold bg-gray" />
            </Col>
            <Col lg="2" className="m-2">
              <Form.Control
                type="text"
                value={profitPercent}
                readOnly
                className="fw-bold bg-gray"
              />
            </Col>
          </Row>
          {renderedPriceProfitColumns(7)}
          <Row className="d-flex justify-content-center text-white text-center mt-lg-5">
            <Col lg="2" className="bg-dark rounded-3 m-lg-1 mx-lg-3">
              <span className="font-24 fw-bold">TOTAL COST</span>
            </Col>
            <Col lg="2" className="bg-dark rounded-3 m-lg-1 mx-lg-3">
              <span className="font-24 fw-bold">SCREEN COST</span>
            </Col>
            <Col lg="2" className="bg-dark rounded-3 m-lg-1 mx-lg-3">
              <span className="font-24 fw-bold">PRICE</span>
            </Col>
            <Col lg="2" className="bg-dark rounded-3 m-lg-1 mx-lg-3">
              <span className="font-24 fw-bold">PERCENTAGE</span>
            </Col>
          </Row>
          <Row className="d-flex justify-content-center text-white text-center">
            <Col lg="2" className="m-lg-1 mx-lg-3">
              <Form.Control type="number" value={shirtCost} readOnly className="fw-bold bg-gray" />
            </Col>
            <Col lg="2" className="m-lg-1 mx-lg-3">
              <Form.Control
                type="number"
                value={screenCostModal}
                onChange={(e) => setScreenCostModal(e.target.value)}
                className="fw-bold bg-gray"
                placeholder="0"
              />
            </Col>
            <Col lg="2" className="m-lg-1 mx-lg-3">
              <Form.Control
                type="number"
                value={shirtPriceModal}
                readOnly
                className="fw-bold bg-gray"
              />
            </Col>
            <Col lg="2" className="m-lg-1 mx-lg-3">
              <Form.Control
                type="number"
                value={percentPriceModal}
                name="shirt_price_percent"
                min={0}
                max={100}
                onChange={(e) => setPercentPriceModal(e.target.value)}
                placeholder="0"
                className="fw-bold bg-gray"
              />
            </Col>
          </Row>
        </Modal.Body>
      </Modal>
    </>
  );
};
