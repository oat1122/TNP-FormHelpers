/**
 * Invoice formatting utilities
 * ฟังก์ชันสำหรับจัดรูปแบบข้อมูลในใบแจ้งหนี้
 */

// ปรับปรุงการจัดรูปแบบเงินให้คงเส้นคงวา ฿129,028.50
export const formatTHB = (n) => {
  const num = Number(n || 0);
  return new Intl.NumberFormat('th-TH', { 
    style: 'currency', 
    currency: 'THB',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num);
};

// ปรับปรุงการจัดรูปแบบวันที่เป็น พ.ศ. DD/MM/YYYY
export const formatDate = (d) => {
  if (!d) return '-';
  try {
    const date = new Date(d);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear() + 543; // แปลงเป็น พ.ศ.
    return `${day}/${month}/${year}`;
  } catch { 
    return '-'; 
  }
};

// ฟังก์ชันสำหรับตัดข้อความที่ยาวเกินไป
export const truncateText = (text, maxLength = 35) => {
  if (!text) return '';
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
};

// Helper function to safely convert to number
export const toNumber = (v) => Number(v || 0);

// Constants
export const typeLabels = {
  full_amount: 'เต็มจำนวน',
  remaining: 'ยอดคงเหลือ (หลังหักมัดจำ)',
  deposit: 'มัดจำ',
  partial: 'เรียกเก็บบางส่วน'
};

export const statusColor = {
  draft: 'default',
  pending: 'warning',
  pending_after: 'warning',
  approved: 'success',
  rejected: 'error',
  sent: 'info',
  partial_paid: 'warning',
  fully_paid: 'success',
  overdue: 'error',
};

export const headerOptions = [
  'ต้นฉบับ',
  'สำเนา',
  'สำเนา-ลูกค้า'
];