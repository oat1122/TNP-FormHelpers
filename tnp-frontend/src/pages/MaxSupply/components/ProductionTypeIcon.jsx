import React from "react";
import {
  ScreenShare,
  Print,
  LocalPrintshop,
  ContentCut,
  Help as HelpIcon,
} from "@mui/icons-material";
import { productionTypeConfig } from "../utils/constants";

const ProductionTypeIcon = ({ type, size = 20, color = "inherit", ...props }) => {
  const config = productionTypeConfig[type] || productionTypeConfig.screen;

  const iconComponents = {
    ScreenShare,
    Print, // เปลี่ยนจาก PhoneAndroid เป็น Print สำหรับ DTF
    LocalPrintshop, // สำหรับ sublimation
    ContentCut, // สำหรับ embroidery
  };

  const IconComponent = iconComponents[config.iconComponent] || HelpIcon;

  return (
    <IconComponent
      sx={{
        fontSize: size,
        color: color === "inherit" ? config.color : color,
        ...props.sx,
      }}
      {...props}
    />
  );
};

export default ProductionTypeIcon;
