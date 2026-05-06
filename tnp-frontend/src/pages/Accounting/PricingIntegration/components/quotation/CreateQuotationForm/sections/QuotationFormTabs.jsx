import {
  Calculate as CalcIcon,
  Inventory2 as ItemsIcon,
  Payment as PaymentIcon,
  PersonOutline as CustomerIcon,
} from "@mui/icons-material";
import { Badge, Box, Tab, Tabs } from "@mui/material";
import { useState } from "react";

/**
 * Tabbed container for CreateQuotationForm (Phase 4 of redesign).
 *
 * Replaces the previous single-scroll stack with 4 focused tabs:
 *   - ลูกค้า + PR    (CustomerAndPRSection)
 *   - รายการงาน      (JobsSection — items only, financial controls moved out)
 *   - คำนวณ + ภาษี   (FinancialControlsSection — pricing + discount + vat + wht + total)
 *   - ชำระเงิน + รูป (PaymentTermsSection + SampleImagesSection)
 *
 * Form state is owned by the parent CreateQuotationForm and threaded through
 * `panels` so tab switches do not unmount editor state.
 *
 * Error indicator (red dot) shows on tabs whose `errorCount > 0`.
 */
const TAB_DEFS = [
  { id: "customer", label: "ลูกค้า + PR", Icon: CustomerIcon },
  { id: "jobs", label: "รายการงาน", Icon: ItemsIcon },
  { id: "calc", label: "คำนวณ + ภาษี", Icon: CalcIcon },
  { id: "payment", label: "ชำระเงิน + รูป", Icon: PaymentIcon },
];

const QuotationFormTabs = ({
  panels,
  errorCounts = {},
  defaultTab = "customer",
  activeTab: controlledActiveTab,
  onActiveTabChange,
}) => {
  const [internalActiveTab, setInternalActiveTab] = useState(defaultTab);
  const activeTab = controlledActiveTab ?? internalActiveTab;
  const setActiveTab = (val) => {
    setInternalActiveTab(val);
    onActiveTabChange?.(val);
  };

  return (
    <Box>
      <Box
        sx={{
          borderBottom: 1,
          borderColor: "divider",
          mb: 1.5,
          position: "sticky",
          top: 0,
          zIndex: 5,
          bgcolor: "background.paper",
        }}
      >
        <Tabs
          value={activeTab}
          onChange={(_e, val) => setActiveTab(val)}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
        >
          {TAB_DEFS.map(({ id, label, Icon }) => {
            const errorCount = errorCounts[id] || 0;
            const labelNode =
              errorCount > 0 ? (
                <Badge
                  color="error"
                  variant="dot"
                  overlap="rectangular"
                  sx={{ "& .MuiBadge-badge": { right: -6, top: 2 } }}
                >
                  {label}
                </Badge>
              ) : (
                label
              );
            return (
              <Tab
                key={id}
                value={id}
                iconPosition="start"
                icon={<Icon sx={{ fontSize: 18 }} />}
                label={labelNode}
                sx={{ textTransform: "none", fontSize: "0.9rem", minHeight: 44 }}
              />
            );
          })}
        </Tabs>
      </Box>
      <Box>{panels[activeTab] || null}</Box>
    </Box>
  );
};

export default QuotationFormTabs;
