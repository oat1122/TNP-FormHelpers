import { useEffect, useState } from "react";
import { Modal, Row, Col, Form, Button } from "react-bootstrap";
import { useSelector } from "react-redux";
import { AiOutlineControl } from "react-icons/ai";
import {
  useUpdateCostFabricOnceMutation,
  useGetFabricByPatternIdQuery,
} from "../../services/tnpApi";
import Swal from "sweetalert2";

function FabricEdit({ fabric }) {
  const [showEdit, setShowEdit] = useState(false); // State show / hide edit fabric detail modal
  const shirtCate = useSelector((state) => state.fabricCost.pattern.shirtCate);
  const [updateCostFabricOnce] = useUpdateCostFabricOnceMutation();
  const pattern = useSelector((state) => state.fabricCost.pattern.id);
  const { refetch } = useGetFabricByPatternIdQuery(pattern);

  const [fabricInput, setFabricInput] = useState({
    cost_fabric_id: fabric.cost_fabric_id,
    pattern_id: pattern,
    fabric_name: fabric.fabric_name,
    supplier: fabric.supplier,
    fabric_name_tnp: fabric.fabric_name_tnp,
    fabric_kg: fabric.fabric_kg,
    collar_kg: fabric.collar_kg,
    fabric_price_per_kg: fabric.fabric_price_per_kg,
    shirt_per_total: fabric.shirt_per_total,
    cutting_price: fabric.cutting_price,
    sewing_price: fabric.sewing_price,
    collar_price: fabric.collar_price,
    button_price: fabric.button_price,
  });

  const resetFabricInput = () => {
    setFabricInput({
      cost_fabric_id: fabric.cost_fabric_id,
      fabric_kg: fabric.fabric_kg,
      collar_kg: fabric.collar_kg,
      fabric_price_per_kg: fabric.fabric_price_per_kg,
      shirt_per_total: fabric.shirt_per_total,
      cutting_price: fabric.cutting_price,
      sewing_price: fabric.sewing_price,
      collar_price: fabric.collar_price,
      button_price: fabric.button_price,
    });
  };

  const calculatedFabricCost =
    ((Number(fabricInput.fabric_kg) + Number(fabricInput.collar_kg)) *
      fabricInput.fabric_price_per_kg) /
    fabricInput.shirt_per_total; // Calculate fabric cost
  const fabricCost = isFinite(calculatedFabricCost) ? calculatedFabricCost.toFixed() : 0; // Result fabric cost
  const calcShirtCost =
    Number(fabricCost) +
    Number(fabricInput.sewing_price) +
    Number(fabricInput.cutting_price) +
    Number(fabricInput.collar_price) +
    Number(fabricInput.button_price); // Calculate shirt cost
  const shirtCost = isNaN(calcShirtCost) ? 0 : calcShirtCost.toFixed(); // Result shirt cost

  // Show edit fabric modal
  const handleModalEditClose = () => {
    setShowEdit(false);
    resetFabricInput();
  };

  // Close edit fabric modal
  const handleModalEditShow = () => setShowEdit(true);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFabricInput((prevState) => ({ ...prevState, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    updateCostFabricOnce(fabricInput)
      .then(async (response) => {
        await Swal.fire({
          icon: "success",
          title: "Fabric cost updated",
          showConfirmButton: false,
          timer: 1500,
        });
        console.log(response.data.message);
        refetch();
        handleModalEditClose();
      })
      .catch((error) => {
        Swal.fire({
          icon: "error",
          title: "Errorr",
          text: error.message,
        });
      });
  };

  useEffect(() => {
    resetFabricInput();
  }, [showEdit]);

  return (
    <>
      <Button
        variant="dark"
        onClick={handleModalEditShow}
        className="rounded-3 p-1 pt-0 me-1 fs-4"
        title="Edit detail fabric"
      >
        <AiOutlineControl />
      </Button>

      <Modal show={showEdit} onHide={handleModalEditClose} size="xl" className="fabric-edit">
        <Modal.Body className="py-lg-5 px-0 px-xl-5">
          <Form onSubmit={handleSubmit}>
            {/* Top title */}
            <Row className="d-flex justify-content-center mx-2 mx-lg-0">
              <Col lg="7" className="bg-dark rounded-3">
                <Row>
                  <Col lg="12" className="bg-dark rounded-3">
                    <span className="font-38 text-white">
                      {fabric.fabric_name || ""}
                      <small className="font-24 ms-2">{fabric.fabric_name_tnp || ""}</small>
                      <small className="font-24"> | {fabric.supplier || ""}</small>
                    </span>
                  </Col>
                </Row>
              </Col>
            </Row>

            {/* Fabric kg title, input fabric kg., fabric cost title */}
            <Row className="d-flex justify-content-center text-white text-center mx-2 mx-lg-0">
              <Col lg="2">
                <Row className="pe-lg-4">
                  <Col lg="12" className="bg-dark rounded-3 my-auto p-1 px-0 mt-4 mt-lg-5">
                    <span className="font-24 fw-bold">fabric kg.</span>
                  </Col>
                </Row>
              </Col>

              <Col lg="2" className="mt-2 mt-lg-5">
                <Row className="pe-lg-4 ps-lg-0">
                  <Col lg="12" className="bg-gray rounded-3 p-1 pb-0">
                    <Form.Control
                      required
                      type="number"
                      value={fabricInput.fabric_kg || ""}
                      min={0}
                      name="fabric_kg"
                      onChange={handleInputChange}
                      className="fw-bold bg-gray font-24 px-0 py-1"
                    />
                  </Col>
                </Row>
              </Col>

              {/* Hide on tablet, smartphone and display only laptop, desktop screen */}
              <Col lg="3" className="d-none d-lg-inline mt-4 mt-lg-5 ps-lg-5">
                <Row className="bg-dark rounded-3">
                  <Col lg="12" className="bg-dark rounded-3 p-1 px-0">
                    <span className="font-24 fw-bold">fabric cost</span>
                  </Col>
                </Row>
              </Col>
            </Row>

            {/* Collar kg. title and input, price fabric title and input, shirt/total title and input */}
            <Row className="d-flex justify-content-center text-white text-center mx-2 mx-lg-0">
              <Col lg="2" className="mt-2 mt-lg-0">
                <Row className="pe-lg-4">
                  {/* Hide when select polo pattern */}
                  {shirtCate !== 2 && (
                    <>
                      <Col lg="12" className="bg-dark rounded-3 my-auto p-1 px-0 mt-4 mt-lg-3">
                        <span className="font-24 fw-bold">collar socket kg.</span>
                      </Col>
                      {/* Hide on laptop and desktop screen */}
                      <Col
                        lg="12"
                        className="bg-gray rounded-3 p-1 pb-0 mx-lg-3 mt-2 mt-lg-5 d-lg-none"
                      >
                        <Form.Control
                          required
                          type="number"
                          value={fabricInput.collar_kg || ""}
                          min={0}
                          name="collar_kg"
                          onChange={handleInputChange}
                          className="fw-bold bg-gray font-24 px-0 py-1"
                        />
                      </Col>
                    </>
                  )}

                  <Col lg="12" className="bg-dark rounded-3 my-auto p-1 mt-4 mt-lg-3">
                    <span className="font-24 fw-bold">price fabric/kg.</span>
                  </Col>

                  {/* Hide on laptop and desktop screen */}
                  <Col
                    lg="12"
                    className="bg-gray rounded-3 p-1 pb-0 mx-lg-3 mt-2 mt-lg-5 d-lg-none"
                  >
                    <Form.Control
                      required
                      type="number"
                      value={fabricInput.fabric_price_per_kg || ""}
                      min={0}
                      name="fabric_price_per_kg"
                      onChange={handleInputChange}
                      className="fw-bold bg-gray font-24 px-0 py-1"
                    />
                  </Col>

                  <Col lg="12" className="bg-dark rounded-3 my-auto p-1 mt-4 mt-lg-3">
                    <span className="font-24 fw-bold">shirt/total fabric</span>
                  </Col>

                  {/* Hide on laptop and desktop screen */}
                  <Col
                    lg="12"
                    className="bg-gray rounded-3 p-1 pb-0 mx-lg-3 mt-2 mt-lg-5 d-lg-none"
                  >
                    <Form.Control
                      required
                      type="number"
                      value={fabricInput.shirt_per_total || ""}
                      min={0}
                      name="shirt_per_total"
                      onChange={handleInputChange}
                      className="fw-bold bg-gray font-24 px-0 py-1"
                    />
                  </Col>
                </Row>
              </Col>

              {/* Display on laptop and desktop screen */}
              <Col lg="2" className="d-none d-lg-inline">
                <Row className="pe-lg-4">
                  {/* Hide when select polo pattern */}
                  {shirtCate !== 2 && (
                    <Col lg="12" className="bg-gray rounded-3 mt-3 p-1 pb-0">
                      <Form.Control
                        required
                        type="number"
                        value={fabricInput.collar_kg || ""}
                        min={0}
                        name="collar_kg"
                        onChange={handleInputChange}
                        className="fw-bold bg-gray font-24 px-0 py-1"
                      />
                    </Col>
                  )}

                  <Col lg="12" className="bg-gray rounded-3 p-1 pb-0 mt-3">
                    <Form.Control
                      required
                      type="number"
                      value={fabricInput.fabric_price_per_kg || ""}
                      min={0}
                      name="fabric_price_per_kg"
                      onChange={handleInputChange}
                      className="fw-bold bg-gray font-24 px-0 py-1"
                    />
                  </Col>

                  <Col lg="12" className="bg-gray rounded-3 p-1 pb-0 mt-3">
                    <Form.Control
                      required
                      type="number"
                      value={fabricInput.shirt_per_total || ""}
                      min={0}
                      name="shirt_per_total"
                      onChange={handleInputChange}
                      className="fw-bold bg-gray font-24 px-0 py-1"
                    />
                  </Col>
                </Row>
              </Col>

              {/* Hide on laptop and desktop screen */}
              <Col lg="12" className="bg-dark rounded-3 my-auto p-1 mt-4 d-lg-none">
                <span className="font-24 fw-bold">fabric cost</span>
              </Col>

              <Col lg="3" className="mt-2 mt-lg-3 ps-lg-5">
                <Row className="row-fabric-cost bg-gray rounded-3">
                  <Col lg="12" className="p-1 pb-0 my-auto">
                    <Form.Control
                      type="number"
                      value={fabricCost}
                      min={0}
                      name="fabricCost"
                      className="fw-bold bg-gray font-24 px-0 py-1"
                      readOnly
                    />
                  </Col>
                </Row>
              </Col>
            </Row>

            {/* Display total cost title on laptop and desktop sceen */}
            <Row className="d-flex justify-content-center text-white text-center">
              <Col lg="4" className="mt-2 mt-lg-5"></Col>
              <Col lg="3" className="d-none d-lg-inline mt-4 mt-lg-5 ps-lg-5">
                <Row className="bg-dark rounded-3">
                  <Col lg="12" className="bg-dark rounded-3 p-1 px-0 my-auto">
                    <span className="font-24 fw-bold">total cost</span>
                  </Col>
                </Row>
              </Col>
            </Row>

            {/* Cut price title and input, sew price title and input, total cost title and input */}
            <Row className="d-flex justify-content-center text-white text-center mx-2 mx-lg-0">
              <Col lg="2" className="mt-2 mt-lg-0">
                <Row className="pe-lg-4">
                  <Col lg="12" className="bg-dark rounded-3 my-auto p-1 px-0 mt-4 mt-lg-3">
                    <span className="font-24 fw-bold">cut</span>
                  </Col>

                  {/* Hide on laptop and desktop screen */}
                  <Col
                    lg="12"
                    className="bg-gray rounded-3 p-1 pb-0 mx-lg-3 mt-2 mt-lg-5 d-lg-none"
                  >
                    <Form.Control
                      type="number"
                      value={fabricInput.cutting_price || ""}
                      min={0}
                      name="cutting_price"
                      onChange={handleInputChange}
                      className="fw-bold bg-gray font-24 px-0 py-1"
                    />
                  </Col>

                  <Col lg="12" className="bg-dark rounded-3 my-auto p-1 mt-4 mt-lg-3">
                    <span className="font-24 fw-bold">sew</span>
                  </Col>

                  {/* Hide on laptop and desktop screen */}
                  <Col
                    lg="12"
                    className="bg-gray rounded-3 p-1 pb-0 mx-lg-3 mt-2 mt-lg-5 d-lg-none"
                  >
                    <Form.Control
                      type="number"
                      value={fabricInput.sewing_price || ""}
                      min={0}
                      name="sewing_price"
                      onChange={handleInputChange}
                      className="fw-bold bg-gray font-24 px-0 py-1"
                    />
                  </Col>

                  {/* Hide when select polo pattern */}
                  {shirtCate === 2 && (
                    <>
                      <Col lg="12" className="bg-dark rounded-3 my-auto p-1 px-0 mt-4 mt-lg-3">
                        <span className="font-24 fw-bold">collar</span>
                      </Col>

                      {/* Hide on laptop and desktop screen */}
                      <Col
                        lg="12"
                        className="bg-gray rounded-3 p-1 pb-0 mx-lg-3 mt-2 mt-lg-5 d-lg-none"
                      >
                        <Form.Control
                          type="number"
                          value={fabricInput.collar_price || ""}
                          min={0}
                          name="collar_price"
                          onChange={handleInputChange}
                          className="fw-bold bg-gray font-24 px-0 py-1"
                        />
                      </Col>

                      <Col lg="12" className="bg-dark rounded-3 my-auto p-1 mt-4 mt-lg-3">
                        <span className="font-24 fw-bold">buttons</span>
                      </Col>

                      {/* Hide on laptop and desktop screen */}
                      <Col
                        lg="12"
                        className="bg-gray rounded-3 p-1 pb-0 mx-lg-3 mt-2 mt-lg-5 d-lg-none"
                      >
                        <Form.Control
                          type="number"
                          value={fabricInput.button_price || ""}
                          min={0}
                          name="button_price"
                          onChange={handleInputChange}
                          className="fw-bold bg-gray font-24 px-0 py-1"
                        />
                      </Col>
                    </>
                  )}
                </Row>
              </Col>

              {/* Display on laptop and desktop screen */}
              <Col lg="2" className="d-none d-lg-inline">
                <Row className="pe-lg-4">
                  <Col lg="12" className="bg-gray rounded-3 mt-3 p-1 pb-0">
                    <Form.Control
                      type="number"
                      value={fabricInput.cutting_price || ""}
                      min={0}
                      name="cutting_price"
                      onChange={handleInputChange}
                      className="fw-bold bg-gray font-24 px-0 py-1"
                    />
                  </Col>
                  <Col lg="12" className="bg-gray rounded-3 p-1 pb-0 mt-3">
                    <Form.Control
                      type="number"
                      value={fabricInput.sewing_price || ""}
                      min={0}
                      name="sewing_price"
                      onChange={handleInputChange}
                      className="fw-bold bg-gray font-24 px-0 py-1"
                    />
                  </Col>

                  {/* Hide when select polo pattern */}
                  {shirtCate === 2 && (
                    <>
                      <Col lg="12" className="bg-gray rounded-3 mt-3 p-1 pb-0">
                        <Form.Control
                          type="number"
                          value={fabricInput.collar_price || ""}
                          min={0}
                          name="collar_price"
                          onChange={handleInputChange}
                          className="fw-bold bg-gray font-24 px-0 py-1"
                        />
                      </Col>
                      <Col lg="12" className="bg-gray rounded-3 p-1 pb-0 mt-3">
                        <Form.Control
                          type="number"
                          value={fabricInput.button_price || ""}
                          min={0}
                          name="button_price"
                          onChange={handleInputChange}
                          className="fw-bold bg-gray font-24 px-0 py-1"
                        />
                      </Col>
                    </>
                  )}
                </Row>
              </Col>

              {/* Hide on laptop and desktop screen */}
              <Col lg="12" className="bg-dark rounded-3 my-auto p-1 mt-4 d-lg-none">
                <span className="font-24 fw-bold">total cost</span>
              </Col>

              <Col lg="3" className="mt-2 mt-lg-3 ps-lg-5">
                <Row className="row-fabric-cost bg-gray rounded-3 ">
                  <Col lg="12" className="p-1 pb-0 my-auto">
                    <Form.Control
                      type="number"
                      value={shirtCost}
                      min={0}
                      name="shirtCost"
                      className="fw-bold bg-gray font-24 px-0 py-1"
                      readOnly
                    />
                  </Col>
                </Row>
              </Col>
            </Row>

            {/* Submit button */}
            <Row className="mx-2 mx-lg-0">
              <Col lg="4" className="mt-0 mt-lg-5"></Col>
              <Col lg="6" className="d-flex justify-content-end mt-4 mt-lg-3 pe-0 pe-lg-5">
                <Button
                  type="submit"
                  variant="danger"
                  className="mx-2 my-2 py-2 py-lg-1 btn-submit col-12 col-lg-3"
                >
                  submit
                </Button>
              </Col>
              <Col lg="2"></Col>
            </Row>
          </Form>
        </Modal.Body>
      </Modal>
    </>
  );
}

export default FabricEdit;
