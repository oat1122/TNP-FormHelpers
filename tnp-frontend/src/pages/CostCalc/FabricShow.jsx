import "./FabricCalc.css";
import { useState, useEffect } from "react";
import { Form, InputGroup, Button, ButtonGroup } from "react-bootstrap";
import { IoTrashOutline } from "react-icons/io5";
import { useSelector, useDispatch } from "react-redux";
import Swal from "sweetalert2";

import FabricEdit from "./FabricEdit";
import { ModalProfit } from "./ModalProfit";
import { updateFabric, removeFabric } from "../../features/fabricCost/fabricCostSlice";
import { useGetFabricClassQuery, useDeleteFabricByIdMutation } from "../../services/tnpApi";

function FabricShow({ fabric, index }) {
  const dispatch = useDispatch();
  const { data: fabricClass } = useGetFabricClassQuery();
  const [delFabric] = useDeleteFabricByIdMutation();
  const user = useSelector((state) => state.fabricCost.user);
  const [dontEdit, setDontEdit] = useState(null); // State edit value with permission
  const [showInput, setShowInput] = useState(null);
  const [showInput1k, setShowInput1k] = useState(null);
  const [displayNone, setDisplayNone] = useState("");

  const calculatedFabricCost =
    ((Number(fabric.fabric_kg) + Number(fabric.collar_kg)) * fabric.fabric_price_per_kg) /
    fabric.shirt_per_total; // Calculate fabric cost
  const fabricCost = isFinite(calculatedFabricCost) ? calculatedFabricCost.toFixed() : 0; // Result fabric cost
  const calcShirtCost =
    Number(fabricCost) +
    Number(fabric.sewing_price) +
    Number(fabric.cutting_price) +
    Number(fabric.collar_price) +
    Number(fabric.button_price); // Calculate shirt cost
  const shirtCost = isNaN(calcShirtCost) ? 0 : calcShirtCost.toFixed(); // Result shirt cost

  // Result shirt price
  const shirtPrice = isNaN(fabric.shirt_price_percent)
    ? shirtCost
    : fabric.shirt_price_percent === "100"
      ? (shirtCost * 100) / 1
      : Math.round((shirtCost * 100) / (100 - fabric.shirt_price_percent));

  // Result shirt price minimun 1k of shirt
  const shirtPrice1k = isNaN(fabric.shirt_1k_price_percent)
    ? shirtCost
    : fabric.shirt_1k_price_percent === "100"
      ? (shirtCost * 100) / 1
      : Math.round((shirtCost * 100) / (100 - fabric.shirt_1k_price_percent));

  // Show percent input when click button
  const handleShowPercentInput = () => setShowInput(!showInput);
  const handleShowPercentInput1k = () => setShowInput1k(!showInput1k);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    dispatch(updateFabric({ index, name, value }));
  };

  const handleRemove = () => {
    if (!fabric.cost_fabric_id) {
      dispatch(removeFabric(index));
    } else {
      Swal.fire({
        title: "Do you want to delete this fabric?",
        showCancelButton: true,
        confirmButtonText: "Yes",
      }).then((result) => {
        /* Read more about isConfirmed, isDenied below */
        if (result.isConfirmed) {
          delFabric(fabric.cost_fabric_id)
            .unwrap()
            .then(async (response) => {
              await Swal.fire({
                icon: "success",
                title: "Fabric deleted",
                showConfirmButton: false,
                timer: 1500,
              });

              dispatch(removeFabric(index));
              console.log(response.message);
            })

            .catch(({ response }) => {
              console.log(response.data.message);
            });
        } else if (result.isDenied) {
          Swal.fire("Can't deleted", "", "info");
        }
      });
    }
  };

  // Render shirt price field
  const renderedShirtPrice = (increment) => {
    const resultShirtPrice = shirtPrice === 0 ? 0 : Number(shirtPrice) + increment;
    return (
      <Form.Control
        readOnly
        type="number"
        value={resultShirtPrice}
        name="shirt_price"
        className="ps-md-3"
      />
    );
  };

  // Render shirt minimun 1000 price field
  const renderedShirtPrice1k = (increment) => {
    const resultShirtPrice = shirtPrice1k === 0 ? 0 : Number(shirtPrice1k) + increment;
    return (
      <Form.Control
        readOnly
        type="number"
        value={resultShirtPrice}
        name="shirt_price"
        className="ps-md-3"
      />
    );
  };

  // Render quantity shirt price column for sale user
  const renderedShirtPriceColumns = () => {
    const columns = [];

    columns.push(<td title="qty-shirt">{renderedShirtPrice1k(0)}</td>);

    for (let i = 0, x = 0; i < 4; i++, x += 5) {
      columns.push(
        <td title="qty-shirt" key={i}>
          {renderedShirtPrice(x)}
        </td>
      );
    }

    return columns;
  };

  // Render shirt price percent input field
  const renderedShirtPricePercent = (
    <>
      <Form.Control
        type="number"
        value={fabric.shirt_price_percent || ""}
        name="shirt_price_percent"
        min={0}
        max={100}
        onChange={handleInputChange}
        placeholder="0"
        className={`text-end ${displayNone}`}
        readOnly={dontEdit}
      />
      <InputGroup.Text className={`pe-xl-3 ${displayNone}`}>%</InputGroup.Text>
    </>
  );

  const renderedShirt1kPricePercent = (
    <>
      <Form.Control
        type="number"
        value={fabric.shirt_1k_price_percent || ""}
        name="shirt_1k_price_percent"
        min={0}
        max={100}
        onChange={handleInputChange}
        placeholder="0"
        className={`text-end ${displayNone}`}
        readOnly={dontEdit}
      />
      <InputGroup.Text className={`pe-xl-3 ${displayNone}`}>%</InputGroup.Text>
    </>
  );

  useEffect(() => {
    if (user.role !== "manager" && user.role !== "admin") {
      setDontEdit(!dontEdit);
    }

    if (user.role === "sale") {
      setDisplayNone("d-none");
    }
  }, []);

  return (
    <>
      <tr className="fabric-show">
        <td>
          <Form.Select
            name="fabric_class"
            onChange={handleInputChange}
            aria-label="select fabric class"
            value={fabric.fabric_class}
            title={fabric.fabric_class}
            className={`py-0 ${
              user.role !== "manager" || user.role !== "admin" ? "select-disabled" : null
            }`}
            disabled={dontEdit}
          >
            {fabricClass &&
              fabricClass.map((itemClass, index) => (
                <option key={index} value={itemClass} title={itemClass} className="custom-option">
                  {itemClass}
                </option>
              ))}
          </Form.Select>
        </td>
        <td>
          <Form.Control
            required
            type="text"
            value={fabric.fabric_name || ""}
            name="fabric_name"
            onChange={handleInputChange}
            readOnly={dontEdit}
          />
        </td>
        <td title="supplier">
          <Form.Control
            required
            type="text"
            value={fabric.supplier || ""}
            name="supplier"
            onChange={handleInputChange}
            readOnly={dontEdit}
            className="px-3"
          />
        </td>
        <td>
          <Form.Control
            type="text"
            value={fabric.fabric_name_tnp || ""}
            name="fabric_name_tnp"
            onChange={handleInputChange}
            readOnly={dontEdit}
          />
        </td>
        {user.role === "admin" || user.role === "manager" ? (
          <>
            <td title="cost">
              <Form.Control readOnly type="text" value={shirtCost} name="shirt_cost" />
            </td>
            <td title="price">
              <InputGroup>
                {showInput ? renderedShirtPricePercent : renderedShirtPrice(0)}
                <Button
                  variant="danger"
                  onClick={handleShowPercentInput}
                  className={`${displayNone} py-0 px-1 rounded-end-3`}
                >
                  <span className="icon">&#8942;</span>
                </Button>
              </InputGroup>
            </td>
            <td title="price-1k">
              <InputGroup>
                {showInput1k ? renderedShirt1kPricePercent : renderedShirtPrice1k(0)}
                <Button
                  variant="danger"
                  onClick={handleShowPercentInput1k}
                  className={`${displayNone} py-0 px-1 rounded-end-3`}
                >
                  <span className="icon">&#8942;</span>
                </Button>
              </InputGroup>
            </td>
            <td>
              <ButtonGroup>
                {/* Hide component when fabric name and supplier input field in null */}
                {(fabric.fabric_name && fabric.supplier) !== "" && (
                  <>
                    <FabricEdit fabric={fabric} handleInputChange={handleInputChange} />
                    <ModalProfit fabric={fabric} shirtCost={shirtCost} />
                  </>
                )}

                <Button
                  variant="dark"
                  onClick={handleRemove}
                  className="rounded-3 p-1 btn-action"
                  title="Delete fabric"
                >
                  <IoTrashOutline size={22} />
                </Button>
              </ButtonGroup>
            </td>
          </>
        ) : (
          <>{renderedShirtPriceColumns()}</>
        )}
      </tr>
    </>
  );
}

export default FabricShow;
