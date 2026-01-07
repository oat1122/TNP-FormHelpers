import React from "react";
import { Card, CardContent, Divider } from "@mui/material";

// Parts (Molecules)
import { CustomerCardHeader, CustomerCardInfo, CustomerCardFooter } from "./parts";

// Error Boundary
import CustomerCardErrorBoundary from "./CustomerCardErrorBoundary";

// Services
import { AddressService } from "../../../../services/AddressService";

// Utils
import { datadisplayColors } from "../../utils/customerCardUtils";

/**
 * CustomerCard - การ์ดแสดงข้อมูลลูกค้ารายบุคคล
 * @param {Object} customer - Customer data object
 * @param {Function} onView - Handler สำหรับดูข้อมูล
 * @param {Function} onEdit - Handler สำหรับแก้ไข
 * @param {Function} handleRecall - Handler สำหรับ reset recall
 */
const CustomerCard = ({ customer, onView, onEdit, handleRecall }) => {
  // Defensive programming - ตรวจสอบ customer object
  if (!customer || typeof customer !== "object") {
    console.warn("Invalid customer object:", customer);
    return null;
  }

  // Parse address using AddressService
  const parsedAddress = customer.cus_address
    ? {
        address: AddressService.formatShortAddress(customer, 60),
        subdistrict: "",
        district: "",
        province: "",
        zipCode: "",
      }
    : {
        address: "",
        subdistrict: "",
        district: "",
        province: "",
        zipCode: "",
      };

  return (
    <CustomerCardErrorBoundary>
      <Card
        sx={{
          mb: 2,
          boxShadow: 2,
          borderRadius: 3,
          borderLeft: `4px solid ${datadisplayColors.card.border}`,
          transition: "all 0.2s ease-in-out",
          "&:hover": {
            boxShadow: 4,
            transform: "translateY(-2px)",
          },
          backgroundColor: datadisplayColors.card.background,
        }}
      >
        <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
          {/* Header */}
          <CustomerCardHeader customer={customer} onView={onView} onEdit={onEdit} />

          <Divider sx={{ my: 1.5, borderColor: datadisplayColors.primaryDivider }} />

          {/* Info Section */}
          <CustomerCardInfo
            customer={customer}
            parsedAddress={parsedAddress}
            handleRecall={handleRecall}
          />

          {/* Footer */}
          <CustomerCardFooter createdDate={customer.cus_created_date} />
        </CardContent>
      </Card>
    </CustomerCardErrorBoundary>
  );
};

export default CustomerCard;
