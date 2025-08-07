/**
 * API Utility functions for Customer Management
 * Handle authentication headers and base URL automatically
 */

const getApiHeaders = () => {
    const authToken = localStorage.getItem("authToken") || localStorage.getItem("token");
    const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    };

    if (authToken) {
        headers.Authorization = `Bearer ${authToken}`;
    }

    // Debug logging for auth
    if (import.meta.env.VITE_DEBUG_API === 'true') {
        console.log(`🔑 Auth Token: ${authToken ? 'Present' : 'Missing'}`);
    }

    return headers;
};

const getApiUrl = (endpoint) => {
    const baseUrl = import.meta.env.VITE_END_POINT_URL;
    const fullUrl = `${baseUrl}${endpoint}`;
    
    // Debug logging for API calls
    if (import.meta.env.VITE_DEBUG_API === 'true') {
        console.log('🌐 API Call:', fullUrl);
    }
    
    return fullUrl;
};

export const customerApi = {
    // Master data APIs
    async getBusinessTypes() {
        try {
            const response = await fetch(getApiUrl('/get-all-business-types'), {
                headers: getApiHeaders()
            });

            if (response.ok) {
                return await response.json();
            }
            
            const errorData = await response.json().catch(() => ({}));
            const errorMessage = errorData.message || `HTTP ${response.status}: ${response.statusText}`;
            
            const error = new Error(errorMessage);
            error.response = {
                status: response.status,
                statusText: response.statusText,
                data: errorData
            };
            throw error;
        } catch (error) {
            if (!error.response && error.name === 'TypeError') {
                const enhancedError = new Error('Network error: ไม่สามารถโหลดข้อมูลประเภทธุรกิจได้');
                enhancedError.originalError = error;
                throw enhancedError;
            }
            throw error;
        }
    },

    async getProvinces() {
        try {
            const response = await fetch(getApiUrl('/locations'), {
                headers: getApiHeaders()
            });

            if (response.ok) {
                const data = await response.json();
                return data.master_provinces || [];
            }
            
            const errorData = await response.json().catch(() => ({}));
            const errorMessage = errorData.message || `HTTP ${response.status}: ${response.statusText}`;
            
            const error = new Error(errorMessage);
            error.response = {
                status: response.status,
                statusText: response.statusText,
                data: errorData
            };
            throw error;
        } catch (error) {
            if (!error.response && error.name === 'TypeError') {
                const enhancedError = new Error('Network error: ไม่สามารถโหลดข้อมูลจังหวัดได้');
                enhancedError.originalError = error;
                throw enhancedError;
            }
            throw error;
        }
    },

    async getDistricts(provinceId) {
        try {
            const response = await fetch(getApiUrl(`/locations?province_sort_id=${provinceId}`), {
                headers: getApiHeaders()
            });

            if (response.ok) {
                const data = await response.json();
                return data.master_district || [];
            }
            
            const errorData = await response.json().catch(() => ({}));
            const errorMessage = errorData.message || `HTTP ${response.status}: ${response.statusText}`;
            
            const error = new Error(errorMessage);
            error.response = {
                status: response.status,
                statusText: response.statusText,
                data: errorData
            };
            throw error;
        } catch (error) {
            if (!error.response && error.name === 'TypeError') {
                const enhancedError = new Error('Network error: ไม่สามารถโหลดข้อมูลอำเภอได้');
                enhancedError.originalError = error;
                throw enhancedError;
            }
            throw error;
        }
    },

    async getSubdistricts(districtId) {
        try {
            const response = await fetch(getApiUrl(`/locations?district_sort_id=${districtId}`), {
                headers: getApiHeaders()
            });

            if (response.ok) {
                const data = await response.json();
                return data.master_subdistrict || [];
            }
            
            const errorData = await response.json().catch(() => ({}));
            const errorMessage = errorData.message || `HTTP ${response.status}: ${response.statusText}`;
            
            const error = new Error(errorMessage);
            error.response = {
                status: response.status,
                statusText: response.statusText,
                data: errorData
            };
            throw error;
        } catch (error) {
            if (!error.response && error.name === 'TypeError') {
                const enhancedError = new Error('Network error: ไม่สามารถโหลดข้อมูลตำบลได้');
                enhancedError.originalError = error;
                throw enhancedError;
            }
            throw error;
        }
    },

    // Customer management APIs
    async updateCustomer(customerId, customerData) {
        try {
            // Clean phone and tax ID
            const cleanedData = {
                ...customerData,
                cus_tel_1: customerData.cus_tel_1?.replace(/[^0-9]/g, ''),
                cus_tel_2: customerData.cus_tel_2?.replace(/[^0-9]/g, ''),
                cus_tax_id: customerData.cus_tax_id?.replace(/[^0-9]/g, ''),
            };

            const response = await fetch(getApiUrl(`/customers/${customerId}`), {
                method: 'PUT',
                headers: getApiHeaders(),
                body: JSON.stringify(cleanedData),
            });

            if (response.ok) {
                const result = await response.json();
                if (result.status === 'success') {
                    return result;
                }
                throw new Error(result.message || 'Update failed');
            }

            const errorData = await response.json().catch(() => ({}));
            const errorMessage = errorData.message || `HTTP ${response.status}: ${response.statusText}`;
            
            // Create error with response context
            const error = new Error(errorMessage);
            error.response = {
                status: response.status,
                statusText: response.statusText,
                data: errorData
            };
            throw error;
        } catch (error) {
            // If it's a fetch error (network issues), enhance the message
            if (!error.response && error.name === 'TypeError') {
                const enhancedError = new Error('Network error: ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้');
                enhancedError.originalError = error;
                throw enhancedError;
            }
            throw error;
        }
    },

    async getCustomer(customerId) {
        try {
            const response = await fetch(getApiUrl(`/customers/${customerId}`), {
                headers: getApiHeaders()
            });

            if (response.ok) {
                return await response.json();
            }
            
            const errorData = await response.json().catch(() => ({}));
            const errorMessage = errorData.message || `HTTP ${response.status}: ${response.statusText}`;
            
            const error = new Error(errorMessage);
            error.response = {
                status: response.status,
                statusText: response.statusText,
                data: errorData
            };
            throw error;
        } catch (error) {
            if (!error.response && error.name === 'TypeError') {
                const enhancedError = new Error('Network error: ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้');
                enhancedError.originalError = error;
                throw enhancedError;
            }
            throw error;
        }
    }
};

// Validation utilities
export const validateCustomerData = (data) => {
    const errors = {};

    if (!data.cus_company?.trim()) {
        errors.cus_company = 'กรุณากรอกชื่อบริษัท';
    }
    if (!data.cus_firstname?.trim()) {
        errors.cus_firstname = 'กรุณากรอกชื่อ';
    }
    if (!data.cus_lastname?.trim()) {
        errors.cus_lastname = 'กรุณากรอกนามสกุล';
    }
    if (!data.cus_name?.trim()) {
        errors.cus_name = 'กรุณากรอกชื่อเล่น';
    }
    if (!data.cus_tel_1?.trim()) {
        errors.cus_tel_1 = 'กรุณากรอกเบอร์โทรศัพท์';
    }

    // Validate phone number format
    if (data.cus_tel_1 && !/^[0-9]{9,10}$/.test(data.cus_tel_1.replace(/[^0-9]/g, ''))) {
        errors.cus_tel_1 = 'รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง';
    }

    // Validate email format
    if (data.cus_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.cus_email)) {
        errors.cus_email = 'รูปแบบอีเมลไม่ถูกต้อง';
    }

    // Validate tax ID format (13 digits)
    if (data.cus_tax_id && !/^[0-9]{13}$/.test(data.cus_tax_id.replace(/[^0-9]/g, ''))) {
        errors.cus_tax_id = 'เลขประจำตัวผู้เสียภาษีต้องเป็นตัวเลข 13 หลัก';
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
};

// Formatting utilities
export const formatPhoneNumber = (phone) => {
    if (!phone) return '';
    const cleaned = phone.replace(/[^0-9]/g, '');
    if (cleaned.length === 10) {
        return `${cleaned.substring(0, 3)}-${cleaned.substring(3, 6)}-${cleaned.substring(6)}`;
    }
    return phone;
};

export const formatTaxId = (taxId) => {
    if (!taxId) return '';
    const cleaned = taxId.replace(/[^0-9]/g, '');
    if (cleaned.length === 13) {
        return `${cleaned.substring(0, 1)}-${cleaned.substring(1, 5)}-${cleaned.substring(5, 10)}-${cleaned.substring(10, 12)}-${cleaned.substring(12)}`;
    }
    return taxId;
};
