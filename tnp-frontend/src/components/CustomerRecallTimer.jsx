import { useState, useEffect } from "react";
import { Box, Typography } from "@mui/material";
import moment from "moment";
import "moment/locale/th";

// Set moment to use Thai locale
moment.locale("th");

function CustomerRecallTimer({
  cd_last_datetime,
  showIcon = false,
  size = "body2",
  urgentThreshold = 7,
}) {
  const [timeRemaining, setTimeRemaining] = useState(getTimeRemaining());

  useEffect(() => {
    // Update the countdown every 1 second
    const intervalId = setInterval(() => {
      setTimeRemaining(getTimeRemaining());
    }, 1000);

    // Cleanup the interval when the component unmounts
    return () => clearInterval(intervalId);
  }, [cd_last_datetime]); // Re-run when cd_last_datetime changes

  // Function to calculate time remaining
  function getTimeRemaining() {
    if (!cd_last_datetime) {
      return {
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        expired: false,
        total: 0,
      };
    }

    const now = moment();
    const recallDate = moment(cd_last_datetime);
    const duration = moment.duration(recallDate.diff(now));

    const total = recallDate.diff(now);
    const expired = total <= 0;

    if (expired) {
      // เมื่อเกินเวลาแล้ว คำนวณจำนวนวันที่เกินไป
      const overdueDuration = moment.duration(now.diff(recallDate));
      return {
        days: Math.floor(overdueDuration.asDays()),
        hours: overdueDuration.hours(),
        minutes: overdueDuration.minutes(),
        seconds: overdueDuration.seconds(),
        expired: true,
        total: -Math.abs(total),
      };
    }

    return {
      days: Math.floor(duration.asDays()),
      hours: duration.hours(),
      minutes: duration.minutes(),
      seconds: duration.seconds(),
      expired: false,
      total: total,
    };
  }

  // Format the display text
  const formatTimeDisplay = () => {
    if (!cd_last_datetime) {
      return "-";
    }

    const { days, hours, minutes, seconds, expired } = timeRemaining;

    if (expired) {
      // แสดงเวลาที่เกินกำหนดแล้ว - แยกประเภทตามระยะเวลา
      if (days === 0) {
        if (hours > 0) {
          return "ครบกำหนดแล้ว";
        } else {
          return "ครบกำหนดแล้ว";
        }
      } else if (days >= 1 && days <= 3) {
        return `เกิน ${days} วัน - เร่งด่วน`;
      } else if (days >= 4 && days <= 7) {
        return `เกิน ${days} วัน - มาก`;
      } else if (days >= 8 && days <= 30) {
        return `เกิน ${days} วัน - นาน`;
      } else {
        return `เกิน ${days} วัน - นานมาก`;
      }
    } else {
      // แสดงเวลาที่เหลือ
      if (days > 0) {
        return `${days} วัน`;
      } else if (hours > 0) {
        return `${hours} ชม`;
      } else if (minutes > 0) {
        return `${minutes} นาที`;
      } else {
        return `${seconds} วินาที`;
      }
    }
  };

  // Determine color based on urgency
  const getColor = () => {
    if (!cd_last_datetime) return "inherit";

    const { days, expired } = timeRemaining;

    if (expired) {
      return "error.main"; // แดงเข้มเมื่อเกินเวลาทั้งหมด
    } else if (days <= urgentThreshold) {
      return "error.main"; // แดงเมื่อใกล้ครบกำหนด
    } else if (days <= 15) {
      return "warning.main"; // ส้มเมื่อค่อนข้างใกล้
    } else {
      return "success.main"; // เขียวเมื่อยังไกล
    }
  };

  // Determine font weight
  const getFontWeight = () => {
    if (!cd_last_datetime) return "normal";

    const { expired } = timeRemaining;
    return expired ? "bold" : "normal";
  };

  // Animation for urgent cases
  const getAnimation = () => {
    if (!cd_last_datetime) return "none";

    const { expired } = timeRemaining;
    return expired ? "glow-border 2s ease-in-out infinite" : "none";
  };

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        width: "100%",
        // Add glow-border keyframes
        "@keyframes glow-border": {
          "0%": {
            boxShadow: "0 0 5px rgba(244, 67, 54, 0.5), inset 0 0 5px rgba(244, 67, 54, 0.1)",
          },
          "50%": {
            boxShadow: "0 0 20px rgba(244, 67, 54, 0.8), inset 0 0 10px rgba(244, 67, 54, 0.3)",
          },
          "100%": {
            boxShadow: "0 0 5px rgba(244, 67, 54, 0.5), inset 0 0 5px rgba(244, 67, 54, 0.1)",
          },
        },
      }}
    >
      <Typography
        variant={size}
        sx={{
          fontWeight: getFontWeight(),
          color: getColor(),
          display: "flex",
          alignItems: "center",
          gap: 0.5,
          animation: getAnimation(),
          padding: "4px 8px",
          borderRadius: "12px",
          backgroundColor: timeRemaining.expired ? "rgba(244, 67, 54, 0.1)" : "transparent",
        }}
      >
        {showIcon && (timeRemaining.expired || timeRemaining.days <= urgentThreshold) && (
          <Box component="span" sx={{ fontSize: "1.2rem" }}>
            {timeRemaining.expired ? "🔴" : timeRemaining.days <= urgentThreshold ? "⚠️" : ""}
          </Box>
        )}
        {formatTimeDisplay()}
      </Typography>
    </Box>
  );
}

export default CustomerRecallTimer;
