import React from "react";
import { Outlet } from "react-router-dom";

import { MaxSupplyProvider } from "./context/MaxSupplyContext";

const MaxSupplyLayout = () => {
  return (
    <MaxSupplyProvider>
      <Outlet />
    </MaxSupplyProvider>
  );
};

export default MaxSupplyLayout;
