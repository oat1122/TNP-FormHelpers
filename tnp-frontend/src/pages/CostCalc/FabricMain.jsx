import "./FabricCalc.css";
import FabricList from "./FabricList";
import FabricSelectPattern from "./FabricSelectPattern";
import { Container } from "react-bootstrap";

function FabricMain() {

  return (
    <Container className="fabric-main">
      <FabricSelectPattern />
      <FabricList />
    </Container>
  );
}

export default FabricMain;
