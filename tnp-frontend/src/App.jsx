import React, { Suspense, lazy } from "react";
import { Route, Routes } from "react-router-dom";
import { AuthLayout, GuestLayout } from "./pages/Login/AuthLayout";
import "./index.css";
import AppLogin from "./pages/Login/AppLogin";
import ControlPanel from "./pages/ControlPanel/ControlPanel";
import CssBaseline from "@mui/material/CssBaseline";
import AppTheme from "./AppTheme";
import { CircularProgress } from "@mui/material";

// Lazy loaded components
const GridCard = lazy(() => import("./pages/MonitorProduction/GridCard"));
const ShowLog = lazy(() => import("./pages/LogProduction/ShowLog"));
const AppRegister = lazy(() => import("./pages/Register/AppRegister"));
const FabricMain = lazy(() => import("./pages/CostCalc/FabricMain"));
const WorksheetList = lazy(() => import("./pages/Worksheet/WorksheetList"));
const WorksheetCreate = lazy(() => import("./pages/Worksheet/WorksheetCreate"));
const CustomerList = lazy(() => import("./pages/Customer/CustomerList"));
const Testing = lazy(() => import("./components/Testing"));
const UserList = lazy(() => import("./pages/UserManagement/UserList"));
const PricingList = lazy(() => import("./pages/Pricing/PricingList"));
const PricingForm = lazy(() => import("./pages/Pricing/PricingForm"));

function App() {
  return (
    <AppTheme>
      <CssBaseline /> {/* Reset CSS */}
      <Suspense fallback={
        <div className="text-center mt-4">
          <CircularProgress color="error" size={60} />
        </div>
      }>
        <Routes>
          <Route element={<AuthLayout />}>
            <Route path="/" element={<ControlPanel />} />
            <Route path="/monitor" element={<GridCard />} />
            <Route path="/log" element={<ShowLog />} />
            <Route path="/signup" element={<AppRegister />} />

            <Route path="/shirt-price" element={<FabricMain />} />
            <Route path="/user-management" element={<UserList />} />
            <Route path="/customer" element={<CustomerList />} />

            <Route path="/worksheet" element={<WorksheetList />} />
            <Route path="/worksheet-create/:typeShirt" element={<WorksheetCreate />} />
            <Route path="/worksheet-update/:id" element={<WorksheetCreate />} />

            <Route path="/pricing" element={<PricingList />} />
            <Route path="/pricing/create" element={<PricingForm mode="create" />} />
            <Route path="/pricing/edit/:id" element={<PricingForm mode="edit" />} />
            <Route path="/pricing/view/:id" element={<PricingForm mode="view" />} />

            <Route path="/test" element={<Testing />} />
          </Route>
          <Route element={<GuestLayout />}>
            <Route path="/login" element={<AppLogin />} />
          </Route>
        </Routes>
      </Suspense>
    </AppTheme>
  );
}

export default App;
