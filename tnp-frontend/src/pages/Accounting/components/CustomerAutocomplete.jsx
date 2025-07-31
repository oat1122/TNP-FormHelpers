import React, { useState, useEffect, useMemo } from 'react';
import {
  Autocomplete,
  TextField,
  Box,
  Typography,
  Avatar,
  Chip,
  Paper,
  InputAdornment,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Search as SearchIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
  Add as AddIcon,
  Clear as ClearIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { customerService } from '../../../features/Accounting';
import { debounce } from 'lodash';

/**
 * CustomerAutocomplete component
 * Autocomplete สำหรับเลือกลูกค้า พร้อมการค้นหาและแสดงข้อมูลลูกค้า
 * 
 * @param {Object} props
 * @param {Object|null} props.value - Selected customer object
 * @param {function} props.onChange - Change handler (event, customer) => void
 * @param {string} props.label - Input label
 * @param {string} props.placeholder - Input placeholder
 * @param {boolean} props.required - Whether field is required
 * @param {boolean} props.disabled - Whether field is disabled
 * @param {boolean} props.readOnly - Whether field is read-only
 * @param {string} props.variant - TextField variant
 * @param {string} props.size - Component size
 * @param {Object} props.sx - Additional styles
 * @param {boolean} props.showAvatar - Whether to show customer avatar
 * @param {boolean} props.showAddButton - Whether to show add new customer button
 * @param {function} props.onAddNew - Handler for add new customer
 * @param {string} props.error - Error message
 * @param {string} props.helperText - Helper text
 * @param {Array} props.includeTypes - Customer types to include ['individual', 'company']
 * @param {Array} props.excludeIds - Customer IDs to exclude from results
 * @param {boolean} props.allowClear - Whether to show clear button
 */
const CustomerAutocomplete = ({
  value = null,
  onChange,
  label = 'เลือกลูกค้า',
  placeholder = 'ค้นหาชื่อลูกค้า, ชื่อบริษัท, อีเมล หรือเบอร์โทร...',
  required = false,
  disabled = false,
  readOnly = false,
  variant = 'outlined',
  size = 'medium',
  sx = {},
  showAvatar = true,
  showAddButton = false,
  onAddNew,
  error,
  helperText,
  includeTypes = ['individual', 'company'],
  excludeIds = [],
  allowClear = true,
  ...textFieldProps
}) => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [apiError, setApiError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Debounced search function
  const debouncedSearch = useMemo(
    () => debounce(async (search) => {
      if (!search || search.length < 2) {
        setCustomers([]);
        setHasSearched(false);
        return;
      }

      setLoading(true);
      setApiError(null);

      try {
        const response = await customerService.searchCustomers({
          search,
          types: includeTypes,
          per_page: 20,
          exclude_ids: excludeIds
        });

        if (response.data && response.data.data) {
          setCustomers(response.data.data);
          setHasSearched(true);
        } else {
          setCustomers([]);
          setHasSearched(true);
        }
      } catch (err) {
        console.error('Error searching customers:', err);
        
        let errorMessage = 'ไม่สามารถค้นหาลูกค้าได้';
        if (err.response?.status === 401) {
          errorMessage = 'ไม่มีสิทธิ์เข้าถึงข้อมูลลูกค้า';
        } else if (err.response?.status >= 500) {
          errorMessage = 'เกิดข้อผิดพลาดในระบบเซิร์ฟเวอร์';
        }
        
        setApiError(errorMessage);
        setCustomers([]);
        setHasSearched(true);
      } finally {
        setLoading(false);
      }
    }, 300),
    [includeTypes, excludeIds]
  );

  // Effect to handle search
  useEffect(() => {
    debouncedSearch(searchTerm);
    return () => {
      debouncedSearch.cancel();
    };
  }, [searchTerm, debouncedSearch]);

  // Load initial customers if value is provided but not in current options
  useEffect(() => {
    if (value && !customers.find(c => c.id === value.id)) {
      setCustomers(prev => [value, ...prev]);
    }
  }, [value, customers]);

  const handleInputChange = (event, newInputValue, reason) => {
    if (reason === 'input') {
      setSearchTerm(newInputValue);
    }
  };

  const handleChange = (event, newValue, reason) => {
    if (onChange) {
      onChange(event, newValue, reason);
    }
  };

  const handleAddNew = () => {
    if (onAddNew) {
      onAddNew(searchTerm);
    }
  };

  const getCustomerDisplayName = (customer) => {
    if (!customer) return '';
    
    if (customer.type === 'company') {
      return customer.company_name || customer.name;
    } else {
      return `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || customer.name;
    }
  };

  const getCustomerSecondaryText = (customer) => {
    if (!customer) return '';
    
    const parts = [];
    
    if (customer.type === 'company' && customer.contact_person) {
      parts.push(`ติดต่อ: ${customer.contact_person}`);
    }
    
    if (customer.email) {
      parts.push(customer.email);
    }
    
    if (customer.phone) {
      parts.push(customer.phone);
    }
    
    return parts.join(' • ');
  };

  const renderOption = (props, customer) => (
    <Box component="li" {...props} key={customer.id}>
      <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', py: 1 }}>
        {showAvatar && (
          <Avatar 
            sx={{ 
              mr: 2, 
              bgcolor: customer.type === 'company' ? 'primary.main' : 'secondary.main',
              width: 32,
              height: 32
            }}
          >
            {customer.type === 'company' ? <BusinessIcon /> : <PersonIcon />}
          </Avatar>
        )}
        
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Typography variant="body1" noWrap>
            {getCustomerDisplayName(customer)}
          </Typography>
          
          {getCustomerSecondaryText(customer) && (
            <Typography variant="body2" color="text.secondary" noWrap>
              {getCustomerSecondaryText(customer)}
            </Typography>
          )}
          
          <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
            <Chip 
              label={customer.type === 'company' ? 'นิติบุคคล' : 'บุคคลธรรมดา'}
              size="small"
              variant="outlined"
              color={customer.type === 'company' ? 'primary' : 'secondary'}
            />
            
            {customer.customer_group && (
              <Chip 
                label={customer.customer_group}
                size="small"
                variant="outlined"
                color="default"
              />
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );

  const renderInput = (params) => (
    <TextField
      {...params}
      {...textFieldProps}
      label={label}
      placeholder={placeholder}
      variant={variant}
      size={size}
      required={required}
      error={!!error}
      helperText={error || helperText}
      InputProps={{
        ...params.InputProps,
        startAdornment: (
          <InputAdornment position="start">
            <SearchIcon color="action" />
          </InputAdornment>
        ),
        endAdornment: (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {loading && <CircularProgress size={20} />}
            
            {allowClear && value && !disabled && !readOnly && (
              <Tooltip title="ล้างการเลือก">
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleChange(e, null, 'clear');
                  }}
                >
                  <ClearIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            
            {showAddButton && onAddNew && searchTerm && (
              <Tooltip title="เพิ่มลูกค้าใหม่">
                <IconButton
                  size="small"
                  onClick={handleAddNew}
                  color="primary"
                >
                  <AddIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            
            {params.InputProps.endAdornment}
          </Box>
        )
      }}
    />
  );

  return (
    <Box sx={sx}>
      <Autocomplete
        value={value}
        onChange={handleChange}
        onInputChange={handleInputChange}
        options={customers}
        getOptionLabel={getCustomerDisplayName}
        isOptionEqualToValue={(option, value) => option.id === value?.id}
        renderOption={renderOption}
        renderInput={renderInput}
        loading={loading}
        disabled={disabled}
        readOnly={readOnly}
        filterOptions={(x) => x} // Disable built-in filtering since we use server-side search
        noOptionsText={
          loading ? 'กำลังค้นหา...' :
          apiError ? apiError :
          !hasSearched ? 'พิมพ์เพื่อค้นหาลูกค้า' :
          searchTerm.length < 2 ? 'พิมพ์อย่างน้อย 2 ตัวอักษร' :
          'ไม่พบลูกค้าที่ตรงกับคำค้นหา'
        }
        PaperComponent={({ children, ...paperProps }) => (
          <Paper {...paperProps}>
            {apiError && (
              <Alert 
                severity="error" 
                sx={{ m: 1 }}
                action={
                  <IconButton 
                    size="small" 
                    onClick={() => debouncedSearch(searchTerm)}
                  >
                    <RefreshIcon />
                  </IconButton>
                }
              >
                {apiError}
              </Alert>
            )}
            {children}
          </Paper>
        )}
        sx={{
          '& .MuiAutocomplete-listbox': {
            maxHeight: 300
          }
        }}
      />
    </Box>
  );
};

export default CustomerAutocomplete;