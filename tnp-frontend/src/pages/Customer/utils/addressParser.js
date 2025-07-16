/**
 * ฟังก์ชันสำหรับแยกที่อยู่ที่บันทึกแบบรวมกลับเป็นส่วนๆ
 * ใช้สำหรับแสดงผลในหน้า view customer
 * 
 * @param {string} fullAddress - ที่อยู่แบบรวม เช่น "99 ซอย 9 ตำบลบางเสาธง อำเภอบางเสาธง สมุทรปราการ 10540"
 * @returns {object} - ข้อมูลที่อยู่แยกเป็น { address, subdistrict, district, province, zipCode }
 */
export const parseFullAddress = (fullAddress) => {
  if (!fullAddress || typeof fullAddress !== 'string') {
    return {
      address: '',
      subdistrict: '',
      district: '',
      province: '',
      zipCode: ''
    };
  }

  try {
    const parts = fullAddress.trim().split(' ');
    
    // หารหัสไปรษณีย์ (5 หลักสุดท้าย)
    const zipCode = parts[parts.length - 1];
    const isZipCode = /^\d{5}$/.test(zipCode);
    
    // หาจังหวัด (มักจะอยู่ก่อนรหัสไปรษณีย์)
    let province = '';
    let provinceIndex = -1;
    
    // ค้นหาคำที่มี "กรุงเทพ", "นคร", "บุรี", "ราม" หรือคำที่น่าจะเป็นจังหวัด
    const provinceKeywords = ['กรุงเทพมหานคร', 'กรุงเทพ', 'นคร', 'บุรี', 'ราม', 'ชัย', 'ทอง', 'สาร'];
    
    for (let i = parts.length - (isZipCode ? 2 : 1); i >= 0; i--) {
      const part = parts[i];
      if (provinceKeywords.some(keyword => part.includes(keyword)) || 
          part.length > 3) {
        province = part;
        provinceIndex = i;
        break;
      }
    }
    
    // หาอำเภอ/เขต (อยู่ก่อนจังหวัด)
    let district = '';
    let districtIndex = -1;
    
    if (provinceIndex > 0) {
      for (let i = provinceIndex - 1; i >= 0; i--) {
        const part = parts[i];
        if (part.includes('เขต') || part.includes('อำเภอ') || part.includes('กิ่งอำเภอ')) {
          district = part;
          districtIndex = i;
          break;
        }
      }
    }
    
    // หาตำบล/แขวง (อยู่ก่อนอำเภอ)
    let subdistrict = '';
    let subdistrictIndex = -1;
    
    if (districtIndex > 0) {
      for (let i = districtIndex - 1; i >= 0; i--) {
        const part = parts[i];
        if (part.includes('แขวง') || part.includes('ตำบล') || part.includes('หมู่บ้าน')) {
          subdistrict = part;
          subdistrictIndex = i;
          break;
        }
      }
    }
    
    // ส่วนที่เหลือคือที่อยู่ (เลขที่, ซอย, ถนน)
    let addressEndIndex = subdistrictIndex > 0 ? subdistrictIndex : 
                         districtIndex > 0 ? districtIndex : 
                         provinceIndex > 0 ? provinceIndex : 
                         parts.length - (isZipCode ? 1 : 0);
    
    const address = parts.slice(0, addressEndIndex).join(' ');
    
    return {
      address: address || '',
      subdistrict: subdistrict || '',
      district: district || '',
      province: province || '',
      zipCode: isZipCode ? zipCode : ''
    };
    
  } catch (error) {
    console.error('Error parsing address:', error);
    return {
      address: fullAddress,
      subdistrict: '',
      district: '',
      province: '',
      zipCode: ''
    };
  }
};

/**
 * ตัวอย่างการใช้งานใน View Customer Component
 */
export const CustomerAddressView = ({ customerData }) => {
  const parsedAddress = parseFullAddress(customerData.cus_address);
  
  return (
    <div className="address-section">
      <div className="address-item">
        <p>ที่อยู่:</p>
        <p>{parsedAddress.address || customerData.cus_address}</p>
      </div>
      <div className="address-item">
        <p>จังหวัด:</p>
        <p>{parsedAddress.province || '-'}</p>
      </div>
      <div className="address-item">
        <p>อำเภอ:</p>
        <p>{parsedAddress.district || '-'}</p>
      </div>
      <div className="address-item">
        <p>ตำบล:</p>
        <p>{parsedAddress.subdistrict || '-'}</p>
      </div>
      <div className="address-item">
        <p>รหัสไปรษณีย์:</p>
        <p>{parsedAddress.zipCode || '-'}</p>
      </div>
    </div>
  );
};
