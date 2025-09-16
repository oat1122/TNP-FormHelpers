/**
 * Invoice business logic utilities
 * ฟังก์ชันสำหรับ business logic ของใบแจ้งหนี้
 */

import { statusColor } from './invoiceFormatters';

// ฟังก์ชันตรวจสอบสถานะตามวันครบกำหนด
export const getInvoiceStatus = (invoice) => {
  if (!invoice) return { status: 'draft', color: 'default' };

  const today = new Date();
  const dueDate = invoice.due_date ? new Date(invoice.due_date) : null;
  const finalTotal = invoice?.final_total_amount || invoice?.total_amount || 0;
  const paidAmount = invoice?.paid_amount || 0;
  const depositAmount = invoice?.deposit_amount || 0;
  const remaining = Math.max(finalTotal - paidAmount - depositAmount, 0);

  // ถ้าชำระครบแล้ว
  if (remaining <= 0) {
    return { status: 'ชำระแล้ว', color: 'success' };
  }

  // ถ้าเกินกำหนด
  if (dueDate && dueDate < today && remaining > 0) {
    return { status: 'เกินกำหนด', color: 'error' };
  }

  const originalStatus = invoice.status || 'draft';
  const statusMap = {
    draft: 'แบบร่าง',
    pending: 'รอดำเนินการ',
    pending_after: 'รออนุมัติมัดจำหลัง',
    approved: 'อนุมัติแล้ว',
    rejected: 'ถูกปฏิเสธ',
    sent: 'ส่งแล้ว',
    partial_paid: 'ชำระบางส่วน',
    fully_paid: 'ชำระแล้ว',
    overdue: 'เกินกำหนด'
  };

  return {
    status: statusMap[originalStatus] || originalStatus,
    color: statusColor[originalStatus] || 'default'
  };
};

// ฟังก์ชันสำหรับการแสดงรายการสินค้า/บริการ
export const formatItemsList = (invoice) => {
  if (!invoice) return null;
  
  // ใช้ข้อมูลจาก invoice.items (ตาราง invoice_items)
  if (invoice.items && Array.isArray(invoice.items) && invoice.items.length > 0) {
    // ดึงชื่อรายการจาก item_name และจัดกลุ่มเพื่อนับจำนวน
    const itemGroups = new Map();
    
    invoice.items.forEach(item => {
      if (item.item_name && item.item_name.trim() !== '') {
        // ทำความสะอาดชื่อสินค้า - เก็บข้อความในวงเล็บไว้ และ normalize spaces
        let cleanName = item.item_name
          .replace(/\s+/g, ' ') // แปลง multiple spaces เป็น single space
          .trim();
        
        if (cleanName.length > 0) {
          if (itemGroups.has(cleanName)) {
            itemGroups.set(cleanName, itemGroups.get(cleanName) + 1);
          } else {
            itemGroups.set(cleanName, 1);
          }
        }
      }
    });
    
    if (itemGroups.size > 0) {
      const totalItems = invoice.items.length;
      const uniqueItemNames = Array.from(itemGroups.keys());
      const displayCount = Math.min(3, uniqueItemNames.length); // แสดงสูงสุด 3 รายการ
      
      // สร้างข้อความแสดงรายการ
      let itemsText = uniqueItemNames.slice(0, displayCount).map(name => {
        const count = itemGroups.get(name);
        return count > 1 ? `${name} (${count})` : name;
      }).join(', ');
      
      // เพิ่มข้อความ "และอีก X รายการ" ถ้ามีมากกว่า 3 รายการ
      if (uniqueItemNames.length > 3) {
        const remainingCount = uniqueItemNames.length - 3;
        itemsText += `, และอีก ${remainingCount} รายการ`;
      }
      
      return `รายการสินค้า/บริการ (${totalItems} รายการ) ${itemsText}`;
    }
  }
  
  // ถ้าไม่มี items หรือไม่มี item_name ใช้ work_name แทน
  if (invoice.work_name && invoice.work_name.trim() !== '') {
    return `ชื่องาน: ${invoice.work_name}`;
  }
  
  // ถ้าไม่มีข้อมูลใดๆ แต่มี pattern, fabric_type, color
  const workDetails = [];
  if (invoice.pattern && invoice.pattern.trim() !== '') workDetails.push(`แพทเทิร์น: ${invoice.pattern}`);
  if (invoice.fabric_type && invoice.fabric_type.trim() !== '') workDetails.push(`ชนิดผ้า: ${invoice.fabric_type}`);
  if (invoice.color && invoice.color.trim() !== '') workDetails.push(`สี: ${invoice.color}`);
  
  if (workDetails.length > 0) {
    return `รายละเอียดงาน: ${workDetails.join(', ')}`;
  }
  
  // ถ้าไม่มีข้อมูลใดๆ เลย
  return null;
};

import { formatTHB } from './invoiceFormatters';

// ฟังก์ชันสำหรับการแสดงมัดจำ
export const formatDepositInfo = (invoice) => {
  if (!invoice) return null;
  
  const { deposit_percentage, deposit_amount, deposit_mode, total_amount } = invoice;
  
  if (deposit_mode === 'percentage' && deposit_percentage && deposit_percentage > 0) {
    const calculatedAmount = (total_amount * deposit_percentage) / 100;
    return `${deposit_percentage}% (${formatTHB(calculatedAmount)})`;
  } else if (deposit_mode === 'amount' && deposit_amount && deposit_amount > 0) {
    return formatTHB(deposit_amount);
  }
  
  return null;
};

// Calculate financial totals for invoice
export const calculateInvoiceFinancials = (invoice) => {
  if (!invoice) return null;

  const subtotal = Number(invoice?.subtotal || 0);
  const specialDiscountAmount = Number(invoice?.special_discount_amount || 0);
  const vatAmount = Number(invoice?.vat_amount || 0);
  const withholding = Number(invoice?.withholding_tax_amount || 0);
  
  // ใช้ค่า final_total_amount จาก DB เป็นหลัก ถ้าไม่มีค่อย fallback ตามสูตรเดียวกับ trigger
  const vatRate = (invoice?.vat_percentage || 7) / 100;
  const fallbackTotal = subtotal + (invoice?.has_vat ? subtotal * vatRate : 0) - specialDiscountAmount - withholding;
  const total = Number(invoice?.final_total_amount ?? fallbackTotal);
  const afterVat = subtotal + vatAmount; // เพื่อแสดง breakdown ให้ตรงกับ DB
  
  // คำนวณยอดคงเหลือที่ถูกต้อง
  const paidAmount = Number(invoice?.paid_amount || 0);
  const depositAmount = Number(invoice?.deposit_amount || 0);
  const remaining = Math.max(total - paidAmount - depositAmount, 0);

  return {
    subtotal,
    specialDiscountAmount,
    vatAmount,
    withholding,
    total,
    afterVat,
    paidAmount,
    depositAmount,
    remaining
  };
};