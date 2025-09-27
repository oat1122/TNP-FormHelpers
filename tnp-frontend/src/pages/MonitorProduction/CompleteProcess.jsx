import Button from "@mui/material/Button";
import { Col } from "react-bootstrap";
import "./CompleteProcess.css";
import axios from "../../api/axios";
import { useGetAllSheetsQuery } from "../../api/slice";

function CompleteProcess({ data }) {
  const user = JSON.parse(localStorage.getItem("userData"));
  const { refetch } = useGetAllSheetsQuery();

  const handleComplete = async () => {
    await axios
      .put(`production/${data.pd_id}`, { status: 2 })
      .then(({ data }) => {
        console.log(data.message);
      })
      .catch(({ response }) => {
        console.log(response.data.message);
      });

    refetch();
  };

  const handleEditProcess = async () => {
    await axios
      .put(`production/${data.pd_id}`, { production_type: "", status: 0 })
      .then(({ data }) => {
        console.log(data.message);
      })
      .catch(({ response }) => {
        console.log(response.data.message);
      });

    refetch();
  };

  const handleEditProduction = async () => {
    await axios
      .put(`production/${data.pd_id}`, { status: 1 })
      .then(({ data }) => {
        console.log(data.message);
      })
      .catch(({ response }) => {
        console.log(response.data.message);
      });

    refetch();
  };

  return (
    <Col className="complete-process mt-3 text-center">
      {data.status === 1 && (user.role === "manager" || user.role === "production") ? (
        <>
          <Button
            variant="outlined"
            className="col-5 btn-edit mx-2 rounded-2"
            onClick={handleEditProcess}
          >
            EDIT
          </Button>
          <Button
            variant="outlined"
            className="col-5 btn-complete mx-2 rounded-2"
            onClick={handleComplete}
          >
            COMPLETE
          </Button>
        </>
      ) : (user.role === "manager" || user.role === "admin") && data.status === 2 ? (
        <Button variant="outlined" className="col-6 btn-edit" onClick={handleEditProduction}>
          BACK TO EDIT
        </Button>
      ) : null}
    </Col>
  );
}

export default CompleteProcess;
