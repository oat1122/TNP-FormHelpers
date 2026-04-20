import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";

import {
  useAddPersonalActivityMutation,
  useUpdateNotebookMutation,
} from "../../../features/Notebook/notebookApi";
import { dismissToast, showError, showLoading, showSuccess } from "../../../utils/toast";

const NotebookPersonalActivityDialog = ({
  open,
  mode = "create",
  selectedRecord = null,
  onClose,
}) => {
  const isViewMode = mode === "view";
  const isEditMode = mode === "edit";
  const [form, setForm] = useState({
    nb_date: "",
    nb_additional_info: "",
  });
  const [errors, setErrors] = useState({});
  const [addPersonalActivity, { isLoading: isCreating }] = useAddPersonalActivityMutation();
  const [updateNotebook, { isLoading: isUpdating }] = useUpdateNotebookMutation();

  useEffect(() => {
    if (!open) {
      return;
    }

    setForm({
      nb_date: selectedRecord?.nb_date || new Date().toISOString().slice(0, 10),
      nb_additional_info: selectedRecord?.nb_additional_info || "",
    });
    setErrors({});
  }, [open, selectedRecord]);

  const title = useMemo(() => {
    if (isViewMode) {
      return "ดูธุระส่วนตัว";
    }

    if (isEditMode) {
      return "แก้ไขธุระส่วนตัว";
    }

    return "เพิ่มธุระส่วนตัว";
  }, [isEditMode, isViewMode]);

  const handleChange = (field) => (event) => {
    setForm((previous) => ({ ...previous, [field]: event.target.value }));
    setErrors((previous) => ({ ...previous, [field]: null }));
  };

  const validate = () => {
    const nextErrors = {};

    if (!form.nb_date) {
      nextErrors.nb_date = "กรุณาเลือกวันที่";
    }

    if (!form.nb_additional_info.trim()) {
      nextErrors.nb_additional_info = "กรุณากรอกข้อความ";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      showError("กรุณากรอกข้อมูลให้ครบ");
      return;
    }

    const loadingId = showLoading(
      isEditMode ? "กำลังอัปเดตธุระส่วนตัว..." : "กำลังบันทึกธุระส่วนตัว..."
    );

    try {
      if (isEditMode && selectedRecord?.id) {
        await updateNotebook({
          id: selectedRecord.id,
          nb_date: form.nb_date,
          nb_additional_info: form.nb_additional_info.trim(),
        }).unwrap();
        showSuccess("อัปเดตธุระส่วนตัวสำเร็จ");
      } else {
        await addPersonalActivity({
          nb_date: form.nb_date,
          nb_additional_info: form.nb_additional_info.trim(),
        }).unwrap();
        showSuccess("บันทึกธุระส่วนตัวสำเร็จ");
      }

      onClose?.();
    } catch (error) {
      showError(error?.data?.message || "ไม่สามารถบันทึกธุระส่วนตัวได้");
    } finally {
      dismissToast(loadingId);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontFamily: "Kanit", fontWeight: 600 }}>{title}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <TextField
            label="วันที่"
            type="date"
            value={form.nb_date}
            onChange={handleChange("nb_date")}
            InputLabelProps={{ shrink: true }}
            error={Boolean(errors.nb_date)}
            helperText={errors.nb_date}
            disabled={isViewMode}
            fullWidth
          />
          <TextField
            label="ข้อความ"
            value={form.nb_additional_info}
            onChange={handleChange("nb_additional_info")}
            error={Boolean(errors.nb_additional_info)}
            helperText={errors.nb_additional_info}
            disabled={isViewMode}
            fullWidth
            multiline
            minRows={4}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} sx={{ fontFamily: "Kanit" }}>
          {isViewMode ? "ปิด" : "ยกเลิก"}
        </Button>
        {!isViewMode ? (
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={isCreating || isUpdating}
            sx={{ fontFamily: "Kanit" }}
          >
            {isCreating || isUpdating ? "กำลังบันทึก..." : "บันทึก"}
          </Button>
        ) : null}
      </DialogActions>
    </Dialog>
  );
};

export default NotebookPersonalActivityDialog;
