import { Info as InfoIcon } from "@mui/icons-material";
import { Alert, Box, Dialog, DialogContent, LinearProgress, TextField } from "@mui/material";

import { useCreateQuotationDialogState } from "./hooks/useCreateQuotationDialogState";
import CustomerInfoBanner from "./sections/CustomerInfoBanner";
import DialogFooterActions from "./sections/DialogFooterActions";
import DialogHeaderBar from "./sections/DialogHeaderBar";
import PricingRequestSelectorList from "./sections/PricingRequestSelectorList";

const CreateQuotationDialog = ({ open, onClose, pricingRequest, onSubmit }) => {
  const state = useCreateQuotationDialogState({ open, pricingRequest, onSubmit, onClose });

  return (
    <Dialog open={open} onClose={onClose} maxWidth={false} fullWidth>
      <DialogHeaderBar customerName={pricingRequest?.customer?.cus_company} onClose={onClose} />

      <DialogContent sx={{ p: 0, position: "relative" }}>
        {state.isLoading && (
          <LinearProgress sx={{ position: "absolute", top: 0, left: 0, right: 0 }} />
        )}

        <Box sx={{ p: 3 }}>
          <Alert severity="info" icon={<InfoIcon />} sx={{ mb: 2 }}>
            เลือกงานที่ต้องการสร้างใบเสนอราคา (เลือกได้หลายงานรวมใบเดียว)
          </Alert>

          <CustomerInfoBanner customer={pricingRequest?.customer} />

          <PricingRequestSelectorList
            list={state.list}
            isLoading={state.isLoading}
            selectedPricingItems={state.selectedPricingItems}
            selectedTotal={state.selectedTotal}
            onToggleSelect={state.toggleSelect}
          />

          <TextField
            fullWidth
            multiline
            rows={3}
            label="หมายเหตุเพิ่มเติม"
            value={state.additionalNotes}
            onChange={(e) => state.setAdditionalNotes(e.target.value)}
            placeholder="หมายเหตุเพิ่มเติมสำหรับใบเสนอราคา…"
            sx={{ mt: 2 }}
          />
        </Box>
      </DialogContent>

      <DialogFooterActions
        selectedCount={state.selectedPricingItems.length}
        totalCount={state.list.length}
        isSubmitting={state.isSubmitting}
        onClose={onClose}
        onSubmit={state.handleSubmit}
      />
    </Dialog>
  );
};

export default CreateQuotationDialog;
