import { Check as CheckIcon } from "@mui/icons-material";
import { Alert, Box, CardContent, Collapse, Divider, Grid, Typography } from "@mui/material";
import { useCallback, useState } from "react";

import { useBusinessTypes } from "./hooks/useBusinessTypes";
import { useCurrentUser } from "./hooks/useCurrentUser";
import { useCustomerAddressLookup } from "./hooks/useCustomerAddressLookup";
import { useCustomerEditForm } from "./hooks/useCustomerEditForm";
import { useCustomerHydration } from "./hooks/useCustomerHydration";
import { useCustomerManagerAssignment } from "./hooks/useCustomerManagerAssignment";
import { useCustomerSave } from "./hooks/useCustomerSave";
import CustomerAddressFields from "./sections/CustomerAddressFields";
import CustomerBasicFields from "./sections/CustomerBasicFields";
import CustomerBusinessFields from "./sections/CustomerBusinessFields";
import CustomerContactFields from "./sections/CustomerContactFields";
import CustomerHeaderBar from "./sections/CustomerHeaderBar";
import { CustomerCard, hydratingIndicatorSx } from "./styles/customerEditStyles";

const CustomerEditCard = ({ customer, onUpdate, onCancel, startInEdit = false }) => {
  const [isEditing, setIsEditing] = useState(startInEdit);
  const [isExpanded, setIsExpanded] = useState(startInEdit);
  const [displayCustomer, setDisplayCustomer] = useState(customer);

  const { isAdmin, currentUser } = useCurrentUser();

  const { editData, setEditData, errors, setErrors, handleInputChange, resetForm } =
    useCustomerEditForm(customer, { isAdmin, currentUser });

  const { isHydrating } = useCustomerHydration(customer, {
    setEditData,
    setDisplayCustomer,
  });

  const { salesList } = useCustomerManagerAssignment({
    editData,
    setEditData,
    setDisplayCustomer,
  });

  const { businessTypes } = useBusinessTypes();

  const addressLookup = useCustomerAddressLookup(editData, { handleInputChange });

  const { handleSave, isSaving } = useCustomerSave({
    customer,
    displayCustomer,
    editData,
    setEditData,
    setDisplayCustomer,
    setErrors,
    isAdmin,
    currentUser,
    salesList,
    addressLookupState: {
      provinces: addressLookup.provinces,
      districts: addressLookup.districts,
      subdistricts: addressLookup.subdistricts,
    },
    onUpdate,
    onSaveSuccess: () => {
      setIsEditing(false);
      setIsExpanded(false);
    },
    onSaveFailure: () => {
      setIsEditing(true);
      setIsExpanded(true);
    },
  });

  const handleEdit = useCallback(() => {
    setIsEditing(true);
    setIsExpanded(true);
    setErrors({});
  }, [setErrors]);

  const handleCancel = useCallback(() => {
    setIsEditing(false);
    setIsExpanded(false);
    resetForm(displayCustomer || customer);
    onCancel?.();
  }, [resetForm, displayCustomer, customer, onCancel]);

  if (!customer) {
    return (
      <Alert severity="info" sx={{ borderRadius: "12px" }}>
        <Typography>ไม่พบข้อมูลลูกค้า</Typography>
      </Alert>
    );
  }

  const viewCustomer = displayCustomer || customer;

  return (
    <CustomerCard>
      {isHydrating && <Box sx={hydratingIndicatorSx} />}
      <CardContent sx={{ padding: "24px" }}>
        {errors.success && (
          <Alert severity="success" sx={{ mb: 2, borderRadius: "12px" }} icon={<CheckIcon />}>
            {errors.success}
          </Alert>
        )}
        {errors.general && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: "12px" }}>
            {errors.general}
          </Alert>
        )}

        <CustomerHeaderBar
          isEditing={isEditing}
          isExpanded={isExpanded}
          isHydrating={isHydrating}
          isSaving={isSaving}
          onToggleExpand={() => setIsExpanded(!isExpanded)}
          onEdit={handleEdit}
          onCancel={handleCancel}
          onSave={handleSave}
        />

        <CustomerBasicFields
          isEditing={isEditing}
          editData={editData}
          errors={errors}
          onChange={handleInputChange}
          viewCustomer={viewCustomer}
        />

        <Collapse in={isExpanded || isEditing}>
          <Divider sx={{ my: 2 }} />

          <Grid container spacing={2}>
            <CustomerContactFields
              isEditing={isEditing}
              editData={editData}
              errors={errors}
              onChange={handleInputChange}
              viewCustomer={viewCustomer}
            />

            {isEditing && (
              <CustomerBusinessFields
                editData={editData}
                errors={errors}
                onChange={handleInputChange}
                businessTypes={businessTypes}
                salesList={salesList}
                isAdmin={isAdmin}
                currentUser={currentUser}
              />
            )}

            <CustomerAddressFields
              isEditing={isEditing}
              editData={editData}
              onChange={handleInputChange}
              viewCustomer={viewCustomer}
              provinces={addressLookup.provinces}
              districts={addressLookup.districts}
              subdistricts={addressLookup.subdistricts}
              onProvinceChange={addressLookup.handleProvinceChange}
              onDistrictChange={addressLookup.handleDistrictChange}
              onSubdistrictChange={addressLookup.handleSubdistrictChange}
            />
          </Grid>
        </Collapse>
      </CardContent>
    </CustomerCard>
  );
};

export default CustomerEditCard;
