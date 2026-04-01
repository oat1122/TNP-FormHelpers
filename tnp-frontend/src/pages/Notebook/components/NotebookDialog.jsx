import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  Fab,
  FormControl,
  Grid,
  MenuItem,
  Select,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { styled, useTheme } from "@mui/material/styles";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  MdAssignment,
  MdBusiness,
  MdEdit,
  MdNote,
  MdRemoveRedEye,
  MdSave,
  MdSupervisorAccount,
} from "react-icons/md";

import NotebookHistoryTimeline from "./NotebookHistoryTimeline";
import NotebookNoteField from "./NotebookNoteField";
import NotebookQuickActions from "./NotebookQuickActions";
import NotebookSummaryBar from "./NotebookSummaryBar";
import { useGetAllUserQuery } from "../../../features/UserManagement/userManagementApi";
import DuplicatePhoneDialog from "../../Customer/components/Forms/DuplicatePhoneDialog";
import { useNotebookForm } from "../hooks/useNotebookForm";
import {
  NOTEBOOK_STATUS_OPTIONS,
  getNotebookActionLabel,
  getNotebookSourceMeta,
  getNotebookStatusLabel,
  getNotebookStatusOption,
} from "../utils/notebookDialogConfig";

const SectionCard = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2.25),
  borderRadius: theme.spacing(1.5),
  border: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.background.paper,
  boxShadow: "0 10px 26px rgba(15, 23, 42, 0.05)",
}));

const SectionHeading = styled(Typography)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1),
  fontSize: "1rem",
  fontWeight: 700,
  marginBottom: theme.spacing(0.5),
}));

const SourceToggleButton = styled(ToggleButton)(({ theme }) => ({
  textTransform: "none",
  borderRadius: 999,
  paddingInline: theme.spacing(1.5),
  border: `1px solid ${theme.palette.divider}`,
}));

const createSyntheticEvent = (name, value) => ({
  target: {
    name,
    value,
    type: "text",
  },
});

const NotebookDialog = ({ currentUser = {} }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const noteInputRef = useRef(null);
  const [showHistory, setShowHistory] = useState(false);
  const [pendingDraftMap, setPendingDraftMap] = useState({});

  const {
    dialogOpen,
    dialogMode,
    recordKey,
    draft,
    errors,
    duplicatePhoneDialogOpen,
    duplicatePhoneData,
    isSubmitting,
    isAdmin,
    notebookHistories,
    isNotebookDetailFetching,
    handleClose,
    handleChange,
    handleBlur,
    handleOnlineToggle,
    handleSubmit,
    closeDuplicatePhoneDialog,
    checkPhoneDuplicate,
  } = useNotebookForm({ currentUser });

  const { data: userData } = useGetAllUserQuery(
    { per_page: 1000 },
    {
      skip: !isAdmin,
    }
  );

  const salesList = userData?.data || [];
  const isEditMode = dialogMode === "edit";
  const isViewMode = dialogMode === "view";
  const isCreateMode = dialogMode === "create";
  const historyLoading = !isCreateMode && isNotebookDetailFetching;
  const summaryTitle = draft.nb_customer_name?.trim() || "New sales note";
  const statusMeta = getNotebookStatusOption(draft.nb_status);
  const sourceMeta = getNotebookSourceMeta(Boolean(draft.nb_is_online));
  const selectedSalesOwner = salesList.find((user) => user.user_id === draft.nb_manage_by);
  const salesOwnerLabel = isAdmin
    ? selectedSalesOwner?.username || selectedSalesOwner?.user_nickname || "Sales owner not set"
    : currentUser.username || currentUser.user_nickname || "Sales owner";
  const resetKey = `${recordKey}-${historyLoading ? "loading" : "ready"}`;

  useEffect(() => {
    setShowHistory(false);
    setPendingDraftMap({});
  }, [dialogOpen, resetKey]);

  const pendingDrafts = useMemo(
    () =>
      Object.values(pendingDraftMap)
        .filter(Boolean)
        .map((draftItem) => ({
          ...draftItem,
          actor: currentUser?.username || currentUser?.user_nickname || "Current user",
        })),
    [currentUser, pendingDraftMap]
  );
  const visibleHistories = useMemo(
    () => notebookHistories.filter((history) => history?.action !== "created"),
    [notebookHistories]
  );

  const setFieldValue = (name, value) => {
    handleChange(createSyntheticEvent(name, value));
  };

  const handleActionChange = (value) => {
    if (isViewMode) {
      return;
    }

    setFieldValue("nb_action", value);
    requestAnimationFrame(() => noteInputRef.current?.focus());
  };

  const handleStatusChange = (_, value) => {
    if (!value) {
      return;
    }

    setFieldValue("nb_status", value);
  };

  const handlePendingDraftChange = (fieldName, draftItem) => {
    setPendingDraftMap((previous) => {
      const next = { ...previous };

      if (!draftItem) {
        delete next[fieldName];
        return next;
      }

      next[fieldName] = draftItem;
      return next;
    });
  };

  const modeLabel = isViewMode
    ? "Notebook view"
    : isEditMode
      ? "Notebook update"
      : "New sales note";
  const closeButtonLabel = isViewMode ? "Close" : "Cancel";
  const noteDescription = isEditMode
    ? "Add the newest customer-facing update here. The last saved note stays visible in activity."
    : "Capture the customer-facing details, objections, and the next commitment.";
  const internalNoteDescription = isEditMode
    ? "Add the newest internal update here without deleting the last saved note."
    : "Keep reminders, pricing context, or internal-only coaching notes here.";

  return (
    <Dialog
      open={dialogOpen}
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          borderRadius: { xs: 0, sm: 3 },
          overflow: "hidden",
          bgcolor: "grey.50",
          maxHeight: { xs: "100%", sm: "92vh" },
        },
      }}
    >
      <DialogContent
        sx={{
          p: { xs: 2, sm: 2.5, md: 3 },
          pb: { xs: 11, sm: 3 },
          bgcolor: "grey.50",
        }}
      >
        <Stack spacing={2.25}>
          <NotebookSummaryBar
            title={summaryTitle}
            modeLabel={modeLabel}
            statusMeta={statusMeta}
            actionLabel={getNotebookActionLabel(draft.nb_action)}
            salesOwnerLabel={salesOwnerLabel}
            sourceMeta={sourceMeta}
            onClose={handleClose}
          />

          <NotebookQuickActions
            value={draft.nb_action}
            onChange={handleActionChange}
            readOnly={isViewMode}
          />

          <Grid container spacing={2.25}>
            <Grid item xs={12} md={7}>
              <Stack spacing={2.25}>
                <SectionCard>
                  <SectionHeading>
                    <MdAssignment />
                    Follow-up status
                  </SectionHeading>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                    Confirm the latest status without opening another menu.
                  </Typography>

                  <ToggleButtonGroup
                    exclusive
                    value={draft.nb_status || null}
                    onChange={handleStatusChange}
                    disabled={isViewMode}
                    sx={{ flexWrap: "wrap", gap: 1 }}
                  >
                    {NOTEBOOK_STATUS_OPTIONS.map((option) => (
                      <ToggleButton
                        key={option.value}
                        value={option.value}
                        sx={{
                          borderRadius: 999,
                          border: "1px solid",
                          borderColor: "divider",
                          textTransform: "none",
                          px: 1.5,
                          py: 0.75,
                        }}
                      >
                        {option.label}
                      </ToggleButton>
                    ))}
                  </ToggleButtonGroup>

                  <Stack direction="row" spacing={1} sx={{ mt: 1.5, flexWrap: "wrap", rowGap: 1 }}>
                    <Chip
                      color={statusMeta?.color || "default"}
                      variant={statusMeta ? "filled" : "outlined"}
                      label={getNotebookStatusLabel(draft.nb_status)}
                    />
                    <Chip
                      color="primary"
                      variant={draft.nb_action ? "filled" : "outlined"}
                      label={getNotebookActionLabel(draft.nb_action)}
                    />
                  </Stack>
                </SectionCard>

                <NotebookNoteField
                  title="Interaction notes"
                  description={noteDescription}
                  name="nb_additional_info"
                  value={draft.nb_additional_info}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Summarize the conversation, customer needs, and the next agreed step..."
                  resetKey={resetKey}
                  onDraftChange={(draftItem) =>
                    handlePendingDraftChange("nb_additional_info", draftItem)
                  }
                  inputRef={noteInputRef}
                  minRows={6}
                  readOnly={isViewMode}
                />

                <NotebookNoteField
                  title="Internal notes"
                  description={internalNoteDescription}
                  name="nb_remarks"
                  value={draft.nb_remarks}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Add internal reminders, risks, or prep for the next follow-up..."
                  resetKey={resetKey}
                  onDraftChange={(draftItem) => handlePendingDraftChange("nb_remarks", draftItem)}
                  minRows={4}
                  readOnly={isViewMode}
                />

                {historyLoading || visibleHistories.length > 0 || pendingDrafts.length > 0 ? (
                  <NotebookHistoryTimeline
                    histories={visibleHistories}
                    isLoading={historyLoading}
                    showAll={showHistory}
                    onToggle={() => setShowHistory((previous) => !previous)}
                    pendingDrafts={pendingDrafts}
                  />
                ) : null}
              </Stack>
            </Grid>

            <Grid item xs={12} md={5}>
              <Stack spacing={2.25}>
                <SectionCard>
                  <SectionHeading>
                    <MdBusiness />
                    Customer info
                  </SectionHeading>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                    Keep contact details close by, but out of the primary action path.
                  </Typography>

                  <Stack spacing={1.5}>
                    <TextField
                      fullWidth
                      label="Customer / lead"
                      name="nb_customer_name"
                      value={draft.nb_customer_name || ""}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      InputProps={{ readOnly: isViewMode }}
                      error={!!errors.nb_customer_name}
                      helperText={errors.nb_customer_name}
                    />

                    <TextField
                      fullWidth
                      label="Contact person"
                      name="nb_contact_person"
                      value={draft.nb_contact_person || ""}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      InputProps={{ readOnly: isViewMode }}
                      error={!!errors.nb_contact_person}
                      helperText={errors.nb_contact_person}
                    />

                    <TextField
                      fullWidth
                      label="Phone"
                      name="nb_contact_number"
                      value={draft.nb_contact_number || ""}
                      onChange={handleChange}
                      onBlur={(event) => {
                        if (isViewMode) {
                          return;
                        }

                        handleBlur(event);
                        checkPhoneDuplicate(event.target.value);
                      }}
                      InputProps={{ readOnly: isViewMode }}
                      error={!!errors.nb_contact_number}
                      helperText={
                        errors.nb_contact_number ||
                        "Duplicate checking runs when you leave the field."
                      }
                    />

                    <TextField
                      fullWidth
                      label="Email"
                      name="nb_email"
                      value={draft.nb_email || ""}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      InputProps={{ readOnly: isViewMode }}
                      error={!!errors.nb_email}
                      helperText={errors.nb_email}
                    />
                  </Stack>
                </SectionCard>

                <SectionCard>
                  <SectionHeading>
                    <MdSupervisorAccount />
                    Ownership & source
                  </SectionHeading>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                    Supporting context stays visible without stealing focus from the next move.
                  </Typography>

                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="subtitle2" sx={{ mb: 0.75 }}>
                        Sales owner
                      </Typography>

                      {isAdmin ? (
                        <FormControl fullWidth size="small">
                          <Select
                            name="nb_manage_by"
                            value={draft.nb_manage_by || ""}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            displayEmpty
                            disabled={isViewMode}
                          >
                            <MenuItem value="">
                              <em>Select sales owner</em>
                            </MenuItem>
                            {salesList.map((user) => (
                              <MenuItem key={user.user_id} value={user.user_id}>
                                {user.username || user.user_nickname || `User ${user.user_id}`}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      ) : (
                        <Chip
                          color="default"
                          variant="outlined"
                          label={
                            currentUser.username || currentUser.user_nickname || "Current user"
                          }
                        />
                      )}
                    </Box>

                    <Box>
                      <Typography variant="subtitle2" sx={{ mb: 0.75 }}>
                        Source
                      </Typography>

                      <ToggleButtonGroup
                        exclusive
                        value={draft.nb_is_online ? "online" : "onsite"}
                        onChange={(_, value) => {
                          if (!value) {
                            return;
                          }

                          handleOnlineToggle(value === "online");
                        }}
                        disabled={isViewMode}
                        sx={{ gap: 1 }}
                      >
                        <SourceToggleButton value="online">Online</SourceToggleButton>
                        <SourceToggleButton value="onsite">On-site</SourceToggleButton>
                      </ToggleButtonGroup>
                    </Box>

                    <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", rowGap: 1 }}>
                      <Chip variant="outlined" label={sourceMeta.label} color={sourceMeta.color} />
                      <Chip
                        variant="outlined"
                        icon={
                          isViewMode ? <MdRemoveRedEye /> : isEditMode ? <MdEdit /> : <MdSave />
                        }
                        label={isViewMode ? "View mode" : isEditMode ? "Edit mode" : "Create mode"}
                      />
                      {draft.nb_contact_number ? (
                        <Chip variant="outlined" label="Phone ready for follow-up" />
                      ) : null}
                    </Stack>
                  </Stack>
                </SectionCard>

                <SectionCard>
                  <SectionHeading>
                    <MdNote />
                    Workflow summary
                  </SectionHeading>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                    A compact recap keeps long notes from hiding the important decision points.
                  </Typography>

                  <Stack spacing={1.25}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Next action
                      </Typography>
                      <Typography variant="body1" fontWeight={600}>
                        {getNotebookActionLabel(draft.nb_action)}
                      </Typography>
                    </Box>

                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Status
                      </Typography>
                      <Typography variant="body1" fontWeight={600}>
                        {getNotebookStatusLabel(draft.nb_status)}
                      </Typography>
                    </Box>

                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Save behavior
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Save stays visible at the bottom on desktop and as a floating CTA on mobile.
                      </Typography>
                    </Box>
                  </Stack>
                </SectionCard>
              </Stack>
            </Grid>
          </Grid>
        </Stack>
      </DialogContent>

      {!isMobile && !isViewMode && (
        <DialogActions
          sx={{
            p: 2.5,
            gap: 1,
            bgcolor: "rgba(250,250,250,0.92)",
            borderTop: "1px solid",
            borderColor: "divider",
            backdropFilter: "blur(10px)",
            position: "sticky",
            bottom: 0,
            zIndex: 2,
          }}
        >
          <Button onClick={handleClose} color="inherit" size="large">
            {closeButtonLabel}
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            startIcon={<MdSave />}
            disabled={isSubmitting}
            size="large"
            sx={{
              px: 3.5,
              borderRadius: 999,
              textTransform: "none",
              fontSize: "1rem",
            }}
          >
            {isSubmitting ? "Saving..." : "Save note"}
          </Button>
        </DialogActions>
      )}

      {!isMobile && isViewMode && (
        <DialogActions
          sx={{
            p: 2.5,
            gap: 1,
            bgcolor: "rgba(250,250,250,0.92)",
            borderTop: "1px solid",
            borderColor: "divider",
            backdropFilter: "blur(10px)",
            position: "sticky",
            bottom: 0,
            zIndex: 2,
          }}
        >
          <Button onClick={handleClose} color="primary" variant="contained" size="large">
            {closeButtonLabel}
          </Button>
        </DialogActions>
      )}

      {isMobile && dialogOpen && !isViewMode && (
        <Fab
          color="primary"
          variant="extended"
          onClick={handleSubmit}
          disabled={isSubmitting}
          sx={{
            position: "fixed",
            right: 16,
            bottom: 16,
            zIndex: theme.zIndex.modal + 1,
            borderRadius: 999,
            px: 2.5,
          }}
        >
          <MdSave style={{ marginRight: 8 }} />
          {isSubmitting ? "Saving..." : "Save note"}
        </Fab>
      )}

      <DuplicatePhoneDialog
        open={duplicatePhoneDialogOpen}
        onClose={closeDuplicatePhoneDialog}
        duplicateData={duplicatePhoneData}
      />
    </Dialog>
  );
};

export default NotebookDialog;
