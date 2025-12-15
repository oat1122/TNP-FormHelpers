import { configureStore } from "@reduxjs/toolkit";
// Or from '@reduxjs/toolkit/query/react'
import { setupListeners } from "@reduxjs/toolkit/query";

import { apiSlice } from "./api/slice";
import { accountingApi } from "./features/Accounting/accountingApi";
import accountingReducer from "./features/Accounting/accountingSlice";
import { customerApi } from "./features/Customer/customerApi";
import { customerTransferApi } from "./features/Customer/customerTransferApi";
import customerSliceReducer from "./features/Customer/customerSlice";
import fabricCostReducer from "./features/fabricCost/fabricCostSlice";
import { globalApi } from "./features/globalApi";
import globalSliceReducer from "./features/globalSlice";
import monitorProductionSliceReducer from "./features/MonitorProduction/monitorProductionSlice";
import { pricingApi } from "./features/Pricing/pricingApi";
import pricingReducers from "./features/Pricing/pricingSlice";
import { userManagementApi } from "./features/UserManagement/userManagementApi";
import userManagementReducers from "./features/UserManagement/userManagementSlice";
import subRoleManagementReducers from "./features/SubRoleManagement/subRoleManagementSlice";
import { worksheetApi } from "./features/Worksheet/worksheetApi";
import worksheetSliceReducer from "./features/Worksheet/worksheetSlice";
import { tnpApi } from "./services/tnpApi";

const store = configureStore({
  reducer: {
    // Add the generated reducer as a specific top-level slice
    global: globalSliceReducer,
    monitorProduction: monitorProductionSliceReducer,
    fabricCost: fabricCostReducer,
    worksheet: worksheetSliceReducer,
    customer: customerSliceReducer,
    userManagement: userManagementReducers,
    subRoleManagement: subRoleManagementReducers,
    pricing: pricingReducers,
    accounting: accountingReducer,

    // api
    [apiSlice.reducerPath]: apiSlice.reducer,
    [tnpApi.reducerPath]: tnpApi.reducer,
    [globalApi.reducerPath]: globalApi.reducer,
    [worksheetApi.reducerPath]: worksheetApi.reducer,
    [customerApi.reducerPath]: customerApi.reducer,
    [customerTransferApi.reducerPath]: customerTransferApi.reducer,
    [userManagementApi.reducerPath]: userManagementApi.reducer,
    [pricingApi.reducerPath]: pricingApi.reducer,
    [accountingApi.reducerPath]: accountingApi.reducer,
  },
  // Adding the api middleware enables caching, invalidation, polling,
  // and other useful features of `rtk-query`.
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      apiSlice.middleware,
      tnpApi.middleware,
      globalApi.middleware,
      worksheetApi.middleware,
      customerApi.middleware,
      customerTransferApi.middleware,
      userManagementApi.middleware,
      pricingApi.middleware,
      accountingApi.middleware
    ),
});

// optional, but required for refetchOnFocus/refetchOnReconnect behaviors
// see `setupListeners` docs - takes an optional callback as the 2nd arg for customization
setupListeners(store.dispatch);

export default store;
