import {
  Inventory2 as ItemsIcon,
  Payment as PaymentIcon,
  PersonOutline as CustomerIcon,
} from "@mui/icons-material";
import { Box, Tab, Tabs } from "@mui/material";

/**
 * Tab bar for QuotationDuplicateDialog (Tabs Redesign).
 *
 * Now a CONTROLLED tab bar — caller owns `activeTab` state so it can place
 * the tab bar anywhere in the dialog tree (e.g. directly under DialogHeader,
 * outside DialogContent's padding) and render the active panel separately.
 *
 * Usage pattern:
 *   <EditModeTabs activeTab={activeTab} onChange={setActiveTab} />
 *   {panels[activeTab]}
 *
 * Mirrors the EditModeTabs pattern from InvoiceDetailDialog but adapted:
 *   - 3 tabs only (no "ภาพรวม" / no "ก่อน-หลัง")
 *   - Default tab = "items" (set by caller via initial activeTab)
 *   - No dirty-dot indicator (always-edit mode)
 */
export const TAB_DEFS = [
  { id: "customer", label: "ลูกค้า", Icon: CustomerIcon },
  { id: "items", label: "รายการ + คำนวณ", Icon: ItemsIcon },
  { id: "payment", label: "เงื่อนไขชำระ", Icon: PaymentIcon },
];

const EditModeTabs = ({ activeTab, onChange }) => (
  <Box
    sx={{
      borderBottom: 1,
      borderColor: "divider",
      bgcolor: "background.paper",
    }}
  >
    <Tabs
      value={activeTab}
      onChange={(_e, val) => onChange(val)}
      variant="scrollable"
      scrollButtons="auto"
      allowScrollButtonsMobile
    >
      {TAB_DEFS.map(({ id, label, Icon }) => (
        <Tab
          key={id}
          value={id}
          iconPosition="start"
          icon={<Icon sx={{ fontSize: 18 }} />}
          label={label}
          sx={{ textTransform: "none", fontSize: "0.9rem", minHeight: 44 }}
        />
      ))}
    </Tabs>
  </Box>
);

export default EditModeTabs;
