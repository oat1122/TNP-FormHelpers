import { useState } from "react";
import { Container, Row, Col, Form, Card } from "react-bootstrap";
import Button from "@mui/material/Button";
import axios from "../../api/axios";
import { useNavigate } from "react-router-dom";
import "./AppLogin.css";

const AppLogin = () => {
  const navigate = useNavigate();
  const [inputList, setInputList] = useState({
    username: "",
    password: "",
  });
  const [errorMsg, setErrorMsg] = useState({
    username: "",
    password: "",
    all: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [typePass, setTypePass] = useState("password");

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setInputList((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Set error message for the changed field
    setErrorMsg((prev) => ({
      ...prev,
      [name]: "", // Clear the error for the changed field
    }));
  };

  const handleShowPass = () => {
    {
      typePass == "password" ? setTypePass("text") : setTypePass("password");
    }
  };

  const getCsrfToken = async () => {
    await axios.get(`/sanctum/csrf-cookie`);
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setIsLoading(true);

    await getCsrfToken();
    setErrorMsg({
      username: "",
      password: "",
      all: "",
    });

    const formData = new FormData();
    formData.append("username", inputList.username);
    formData.append("password", inputList.password);

    try {
      const response = await axios.post("/login", formData);

      setIsLoading(false);

      if (response.data.status === "success") {
        // เก็บข้อมูลที่ได้จาก API response
        const { token, data } = response.data;

        // Save the user data and access token to localStorage
        localStorage.setItem("isLoggedIn", true);
        localStorage.setItem("userData", JSON.stringify(data));
        localStorage.setItem("authToken", token);

        // Remove any existing tokenExpiry to prevent token expiry issues
        localStorage.removeItem("tokenExpiry");
        
        // Clean up any old token-related items that might cause issues
        localStorage.removeItem("token"); // Remove any old 'token' key
        
        console.log("Login successful - Token expiry tracking disabled");

        navigate("/");
        setInputList({ username: "", password: "" });
      }

    } catch (error) {
      setIsLoading(false);
      console.error("Login failed: ", error.response?.data);

      if (error.response?.data.errors) {
        setErrorMsg((prev) => ({
          ...prev,
          username: error.response?.data.errors?.username?.[0],
          password: error.response?.data.errors?.password?.[0],
        }));
      } else {
        setErrorMsg((prev) => ({
          ...prev,
          all: error.response?.data.message,
        }));
      }
    }
  };

  return (
    <Container className="app-login">
      <Row className="justify-content-center">
        <Col sm={12} md={8} lg={5} xl={4}>
          <Form onSubmit={handleLogin}>
            <Card className="border border-1 card-login">
              <Card.Body className="p-4">
                <Card.Title className="text-center">
                  <h1>TNP SYSTEM LOGIN</h1>
                </Card.Title>
                <hr className="mt-0" />
                <Card.Text className="m-0">
                  <Form.Label>Username</Form.Label>
                  <Form.Control
                    type="text"
                    value={inputList.username}
                    name="username"
                    placeholder="Enter Username"
                    onChange={handleInputChange}
                  />
                </Card.Text>
                <Card.Text
                  className="text-danger fs-5 mb-0 error"
                >
                  {errorMsg.username}
                </Card.Text>
                <Card.Text className="mt-xl-3 mb-0">
                  <Form.Label>Password</Form.Label>
                  <Form.Control
                    type={typePass}
                    value={inputList.password}
                    name="password"
                    placeholder="Enter Password"
                    onChange={handleInputChange}
                  />
                </Card.Text>
                <Card.Text className="text-danger fs-5 mb-0 error">
                  {errorMsg.password}
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
              </Card.Body>
              <Card.Footer className="text-center bg-white p-3">
                <Card.Text className="text-center">
                  <Button
                    type="submit"
                    className="btn btn-danger"
                    disabled={isLoading}
                  >
                    LOGIN
                    {isLoading ? (
                      <div className="ms-1">
                        <span
                          className="spinner-border spinner-border-sm"
                          role="status"
                        ></span>
                      </div>
                    ) : null}
                  </Button>
                </Card.Text>
                <Card.Text className="text-danger fs-4 error">
                  {errorMsg.all}
                </Card.Text>
              </Card.Footer>
            </Card>
          </Form>
        </Col>
      </Row>
    </Container>
  );
};

export default AppLogin;