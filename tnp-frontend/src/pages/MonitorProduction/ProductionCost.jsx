import { useState, useEffect, useRef } from "react";
import { Button, TextField, InputAdornment, InputLabel } from "@mui/material";
import { Modal, Row, Col, Form } from "react-bootstrap";
import { BsPlusLg, BsTrash3 } from "react-icons/bs";
import axios from "../../api/axios";
import { useGetCostsQuery } from "../../api/slice";
import "./ProductionCost.css";

function ProductionCost({ myData, pd_id }) {
  const { refetch } = useGetCostsQuery(pd_id);
  const [showCost, setShowCost] = useState(false);
  const handleShow = () => setShowCost(true);

  const [inputList, setInputList] = useState([
    {
      cost_id: "",
      pd_id: pd_id,
      fabric: "",
      factory: "",
      fabric_color: "",
      quantity: "",
      fabric_price: "",
      sumPrice: 0,
    },
  ]);

  const [inputDel, setInputDel] = useState([{ cost_id: "" }]);

  const initialInputList = useRef([]);

  useEffect(() => {
    if (myData && myData.length > 0) {
      const transformedData = myData.map((item) => ({
        cost_id: item.cost_id,
        pd_id: item.pd_id,
        fabric: item.fabric === null ? "" : item.fabric,
        factory: item.factory === null ? "" : item.factory,
        fabric_color: item.fabric_color === null ? "" : item.fabric_color,
        quantity: item.quantity === null ? "" : item.quantity,
        fabric_price: item.fabric_price === null ? "" : item.fabric_price,
        sumPrice:
          (item.quantity && item.fabric_price) === null ? 0 : item.quantity * item.fabric_price,
      }));
      initialInputList.current = transformedData;
      setInputList(transformedData);
    } else {
      initialInputList.current = inputList;
      setInputList([
        {
          cost_id: "",
          pd_id: pd_id,
          fabric: "",
          factory: "",
          fabric_color: "",
          quantity: "",
          fabric_price: "",
          sumPrice: 0,
        },
      ]);
    }
  }, [myData]);

  const totalQuantity = inputList.reduce((acc, curr) => {
    return acc + Number(curr.quantity);
  }, 0);

  const totalCost = inputList.reduce((acc, curr) => {
    const quantity = Number(curr.quantity) || null;
    const price = Number(curr.fabric_price) || null;
    const totalCost = quantity * price;
    return acc + totalCost;
  }, 0);

  const handleClose = async () => {
    setShowCost(false);
    setTimeout(() => {
      setInputList(initialInputList.current);
    }, 500);
    setInputDel([]);
  };

  // handle input change
  const handleInputChange = (event, index) => {
    const { name, value } = event.target;
    const list = [...inputList];
    list[index][name] = value;

    // calculate total cost for this row
    const quantity = Number(list[index].quantity);
    const fabricPrice = Number(list[index].fabric_price);
    list[index].sumPrice = quantity * fabricPrice;

    setInputList(list);
  };

  // handle click event of the Remove button
  const handleRemoveClick = (index, cost_id) => {
    const list = [...inputList];
    list.splice(index, 1);
    setInputList(list);
    setInputDel([...inputDel, { cost_id: cost_id }]);
  };

  // handle click event of the Add button
  const handleAddClick = () => {
    setInputList([
      ...inputList,
      {
        cost_id: "",
        pd_id: pd_id,
        fabric: "",
        factory: "",
        fabric_color: "",
        quantity: "",
        fabric_price: "",
      },
    ]);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      const response = await axios.post(`updateCost`, {
        inputList,
        initialInputList,
        inputDel,
      });

      console.log(response.data.message);
    } catch (error) {
      console.log(error);
    }

    setShowCost(false);
    refetch();
  };

  return (
    <div className="production-cost pe-0">
      <Button
        className="text-center ps-2 btn fs-5 rounded-2"
        onClick={handleShow}
        name="cost-modal"
      >
        ต้นทุนการผลิต
      </Button>
      <Modal show={showCost} onHide={handleClose} className="production-cost">
        <Form onSubmit={handleSubmit}>
          <Modal.Body className="p-4 pb-0">
            <Row className="text-center">
              <Col lg={1} className="d-none d-lg-block">
                <h4>ลำดับ</h4>
              </Col>
              <Col lg={2} className="d-none d-lg-block">
                <h4>ชื่อผ้า</h4>
              </Col>
              <Col lg={2} className="d-none d-lg-block">
                <h4>ร้านผ้า</h4>
              </Col>
              <Col lg={2} className="d-none d-lg-block">
                <h4>สีผ้า</h4>
              </Col>
              <Col lg={2} className="d-none d-lg-block">
                <h4>จำนวนผ้า/โล</h4>
              </Col>
              <Col lg={1} className="d-none d-lg-block">
                <h4>ราคา</h4>
              </Col>
              <Col lg={1} className="d-none d-lg-block">
                <h4>ราคารวม</h4>
              </Col>
              <Col lg={1} className="d-none d-lg-block"></Col>
            </Row>
            {inputList.map((cost, index) => {
              return (
                <Row key={index} className="text-center mt-md-0 mt-lg-3">
                  <Col md={2} lg={1} className="">
                    <InputLabel htmlFor="number-input" className="d-none d-lg-none d-md-block">
                      <h4>ลำดับ</h4>
                    </InputLabel>
                    <h4 className="pt-1 mb-0">{index + 1}</h4>
                  </Col>
                  <Col md={10} lg={2} className="mt-2 mt-md-0">
                    <InputLabel htmlFor="input-fabric-name" className="d-lg-none">
                      <h4>ชื่อผ้า</h4>
                    </InputLabel>
                    <TextField
                      type="text"
                      variant="outlined"
                      className="form-control"
                      name="fabric"
                      value={cost.fabric}
                      onChange={(event) => handleInputChange(event, index)}
                    />
                  </Col>
                  <Col md={6} lg={2} className="mt-2 mt-md-2 mt-lg-0">
                    <InputLabel htmlFor="input-factory" className="d-lg-none">
                      <h4>ร้านผ้า</h4>
                    </InputLabel>
                    <TextField
                      type="text"
                      variant="outlined"
                      className="form-control"
                      name="factory"
                      value={cost.factory}
                      onChange={(event) => handleInputChange(event, index)}
                    />
                  </Col>
                  <Col md={6} lg={2} className="mt-2 mt-lg-0">
                    <InputLabel htmlFor="input-fabric-color" className="d-lg-none">
                      <h4>สีผ้า</h4>
                    </InputLabel>
                    <TextField
                      type="text"
                      variant="outlined"
                      className="form-control"
                      name="fabric_color"
                      value={cost.fabric_color}
                      onChange={(event) => handleInputChange(event, index)}
                    />
                  </Col>
                  <Col xs={6} md={6} lg={2} className="mt-2 mt-lg-0">
                    <InputLabel htmlFor="input-quantity" className="d-lg-none">
                      <h4>จำนวนผ้า/โล</h4>
                    </InputLabel>
                    <TextField
                      type="number"
                      variant="outlined"
                      className="form-control"
                      name="quantity"
                      inputProps={{ min: 0, step: 0.1 }}
                      value={cost.quantity}
                      onChange={(event) => handleInputChange(event, index)}
                    />
                  </Col>
                  <Col xs={6} md={6} lg={1} className="mt-2 mt-lg-0">
                    <InputLabel htmlFor="input-fabric-price" className="d-lg-none">
                      <h4>ราคา</h4>
                    </InputLabel>
                    <TextField
                      type="number"
                      variant="outlined"
                      className="form-control"
                      name="fabric_price"
                      inputProps={{ min: 0 }}
                      value={cost.fabric_price}
                      onChange={(event) => handleInputChange(event, index)}
                    />
                  </Col>
                  <Col md={10} lg={1} className="mt-2 mt-lg-0">
                    <InputLabel htmlFor="input-sum-price" className="d-lg-none">
                      <h4>ราคารวม</h4>
                    </InputLabel>
                    <TextField
                      type="number"
                      variant="outlined"
                      className="form-control"
                      value={cost.sumPrice}
                      onChange={(event) => handleInputChange(event, index)}
                      disabled
                    />
                  </Col>
                  <Col md={2} lg={1} className="mt-3 mt-lg-0">
                    {inputList.length !== 1 && (
                      <Button
                        className="btn remove w-100 mt-md-4 mt-lg-0"
                        variant="outlined"
                        onClick={() => handleRemoveClick(index, cost.cost_id)}
                      >
                        <BsTrash3 />
                      </Button>
                    )}
                  </Col>
                  <hr className="d-lg-none mt-3 mt-md-4" />
                </Row>
              );
            })}
            <Col lg={12} className="mt-md-2 mt-lg-4">
              <Button variant="outlined" className="btn col-12" onClick={handleAddClick}>
                <BsPlusLg />
              </Button>
            </Col>
            <hr className="d-lg-none mt-3 mb-0" />
          </Modal.Body>
          <Modal.Footer className="border border-0 d-block">
            <Row className="mt-0 mt-lg-5 gx-4 row-sum">
              <Col sm={12} md={6} lg={3} className="ps-md-2 ps-xl-5 d-none d-lg-inline">
                <Button type="submit" variant="contained" size="small" className="btn">
                  Save
                </Button>
              </Col>
              <Col sm={12} md={6} lg={3} className="pe-md-3 pe-xl-5 d-none d-lg-inline">
                <Button
                  variant="outlined"
                  size="small"
                  className="btn"
                  onClick={handleClose}
                  name="cost-close-modal"
                >
                  Close
                </Button>
              </Col>
              <Col sm={12} lg={2} className="text-center text-lg-end">
                <h4 className="">รวมทั้งหมด</h4>
              </Col>
              <Col xs={6} md={6} lg={2} className="ps-lg-3 mt-md-2 mt-lg-0">
                <TextField
                  type="number"
                  variant="outlined"
                  className="form-control"
                  value={totalQuantity}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">kg</InputAdornment>,
                  }}
                  disabled
                />
              </Col>
              <Col xs={6} md={6} lg={2} className="ps-lg-3 mt-md-2 mt-lg-0">
                <TextField
                  type="number"
                  variant="outlined"
                  className="form-control"
                  value={totalCost}
                  InputProps={{
                    endAdornment: <InputAdornment position="start">฿</InputAdornment>,
                  }}
                  disabled
                />
              </Col>
              <hr className="d-lg-none my-4" />
              <Col sm={12} md={6} lg={3} className="ps-md-2 ps-xl-5 pb-2 d-lg-none">
                <Button type="submit" variant="contained" size="small" className="btn">
                  Save
                </Button>
              </Col>
              <Col sm={12} md={6} lg={3} className="pe-md-3 pe-xl-5 d-lg-none">
                <Button
                  variant="outlined"
                  size="small"
                  className="btn"
                  onClick={handleClose}
                  name="cost-close-modal"
                >
                  Close
                </Button>
              </Col>
            </Row>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
}

export default ProductionCost;
