import { useEffect, useState } from "react";
import { Row, Col, Form, InputGroup } from "react-bootstrap";
import { useSelector, useDispatch } from "react-redux";

import { setInputFabric } from "../../features/fabricCost/fabricCostSlice";

function FabricCreate({ onCreate }) {
  // const fabrics = useSelector((state) => state.fabricCost.fabrics);
  const dispatch = useDispatch();

  const [inputFabrics, setInputFabrics] = useState([
    {
      fabric_class: "",
      fabric_name: "",
      supplier: "",
      fabric_name_tnp: "",
      fabric_price_per_kg: "",
      shirt_per_kg: "",
      sewing_price: "",
    },
  ]);

  const [pricePercent, setPricePercent] = useState(0);

  const handleInputChange = (e, index) => {
    const { name, value } = e.target;
    const updatedFabrics = [...inputFabrics];
    updatedFabrics[index][name] = value;
    setInputFabrics(updatedFabrics);
    dispatch(setInputFabric(updatedFabrics));
  };

  const handleAddFabric = () => {
    setInputFabrics([...inputFabrics, {}]);
    dispatch(setInputFabric([...inputFabrics, {}]));
  };

  return (
    <Form>
      {inputFabrics.map((inputFabric, index) => {
        const fabricCost = isFinite(inputFabric.fabric_price_per_kg / inputFabric.shirt_per_kg)
          ? inputFabric.fabric_price_per_kg / inputFabric.shirt_per_kg
          : 0;

        const shirtCost = isNaN(fabricCost + Number(inputFabric.sewing_price))
          ? 0
          : fabricCost + Number(inputFabric.sewing_price);

        const shirtPrice =
          pricePercent === "100"
            ? (shirtCost * 100) / 1
            : Math.round((shirtCost * 100) / (100 - pricePercent));

        const profitPercent =
          shirtPrice && shirtCost
            ? Math.round(((shirtPrice - shirtCost) / shirtCost) * 100) + "%"
            : 0 + "%";

        return (
          <Row className="content my-2" key={index}>
            <Col>
              <Form.Select
                name="fabric_class"
                onChange={(e) => handleInputChange(e, index)}
                aria-label="select fabric class"
              >
                {/* <option value="R">R</option>
                <option value="P">P</option>
                <option value="PR">PR</option> */}
              </Form.Select>
            </Col>
            <Col>
              <Form.Control
                required
                type="text"
                value={inputFabric.fabric_name}
                name="fabric_name"
                onChange={(e) => handleInputChange(e, index)}
              />
            </Col>
            <Col>
              <Form.Control
                required
                type="text"
                value={inputFabric.supplier}
                name="supplier"
                onChange={(e) => handleInputChange(e, index)}
              />
            </Col>
            <Col>
              <Form.Control
                required
                type="text"
                value={inputFabric.fabric_name_tnp}
                name="fabric_name_tnp"
                onChange={(e) => handleInputChange(e, index)}
              />
            </Col>
            <Col>
              <Form.Control
                required
                type="number"
                value={inputFabric.fabric_price_per_kg}
                min={0}
                // step={0.01}
                name="fabric_price_per_kg"
                onChange={(e) => handleInputChange(e, index)}
              />
            </Col>
            <Col>
              <Form.Control
                required
                type="number"
                value={inputFabric.shirt_per_kg}
                min={0}
                name="shirt_per_kg"
                onChange={(e) => handleInputChange(e, index)}
              />
            </Col>
            <Col>
              <Form.Control readOnly type="number" value={fabricCost} name="fabric-cost" />
            </Col>
            <Col>
              <Form.Control
                required
                type="number"
                value={inputFabric.sewing_price}
                min={0}
                name="sewing_price"
                onChange={(e) => handleInputChange(e, index)}
              />
            </Col>
            <Col>
              <Form.Control readOnly type="number" value={shirtCost} name="shirt-cost" />
            </Col>
            <Col>
              <Form.Control readOnly type="number" value={shirtPrice} name="shirt-price" />
              <InputGroup>
                <Form.Control
                  type="number"
                  value={pricePercent}
                  name="shirt_price"
                  min={0}
                  max={100}
                  onChange={(e) => setPricePercent(e.target.value)}
                  placeholder="0"
                />
                <InputGroup.Text>%</InputGroup.Text>
              </InputGroup>
            </Col>
            <Col title="action">
              <Form.Control readOnly type="text" value={profitPercent} name="shirt-price" />
            </Col>
          </Row>
        );
      })}
    </Form>
  );
}

export default FabricCreate;
