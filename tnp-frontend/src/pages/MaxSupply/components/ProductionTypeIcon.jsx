import React from 'react';
import { 
  ScreenShare, 
  PhoneAndroid, 
  Sports, 
  ContentCut,
  Help as HelpIcon 
} from '@mui/icons-material';
import { productionTypeConfig } from '../utils/constants';

const ProductionTypeIcon = ({ type, size = 20, color = 'inherit', ...props }) => {
  const config = productionTypeConfig[type] || productionTypeConfig.screen;
  
  const iconComponents = {
    ScreenShare,
    PhoneAndroid,
    Sports,
    ContentCut,
  };
  
  const IconComponent = iconComponents[config.iconComponent] || HelpIcon;
  
  return (
    <IconComponent
      sx={{
        fontSize: size,
        color: color === 'inherit' ? config.color : color,
        ...props.sx,
      }}
      {...props}
    />
  );
};

export default ProductionTypeIcon; 