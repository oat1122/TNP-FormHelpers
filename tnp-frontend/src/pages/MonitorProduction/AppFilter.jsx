import { useState } from "react";
import { Table, ToggleButton, ButtonGroup, Form } from "react-bootstrap";
import "./AppFilter.css";

function AppFilter({ onFiltersChange }) {
  const [isChecked, setIsChecked] = useState({
    selectAll: true,
    notStarted: false,
    inProgress: false,
    owner: false,
    dateNull: false,
    shirtCate: "1",
    done: false,
  });

  const handleRadioChange = (event) => {
    const { name } = event.target;
    const updatedState = {
      ...isChecked,
      selectAll: false,
      notStarted: false,
      inProgress: false,
      owner: false,
      dateNull: false,
      done: false,
      [name]: true,
    };

    setIsChecked(updatedState);

    setTimeout(() => {
      onFiltersChange(updatedState);
    }, 200);
  };

  const handleSelectChange = (event) => {
    const { value } = event.target;
    const updatedState = { ...isChecked, shirtCate: value };

    setIsChecked(updatedState);

    setTimeout(() => {
      onFiltersChange(updatedState);
    }, 200);
  };

  return (
    <div className="app-filter text-center">
      <div className="table-container">
        <Table responsive>
          <tbody>
            <tr>
              <td style={{ backgroundColor: "transparent" }}>
                <div>
                  <ButtonGroup className="col-lg-12 my-2">
                    <Form.Select
                      aria-label="select shirt category"
                      className="mx-3"
                      name="shirtCate"
                      value={isChecked.shirtCate}
                      onChange={(e) => handleSelectChange(e)}
                    >
                      <option value="1">ทั้งหมด</option>
                      <option className="green" value="2">
                        เสื้อยืด
                      </option>
                      <option value="3">เสื้อโปโล</option>
                    </Form.Select>
                    <div className="vl"></div>
                    <ToggleButton
                      id="radio-filter-0"
                      type="radio"
                      className="mx-3"
                      name="selectAll"
                      value={isChecked.selectAll}
                      checked={isChecked.selectAll}
                      onChange={handleRadioChange}
                    >
                      ดูงานทั้งหมด
                    </ToggleButton>
                    <ToggleButton
                      id="radio-filter-1"
                      type="radio"
                      className="mx-3"
                      name="notStarted"
                      value={isChecked.notStarted}
                      checked={isChecked.notStarted}
                      onChange={handleRadioChange}
                    >
                      ยังไม่ได้เริ่มงาน
                    </ToggleButton>
                    <ToggleButton
                      id="radio-filter-2"
                      type="radio"
                      className="mx-3"
                      name="inProgress"
                      value={isChecked.inProgress}
                      checked={isChecked.inProgress}
                      onChange={handleRadioChange}
                    >
                      กำลังดำเนินการ
                    </ToggleButton>
                    <ToggleButton
                      id="radio-filter-3"
                      type="radio"
                      className="mx-3"
                      name="owner"
                      value={isChecked.owner}
                      checked={isChecked.owner}
                      onChange={handleRadioChange}
                    >
                      งานของฉัน
                    </ToggleButton>
                    <ToggleButton
                      id="radio-filter-4"
                      type="radio"
                      className="mx-3"
                      name="dateNull"
                      value={isChecked.dateNull}
                      checked={isChecked.dateNull}
                      onChange={handleRadioChange}
                    >
                      ยังไม่ได้เพิ่มวันที่
                    </ToggleButton>
                    <ToggleButton
                      id="radio-filter-5"
                      type="radio"
                      className="mx-3"
                      name="done"
                      value={isChecked.done}
                      checked={isChecked.done}
                      onChange={handleRadioChange}
                    >
                      งานเสร็จสิ้น
                    </ToggleButton>
                  </ButtonGroup>
                </div>
              </td>
            </tr>
          </tbody>
        </Table>
      </div>
    </div>
  );
}

export default AppFilter;
