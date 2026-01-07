import React from "react";
import { Menu, MenuItem, Typography, Divider, Box, Button, Chip, IconButton } from "@mui/material";
import { MdClose } from "react-icons/md";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/th";

dayjs.extend(relativeTime);
dayjs.locale("th");

/**
 * Notification Menu Component
 * Displays a dropdown menu with customer allocation notifications
 *
 * @param {Object} props
 * @param {HTMLElement} props.anchorEl - Anchor element for menu positioning
 * @param {boolean} props.open - Whether menu is open
 * @param {Function} props.onClose - Close handler
 * @param {Array} props.notifications - Array of notification objects
 * @param {number} props.unreadCount - Number of unread notifications
 * @param {Function} props.onMarkAsRead - Handler for marking notifications as read
 * @param {Function} props.onMarkAllAsRead - Handler for marking all as read
 * @param {Function} props.onNotificationClick - Handler for clicking a notification
 * @param {Function} props.onDismiss - Handler for dismissing a notification (X button)
 */
const NotificationMenu = ({
  anchorEl,
  open,
  onClose,
  notifications = [],
  unreadCount = 0,
  onMarkAsRead,
  onMarkAllAsRead,
  onNotificationClick,
  onDismiss,
}) => {
  const handleNotificationClick = (notification) => {
    // Mark this notification as read
    if (onMarkAsRead && notification.data?.customer_id) {
      onMarkAsRead([notification.data.customer_id]);
    }

    // Call custom handler if provided
    if (onNotificationClick) {
      onNotificationClick(notification);
    }

    // Close the menu
    onClose();
  };

  const handleMarkAllAsRead = () => {
    if (onMarkAllAsRead) {
      onMarkAllAsRead();
    }
  };

  // Dismiss handler - removes notification from list
  const handleDismiss = (e, notification) => {
    e.stopPropagation(); // Don't trigger click on MenuItem
    if (onDismiss && notification.data?.customer_id) {
      onDismiss([notification.data.customer_id]);
    }
  };

  return (
    <Menu
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: 380,
          maxHeight: 500,
          mt: 1.5,
        },
      }}
      transformOrigin={{ horizontal: "right", vertical: "top" }}
      anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
    >
      {/* Header */}
      <Box sx={{ p: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography variant="h6">การแจ้งเตือน</Typography>
          {unreadCount > 0 && (
            <Chip
              label={unreadCount}
              color="error"
              size="small"
              sx={{ height: 22, fontSize: "0.75rem" }}
            />
          )}
        </Box>
        {unreadCount > 0 && (
          <Button size="small" onClick={handleMarkAllAsRead} sx={{ fontSize: "0.75rem" }}>
            อ่านทั้งหมด
          </Button>
        )}
      </Box>

      <Divider />

      {/* Notification List */}
      {notifications.length === 0 ? (
        <Box sx={{ p: 4, textAlign: "center" }}>
          <Typography variant="body2" color="text.secondary">
            ไม่มีการแจ้งเตือนใหม่
          </Typography>
          <Typography variant="caption" color="text.disabled" display="block" mt={1}>
            เมื่อมีการจัดสรรลูกค้าใหม่ จะแสดงที่นี่
          </Typography>
        </Box>
      ) : (
        <Box sx={{ maxHeight: 400, overflowY: "auto" }}>
          {notifications.map((notif, index) => (
            <MenuItem
              key={notif.id || index}
              onClick={() => handleNotificationClick(notif)}
              sx={{
                py: 1.5,
                px: 2,
                whiteSpace: "normal",
                // Enhanced read vs unread styling
                bgcolor: notif.is_read ? "transparent" : "action.hover",
                opacity: notif.is_read ? 0.6 : 1, // Faded for read notifications
                borderLeft: notif.is_read ? "3px solid transparent" : "3px solid",
                borderLeftColor: notif.is_read ? "transparent" : "primary.main",
                "&:hover": {
                  bgcolor: notif.is_read ? "action.hover" : "action.selected",
                  opacity: 1, // Full opacity on hover
                },
                transition: "all 0.2s ease-in-out",
              }}
            >
              <Box sx={{ width: "100%", display: "flex", alignItems: "flex-start" }}>
                {/* Notification Content */}
                <Box sx={{ flex: 1 }}>
                  {/* Title */}
                  <Typography
                    variant="body2"
                    fontWeight={notif.is_read ? 400 : 600}
                    sx={{ mb: 0.5 }}
                  >
                    {notif.title || "มีลูกค้าใหม่ที่ได้รับมอบหมาย"}
                  </Typography>

                  {/* Message */}
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    display="block"
                    sx={{ mb: 0.5 }}
                  >
                    {notif.message}
                  </Typography>

                  {/* Timestamp */}
                  <Typography variant="caption" color="text.disabled" sx={{ fontSize: "0.7rem" }}>
                    {notif.timestamp ? dayjs(notif.timestamp).fromNow() : "เมื่อสักครู่"}
                  </Typography>
                </Box>

                {/* Dismiss Button (X) */}
                <IconButton
                  size="small"
                  onClick={(e) => handleDismiss(e, notif)}
                  sx={{
                    ml: 1,
                    opacity: 0.5,
                    "&:hover": { opacity: 1, color: "error.main" },
                  }}
                >
                  <MdClose size={16} />
                </IconButton>
              </Box>
            </MenuItem>
          ))}
        </Box>
      )}
    </Menu>
  );
};

export default NotificationMenu;
