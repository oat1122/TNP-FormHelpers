import React, { useState, useContext } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import { setGroupSelected, setPaginationModel } from "../../features/Customer/customerSlice";
import ScrollContext from './ScrollContext';

function FilterTab() {
  const dispatch = useDispatch();
  const groupList = useSelector((state) => state.customer.groupList);
  const totalCount = useSelector((state) => state.customer.totalCount);
  const groupSelected = useSelector((state) => state.customer.groupSelected);
  const { scrollToTop } = useContext(ScrollContext);

  const handleSelectGroup = (event, newVal) => {
    if (newVal !== null) {
      dispatch(setGroupSelected(newVal));
      dispatch(setPaginationModel({  page: 0, pageSize: 10 }));
      // Scroll to top when changing groups
      scrollToTop();
    }
  };

  return (
    <>
      <ToggleButtonGroup
        value={groupSelected}
        exclusive
        onChange={handleSelectGroup}
        color="error-light"
      >
        <ToggleButton value="all">
          {`ทั้งหมด (${totalCount})`}
        </ToggleButton>
        {groupList.map((item, index) => (
          <ToggleButton key={index} value={item.mcg_id}>
            {`${item.mcg_name} (${item.customer_group_count || 0})`}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </>
  );
}

export default FilterTab;
