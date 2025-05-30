import { Container, Row, Col, Card } from "react-bootstrap";
import AppHeader from "../../components/Navbar/AppHeader";
import styles from "./ShowLog.module.css";

function ShowLog() {
  return (
    <>
      {/* <AppHeader/> */}
      <Container className="mt-4 mt-md-5">
        <Card className="col-md-11 col-lg-8 col-xl-7 mx-auto">
          <Card.Body className="pb-5">
            <Card.Title className={`${styles.title} mb-3 mt-1`}>
              ประวัติ
            </Card.Title>
            <Card.Text>
              <Row
                className={`${styles.Row} col-12 col-md-10 col-lg-9 col-xl-9 mx-auto py-1 px-3`}
              >
                <Col>
                  <label>สั่งผ้า</label>
                </Col>
                <Col className="d-flex justify-content-end">
                  <label>21/11/2022</label>
                </Col>
              </Row>
              <Row
                className={`${styles.Row} col-12 col-md-10 col-lg-9 col-xl-9 mx-auto py-1 px-3 my-3`}
              >
                <Col>
                  <label>สั่งผ้า</label>
                </Col>
                <Col className="d-flex justify-content-end">
                  <label>21/11/2022</label>
                </Col>
              </Row>
              <Row
                className={`${styles.Row} col-12 col-md-10 col-lg-9 col-xl-9 mx-auto py-1 px-3 my-3`}
              >
                <Col>
                  <label>สั่งผ้า</label>
                </Col>
                <Col className="d-flex justify-content-end">
                  <label>21/11/2022</label>
                </Col>
              </Row>
            </Card.Text>
          </Card.Body>
        </Card>
      </Container>
    </>
  );
}

export default ShowLog;
