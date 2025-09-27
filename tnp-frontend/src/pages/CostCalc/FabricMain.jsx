import "./FabricCalc.css";
import { Container } from "react-bootstrap";

import FabricList from "./FabricList";
import FabricSelectPattern from "./FabricSelectPattern";

function FabricMain() {
  return (
    <Container className="fabric-main">
      <FabricSelectPattern />
      <FabricList />
    </Container>
  );
}

export default FabricMain;
