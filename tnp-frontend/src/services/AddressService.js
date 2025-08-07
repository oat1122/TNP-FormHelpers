/**
 * Address Service for Customer Management
 * จัดการการแสดงผลและจัดรูปแบบที่อยู่
 */

export class AddressService {
  
  /**
   * สร้างที่อยู่เต็มจาก components สำหรับแสดงผล
   * @param {Object} customer - ข้อมูลลูกค้า
   * @returns {string} ที่อยู่เต็มที่จัดรูปแบบแล้ว
   */
  static formatDisplayAddress(customer) {
    try {
      // ถ้ามี cus_address แล้วใช้เลย
      if (customer.cus_address && customer.cus_address.trim()) {
        return customer.cus_address.trim();
      }

      // ถ้าไม่มี ให้สร้างจาก components
      const parts = [];
      
      // ชื่อสถานที่
      if (customer.cus_subdistrict_name) {
        parts.push(`แขวง${customer.cus_subdistrict_name}`);
      }
      
      if (customer.cus_district_name) {
        parts.push(`เขต${customer.cus_district_name}`);
      }
      
      if (customer.cus_province_name) {
        // กรุงเทพฯ ใช้ "กทม." แทน "จ.กรุงเทพฯ"
        if (customer.cus_province_name.includes('กรุงเทพ')) {
          parts.push('กทม.');
        } else {
          parts.push(`จ.${customer.cus_province_name}`);
        }
      }
      
      if (customer.cus_zip_code) {
        parts.push(customer.cus_zip_code);
      }
      
      return parts.join(' ');
      
    } catch (error) {
      console.warn('Error formatting display address:', error);
      return customer.cus_address || '';
    }
  }

  /**
   * แยกที่อยู่เต็มเป็น components
   * @param {string} fullAddress - ที่อยู่เต็ม
   * @returns {Object} components ของที่อยู่
   */
  static parseFullAddress(fullAddress) {
    try {
      if (!fullAddress || typeof fullAddress !== 'string') {
        return {
          addressDetail: '',
          subdistrict: '',
          district: '',
          province: '',
          zipCode: ''
        };
      }

      const parts = fullAddress.trim().split(' ');
      const result = {
        addressDetail: '',
        subdistrict: '',
        district: '',
        province: '',
        zipCode: ''
      };

      // หารหัสไปรษณีย์ (5 หลักสุดท้าย)
      const zipCode = parts[parts.length - 1];
      if (/^\d{5}$/.test(zipCode)) {
        result.zipCode = zipCode;
        parts.pop(); // ลบรหัสไปรษณีย์ออก
      }

      // หาจังหวัด (ขึ้นต้นด้วย "จ." หรือ "กทม.")
      for (let i = 0; i < parts.length; i++) {
        if (parts[i].startsWith('จ.')) {
          result.province = parts[i].replace('จ.', '');
          parts.splice(i, 1);
          break;
        } else if (parts[i].startsWith('กทม.')) {
          result.province = 'กรุงเทพมหานคร';
          parts.splice(i, 1);
          break;
        }
      }

      // หาเขต/อำเภอ (ขึ้นต้นด้วย "เขต" หรือ "อ.")
      for (let i = 0; i < parts.length; i++) {
        if (parts[i].startsWith('เขต')) {
          result.district = parts[i].replace('เขต', '');
          parts.splice(i, 1);
          break;
        } else if (parts[i].startsWith('อ.')) {
          result.district = parts[i].replace('อ.', '');
          parts.splice(i, 1);
          break;
        }
      }

      // หาแขวง/ตำบล (ขึ้นต้นด้วย "แขวง" หรือ "ต.")
      for (let i = 0; i < parts.length; i++) {
        if (parts[i].startsWith('แขวง')) {
          result.subdistrict = parts[i].replace('แขวง', '');
          parts.splice(i, 1);
          break;
        } else if (parts[i].startsWith('ต.')) {
          result.subdistrict = parts[i].replace('ต.', '');
          parts.splice(i, 1);
          break;
        }
      }

      // ส่วนที่เหลือคือรายละเอียดที่อยู่
      result.addressDetail = parts.join(' ');

      return result;

    } catch (error) {
      console.warn('Error parsing full address:', error);
      return {
        addressDetail: fullAddress || '',
        subdistrict: '',
        district: '',
        province: '',
        zipCode: ''
      };
    }
  }

  /**
   * สร้างที่อยู่แบบย่อสำหรับแสดงในการ์ด
   * @param {Object} customer - ข้อมูลลูกค้า
   * @param {number} maxLength - ความยาวสูงสุด
   * @returns {string} ที่อยู่แบบย่อ
   */
  static formatShortAddress(customer, maxLength = 50) {
    try {
      const fullAddress = this.formatDisplayAddress(customer);
      
      if (!fullAddress) return '-';
      
      if (fullAddress.length <= maxLength) {
        return fullAddress;
      }
      
      return fullAddress.substring(0, maxLength - 3) + '...';
      
    } catch (error) {
      console.warn('Error formatting short address:', error);
      return '-';
    }
  }

  /**
   * ตรวจสอบว่าที่อยู่ครบถ้วนหรือไม่
   * @param {Object} customer - ข้อมูลลูกค้า
   * @returns {Object} ผลการตรวจสอบ
   */
  static validateAddress(customer) {
    try {
      const hasFullAddress = customer.cus_address && customer.cus_address.trim();
      const hasComponents = customer.cus_province_name || customer.cus_district_name || customer.cus_subdistrict_name;
      
      return {
        isValid: hasFullAddress || hasComponents,
        hasFullAddress: !!hasFullAddress,
        hasComponents: !!hasComponents,
        missingFields: []
      };
      
    } catch (error) {
      console.warn('Error validating address:', error);
      return {
        isValid: false,
        hasFullAddress: false,
        hasComponents: false,
        missingFields: ['address']
      };
    }
  }

  /**
   * จัดรูปแบบที่อยู่สำหรับการพิมพ์เอกสาร
   * @param {Object} customer - ข้อมูลลูกค้า
   * @returns {string} ที่อยู่สำหรับเอกสาร
   */
  static formatDocumentAddress(customer) {
    try {
      const address = this.formatDisplayAddress(customer);
      
      if (!address) return 'ไม่ระบุที่อยู่';
      
      // จัดรูปแบบให้เหมาะสำหรับเอกสาร
      return address
        .replace(/\s+/g, ' ')  // ลบช่องว่างซ้ำ
        .trim();
        
    } catch (error) {
      console.warn('Error formatting document address:', error);
      return 'ไม่ระบุที่อยู่';
    }
  }

  /**
   * สร้างข้อมูลที่อยู่สำหรับส่งไป API
   * @param {Object} formData - ข้อมูลจากฟอร์ม
   * @returns {Object} ข้อมูลที่อยู่สำหรับ API
   */
  static prepareAddressForApi(formData) {
    try {
      const addressData = {};
      
      // ข้อมูลพื้นฐาน
      if (formData.cus_address) {
        addressData.cus_address = formData.cus_address.trim();
      }
      
      // ข้อมูล components
      if (formData.cus_pro_id) addressData.cus_pro_id = formData.cus_pro_id;
      if (formData.cus_dis_id) addressData.cus_dis_id = formData.cus_dis_id;
      if (formData.cus_sub_id) addressData.cus_sub_id = formData.cus_sub_id;
      if (formData.cus_zip_code) addressData.cus_zip_code = formData.cus_zip_code;
      if (formData.cus_address_detail) addressData.cus_address_detail = formData.cus_address_detail;
      
      return addressData;
      
    } catch (error) {
      console.warn('Error preparing address for API:', error);
      return {};
    }
  }
}

export default AddressService;
