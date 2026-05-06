import {
  Assignment as OverviewIcon,
  CompareArrows as SideIcon,
  Inventory2 as ItemsIcon,
  Payment as PaymentIcon,
  PersonOutline as CustomerIcon,
} from "@mui/icons-material";
import { Box, Tab, Tabs } from "@mui/material";
import { useState } from "react";

import InvoiceSideTabs from "../../subcomponents/InvoiceSideTabs";
import CalculationSection from "../sections/CalculationSection";
import CustomerSection, { CompactReadOnlyView } from "../sections/CustomerSection";
import PaymentTermsSection from "../sections/PaymentTermsSection";

/**
 * Tabbed edit-mode container for InvoiceDetailDialog.
 *
 * Phase 3 of redesign: replaces the single-scroll edit layout with focused tabs.
 *   - ภาพรวม      — read-only summary (CompactReadOnlyView) for context
 *   - ลูกค้า       — customer edit form (CustomerSection)
 *   - รายการ      — items + pricing + discount + calculation (CalculationSection)
 *   - ก่อน-หลัง   — per-side override edit (InvoiceSideTabs from invoice-side-edit Phase 3-4)
 *   - เงื่อนไขชำระ — payment terms + deposit + due date + notes (PaymentTermsSection)
 *
 * View mode (isEditing=false) does NOT use this — it uses single-scroll Phase 2 layout.
 *
 * Tab indicator `●`: ก่อน-หลัง tab shows dot when sideEdit.dirtyAny is true.
 * Other tabs do not track per-tab dirty (Phase 4 polish).
 */
const TAB_DEFS = [
  { id: "overview", label: "ภาพรวม", Icon: OverviewIcon },
  { id: "customer", label: "ลูกค้า", Icon: CustomerIcon },
  { id: "items", label: "รายการ + คำนวณ", Icon: ItemsIcon },
  { id: "side", label: "ก่อน-หลัง", Icon: SideIcon },
  { id: "payment", label: "เงื่อนไขชำระ", Icon: PaymentIcon },
];

const EditModeTabs = ({ sectionProps, sideEditProps }) => {
  const [activeTab, setActiveTab] = useState("customer"); // start at customer (most-used edit target)

  const renderTab = () => {
    switch (activeTab) {
      case "overview":
        return <CompactReadOnlyView {...sectionProps.overview} />;
      case "customer":
        return <CustomerSection {...sectionProps.customer} />;
      case "items":
        return <CalculationSection {...sectionProps.calculation} />;
      case "side":
        return <InvoiceSideTabs {...sideEditProps} />;
      case "payment":
        return <PaymentTermsSection {...sectionProps.paymentTerms} />;
      default:
        return null;
    }
  };

  return (
    <Box>
      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 1 }}>
        <Tabs
          value={activeTab}
          onChange={(_e, val) => setActiveTab(val)}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
        >
          {TAB_DEFS.map(({ id, label, Icon }) => {
            const showDirtyDot = id === "side" && sideEditProps?.dirtyBefore;
            const showDirtyDotAfter = id === "side" && sideEditProps?.dirtyAfter;
            const hasDirty = showDirtyDot || showDirtyDotAfter;
            return (
              <Tab
                key={id}
                value={id}
                iconPosition="start"
                icon={<Icon sx={{ fontSize: 18 }} />}
                label={
                  <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.5 }}>
                    {label}
                    {hasDirty && (
                      <Box
                        component="span"
                        sx={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          bgcolor: "warning.main",
                          display: "inline-block",
                        }}
                      />
                    )}
                  </Box>
                }
                sx={{ textTransform: "none", fontSize: "0.85rem", minHeight: 40 }}
              />
            );
          })}
        </Tabs>
      </Box>
      <Box>{renderTab()}</Box>
    </Box>
  );
};

export default EditModeTabs;
