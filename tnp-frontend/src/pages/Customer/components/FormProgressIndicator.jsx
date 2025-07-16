import React from "react";
import { 
  Box, 
  LinearProgress, 
  Typography, 
  Chip, 
  Card, 
  CardContent,
  Stack,
  Tooltip
} from "@mui/material";
import { 
  MdCheckCircle, 
  MdError, 
  MdWarning, 
  MdInfo 
} from "react-icons/md";
import { styled } from "@mui/material/styles";

// Styled components
const ProgressCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  background: `linear-gradient(135deg, rgba(178, 0, 0, 0.1) 0%, ${theme.palette.background.paper} 100%)`,
  borderLeft: `4px solid #B20000`, // สีแดงหลักของ theme
}));

const ProgressBar = styled(LinearProgress)(({ theme }) => ({
  height: 8,
  borderRadius: 4,
  backgroundColor: "#EBEBEB", // สีเทาของ theme
  "& .MuiLinearProgress-bar": {
    borderRadius: 4,
    background: `linear-gradient(90deg, #2e7d32 0%, #B20000 100%)`, // จากเขียวไปแดงตาม theme
  },
}));

const TabProgress = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1),
  padding: theme.spacing(0.5, 1),
  borderRadius: theme.shape.borderRadius,
  backgroundColor: "#EBEBEB", // สีเทาของ theme
}));

const StatusChip = styled(Chip)(({ theme, status }) => {
  const statusColors = {
    completed: {
      backgroundColor: "#2e7d32",
      color: "#ffffff",
    },
    error: {
      backgroundColor: "#B20000", // สีแดงหลักของ theme
      color: "#ffffff",
    },
    warning: {
      backgroundColor: "#E36264", // สีแดงอ่อนของ theme
      color: "#ffffff",
    },
    pending: {
      backgroundColor: "#EBEBEB", // สีเทาของ theme
      color: "#212429", // สีเทาเข้มของ theme
    },
  };

  return {
    fontSize: "0.7rem",
    height: 20,
    fontWeight: 500,
    ...statusColors[status],
  };
});

/**
 * FormProgressIndicator - แสดงความคืบหน้าของการกรอกฟอร์ม
 * @param {Object} props
 * @param {Object} props.inputList - ข้อมูลที่กรอกในฟอร์ม
 * @param {Object} props.errors - ข้อผิดพลาดในฟอร์ม
 * @param {number} props.currentTab - tab ปัจจุบัน
 * @param {Function} props.onTabClick - callback เมื่อคลิกที่ tab
 */
const FormProgressIndicator = ({ 
  inputList = {}, 
  errors = {}, 
  currentTab = 0,
  onTabClick 
}) => {
  // กำหนด required fields สำหรับแต่ละ tab
  const tabRequiredFields = {
    0: ["cus_company", "cus_firstname", "cus_lastname", "cus_name", "cus_bt_id"], // ข้อมูลพื้นฐาน
    1: ["cus_tel_1"], // ข้อมูลติดต่อ
    2: ["cus_address", "cus_pro_id", "cus_dis_id", "cus_sub_id"], // ที่อยู่
    3: [], // บันทึกเพิ่มเติม (ไม่บังคับ)
  };

  const tabNames = [
    "ข้อมูลพื้นฐาน",
    "ข้อมูลติดต่อ", 
    "ที่อยู่",
    "บันทึกเพิ่มเติม"
  ];

  const tabIcons = [
    <MdInfo />,
    <MdInfo />,
    <MdInfo />,
    <MdInfo />
  ];

  // คำนวณสถานะของแต่ละ tab
  const calculateTabStatus = (tabIndex) => {
    const requiredFields = tabRequiredFields[tabIndex] || [];
    const tabErrors = requiredFields.filter(field => errors[field]);
    const completedFields = requiredFields.filter(field => {
      const value = inputList[field];
      return value !== undefined && value !== null && value !== "";
    });

    if (tabErrors.length > 0) {
      return "error";
    } else if (requiredFields.length > 0 && completedFields.length === requiredFields.length) {
      return "completed";
    } else if (completedFields.length > 0) {
      return "warning";
    } else {
      return "pending";
    }
  };

  // คำนวณ progress รวม
  const calculateOverallProgress = () => {
    const allRequiredFields = Object.values(tabRequiredFields).flat();
    const completedFields = allRequiredFields.filter(field => {
      const value = inputList[field];
      return value !== undefined && value !== null && value !== "";
    });
    
    return allRequiredFields.length > 0 
      ? Math.round((completedFields.length / allRequiredFields.length) * 100)
      : 0;
  };

  const overallProgress = calculateOverallProgress();
  const totalErrors = Object.keys(errors).filter(key => errors[key]).length;

  // แสดงข้อความสถานะ
  const getStatusMessage = () => {
    if (totalErrors > 0) {
      return `มีข้อผิดพลาด ${totalErrors} จุด`;
    } else if (overallProgress === 100) {
      return "กรอกข้อมูลครบถ้วนแล้ว";
    } else if (overallProgress > 50) {
      return "กรอกข้อมูลไปแล้วมากกว่าครึ่ง";
    } else if (overallProgress > 0) {
      return "เริ่มกรอกข้อมูลแล้ว";
    } else {
      return "ยังไม่ได้เริ่มกรอกข้อมูล";
    }
  };

  // รับ icon ตามสถานะ
  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return <MdCheckCircle size={16} />;
      case "error":
        return <MdError size={16} />;
      case "warning":
        return <MdWarning size={16} />;
      default:
        return <MdInfo size={16} />;
    }
  };

  return (
    <ProgressCard elevation={1}>
      <CardContent sx={{ pb: 2, "&:last-child": { pb: 2 } }}>
        {/* Header */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Typography variant="subtitle1" fontWeight={600} sx={{ color: "#B20000" }}>
            ความคืบหน้าการกรอกข้อมูล
          </Typography>
          <Chip 
            label={`${overallProgress}%`} 
            sx={{
              backgroundColor: overallProgress === 100 ? "#2e7d32" : overallProgress > 50 ? "#B20000" : "#EBEBEB",
              color: overallProgress > 50 ? "#ffffff" : "#212429",
              fontWeight: 600
            }}
            size="small"
          />
        </Box>

        {/* Progress Bar */}
        <Box sx={{ mb: 2 }}>
          <ProgressBar 
            variant="determinate" 
            value={overallProgress} 
            sx={{ mb: 1 }}
          />
          <Typography variant="body2" color="text.secondary" textAlign="center">
            {getStatusMessage()}
          </Typography>
        </Box>

        {/* Tab Status */}
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {tabNames.map((name, index) => {
            const status = calculateTabStatus(index);
            const isActive = currentTab === index;
            
            return (
              <Tooltip 
                key={index}
                title={`คลิกเพื่อไปยัง ${name}`}
                arrow
              >
                <TabProgress
                  onClick={() => onTabClick && onTabClick(index)}
                  sx={{
                    cursor: onTabClick ? "pointer" : "default",
                    border: isActive ? 2 : 1,
                    borderColor: isActive ? "#B20000" : "#d9d9d9", // ใช้สีของ theme
                    "&:hover": onTabClick ? {
                      backgroundColor: "rgba(178, 0, 0, 0.1)",
                      borderColor: "#B20000",
                    } : {},
                  }}
                >
                  {getStatusIcon(status)}
                  <Typography 
                    variant="caption" 
                    fontWeight={isActive ? 600 : 400}
                    sx={{ 
                      color: isActive ? "#B20000" : "#212429",
                      mr: 0.5
                    }}
                  >
                    {name}
                  </Typography>
                  <StatusChip 
                    status={status}
                    label={
                      status === "completed" ? "เสร็จ" :
                      status === "error" ? "ผิดพลาด" :
                      status === "warning" ? "บางส่วน" : "รอ"
                    }
                    size="small"
                  />
                </TabProgress>
              </Tooltip>
            );
          })}
        </Stack>

        {/* Error Summary */}
        {totalErrors > 0 && (
          <Box sx={{ mt: 2, p: 1, backgroundColor: "rgba(178, 0, 0, 0.1)", borderRadius: 1 }}>
            <Typography variant="caption" sx={{ color: "#B20000", fontWeight: 500 }}>
              <MdError size={14} style={{ marginRight: 4, verticalAlign: "middle" }} />
              พบข้อผิดพลาด {totalErrors} จุด กรุณาตรวจสอบและแก้ไขก่อนบันทึก
            </Typography>
          </Box>
        )}
      </CardContent>
    </ProgressCard>
  );
};

export default FormProgressIndicator; 