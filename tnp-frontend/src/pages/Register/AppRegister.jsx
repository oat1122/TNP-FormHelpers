import React from "react";
import axios from "../../api/axios";
import { useState } from "react";
import "./AppRegister.css";
import { Container, Row, Col, Form, Card } from "react-bootstrap";
import Button from "@mui/material/Button";

const AppRegister = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [msg, setMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState([]);
  const [typePass, setTypePass] = useState("password");
  const listRole = ["admin", "manager", "production", "graphic", "sale"];

  const handleShowPass = () => {
    {typePass == "password" ? setTypePass("text") : setTypePass("password")}
  };

  const handleSignup = async (event) => {

    event.preventDefault();
    setIsLoading(true);

    const formData = new FormData();
    formData.append("username", username);
    formData.append("password", password);
    formData.append("role", role);

    await axios.post("signup", formData).then((response) => {
      setIsLoading(false);

      if (response.data.status === 200) {
        setMsg(response.data.message);
      }

      if (response.data.status === "failed") {
        setMsg(response.data.message);
      }
    });
  };

  return (
    <Container>
      <Row className="justify-content-center">
        <Col sm={12} md={8} lg={5} xl={4}>
          <Form onSubmit={handleSignup}>
            <Card className="border border-1 card-login">
              <Card.Body className="p-4">
                <Card.Title className="text-center">
                  <h1>TNP MONITOR SIGNUP</h1>
                </Card.Title>
                <hr className="mt-0" />
                <Card.Text className="m-0">
                  <Form.Label>Username</Form.Label>
                  <Form.Control
                    type="text"
                    value={username}
                    name="username"
                    placeholder="Enter Username"
                    onChange={(event) => {
                      setUsername(event.target.value);
                    }}
                  />
                </Card.Text>
                <Card.Text className="mt-xl-3 mb-0">
                  <Form.Label>Password</Form.Label>
                  <Form.Control
                    type={typePass}
                    value={password}
                    name="password"
                    placeholder="Enter Password"
                    onChange={(event) => {
                      setPassword(event.target.value);
                    }}
                  />
                </Card.Text>
                <Card.Text className="mt-xl-2">
                  <Form.Check.Input
                    type="checkbox"
                    className="mt-md-1 mt-lg-2 me-1"
                    onClick={handleShowPass}
                  />
                  <Form.Check.Label className="show-pass">
                    Show Password
                  </Form.Check.Label>
                </Card.Text>
                <Card.Text className="mt-xl-3 mb-0">
                  <Form.Label>Role</Form.Label>
                  <Form.Select
                    value={role}
                    name="role"
                    onChange={(event) => {
                      setRole(event.target.value);
                    }}
                    className="fs-5"
                  >
                    <option value="" >Select Role</option>
                    {listRole.map((val, key) => (
                      <option key={key} value={val}>
                        {val}
                      </option>
                    ))}
                    ;
                  </Form.Select>
                </Card.Text>
                <Card.Text className="text-danger fs-4 error">{msg}</Card.Text>
              </Card.Body>
              <Card.Footer className="text-center bg-white p-3">
                <Card.Text className="text-center">
                  <Button type="submit" className="btn btn-danger">
                    REGISTER
                  </Button>
                </Card.Text>
              </Card.Footer>
            </Card>
          </Form>
        </Col>
      </Row>
    </Container>
  );
};

export default AppRegister;
