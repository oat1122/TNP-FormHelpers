import React, { useState } from 'react';
import { ToggleButtonGroup, ToggleButton } from '@mui/material';

/*
 * Reusable pill-style two/ multi option toggle
 * Props:
 *  - value: current selected value (string)
 *  - onChange: (newValue)=>void
 *  - options: [{ value, label }]
 *  - size: 'small' | 'medium'
 *  - color: palette key (primary | secondary | warning | success ... ) OR custom hex via customColor
 *  - customColor: override base background color (string)
 *  - exclusive: boolean (default true)
 *  - sx: style overrides
 */
const LabeledSwitch = ({
  value,
  onChange = () => {},
  options = [],
  size = 'small',
  color = 'primary',
  customColor,
  selectedTextColor, // override text color when selected
  disabled = false,
  exclusive = true,
  sx = {}
}) => {
  // fallback internal state if component used uncontrolled
  const [internal, setInternal] = useState(options[0]?.value);
  const current = value !== undefined ? value : internal;

  const handleChange = (_e, newVal) => {
    if (newVal === null) return; // keep old when clicking same
    if (value === undefined) setInternal(newVal);
    onChange(newVal);
  };

  const bgColorSx = customColor ? customColor : (theme) => theme.palette[color]?.main || theme.palette.primary.main;
  const activeColor = customColor ? '#ffffff' : bgColorSx;

  return (
    <ToggleButtonGroup
      value={current}
      exclusive={exclusive}
      onChange={handleChange}
      size={size}
      disabled={disabled}
      sx={{
        borderRadius: '999px',
        overflow: 'hidden',
        bgcolor: (theme)=> disabled ? theme.palette.action.disabledBackground : (typeof bgColorSx === 'function' ? bgColorSx(theme) : bgColorSx),
        p: '2px',
        minHeight: size === 'small' ? 28 : 34,
        '& .MuiToggleButton-root': {
          flex: 1,
          textTransform: 'none',
          fontWeight: 500,
          color: disabled ? 'rgba(255,255,255,0.6)' : '#fff',
          border: 'none',
          lineHeight: 1.1,
          px: 1.5,
          borderRadius: '999px !important',
          fontSize: size === 'small' ? '.65rem' : '.75rem',
          '&.Mui-selected': {
            bgcolor: '#fff',
            color: disabled ? 'text.disabled' : (selectedTextColor || activeColor),
            fontWeight: 700,
            boxShadow: '0 1px 2px rgba(0,0,0,0.18)',
            '&:hover': { bgcolor: '#fff' },
            '&:active': { transform: 'scale(.96)' }
          },
          '&:hover': { bgcolor: disabled ? 'inherit' : 'rgba(255,255,255,0.15)' }
        },
        ...sx
      }}
    >
      {options.map(opt => (
        <ToggleButton key={opt.value} value={opt.value} aria-label={opt.label} disabled={disabled}>
          {opt.label}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
};

export default LabeledSwitch;
