import {
  CompareArrows as DepositIcon,
  Inventory2 as ItemsIcon,
  Payment as PaymentIcon,
  PersonOutline as CustomerIcon,
} from "@mui/icons-material";
import { Box, Tab, Tabs } from "@mui/material";

export const TAB_DEFS = [
  { id: "customer", label: "ลูกค้า", Icon: CustomerIcon },
  { id: "items", label: "รายการ + คำนวณ", Icon: ItemsIcon },
  { id: "deposit", label: "มัดจำ / ก่อน-หลัง", Icon: DepositIcon },
  { id: "payment", label: "เงื่อนไขชำระ", Icon: PaymentIcon },
];

const CreateModeTabs = ({ activeTab, onChange }) => (
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

export default CreateModeTabs;
