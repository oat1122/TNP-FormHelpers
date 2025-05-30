import { useSelector, useDispatch } from "react-redux";
import { Skeleton, ToggleButton, ToggleButtonGroup } from "@mui/material";
import { setStatusSelected } from "../../features/Pricing/pricingSlice";

function FilterTab(props) {
  const dispatch = useDispatch();
  const statusList = useSelector((state) => state.pricing.statusList);
  const statusSelected = useSelector((state) => state.pricing.statusSelected);
  const totalCount = useSelector((state) => state.pricing.totalCount);

  const handleSelected = (event, newVal) => {
    if (newVal !== null) {
      dispatch(setStatusSelected(newVal));
    }
  };

  return (
    <>
      <ToggleButtonGroup
        value={statusSelected}
        exclusive
        onChange={handleSelected}
        color="error-light"
      >
        <ToggleButton value="all">
          {`ทั้งหมด (${totalCount || 0})`}
        </ToggleButton>

        {props.statusIsLoading ? (
          Array.from({ length: 6 }).map((_, index) => (
            <Skeleton 
              key={`skeleton-${index}`}
              variant="rounded"
              width={160}
              height={40}
              sx={{ marginRight: 3 }}
            />
          ))
        ) : (
          statusList.length > 0 ? (
            statusList.map((item) => (
              <ToggleButton key={`status-${item.status_id}`} value={item.status_id}>
                {`${item.status_name} (${item.pricing_req_status_count || 0})`}
              </ToggleButton>
            ))
          ) : null 
        )}
      </ToggleButtonGroup>
    </>
  );
}

export default FilterTab;
