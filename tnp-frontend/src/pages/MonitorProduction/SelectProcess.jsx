import Button from "@mui/material/Button";
import { useState } from "react";
import { Row, Col } from "react-bootstrap";

import axios from "../../api/axios";

import "./SelectProcess.css";
import { useGetAllSheetsQuery } from "../../api/slice";

function SelectProcess({ data }) {
  const { refetch } = useGetAllSheetsQuery();

  const [checked_1, setChecked_1] = useState(null);
  const [checked_2, setChecked_2] = useState(null);
  const [productionType, setProductionType] = useState("");
  const [screen, setScreen] = useState("");
  const [dft, setDft] = useState("");
  const [embroid, setEmbroid] = useState("");

  const handleFormSubmit = async (event) => {
    event.preventDefault();

    const formData = new FormData();
    formData.append("_method", "PATCH");
    formData.append("production_type", productionType);
    formData.append("screen", screen);
    formData.append("dft", dft);
    formData.append("embroid", embroid);
    formData.append("status", 1);

    await axios
      .post(`production/${data.pd_id}`, formData)
      .then(({ data }) => {
        console.log(data.message);
      })
      .catch(({ response }) => {
        console.log(response.data.message);
      });

    refetch();
  };

  const handleChecked = (event) => {
    const name = event.target.name;
    const value = event.target.value;

    if (checked_1 !== data.pd_id && name === "checked_1") {
      setChecked_1(data.pd_id);
      setProductionType(value);
    } else if (checked_2 !== data.pd_id && name === "checked_2") {
      setChecked_2(data.pd_id);
      setProductionType(value);
    } else {
      setChecked_1(null);
      setChecked_2(null);
      setProductionType("");
      setScreen("");
      setDft("");
      setEmbroid("");
    }
  };

  const ScreenPoint = () => {
    const handleSelect = async (event) => {
      const name = event.target.name;
      const value = event.target.value;
      const checked = event.target.checked;

      if (name === "screen" && checked) {
        setScreen(value);
      } else if (name === "dft" && checked) {
        setDft(value);
      } else if (name === "embroid" && checked) {
        setEmbroid(value);
      } else {
        setScreen("");
        setDft("");
        setEmbroid("");
      }
    };

    return (
      <div
        className="btn-group-vertical"
        role="group"
        aria-label="Basic checkbox toggle button group"
      >
        <input
          type="checkbox"
          className="btn-check"
          id={`check-screen-${data.pd_id}`}
          autoComplete="off"
          value="1"
          name="screen"
          checked={screen !== "" ? true : false}
          onChange={handleSelect}
        />
        <label
          className="btn btn-toggle my-1 mt-2 py-1 px-4"
          htmlFor={`check-screen-${data.pd_id}`}
        >
          มีสกรีน
        </label>
        <input
          type="checkbox"
          className="btn-check"
          id={`check-dft-${data.pd_id}`}
          autoComplete="off"
          value="1"
          name="dft"
          checked={dft !== "" ? true : false}
          onChange={handleSelect}
        />
        <label className="btn btn-toggle my-1 py-1 px-4" htmlFor={`check-dft-${data.pd_id}`}>
          มี DFT
        </label>
        <input
          type="checkbox"
          className="btn-check"
          id={`check-embroid-${data.pd_id}`}
          autoComplete="off"
          value="1"
          name="embroid"
          checked={embroid !== "" ? true : false}
          onChange={handleSelect}
        />
        <label className="btn btn-toggle my-1 py-1 px-4" htmlFor={`check-embroid-${data.pd_id}`}>
          มีปัก
        </label>
      </div>
    );
  };

  return (
    <div className="select-process text-center">
      <form onSubmit={handleFormSubmit}>
        <Row>
          <Col xs={6} className="mx-auto pe-0">
            <input
              type="checkbox"
              className="btn-check"
              autoComplete="off"
              id={`btn-check-1-${data.pd_id}`}
              checked={checked_1 === data.pd_id ? true : false}
              disabled={checked_2 === data.pd_id ? true : false}
              onChange={handleChecked}
              name="checked_1"
              value="1"
            />
            <label className="btn btn-choose p-2 p-lg-3" htmlFor={`btn-check-1-${data.pd_id}`}>
              <h1 className="mb-0">1</h1>
              ตัดเย็บเป็นตัว
              <br />
              และนำมาปัก/สกรีน
            </label>
          </Col>
          <Col xs={6} className="mx-auto ps-0">
            <input
              type="checkbox"
              className="btn-check"
              autoComplete="off"
              id={`btn-check-2-${data.pd_id}`}
              checked={checked_2 === data.pd_id ? true : false}
              disabled={checked_1 === data.pd_id ? true : false}
              onChange={handleChecked}
              name="checked_2"
              value="2"
            />
            <label className="btn btn-choose p-2 p-lg-3" htmlFor={`btn-check-2-${data.pd_id}`}>
              <h1 className="mb-0">2</h1>
              ตัด นำมาปัก/สกรีน
              <br />
              แล้วนำไปเย็บเป็นตัว
            </label>
          </Col>
        </Row>
        <Row>
          <Col className="pe-0">
            {checked_1 === data.pd_id ? <ScreenPoint handleChecked={handleChecked} /> : null}
          </Col>
          <Col className="ps-0">
            {checked_2 === data.pd_id ? <ScreenPoint handleChecked={handleChecked} /> : null}
          </Col>
        </Row>
        {checked_1 || checked_2 ? (
          <Button type="submit" variant="outlined" className="col-5 btn-start mt-3">
            START
          </Button>
        ) : null}
      </form>
    </div>
  );
}

export default SelectProcess;
