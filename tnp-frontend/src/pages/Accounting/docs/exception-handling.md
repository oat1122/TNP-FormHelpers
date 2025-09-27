# Exception Handling:│ │ สถานการณ์: ลูกค้าจ่ายมัดจำ 50% แล้ว ต้องการเพิ่มสินค้า │ │

│ │ │ │ │ │ ┌─ Step 1: ย้อนกลับสถานะ (Account เท่านั้น) ──────────────┐ │ │ │ │
สถานะปัจจุบัน: ใบแจ้งหนี้ (อนุมัติแล้ว) │ │ │ │ │ ต้องการย้อนกลับไป: ใบเสนอราคา
(เพื่อแก้ไข) │ │ │ │ │ │ │ │ │ │ เหตุผลการย้อนกลับ: │ │ │ │ │
[ลูกค้าต้องการเพิ่มรายการสินค้า - บริการติดตั้ง] │ │ │ │ │ │ │ │ │ │ ⚠️ คำเตือน:
การย้อนกลับจะส่งผลกระทบต่อเอกสารที่เกี่ยวข้อง │ │ │ │ │ - Pricing Request:
PR-2025-001 (คงอยู่) │ │ │ │ │ - ใบแจ้งหนี้และใบเสร็จที่เกี่ยวข้องจะถูกยกเลิก │
│ │ │ │ [❌ ยกเลิก] [✅ ยืนยันการย้อนกลับ] │ │ │ │
└─────────────────────────────────────────────────────────┘ │ณีพิเศษ

## 🎯 วัตถุประสงค์

สร้างระบบจัดการกรณีพิเศษต่างๆ ที่อาจเกิดขึ้นในการทำงาน เช่น การแก้ไขออเดอร์
การส่งสินค้าไม่ครบ และการคืนสินค้า พร้อมออกเอกสาร Credit/Debit Note อัตโนมัติ

## 🔄 กรณีพิเศษที่รองรับ

### 1. ลูกค้าเปลี่ยนใจเพิ่มสินค้า (หลังจ่ายมัดจำ)

### 2. ส่งสินค้าไม่ครบ (Partial Delivery)

### 3. การคืนสินค้า (Product Return)

---

## 💡 กรณี 1: ลูกค้าเปลี่ยนใจเพิ่มสินค้า

### 🎨 UI Design

```
Order Modification Flow:
┌─────────────────────────────────────────────────────────────┐
│ 🔄 การแก้ไขออเดอร์ - QT202501-0045                          │
│                                                             │
│ สถานการณ์: ลูกค้าจ่ายมัดจำ 50% แล้ว ต้องการเพิ่มสินค้า      │
│                                                             │
│ ┌─ Step 1: ย้อนกลับสถานะ (Account เท่านั้น) ──────────────┐  │
│ │ สถานะปัจจุบัน: ใบแจ้งหนี้ (อนุมัติแล้ว)                  │  │
│ │ ต้องการย้อนกลับไป: ใบเสนอราคา (เพื่อแก้ไข)                │  │
│ │                                                         │  │
│ │ เหตุผลการย้อนกลับ:                                       │  │
│ │ [ลูกค้าต้องการเพิ่มรายการสินค้า - บริการติดตั้ง]           │  │
│ │                                                         │  │
│ │ ⚠️ คำเตือน: การย้อนกลับจะส่งผลกระทบต่อเอกสารที่เกี่ยวข้อง │  │
│ │ [❌ ยกเลิก] [✅ ยืนยันการย้อนกลับ]                        │  │
│ └─────────────────────────────────────────────────────────┘  │
│                           ↓                                   │
│ ┌─ Step 2: แก้ไขใบเสนอราคา ─────────────────────────────┐  │
│ │ รายการเดิม:                                             │  │
│ │ • งานพิมพ์โบรชัวร์ A4 (2 ชิ้น × ฿25,000) = ฿50,000     │  │
│ │                                                         │  │
│ │ รายการเพิ่ม:                                            │  │
│ │ [+ เพิ่มรายการใหม่]                                     │  │
│ │ • บริการติดตั้ง (1 วัน × ฿5,000) = ฿5,000               │  │
│ │                                                         │  │
│ │ การคำนวณใหม่:                                           │  │
│ │ ยอดเดิม: ฿53,500.00                                    │  │
│ │ ยอดเพิ่ม: ฿5,350.00 (รวม VAT)                          │  │
│ │ ยอดใหม่: ฿58,850.00                                    │  │
│ │                                                         │  │
│ │ การคำนวณเงินมัดจำ:                                      │  │
│ │ เงินมัดจำเดิม: -฿26,750.00 (50% ของยอดเดิม)            │  │
│ │ ยอดเพิ่มที่ต้องชำระ: ฿5,350.00                          │  │
│ │ ยอดคงเหลือใหม่: ฿32,100.00                             │  │
│ │                                                         │  │
│ │ [บันทึกการแก้ไข] [ส่งตรวจสอบใหม่]                        │  │
│ └─────────────────────────────────────────────────────────┘  │
│                           ↓                                   │
│ ┌─ Step 3: ออกเอกสารปรับยอด ────────────────────────────┐  │
│ │ ระบบสร้างอัตโนมัติ:                                     │  │
│ │                                                         │  │
│ │ 📄 ใบเพิ่มหนี้ (Debit Note): DB202501-001              │  │
│ │    อ้างอิง: QT202501-0045 (ใบเสนอราคาเดิม)             │  │
│ │    ยอดเพิ่ม: ฿5,350.00                                 │  │
│ │    เหตุผล: เพิ่มบริการติดตั้งตามคำขอลูกค้า               │  │
│ │                                                         │  │
│ │ 💰 ใบแจ้งหนี้ใหม่: INV202501-0124                      │  │
│ │    ยอดคงเหลือ: ฿32,100.00                             │  │
│ │    ครบกำหนด: 15 ก.พ. 2568                             │  │
│ │                                                         │  │
│ │ [สร้างเอกสารปรับยอด] [ส่งแจ้งลูกค้า]                    │  │
│ └─────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 🔧 Technical Implementation

```javascript
const handleOrderModification = async (quotationId, newItems, reason) => {
  try {
    // 1. ดึงข้อมูลปัจจุบันจาก Quotation (รวม Pricing Request reference)
    const quotationData = await quotationApi.getDetail(quotationId);
    const pricingRequestData = await pricingApi.getDetail(quotationData.pricing_request_id);

    // 2. สร้าง backup ก่อนแก้ไข
    const backupData = await quotationApi.createBackup(quotationId);

    // 3. อัปเดต Quotation พร้อม reference กลับไป Pricing Request
    const updatedData = {
      ...quotationData,
      pricing_request_id: quotationData.pricing_request_id, // คงค่าเดิม
      original_pricing_data: pricingRequestData, // backup ข้อมูลเดิม
      items: [...quotationData.items, ...newItems],
      modification_reason: reason,
      modification_history: [
        ...quotationData.modification_history || [],
        {
          date: new Date(),
          reason: reason,
          items_added: newItems,
          user: getCurrentUser().id
        }
      ]
    };

    // 4. คำนวณยอดใหม่
    const newTotals = calculateQuotationTotals(updatedData.items);

    // 5. สร้าง Debit Note อัตโนมัติ
    const debitNote = await createDebitNote({
      quotation_id: quotationId,
      pricing_request_id: quotationData.pricing_request_id,
      original_amount: quotationData.total_amount,
      additional_amount: newTotals.total_amount - quotationData.total_amount,
      reason: reason
    });

    return {
      success: true,
      updated_quotation: updatedData,
      debit_note: debitNote
    };
  } catch (error) {
    console.error('Error modifying quotation:', error);
    throw error;
  }
};
    const newSubtotal = calculateSubtotal(updatedData.items);
    const newTaxAmount = calculateTax(newSubtotal);
    const newTotal = newSubtotal + newTaxAmount;

    updatedData.subtotal = newSubtotal;
    updatedData.tax_amount = newTaxAmount;
    updatedData.total_amount = newTotal;

    // Calculate new deposit and remaining
    const depositAmount = originalQuotation.deposit_amount;
    const additionalAmount = newTotal - originalQuotation.total_amount;
    const newRemainingAmount = newTotal - depositAmount;

    await quotationApi.update(quotationId, updatedData);

    // 3. Create Debit Note for additional amount
    if (additionalAmount > 0) {
      const debitNote = await adjustmentApi.createDebitNote({
        reference_type: 'quotation',
        reference_id: quotationId,
        amount: additionalAmount,
        reason: `เพิ่มรายการสินค้าตามคำขอลูกค้า: ${reason}`,
        created_by: getCurrentUser().id
      });
    }

    // 4. Re-submit for approval
    await documentApi.submit(quotationId);

    return {
      quotation: updatedData,
      additionalAmount,
      newRemainingAmount
    };

  } catch (error) {
    throw error;
  }
};
```

---

## 📦 กรณี 2: ส่งสินค้าไม่ครบ (Partial Delivery)

### 🎨 UI Design

```
Partial Delivery Management:
┌─────────────────────────────────────────────────────────────┐
│ 📦 การส่งสินค้าบางส่วน - โบรชัวร์ A4                         │
│                                                             │
│ สถานการณ์: สั่ง 1000 ชิ้น แต่ผลิตได้แค่ 600 ชิ้น            │
│                                                             │
│ ┌─ ข้อมูลออเดอร์ ────────────────────────────────────────┐  │
│ │ รายการ: โบรชัวร์ A4 4 สี                               │  │
│ │ จำนวนสั่ง: 1000 ชิ้น × ฿60 = ฿60,000                  │  │
│ │ ผลิตเสร็จ: 600 ชิ้น                                    │  │
│ │ คงเหลือ: 400 ชิ้น                                      │  │
│ │ กำหนดส่งครบ: 15 ก.พ. 2568                             │  │
│ └─────────────────────────────────────────────────────────┘  │
│                                                             │
│ ┌─ ตัวเลือกการออกบิล ────────────────────────────────────┐  │
│ │ เลือกวิธีการคิดเงิน:                                    │  │
│ │ ● คิดเงินตามที่ส่ง (แนะนำ)                              │  │
│ │   - งวดที่ 1: 600 ชิ้น × ฿60 = ฿36,000                │  │
│ │   - งวดที่ 2: 400 ชิ้น × ฿60 = ฿24,000 (รอส่ง)        │  │
│ │                                                         │  │
│ │ ○ คิดเงินเต็มจำนวน                                      │  │
│ │   - ใบแจ้งหนี้เต็มจำนวน: ฿60,000                       │  │
│ │   - ระบุการส่งเป็นงวดในหมายเหตุ                        │  │
│ └─────────────────────────────────────────────────────────┘  │
│                                                             │
│ ┌─ การสร้างเอกสารงวดที่ 1 ───────────────────────────────┐  │
│ │ สร้างอัตโนมัติ:                                         │  │
│ │ 📦 ใบส่งของงวดที่ 1: DN202501-0060                     │  │
│ │    จำนวน: 600 ชิ้น (60% ของ order)                    │  │
│ │    หมายเหตุ: งวดที่ 1 จาก 2 งวด, คงเหลือ 400 ชิ้น      │  │
│ │                                                         │  │
│ │ 💰 ใบแจ้งหนี้งวดที่ 1: INV202501-0130                  │  │
│ │    ยอดเงิน: ฿36,000.00 (600 ชิ้น)                      │  │
│ │                                                         │  │
│ │ 🧾 ใบเสร็จงวดที่ 1: RCPT202501-0095                    │  │
│ │    (เมื่อลูกค้าชำระเงิน)                                │  │
│ └─────────────────────────────────────────────────────────┘  │
│                                                             │
│ ┌─ ระบบติดตามคงเหลือ ────────────────────────────────────┐  │
│ │ 📊 Order Tracking Dashboard:                           │  │
│ │ ┌─────────────────────────────────────────────────────┐ │  │
│ │ │ Order ID: OR202501-001                              │ │  │
│ │ │ ├─ สั่งทั้งหมด: 1000 ชิ้น                           │ │  │
│ │ │ ├─ ส่งแล้ว: 600 ชิ้น (60%) ✅                       │ │  │
│ │ │ ├─ คงเหลือ: 400 ชิ้น (40%) 🟡                       │ │  │
│ │ │ └─ กำหนดส่ง: 15 ก.พ. 2568                           │ │  │
│ │ └─────────────────────────────────────────────────────┘ │  │
│ │                                                         │  │
│ │ สถานะ: 🟡 รอส่งงวดที่ 2                                │  │
│ │ [📅 นัดส่งงวดถัดไป] [📞 แจ้งลูกค้า] [📊 ดูรายงาน]       │  │
│ └─────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 🔧 Technical Implementation

```javascript
const handlePartialDelivery = async (orderId, deliveredItems) => {
  try {
    // 1. Create partial delivery note
    const deliveryNote = await deliveryNoteApi.create({
      order_id: orderId,
      items: deliveredItems,
      delivery_type: "partial",
      notes: `การส่งสินค้าบางส่วน งวดที่ ${getDeliverySequence(orderId)}`,
    });

    // 2. Update order tracking
    for (const item of deliveredItems) {
      await orderTrackingApi.updateDelivered(
        orderId,
        item.product_id,
        item.quantity
      );
    }

    // 3. Create invoice for delivered items
    const partialInvoice = await invoiceApi.createPartial({
      order_id: orderId,
      items: deliveredItems,
      delivery_note_id: deliveryNote.id,
    });

    // 4. Check if order is complete
    const remainingItems = await orderTrackingApi.getRemainingItems(orderId);
    const isComplete = remainingItems.every(
      (item) => item.remaining_quantity === 0
    );

    if (isComplete) {
      await orderApi.markComplete(orderId);
    }

    return {
      deliveryNote,
      partialInvoice,
      remainingItems,
      isComplete,
    };
  } catch (error) {
    throw error;
  }
};
```

---

## 🔄 กรณี 3: การคืนสินค้า

### 🎨 UI Design

```
Product Return Management:
┌─────────────────────────────────────────────────────────────┐
│ 🔄 การคืนสินค้า - โบรชัวร์ A4 (มีปัญหาคุณภาพ)              │
│                                                             │
│ ┌─ ข้อมูลการคืน ─────────────────────────────────────────┐  │
│ │ อ้างอิง: DN202501-0056 (ใบส่งของ)                      │  │
│ │ สินค้า: โบรชัวร์ A4 4 สี                               │  │
│ │ จำนวนคืน: 500 ชิ้น จาก 1000 ชิ้น                      │  │
│ │ เหตุผล: [พิมพ์ผิดสี ไม่ตรงตาม spec]                   │  │
│ │ วันที่คืน: 25 ม.ค. 2568                                │  │
│ └─────────────────────────────────────────────────────────┘  │
│                                                             │
│ ┌─ การคำนวณเงินคืน ──────────────────────────────────────┐  │
│ │ ราคาต่อหน่วย: ฿60.00                                   │  │
│ │ จำนวนคืน: 500 ชิ้น                                     │  │
│ │ ยอดเงินคืน: ฿30,000.00                                 │  │
│ │ VAT ที่ต้องคืน: ฿1,963.00                              │  │
│ │ รวมเงินคืน: ฿31,963.00                                 │  │
│ └─────────────────────────────────────────────────────────┘  │
│                                                             │
│ ┌─ เอกสารที่ออก ────────────────────────────────────────┐  │
│ │ ระบบสร้างอัตโนมัติ:                                     │  │
│ │                                                         │  │
│ │ 📄 ใบลดหนี้ (Credit Note): CR202501-001               │  │
│ │    อ้างอิง: INV202501-0130 (ใบแจ้งหนี้เดิม)            │  │
│ │    ยอดลด: ฿31,963.00                                   │  │
│ │    เหตุผล: คืนสินค้าเนื่องจากไม่ตรงคุณภาพ               │  │
│ │                                                         │  │
│ │ 📋 ใบรับคืนสินค้า: RET202501-001                       │  │
│ │    สถานะสินค้า: [❌ ทำลาย] [🔄 ผลิตใหม่] [📦 เก็บ]      │  │
│ │                                                         │  │
│ │ 💰 ใบสำคัญจ่าย (หรือหักยอดค้างชำระ)                    │  │
│ │    จำนวน: ฿31,963.00                                   │  │
│ └─────────────────────────────────────────────────────────┘  │
│                                                             │
│ ┌─ การปรับปรุงระบบ ──────────────────────────────────────┐  │
│ │ อัปเดตอัตโนมัติ:                                        │  │
│ │ • ปรับสต็อกสินค้า (+500 ชิ้น หรือ -500 ชิ้นเสีย)        │  │
│ │ • ปรับยอดขาย (-฿31,963.00)                             │  │
│ │ • อัปเดตสถานะลูกค้า (ถ้ามียอดค้างชำระ)                  │  │
│ │ • บันทึกประวัติการคืนสินค้า                            │  │
│ │                                                         │  │
│ │ [บันทึกการคืนสินค้า] [พิมพ์เอกสาร] [แจ้งฝ่ายผลิต]        │  │
│ └─────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 🔧 Technical Implementation

```javascript
const handleProductReturn = async (deliveryNoteId, returnItems, reason) => {
  try {
    // 1. Create return note
    const returnNote = await returnApi.create({
      delivery_note_id: deliveryNoteId,
      items: returnItems,
      reason,
      return_date: new Date(),
      created_by: getCurrentUser().id,
    });

    // 2. Calculate refund amount
    const refundAmount = calculateRefundAmount(returnItems);

    // 3. Create credit note
    const creditNote = await adjustmentApi.createCreditNote({
      reference_type: "delivery_note",
      reference_id: deliveryNoteId,
      amount: refundAmount,
      reason: `คืนสินค้า: ${reason}`,
      created_by: getCurrentUser().id,
    });

    // 4. Update inventory
    for (const item of returnItems) {
      await inventoryApi.updateStock(item.product_id, item.quantity, "return");
    }

    // 5. Update customer balance (if applicable)
    const customer = await getCustomerFromDeliveryNote(deliveryNoteId);
    if (customer.outstanding_balance > 0) {
      await customerApi.updateBalance(customer.id, -refundAmount);
    }

    return {
      returnNote,
      creditNote,
      refundAmount,
    };
  } catch (error) {
    throw error;
  }
};
```

## 📋 Required APIs

### POST /api/documents/:id/rollback

### POST /api/adjustments/debit-notes

### POST /api/adjustments/credit-notes

### POST /api/returns/create

### POST /api/order-tracking/partial-delivery

## 🔐 Permissions

- **Sales**: ไม่สามารถดำเนินการได้ (ดูได้เท่านั้น)
- **Account**: ดำเนินการได้ทั้งหมด

## ✅ Acceptance Criteria

### การแก้ไขออเดอร์

1. Account ย้อนกลับสถานะเอกสารได้
2. แก้ไขใบเสนอราคาเพิ่มรายการได้
3. สร้าง Debit Note อัตโนมัติ
4. คำนวณยอดใหม่ถูกต้อง

### การส่งไม่ครบ

1. สร้างใบส่งของแยกงวดได้
2. ติดตามจำนวนคงเหลือได้
3. ออกใบแจ้งหนี้ตามที่ส่งจริง
4. แสดง progress การส่งได้

### การคืนสินค้า

1. บันทึกการคืนสินค้าได้
2. สร้าง Credit Note อัตโนมัติ
3. ปรับปรุงสต็อกและยอดขาย
4. จัดการเงินคืนลูกค้าได้

## 🚀 AI Command

```bash
สร้างระบบจัดการกรณีพิเศษ: แก้ไขออเดอร์, ส่งสินค้าไม่ครบ, การคืนสินค้า
พร้อมออกเอกสาร Credit/Debit Note อัตโนมัติ
```
