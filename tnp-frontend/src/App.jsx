import React, { Suspense, lazy } from "react";
import { Route, Routes } from "react-router-dom";

import { AuthLayout, GuestLayout } from "./pages/Login/AuthLayout";
import "./index.css";
import AppLogin from "./pages/Login/AppLogin";
import ControlPanel from "./pages/ControlPanel/ControlPanel";

import CssBaseline from "@mui/material/CssBaseline";

import AppTheme from "./AppTheme";

import { CircularProgress } from "@mui/material";

import { MaxSupplyProvider } from "./pages/MaxSupply/context/MaxSupplyContext";

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

// Accounting components
const AccountingLayout = lazy(() => import("./pages/Accounting/AccountingLayout"));
const AccountingDashboard = lazy(
  () => import("./pages/Accounting/AccountingDashboard/AccountingDashboard")
);
const PricingIntegration = lazy(
  () => import("./pages/Accounting/PricingIntegration/PricingIntegration")
);
const Quotations = lazy(() => import("./pages/Accounting/Quotations/Quotations"));
const Invoices = lazy(() => import("./pages/Accounting/Invoices/Invoices"));
const DeliveryNotes = lazy(() => import("./pages/Accounting/DeliveryNotes/DeliveryNotes"));

// MaxSupply components
const MaxSupplyHome = lazy(() => import("./pages/MaxSupply/MaxSupplyHome"));
const MaxSupplyList = lazy(() => import("./pages/MaxSupply/MaxSupplyList"));
const MaxSupplyForm = lazy(() => import("./pages/MaxSupply/MaxSupplyForm"));

const WorksheetListForMaxSupply = lazy(() => import("./pages/MaxSupply/WorksheetList"));

function App() {
  return (
    <AppTheme>
      <CssBaseline /> {/* Reset CSS */}
      <MaxSupplyProvider>
        <Suspense
          fallback={
            <div className="text-center mt-4">
              <CircularProgress color="error" size={60} />
            </div>
          }
        >
          <Routes>
            <Route element={<AuthLayout />}>
              <Route path="/" element={<ControlPanel />} />
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

              {/* Accounting Routes */}
              <Route path="/accounting" element={<AccountingLayout />}>
                <Route index element={<AccountingDashboard />} />
                <Route path="pricing-integration" element={<PricingIntegration />} />
                <Route path="quotations" element={<Quotations />} />
                <Route path="invoices" element={<Invoices />} />
                <Route path="receipts" element={<div>Receipts (Coming Soon)</div>} />
                <Route path="delivery-notes" element={<DeliveryNotes />} />
              </Route>

              {/* MaxSupply Routes */}
              <Route path="/max-supply" element={<MaxSupplyHome />} />
              <Route path="/max-supply/home" element={<MaxSupplyHome />} />
              <Route path="/max-supply/list" element={<MaxSupplyList />} />

              <Route path="/max-supply/create" element={<MaxSupplyForm />} />
              <Route path="/max-supply/edit/:id" element={<MaxSupplyForm />} />
              <Route path="/max-supply/:id" element={<MaxSupplyForm />} />
              <Route path="/worksheets-for-maxsupply" element={<WorksheetListForMaxSupply />} />
              <Route path="/worksheets" element={<WorksheetListForMaxSupply />} />

              <Route path="/test" element={<Testing />} />
            </Route>

            <Route element={<GuestLayout />}>
              <Route path="/login" element={<AppLogin />} />
            </Route>
          </Routes>
        </Suspense>
      </MaxSupplyProvider>
    </AppTheme>
  );
}

export default App;
