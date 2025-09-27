import "./FabricCalc.css";
import { Button, Spinner } from "react-bootstrap";
import FabricShow from "./FabricShow";
import { useEffect } from "react";
import { useGetFabricByPatternIdQuery, useEditFabricByIdMutation } from "../../services/tnpApi";
import { useSelector, useDispatch } from "react-redux";
import { addFabric, setFabricsList } from "../../features/fabricCost/fabricCostSlice";
import Swal from "sweetalert2";

function FabricList() {
  const pattern = useSelector((state) => state.fabricCost.pattern.id);
  const fabrics = useSelector((state) => state.fabricCost.fabrics);
  const user = useSelector((state) => state.fabricCost.user);
  const { data, isLoading, isError, refetch } = useGetFabricByPatternIdQuery(pattern);
  const dispatch = useDispatch();
  const [editFabricById] = useEditFabricByIdMutation();

  useEffect(() => {
    if (data) {
      dispatch(setFabricsList(data));
    }
  }, [data, dispatch]);

  const handleOnSubmit = (event) => {
    event.preventDefault();

    editFabricById(fabrics)
      .unwrap()
      .then(async (response) => {
        await Swal.fire({
          icon: "success",
          title: "Fabric cost updated",
          showConfirmButton: false,
          timer: 1500,
        });
        console.log(response.message);
        refetch();
      })
      .catch((error) => {
        Swal.fire({
          icon: "error",
          title: "Errorr",
          text: error.message,
        });
      });
  };

  const renderedFabric = isLoading ? (
    <tr>
      <td colSpan={11} className="text-center pt-4">
        <Spinner animation="border" />
      </td>
    </tr>
  ) : isError ? (
    <tr>
      <td colSpan={11} className="text-center pt-4">
        <p>Error: Internal Server Error</p>
      </td>
    </tr>
  ) : (
    fabrics.map((fabric, index) => (
      <FabricShow key={index} fabric={fabric} index={index} handleOnSubmit={handleOnSubmit} />
    ))
  );

  const handleCreate = () => {
    dispatch(addFabric());
  };

  return (
    <div className="fabric-list">
      <div className="table-responsive">
        <table className="table">
          <thead>
            <tr>
              <th title="fabric-class"></th>
              <th title="fabric-name-public">
                <h5 className="px-2 py-2 rounded-3">fabric name public</h5>
              </th>
              <th title="supplier">
                <h5 className="px-5 py-2 rounded-3">supplier</h5>
              </th>
              <th title="fabric-name-tnp">
                <h5 className="px-2 py-2 rounded-3">fabric name thanaplus</h5>
              </th>
              {user.role === "admin" || user.role === "manager" ? (
                <>
                  <th title="cost">
                    <h5 className="px-3 px-lg-3 py-2 rounded-3">cost</h5>
                  </th>
                  <th title="price">
                    <h5 className="px-4 px-lg-4 py-2 rounded-3">price</h5>
                  </th>
                  <th title="price-1k">
                    <h5 className="px-4 px-lg-4 py-2 rounded-3">price 1000+</h5>
                  </th>
                  <th title="profit-percentage"></th>
                </>
              ) : (
                <>
                  <th title="qty-shirt">
                    <h5 className="py-2 px-3 rounded-3">1000+</h5>
                  </th>
                  <th title="qty-shirt">
                    <h5 className="py-2 px-2 rounded-3">401-500</h5>
                  </th>
                  <th title="qty-shirt">
                    <h5 className="py-2 px-2 rounded-3">301-400</h5>
                  </th>
                  <th title="qty-shirt">
                    <h5 className="py-2 px-2 rounded-3">201-300</h5>
                  </th>
                  <th title="qty-shirt">
                    <h5 className="py-2 px-2 rounded-3">100-200</h5>
                  </th>
                  <th className="px-3"></th>
                </>
              )}
            </tr>
          </thead>
          <tbody>{renderedFabric}</tbody>
        </table>
      </div>
      {user.role === "manager" || user.role === "admin" ? (
        <div className="text-end pe-lg-4">
          <Button
            type="submit"
            variant="danger"
            className="mx-2 my-2 py-1"
            onClick={handleOnSubmit}
          >
            submit
          </Button>
          <Button variant="danger" onClick={handleCreate} className="mx-2 my-2 px-3 py-1">
            +new fabric
          </Button>
        </div>
      ) : null}
    </div>
  );
}

export default FabricList;
