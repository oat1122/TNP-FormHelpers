import React, { Suspense, lazy } from "react";
import { Route, Routes } from "react-router-dom";
import { AuthLayout, GuestLayout } from "./pages/Login/AuthLayout";
import "./index.css";
import AppLogin from "./pages/Login/AppLogin";
import ControlPanel from "./pages/ControlPanel/ControlPanel";
import CssBaseline from "@mui/material/CssBaseline";
import AppTheme from "./AppTheme";
import { CircularProgress } from "@mui/material";
import { MaxSupplyProvider } from "./context/MaxSupplyContext";

// Lazy loaded components
const GridCard = lazy(() => import("./pages/MonitorProduction/GridCard"));
const ShowLog = lazy(() => import("./pages/LogProduction/ShowLog"));
const AppRegister = lazy(() => import("./pages/Register/AppRegister"));
const FabricMain = lazy(() => import("./pages/CostCalc/FabricMain"));
const WorksheetList = lazy(() => import("./pages/Worksheet/WorksheetList"));
const WorksheetCreate = lazy(() => import("./pages/Worksheet/WorksheetCreate"));
const CustomerList = lazy(() => import("./pages/Customer/CustomerList"));
const Testing = lazy(() => import("./components/Testing"));
const TestToast = lazy(() => import("./pages/TestToast"));
const UserList = lazy(() => import("./pages/UserManagement/UserList"));
const PricingList = lazy(() => import("./pages/Pricing/PricingList"));
const PricingForm = lazy(() => import("./pages/Pricing/PricingForm"));

// MaxSupply components
const MaxSupplyList = lazy(() => import("./pages/MaxSupply/MaxSupplyList"));
const MaxSupplyForm = lazy(() => import("./pages/MaxSupply/MaxSupplyForm"));
const MaxSupplyCalendar = lazy(() => import("./pages/MaxSupply/MaxSupplyCalendar"));
const MaxSupplyWorksheetList = lazy(() => import("./pages/MaxSupply/MaxSupplyWorksheetList"));

function App() {
  return (
    <MaxSupplyProvider>
      <AppTheme>
        <CssBaseline /> {/* Reset CSS */}
        <Suspense fallback={
          <div className="text-center mt-4">
            <CircularProgress color="error" size={60} />
          </div>
        }>
          <Routes>
            <Route element={<AuthLayout />}>          <Route path="/" element={<ControlPanel />} />
              <Route path="/monitor" element={<GridCard />} />
              <Route path="/log" element={<ShowLog />} />
              <Route path="/signup" element={<AppRegister />} />
              <Route path="/toast-test" element={<TestToast />} />

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

              {/* MaxSupply routes */}
              <Route path="/max-supply" element={<MaxSupplyList />} />
              <Route path="/max-supply/create" element={<MaxSupplyForm mode="create" />} />
              <Route path="/max-supply/edit/:id" element={<MaxSupplyForm mode="edit" />} />
              <Route path="/max-supply/view/:id" element={<MaxSupplyForm mode="view" />} />
              <Route path="/max-supply/calendar" element={<MaxSupplyCalendar />} />
              <Route path="/max-supply/worksheets" element={<MaxSupplyWorksheetList />} />
            </Route>
            <Route element={<GuestLayout />}>
              <Route path="/login" element={<AppLogin />} />
            </Route>
          </Routes>
        </Suspense>
      </AppTheme>
    </MaxSupplyProvider>
  );
}

export default App;
