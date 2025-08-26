/**
 * Manager Utilities for Customer Management
 * Centralized utilities for handling customer manager assignments
 */

/**
 * Normalize manager data to consistent object format
 * @param {any} rawManager - Raw manager data from API
 * @param {string} fallbackUsername - Fallback username from sales_name
 * @returns {object} Normalized manager object
 */
export const normalizeManagerData = (rawManager, fallbackUsername = '') => {
    if (!rawManager) {
        return {
            user_id: '',
            username: 'ไม่ได้กำหนด'
        };
    }

    // If already an object
    if (typeof rawManager === 'object') {
        const id = rawManager.user_id ?? rawManager.user_uuid ?? rawManager.id ?? '';
        const name = rawManager.username || rawManager.user_nickname || rawManager.name || fallbackUsername;
        
        return {
            user_id: id ? String(id) : '',
            username: name || (id ? 'กำลังโหลด...' : 'ไม่ได้กำหนด')
        };
    }

    // If numeric or string ID
    if (rawManager != null && rawManager !== '') {
        return {
            user_id: String(rawManager),
            username: fallbackUsername || 'กำลังโหลด...'
        };
    }

    return {
        user_id: '',
        username: 'ไม่ได้กำหนด'
    };
};

/**
 * Get manager display name
 * @param {object} customer - Customer object
 * @returns {string} Manager display name
 */
export const getManagerDisplayName = (customer) => {
    if (!customer) return 'ไม่ได้กำหนด';

    // Try different field combinations
    const manager = customer.cus_manage_by;
    if (manager && typeof manager === 'object' && manager.username) {
        return manager.username;
    }

    if (customer.sales_name) {
        return customer.sales_name;
    }

    if (manager && (manager.user_id || manager.id)) {
        return 'กำลังโหลด...';
    }

    return 'ไม่ได้กำหนด';
};

/**
 * Hydrate manager username from sales list
 * @param {object} managerData - Manager data object
 * @param {array} salesList - List of sales users
 * @returns {object} Updated manager data
 */
export const hydrateManagerUsername = (managerData, salesList) => {
    if (!managerData?.user_id || !salesList || salesList.length === 0) {
        return managerData;
    }

    // Skip if already has a valid username
    if (managerData.username && 
        managerData.username !== 'กำลังโหลด...' && 
        managerData.username !== 'ไม่ได้กำหนด' &&
        managerData.username !== 'ไม่สามารถโหลดข้อมูลได้') {
        return managerData;
    }

    const match = salesList.find(u => String(u.user_id) === String(managerData.user_id));
    if (match) {
        return {
            ...managerData,
            username: match.username
        };
    }

    return managerData;
};

/**
 * Auto-assign manager for non-admin users
 * @param {boolean} isAdmin - Whether current user is admin
 * @param {object} currentUser - Current user data
 * @returns {object} Manager assignment
 */
export const getDefaultManagerAssignment = (isAdmin, currentUser) => {
    if (isAdmin || !currentUser?.user_id) {
        return {
            user_id: '',
            username: 'ไม่ได้กำหนด'
        };
    }

    return {
        user_id: String(currentUser.user_id),
        username: currentUser.username || currentUser.user_nickname || 'ผู้ใช้ปัจจุบัน'
    };
};

/**
 * Validate manager assignment
 * @param {object} managerData - Manager data to validate
 * @param {boolean} isAdmin - Whether current user is admin
 * @param {array} salesList - List of valid sales users
 * @param {object} currentUser - Current user data
 * @returns {object} Validation result
 */
export const validateManagerAssignment = (managerData, isAdmin, salesList, currentUser) => {
    const errors = {};

    const managerId = managerData?.user_id || '';

    if (!managerId) {
        if (isAdmin) {
            errors.cus_manage_by = 'กรุณาเลือกผู้ดูแลลูกค้า';
        } else if (!currentUser?.user_id) {
            errors.cus_manage_by = 'ไม่สามารถระบุผู้ดูแลลูกค้าได้';
        }
        // Non-admin with valid user_id will auto-assign, no error
    } else {
        // For admin, validate that selected manager exists in sales list
        if (isAdmin && salesList && salesList.length > 0) {
            const managerExists = salesList.some(u => String(u.user_id) === String(managerId));
            if (!managerExists) {
                errors.cus_manage_by = 'ผู้ดูแลลูกค้าที่เลือกไม่ถูกต้อง';
            }
        }
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
};

/**
 * Prepare manager data for API submission
 * @param {object} managerData - Manager data from form
 * @param {boolean} isAdmin - Whether current user is admin
 * @param {object} currentUser - Current user data
 * @returns {object} API-ready manager data
 */
export const prepareManagerForApi = (managerData, isAdmin, currentUser) => {
    const selectedManagerId = isAdmin 
        ? (managerData?.user_id || '') 
        : (currentUser?.user_id || '');

    // Send as object with numeric user_id for backend compatibility
    if (selectedManagerId && /^\d+$/.test(String(selectedManagerId))) {
        return {
            user_id: Number(selectedManagerId)
        };
    }

    return null;
};

/**
 * Merge manager data from different API responses
 * @param {object} existingCustomer - Existing customer data
 * @param {object} apiResponse - New API response
 * @returns {object} Merged customer data
 */
export const mergeManagerData = (existingCustomer, apiResponse) => {
    if (!apiResponse) return existingCustomer;

    const merged = { ...existingCustomer, ...apiResponse };

    // Normalize manager data
    const rawManager = apiResponse.cus_manage_by || existingCustomer.cus_manage_by;
    const fallbackUsername = apiResponse.sales_name || existingCustomer.sales_name;

    merged.cus_manage_by = normalizeManagerData(rawManager, fallbackUsername);

    // Ensure sales_name is consistent
    if (merged.cus_manage_by?.username && merged.cus_manage_by.username !== 'ไม่ได้กำหนด') {
        merged.sales_name = merged.cus_manage_by.username;
    }

    return merged;
};
