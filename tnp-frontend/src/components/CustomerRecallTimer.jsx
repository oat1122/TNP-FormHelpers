import { useState, useEffect } from 'react';
import { Box, Typography } from "@mui/material";
import moment from "moment";
import 'moment/locale/th';

// Set moment to use Thai locale
moment.locale('th');

function CustomerRecallTimer({ cd_last_datetime, showIcon = false, size = "body2", urgentThreshold = 7 }) {
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
        total: 0
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
        total: -Math.abs(total)
      };
    }
    
    return {
      days: Math.floor(duration.asDays()),
      hours: duration.hours(),
      minutes: duration.minutes(),
      seconds: duration.seconds(),
      expired: false,
      total: total
    };
  }

  // Format the display text
  const formatTimeDisplay = () => {
    if (!cd_last_datetime) {
      return "-";
    }

    const { days, hours, minutes, seconds, expired } = timeRemaining;
    
    if (expired) {
      // แสดงเวลาที่เกินกำหนดแล้ว
      if (days > 0) {
        return `เกิน ${days} วัน`;
      } else if (hours > 0) {
        return `เกิน ${hours} ชม`;
      } else if (minutes > 0) {
        return `เกิน ${minutes} นาที`;
      } else {
        return `เกิน ${seconds} วินาที`;
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
      return "error.main"; // แดงเข้มเมื่อเกินเวลา
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
    
    const { days, expired } = timeRemaining;
    return (expired || days <= urgentThreshold) ? "bold" : "normal";
  };

  // Animation for urgent cases
  const getAnimation = () => {
    if (!cd_last_datetime) return "none";
    
    const { days, expired } = timeRemaining;
    return (expired || days <= urgentThreshold) 
      ? "subtle-pulse 1.5s infinite ease-in-out" 
      : "none";
  };

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        width: "100%",
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