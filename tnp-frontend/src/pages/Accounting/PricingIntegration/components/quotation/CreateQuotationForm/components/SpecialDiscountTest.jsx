import { Container, Typography, Box } from "@mui/material";
import React, { useState } from "react";

import SpecialDiscountField from "./SpecialDiscountField";

const SpecialDiscountTest = () => {
  const [discountType, setDiscountType] = useState("percentage");
  const [discountValue, setDiscountValue] = useState(5);

  const totalAmount = 10000;
  const discountAmount =
    discountType === "percentage" ? totalAmount * (discountValue / 100) : discountValue;

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        SpecialDiscountField Test
      </Typography>

      <Box sx={{ my: 3 }}>
        <SpecialDiscountField
          discountType={discountType}
          discountValue={discountValue}
          totalAmount={totalAmount}
          discountAmount={discountAmount}
          onDiscountTypeChange={setDiscountType}
          onDiscountValueChange={setDiscountValue}
          disabled={false}
        />
      </Box>

      <Box sx={{ mt: 3, p: 2, bgcolor: "grey.100", borderRadius: 1 }}>
        <Typography variant="body2">
          <strong>Debug Info:</strong>
          <br />
          Total Amount: ฿{totalAmount.toLocaleString()}
          <br />
          Discount Type: {discountType}
          <br />
          Discount Value: {discountValue}
          <br />
          Discount Amount: ฿{discountAmount.toLocaleString()}
          <br />
        </Typography>
      </Box>
    </Container>
  );
};

export default SpecialDiscountTest;
