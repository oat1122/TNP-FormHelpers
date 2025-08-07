import React, { useState, useEffect } from 'react';
import {
    Card,
    CardContent,
    Typography,
    Grid,
    TextField,
    Button,
    Box,
    IconButton,
    Collapse,
    Alert,
    CircularProgress,
    Divider,
    Autocomplete,
    FormControl,
    FormLabel,
    RadioGroup,
    FormControlLabel,
    Radio,
} from '@mui/material';
import {
    Edit as EditIcon,
    Save as SaveIcon,
    Cancel as CancelIcon,
    Business as BusinessIcon,
    Person as PersonIcon,
    Phone as PhoneIcon,
    Email as EmailIcon,
    LocationOn as LocationIcon,
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon,
    Check as CheckIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { customerApi, validateCustomerData, formatPhoneNumber, formatTaxId } from './customerApiUtils';

// Styled Components
const CustomerCard = styled(Card)(({ theme }) => ({
    background: 'linear-gradient(135deg, #FFFFFF 0%, #F8F9FA 100%)',
    border: '2px solid #E36264',
    borderRadius: '16px',
    boxShadow: '0 8px 24px rgba(144, 15, 15, 0.15)',
    position: 'relative',
    overflow: 'hidden',
    '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '4px',
        background: 'linear-gradient(90deg, #900F0F 0%, #B20000 100%)',
    },
}));

const CustomerHeader = styled(Box)(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '16px',
    padding: '8px 0',
}));

const EditButton = styled(IconButton)(({ theme }) => ({
    background: 'linear-gradient(135deg, #900F0F 0%, #B20000 100%)',
    color: '#FFFFFF',
    width: '48px',
    height: '48px',
    boxShadow: '0 4px 12px rgba(144, 15, 15, 0.3)',
    '&:hover': {
        background: 'linear-gradient(135deg, #B20000 0%, #E36264 100%)',
        transform: 'scale(1.05)',
    },
    transition: 'all 0.3s ease-in-out',
}));

const SaveButton = styled(Button)(({ theme }) => ({
    background: 'linear-gradient(135deg, #4CAF50 0%, #45A049 100%)',
    color: '#FFFFFF',
    borderRadius: '12px',
    padding: '10px 20px',
    fontWeight: 600,
    textTransform: 'none',
    boxShadow: '0 4px 12px rgba(76, 175, 80, 0.3)',
    '&:hover': {
        background: 'linear-gradient(135deg, #45A049 0%, #388E3C 100%)',
        transform: 'translateY(-2px)',
    },
    '&:disabled': {
        background: '#E0E0E0',
        color: '#9E9E9E',
    },
    transition: 'all 0.3s ease-in-out',
}));

const CancelButton = styled(Button)(({ theme }) => ({
    border: '2px solid #FF6B6B',
    color: '#FF6B6B',
    borderRadius: '12px',
    padding: '8px 20px',
    fontWeight: 600,
    textTransform: 'none',
    '&:hover': {
        backgroundColor: 'rgba(255, 107, 107, 0.05)',
        borderColor: '#FF5252',
        color: '#FF5252',
    },
    transition: 'all 0.3s ease-in-out',
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
    '& .MuiOutlinedInput-root': {
        borderRadius: '12px',
        backgroundColor: '#FFFFFF',
        '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: '#B20000',
        },
        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#900F0F',
            borderWidth: '2px',
        },
    },
    '& .MuiInputLabel-root.Mui-focused': {
        color: '#900F0F',
    },
}));

const CustomerEditCard = ({ customer, onUpdate, onCancel }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editData, setEditData] = useState({});
    const [provinces, setProvinces] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [subdistricts, setSubdistricts] = useState([]);
    const [businessTypes, setBusinessTypes] = useState([]);
    const [errors, setErrors] = useState({});

    // Initialize edit data when customer changes
    useEffect(() => {
        if (customer) {
            setEditData({
                cus_company: customer.cus_company || '',
                cus_firstname: customer.cus_firstname || '',
                cus_lastname: customer.cus_lastname || '',
                cus_name: customer.cus_name || '',
                cus_depart: customer.cus_depart || '',
                cus_tel_1: customer.cus_tel_1 || '',
                cus_tel_2: customer.cus_tel_2 || '',
                cus_email: customer.cus_email || '',
                cus_tax_id: customer.cus_tax_id || '',
                cus_address: customer.cus_address || '',
                cus_zip_code: customer.cus_zip_code || '',
                cus_channel: customer.cus_channel || 1,
                cus_bt_id: customer.cus_bt_id || '',
                cus_pro_id: customer.cus_pro_id || '',
                cus_dis_id: customer.cus_dis_id || '',
                cus_sub_id: customer.cus_sub_id || '',
            });
        }
    }, [customer]);

    // Load master data
    useEffect(() => {
        loadMasterData();
    }, []);

    const loadMasterData = async () => {
        try {
            // Load business types
            const businessTypesData = await customerApi.getBusinessTypes();
            setBusinessTypes(businessTypesData);

            // Load provinces
            const provincesData = await customerApi.getProvinces();
            setProvinces(provincesData);
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message || 'ไม่สามารถโหลดข้อมูลได้';
            console.error('Failed to load master data:', {
                error: errorMessage,
                status: error.response?.status,
                url: error.config?.url
            });
            setErrors({ general: `ไม่สามารถโหลดข้อมูลได้: ${errorMessage}` });
        }
    };

    const loadDistricts = async (provinceId) => {
        try {
            const districtsData = await customerApi.getDistricts(provinceId);
            setDistricts(districtsData);
            setSubdistricts([]); // Clear subdistricts
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message || 'ไม่สามารถโหลดข้อมูลอำเภอได้';
            console.error('Failed to load districts:', {
                provinceId,
                error: errorMessage,
                status: error.response?.status
            });
            setDistricts([]);
        }
    };

    const loadSubdistricts = async (districtId) => {
        try {
            const subdistrictsData = await customerApi.getSubdistricts(districtId);
            setSubdistricts(subdistrictsData);
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message || 'ไม่สามารถโหลดข้อมูลตำบลได้';
            console.error('Failed to load subdistricts:', {
                districtId,
                error: errorMessage,
                status: error.response?.status
            });
            setSubdistricts([]);
        }
    };

    const handleEdit = () => {
        setIsEditing(true);
        setIsExpanded(true);
        setErrors({});
    };

    const handleCancel = () => {
        setIsEditing(false);
        setIsExpanded(false);
        setErrors({});
        // Reset to original data
        if (customer) {
            setEditData({
                cus_company: customer.cus_company || '',
                cus_firstname: customer.cus_firstname || '',
                cus_lastname: customer.cus_lastname || '',
                cus_name: customer.cus_name || '',
                cus_depart: customer.cus_depart || '',
                cus_tel_1: customer.cus_tel_1 || '',
                cus_tel_2: customer.cus_tel_2 || '',
                cus_email: customer.cus_email || '',
                cus_tax_id: customer.cus_tax_id || '',
                cus_address: customer.cus_address || '',
                cus_zip_code: customer.cus_zip_code || '',
                cus_channel: customer.cus_channel || 1,
                cus_bt_id: customer.cus_bt_id || '',
                cus_pro_id: customer.cus_pro_id || '',
                cus_dis_id: customer.cus_dis_id || '',
                cus_sub_id: customer.cus_sub_id || '',
            });
        }
        if (onCancel) onCancel();
    };

    const validateForm = () => {
        const validation = validateCustomerData(editData);
        setErrors(validation.errors);
        return validation.isValid;
    };

    const handleSave = async () => {
        if (!validateForm()) {
            return;
        }

        setIsSaving(true);
        try {
            await customerApi.updateCustomer(customer.cus_id, editData);

            // Update local customer data
            const updatedCustomer = { ...customer, ...editData };
            if (onUpdate) onUpdate(updatedCustomer);

            setIsEditing(false);
            setIsExpanded(false);

            // Show success message briefly
            setErrors({ success: 'บันทึกข้อมูลลูกค้าเรียบร้อยแล้ว' });
            setTimeout(() => setErrors({}), 3000);
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล';
            console.error('Failed to save customer data:', {
                customerId: customer.cus_id,
                error: errorMessage,
                status: error.response?.status,
                data: error.response?.data
            });
            setErrors({ general: `เกิดข้อผิดพลาด: ${errorMessage}` });
        } finally {
            setIsSaving(false);
        }
    }; const handleInputChange = (field, value) => {
        setEditData(prev => ({
            ...prev,
            [field]: value
        }));

        // Clear specific error when user starts typing
        if (errors[field]) {
            setErrors(prev => ({
                ...prev,
                [field]: undefined
            }));
        }
    };

    const handleProvinceChange = (event, newValue) => {
        handleInputChange('cus_pro_id', newValue?.pro_id || '');
        setDistricts([]);
        setSubdistricts([]);
        handleInputChange('cus_dis_id', '');
        handleInputChange('cus_sub_id', '');

        if (newValue?.pro_sort_id) {
            loadDistricts(newValue.pro_sort_id);
        }
    };

    const handleDistrictChange = (event, newValue) => {
        handleInputChange('cus_dis_id', newValue?.dis_id || '');
        setSubdistricts([]);
        handleInputChange('cus_sub_id', '');

        if (newValue?.dis_sort_id) {
            loadSubdistricts(newValue.dis_sort_id);
        }
    };

    if (!customer) {
        return (
            <Alert severity="info" sx={{ borderRadius: '12px' }}>
                <Typography>ไม่พบข้อมูลลูกค้า</Typography>
            </Alert>
        );
    }

    return (
        <CustomerCard>
            <CardContent sx={{ padding: '24px' }}>
                {/* Success/Error Messages */}
                {errors.success && (
                    <Alert
                        severity="success"
                        sx={{ mb: 2, borderRadius: '12px' }}
                        icon={<CheckIcon />}
                    >
                        {errors.success}
                    </Alert>
                )}
                {errors.general && (
                    <Alert severity="error" sx={{ mb: 2, borderRadius: '12px' }}>
                        {errors.general}
                    </Alert>
                )}

                <CustomerHeader>
                    <Box display="flex" alignItems="center" gap={2}>
                        <BusinessIcon sx={{ color: '#900F0F', fontSize: '28px' }} />
                        <Box>
                            <Typography variant="h6" sx={{ color: '#900F0F', fontWeight: 600 }}>
                                ข้อมูลลูกค้า
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {isEditing ? 'กำลังแก้ไขข้อมูล' : 'คลิกเพื่อแก้ไขข้อมูลลูกค้า'}
                            </Typography>
                        </Box>
                    </Box>

                    <Box display="flex" gap={1}>
                        {!isEditing && (
                            <>
                                <IconButton
                                    onClick={() => setIsExpanded(!isExpanded)}
                                    sx={{
                                        color: '#900F0F',
                                        '&:hover': { backgroundColor: 'rgba(144, 15, 15, 0.1)' }
                                    }}
                                >
                                    {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                </IconButton>
                                <EditButton onClick={handleEdit}>
                                    <EditIcon />
                                </EditButton>
                            </>
                        )}

                        {isEditing && (
                            <Box display="flex" gap={1}>
                                <SaveButton
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    startIcon={isSaving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
                                >
                                    {isSaving ? 'กำลังบันทึก...' : 'บันทึก'}
                                </SaveButton>
                                <CancelButton onClick={handleCancel} disabled={isSaving}>
                                    ยกเลิก
                                </CancelButton>
                            </Box>
                        )}
                    </Box>
                </CustomerHeader>

                {/* Basic Customer Info (Always Visible) */}
                <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid item xs={12} md={6}>
                        {isEditing ? (
                            <StyledTextField
                                fullWidth
                                label="ชื่อบริษัท *"
                                value={editData.cus_company}
                                onChange={(e) => handleInputChange('cus_company', e.target.value)}
                                error={!!errors.cus_company}
                                helperText={errors.cus_company}
                                size="small"
                            />
                        ) : (
                            <Box>
                                <Typography variant="caption" color="text.secondary">ชื่อบริษัท</Typography>
                                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                    {customer.cus_company || '-'}
                                </Typography>
                            </Box>
                        )}
                    </Grid>
                    <Grid item xs={12} md={6}>
                        {isEditing ? (
                            <StyledTextField
                                fullWidth
                                label="เบอร์โทรศัพท์ *"
                                value={editData.cus_tel_1}
                                onChange={(e) => handleInputChange('cus_tel_1', e.target.value)}
                                error={!!errors.cus_tel_1}
                                helperText={errors.cus_tel_1}
                                size="small"
                                InputProps={{
                                    startAdornment: <PhoneIcon sx={{ color: '#900F0F', mr: 1 }} />
                                }}
                            />
                        ) : (
                            <Box>
                                <Typography variant="caption" color="text.secondary">เบอร์โทรศัพท์</Typography>
                                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                    {formatPhoneNumber(customer.cus_tel_1) || '-'}
                                </Typography>
                            </Box>
                        )}
                    </Grid>
                </Grid>

                {/* Expanded Details */}
                <Collapse in={isExpanded || isEditing}>
                    <Divider sx={{ my: 2 }} />

                    <Grid container spacing={2}>
                        {/* Personal Information */}
                        <Grid item xs={12}>
                            <Typography variant="subtitle2" sx={{ color: '#900F0F', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                                <PersonIcon /> ข้อมูลผู้ติดต่อ
                            </Typography>
                        </Grid>

                        <Grid item xs={12} md={4}>
                            {isEditing ? (
                                <StyledTextField
                                    fullWidth
                                    label="ชื่อ *"
                                    value={editData.cus_firstname}
                                    onChange={(e) => handleInputChange('cus_firstname', e.target.value)}
                                    error={!!errors.cus_firstname}
                                    helperText={errors.cus_firstname}
                                    size="small"
                                />
                            ) : (
                                <Box>
                                    <Typography variant="caption" color="text.secondary">ชื่อ</Typography>
                                    <Typography variant="body2">{customer.cus_firstname || '-'}</Typography>
                                </Box>
                            )}
                        </Grid>

                        <Grid item xs={12} md={4}>
                            {isEditing ? (
                                <StyledTextField
                                    fullWidth
                                    label="นามสกุล *"
                                    value={editData.cus_lastname}
                                    onChange={(e) => handleInputChange('cus_lastname', e.target.value)}
                                    error={!!errors.cus_lastname}
                                    helperText={errors.cus_lastname}
                                    size="small"
                                />
                            ) : (
                                <Box>
                                    <Typography variant="caption" color="text.secondary">นามสกุล</Typography>
                                    <Typography variant="body2">{customer.cus_lastname || '-'}</Typography>
                                </Box>
                            )}
                        </Grid>

                        <Grid item xs={12} md={4}>
                            {isEditing ? (
                                <StyledTextField
                                    fullWidth
                                    label="ชื่อเล่น *"
                                    value={editData.cus_name}
                                    onChange={(e) => handleInputChange('cus_name', e.target.value)}
                                    error={!!errors.cus_name}
                                    helperText={errors.cus_name}
                                    size="small"
                                />
                            ) : (
                                <Box>
                                    <Typography variant="caption" color="text.secondary">ชื่อเล่น</Typography>
                                    <Typography variant="body2">{customer.cus_name || '-'}</Typography>
                                </Box>
                            )}
                        </Grid>

                        <Grid item xs={12} md={6}>
                            {isEditing ? (
                                <StyledTextField
                                    fullWidth
                                    label="ตำแหน่ง/แผนก"
                                    value={editData.cus_depart}
                                    onChange={(e) => handleInputChange('cus_depart', e.target.value)}
                                    size="small"
                                />
                            ) : (
                                <Box>
                                    <Typography variant="caption" color="text.secondary">ตำแหน่ง/แผนก</Typography>
                                    <Typography variant="body2">{customer.cus_depart || '-'}</Typography>
                                </Box>
                            )}
                        </Grid>

                        <Grid item xs={12} md={6}>
                            {isEditing ? (
                                <StyledTextField
                                    fullWidth
                                    label="เบอร์โทรสำรอง"
                                    value={editData.cus_tel_2}
                                    onChange={(e) => handleInputChange('cus_tel_2', e.target.value)}
                                    size="small"
                                />
                            ) : (
                                <Box>
                                    <Typography variant="caption" color="text.secondary">เบอร์โทรสำรอง</Typography>
                                    <Typography variant="body2">{formatPhoneNumber(customer.cus_tel_2) || '-'}</Typography>
                                </Box>
                            )}
                        </Grid>

                        <Grid item xs={12} md={6}>
                            {isEditing ? (
                                <StyledTextField
                                    fullWidth
                                    label="อีเมล"
                                    value={editData.cus_email}
                                    onChange={(e) => handleInputChange('cus_email', e.target.value)}
                                    error={!!errors.cus_email}
                                    helperText={errors.cus_email}
                                    size="small"
                                    InputProps={{
                                        startAdornment: <EmailIcon sx={{ color: '#900F0F', mr: 1 }} />
                                    }}
                                />
                            ) : (
                                <Box>
                                    <Typography variant="caption" color="text.secondary">อีเมล</Typography>
                                    <Typography variant="body2">{customer.cus_email || '-'}</Typography>
                                </Box>
                            )}
                        </Grid>

                        <Grid item xs={12} md={6}>
                            {isEditing ? (
                                <StyledTextField
                                    fullWidth
                                    label="เลขประจำตัวผู้เสียภาษี"
                                    value={editData.cus_tax_id}
                                    onChange={(e) => handleInputChange('cus_tax_id', e.target.value)}
                                    error={!!errors.cus_tax_id}
                                    helperText={errors.cus_tax_id}
                                    size="small"
                                />
                            ) : (
                                <Box>
                                    <Typography variant="caption" color="text.secondary">เลขประจำตัวผู้เสียภาษี</Typography>
                                    <Typography variant="body2">{formatTaxId(customer.cus_tax_id) || '-'}</Typography>
                                </Box>
                            )}
                        </Grid>

                        {/* Business Information */}
                        {isEditing && (
                            <>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" sx={{ color: '#900F0F', mb: 1, mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <BusinessIcon /> ข้อมูลธุรกิจ
                                    </Typography>
                                </Grid>

                                <Grid item xs={12} md={6}>
                                    <FormControl component="fieldset" size="small">
                                        <FormLabel component="legend" sx={{ color: '#900F0F', fontSize: '0.875rem' }}>
                                            ช่องทางการติดต่อ
                                        </FormLabel>
                                        <RadioGroup
                                            row
                                            value={editData.cus_channel}
                                            onChange={(e) => handleInputChange('cus_channel', parseInt(e.target.value))}
                                        >
                                            <FormControlLabel value={1} control={<Radio size="small" />} label="Sales" />
                                            <FormControlLabel value={2} control={<Radio size="small" />} label="Online" />
                                            <FormControlLabel value={3} control={<Radio size="small" />} label="Office" />
                                        </RadioGroup>
                                    </FormControl>
                                </Grid>

                                <Grid item xs={12} md={6}>
                                    <Autocomplete
                                        size="small"
                                        options={businessTypes}
                                        getOptionLabel={(option) => option.bt_name || ''}
                                        value={businessTypes.find(bt => bt.bt_id === editData.cus_bt_id) || null}
                                        onChange={(event, newValue) => {
                                            handleInputChange('cus_bt_id', newValue?.bt_id || '');
                                        }}
                                        renderInput={(params) => (
                                            <StyledTextField
                                                {...params}
                                                label="ประเภทธุรกิจ"
                                                placeholder="เลือกประเภทธุรกิจ"
                                            />
                                        )}
                                    />
                                </Grid>
                            </>
                        )}

                        {/* Address Information */}
                        <Grid item xs={12}>
                            <Typography variant="subtitle2" sx={{ color: '#900F0F', mb: 1, mt: isEditing ? 2 : 0, display: 'flex', alignItems: 'center', gap: 1 }}>
                                <LocationIcon /> ข้อมูลที่อยู่
                            </Typography>
                        </Grid>

                        <Grid item xs={12}>
                            {isEditing ? (
                                <StyledTextField
                                    fullWidth
                                    label="ที่อยู่"
                                    value={editData.cus_address}
                                    onChange={(e) => handleInputChange('cus_address', e.target.value)}
                                    multiline
                                    rows={2}
                                    size="small"
                                />
                            ) : (
                                <Box>
                                    <Typography variant="caption" color="text.secondary">ที่อยู่</Typography>
                                    <Typography variant="body2">{customer.cus_address || '-'}</Typography>
                                </Box>
                            )}
                        </Grid>

                        {isEditing && (
                            <>
                                <Grid item xs={12} md={4}>
                                    <Autocomplete
                                        size="small"
                                        options={provinces}
                                        getOptionLabel={(option) => option.pro_name_th || ''}
                                        value={provinces.find(p => p.pro_id === editData.cus_pro_id) || null}
                                        onChange={handleProvinceChange}
                                        renderInput={(params) => (
                                            <StyledTextField
                                                {...params}
                                                label="จังหวัด"
                                                placeholder="เลือกจังหวัด"
                                            />
                                        )}
                                    />
                                </Grid>

                                <Grid item xs={12} md={4}>
                                    <Autocomplete
                                        size="small"
                                        options={districts}
                                        getOptionLabel={(option) => option.dis_name || ''}
                                        value={districts.find(d => d.dis_id === editData.cus_dis_id) || null}
                                        onChange={handleDistrictChange}
                                        disabled={!editData.cus_pro_id}
                                        renderInput={(params) => (
                                            <StyledTextField
                                                {...params}
                                                label="อำเภอ/เขต"
                                                placeholder="เลือกอำเภอ/เขต"
                                            />
                                        )}
                                    />
                                </Grid>

                                <Grid item xs={12} md={4}>
                                    <Autocomplete
                                        size="small"
                                        options={subdistricts}
                                        getOptionLabel={(option) => option.sub_name || ''}
                                        value={subdistricts.find(s => s.sub_id === editData.cus_sub_id) || null}
                                        onChange={(event, newValue) => {
                                            handleInputChange('cus_sub_id', newValue?.sub_id || '');
                                            if (newValue?.sub_zip_code) {
                                                handleInputChange('cus_zip_code', newValue.sub_zip_code);
                                            }
                                        }}
                                        disabled={!editData.cus_dis_id}
                                        renderInput={(params) => (
                                            <StyledTextField
                                                {...params}
                                                label="ตำบล/แขวง"
                                                placeholder="เลือกตำบล/แขวง"
                                            />
                                        )}
                                    />
                                </Grid>

                                <Grid item xs={12} md={3}>
                                    <StyledTextField
                                        fullWidth
                                        label="รหัสไปรษณีย์"
                                        value={editData.cus_zip_code}
                                        onChange={(e) => handleInputChange('cus_zip_code', e.target.value)}
                                        size="small"
                                    />
                                </Grid>
                            </>
                        )}

                        {!isEditing && (
                            <Grid item xs={12} md={3}>
                                <Box>
                                    <Typography variant="caption" color="text.secondary">รหัสไปรษณีย์</Typography>
                                    <Typography variant="body2">{customer.cus_zip_code || '-'}</Typography>
                                </Box>
                            </Grid>
                        )}
                    </Grid>
                </Collapse>
            </CardContent>
        </CustomerCard>
    );
};

export default CustomerEditCard;
