import React, { useState, useEffect } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Typography,
  Box,
  Tooltip,
  Divider,
  Paper,
} from "@mui/material";
import {
  MdSave,
  MdDelete,
  MdFolder,
  MdSettings,
  MdFileDownload,
  MdEdit,
  MdClose,
} from "react-icons/md";

/**
 * Component for managing column visibility profiles
 *
 * @param {Object} props
 * @param {Object} props.columnVisibilityModel - Current column visibility model
 * @param {Object} props.columnOrderModel - Current column order model (optional)
 * @param {Function} props.onApplyProfile - Callback when a profile is applied
 */
const ColumnProfileManager = ({
  columnVisibilityModel,
  columnOrderModel,
  onApplyProfile,
}) => {
  const [open, setOpen] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [editProfileId, setEditProfileId] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");

  // Load profiles from localStorage when component mounts
  useEffect(() => {
    try {
      const savedProfiles = localStorage.getItem("customerTableColumnProfiles");
      if (savedProfiles) {
        const parsedProfiles = JSON.parse(savedProfiles);
        setProfiles(Array.isArray(parsedProfiles) ? parsedProfiles : []);
      }
    } catch (error) {
      console.warn("Failed to load column profiles from localStorage", error);
      setProfiles([]);
    }
  }, []);

  // Save profiles to localStorage
  const saveProfilesToStorage = (updatedProfiles) => {
    try {
      localStorage.setItem(
        "customerTableColumnProfiles",
        JSON.stringify(updatedProfiles)
      );
    } catch (error) {
      console.warn("Failed to save column profiles to localStorage", error);
    }
  };

  // Open dialog
  const handleOpen = () => {
    setOpen(true);
    setProfileName("");
    setEditMode(false);
    setEditProfileId(null);
    setErrorMessage("");
  };

  // Close dialog
  const handleClose = () => {
    setOpen(false);
  };

  // Save current settings as a new profile
  const handleSaveProfile = () => {
    if (!profileName.trim()) {
      setErrorMessage("กรุณากรอกชื่อโปรไฟล์");
      return;
    }

    const timestamp = new Date().toISOString();
    let updatedProfiles;

    if (editMode && editProfileId !== null) {
      // Edit existing profile
      updatedProfiles = profiles.map((profile) =>
        profile.id === editProfileId
          ? {
              ...profile,
              name: profileName,
              visibilityModel: columnVisibilityModel,
              orderModel: columnOrderModel,
              timestamp,
            }
          : profile
      );
    } else {
      // Create new profile
      // Check for duplicate name
      if (profiles.some((p) => p.name === profileName.trim())) {
        setErrorMessage("ชื่อโปรไฟล์นี้มีอยู่แล้ว");
        return;
      }

      const newProfile = {
        id: Date.now().toString(),
        name: profileName,
        visibilityModel: columnVisibilityModel,
        orderModel: columnOrderModel,
        timestamp,
      };

      updatedProfiles = [...profiles, newProfile];
    }

    setProfiles(updatedProfiles);
    saveProfilesToStorage(updatedProfiles);
    setProfileName("");
    setEditMode(false);
    setEditProfileId(null);
    setErrorMessage("");
  };

  // Delete a profile
  const handleDeleteProfile = (id) => {
    const updatedProfiles = profiles.filter((profile) => profile.id !== id);
    setProfiles(updatedProfiles);
    saveProfilesToStorage(updatedProfiles);
  };

  // Start editing a profile
  const handleEditProfile = (profile) => {
    setProfileName(profile.name);
    setEditMode(true);
    setEditProfileId(profile.id);
    setErrorMessage("");
  };

  // Apply a profile's settings
  const handleApplyProfile = (profile) => {
    if (profile?.visibilityModel && onApplyProfile) {
      onApplyProfile({
        visibilityModel: profile.visibilityModel,
        orderModel: profile.orderModel || null,
      });
    }
  };

  // Format date
  const formatDate = (timestamp) => {
    try {
      return new Date(timestamp).toLocaleString("th-TH", {
        year: "2-digit",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (e) {
      return "ไม่ระบุเวลา";
    }
  };

  return (
    <>
      <Tooltip title="จัดการโปรไฟล์คอลัมน์">
        <Button
          variant="outlined"
          color="primary"
          onClick={handleOpen}
          startIcon={<MdSettings />}
          size="small"
        >
          <Typography variant="button">โปรไฟล์</Typography>
        </Button>
      </Tooltip>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <MdFolder style={{ marginRight: 8 }} />
            จัดการโปรไฟล์การแสดงผลคอลัมน์
          </Box>
        </DialogTitle>

        <DialogContent dividers>
          <Box mb={3}>
            <Typography variant="subtitle2" gutterBottom>
              {editMode
                ? "แก้ไขโปรไฟล์"
                : "บันทึกการตั้งค่าปัจจุบันเป็นโปรไฟล์ใหม่"}
            </Typography>
            <Box display="flex" alignItems="flex-start" mb={1}>
              <TextField
                fullWidth
                label="ชื่อโปรไฟล์"
                value={profileName}
                onChange={(e) => {
                  setProfileName(e.target.value);
                  setErrorMessage("");
                }}
                size="small"
                error={Boolean(errorMessage)}
                helperText={errorMessage}
              />
              <Button
                variant="contained"
                color="primary"
                startIcon={<MdSave />}
                onClick={handleSaveProfile}
                sx={{ ml: 1, height: 40 }}
              >
                บันทึก
              </Button>
              {editMode && (
                <IconButton
                  onClick={() => {
                    setEditMode(false);
                    setEditProfileId(null);
                    setProfileName("");
                    setErrorMessage("");
                  }}
                  size="small"
                  sx={{ ml: 0.5, height: 40 }}
                >
                  <MdClose />
                </IconButton>
              )}
            </Box>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Typography variant="subtitle2" gutterBottom>
            โปรไฟล์ที่บันทึกไว้
          </Typography>

          {profiles.length === 0 ? (
            <Paper variant="outlined" sx={{ p: 3, textAlign: "center" }}>
              <Typography color="textSecondary">
                ยังไม่มีโปรไฟล์ที่บันทึกไว้
              </Typography>
            </Paper>
          ) : (
            <List>
              {profiles.map((profile) => (
                <ListItem
                  key={profile.id}
                  secondaryAction={
                    <Box>
                      <Tooltip title="แก้ไขโปรไฟล์">
                        <IconButton
                          edge="end"
                          onClick={() => handleEditProfile(profile)}
                          size="small"
                        >
                          <MdEdit />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="ลบโปรไฟล์">
                        <IconButton
                          edge="end"
                          onClick={() => handleDeleteProfile(profile.id)}
                          size="small"
                        >
                          <MdDelete />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  }
                  sx={{
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 1,
                    mb: 1,
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      width: "100%",
                      alignItems: "center",
                      justifyContent: "space-between",
                      pr: 10, // Make room for the action buttons
                    }}
                  >
                    <Box>
                      <ListItemText
                        primary={profile.name}
                        secondary={`บันทึกล่าสุด: ${formatDate(
                          profile.timestamp
                        )}`}
                      />
                    </Box>
                    <Tooltip title="นำโปรไฟล์นี้มาใช้">
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<MdFileDownload />}
                        onClick={() => {
                          handleApplyProfile(profile);
                          handleClose();
                        }}
                      >
                        นำมาใช้
                      </Button>
                    </Tooltip>
                  </Box>
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose} color="primary">
            ปิด
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ColumnProfileManager;
