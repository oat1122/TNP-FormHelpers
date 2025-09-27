import { ButtonGroup, ToggleButton, Table } from "react-bootstrap";
import { useGetPatternQuery } from "../../services/tnpApi";
import { useSelector, useDispatch } from "react-redux";
import { setPatternByID } from "../../features/fabricCost/fabricCostSlice";
import { IoShirt, IoShirtOutline } from "react-icons/io5";

function FabricSelectPattern() {
  const pattern_id = useSelector((state) => state.fabricCost.pattern.id);
  const dispatch = useDispatch();
  const { data, error } = useGetPatternQuery();

  const iconMap = {
    "t-shirt": <IoShirt style={{ marginRight: 10 }} />,
    oversize: <IoShirtOutline style={{ marginRight: 10 }} />,
    crop: <IoShirtOutline style={{ marginRight: 10 }} />,
    "long sleeve": <IoShirtOutline style={{ marginRight: 10 }} />,
    polo: <IoShirtOutline style={{ marginRight: 10 }} />,
    "polo long sleeve": <IoShirtOutline style={{ marginRight: 10 }} />,
  };

  return (
    <div className="fabric-select-pattern mt-3">
      <div className="table-container">
        <Table responsive>
          <tbody>
            <tr>
              <td style={{ backgroundColor: "transparent" }}>
                <ButtonGroup className="col-12 col-xl-10 col-xxl-9">
                  {error ? (
                    <h4>Error: Internal Server Error</h4>
                  ) : (
                    data &&
                    data.map((pattern) => (
                      <ToggleButton
                        key={pattern.pattern_id}
                        id={`radio-pattern-${pattern.pattern_id}`}
                        type="radio"
                        name={pattern.pattern_name}
                        value={pattern.pattern_id}
                        checked={pattern_id === pattern.pattern_id}
                        onChange={() =>
                          dispatch(
                            setPatternByID({
                              id: pattern.pattern_id,
                              shirtCate: pattern.shirt_category,
                            })
                          )
                        }
                        className="mx-3 rounded-3"
                      >
                        {iconMap[pattern.pattern_name]}
                        {pattern.pattern_name}
                      </ToggleButton>
                    ))
                  )}
                </ButtonGroup>
              </td>
            </tr>
          </tbody>
        </Table>
      </div>
    </div>
  );
}

export default FabricSelectPattern;
