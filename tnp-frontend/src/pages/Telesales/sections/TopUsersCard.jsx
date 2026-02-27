import { Paper, Typography, Box, Chip, Skeleton } from "@mui/material";

/**
 * Top Users Card component
 * Displays ranking of users by customer count (team view only)
 *
 * @param {Object} props
 * @param {Array} props.byUser - Array of users with { user_id, full_name, count }
 * @param {boolean} props.isLoading - Loading state
 * @param {function} props.onUserClick - Handler when user is clicked
 */
const TopUsersCard = ({ byUser = [], isLoading, onUserClick }) => {
  return (
    <Paper elevation={2} sx={{ p: 2, height: "100%" }}>
      <Typography variant="h6" gutterBottom fontWeight={600}>
        ผู้ที่เพิ่มลูกค้าสูงสุด
      </Typography>

      {isLoading ? (
        <Box>
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} height={40} sx={{ mb: 1 }} />
          ))}
        </Box>
      ) : byUser.length === 0 ? (
        <Box display="flex" alignItems="center" justifyContent="center" minHeight={200}>
          <Typography color="text.secondary">ไม่มีข้อมูล</Typography>
        </Box>
      ) : (
        <Box>
          {byUser.map((user, index) => (
            <Box
              key={user.user_id}
              onClick={() => onUserClick && onUserClick(user)}
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              py={1}
              sx={{
                borderBottom: index < byUser.length - 1 ? 1 : 0,
                borderColor: "divider",
                cursor: onUserClick ? "pointer" : "default",
                "&:hover": onUserClick ? { backgroundColor: "action.hover" } : {},
                px: onUserClick ? 1 : 0,
                borderRadius: onUserClick ? 1 : 0,
              }}
            >
              <Box display="flex" alignItems="center" gap={1}>
                <Chip size="small" label={index + 1} color={index === 0 ? "primary" : "default"} />
                <Typography variant="body2">{user.full_name}</Typography>
              </Box>
              <Chip label={`${user.count} ราย`} size="small" variant="outlined" />
            </Box>
          ))}
        </Box>
      )}
    </Paper>
  );
};

export default TopUsersCard;
