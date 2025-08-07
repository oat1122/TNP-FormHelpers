# Customer Update System - Implementation Documentation

## 🎯 Overview
ระบบแก้ไขข้อมูลลูกค้าใน CreateQuotationForm ที่ให้ผู้ใช้สามารถอัพเดทข้อมูลลูกค้าได้โดยตรงในฟอร์มสร้างใบเสนอราคา โดยบันทึกข้อมูลลงตาราง `master_customers` ในฐานข้อมูล

## 🏗️ Architecture

### Frontend Components
```
CustomerEditCard.jsx          # Main component สำหรับแก้ไขข้อมูลลูกค้า
CustomerEditCard.css          # Styling สำหรับ component
CreateQuotationForm.jsx       # Integration point ที่รวม CustomerEditCard
```

### Backend Integration
```
API Endpoint: PUT /api/v1/customers/{id}
Controller: CustomerController@update
Model: MasterCustomer
Database: tnpdb.master_customers
```

## 🔧 Features

### ✅ การแสดงผลข้อมูล
- **Collapsible Design**: แสดงข้อมูลสำคัญทันที สามารถขยายดูรายละเอียดได้
- **Real-time Formatting**: จัดรูปแบบเบอร์โทรและเลขประจำตัวผู้เสียภาษีอัตโนมัติ
- **Responsive UI**: รองรับการใช้งานในหน้าจอทุกขนาด

### ✅ การแก้ไขข้อมูล
- **Inline Editing**: แก้ไขข้อมูลในหน้าเดียวกันไม่ต้องเปิดหน้าใหม่
- **Real-time Validation**: ตรวจสอบความถูกต้องของข้อมูลแบบ real-time
- **Auto-clean Data**: ทำความสะอาดเบอร์โทรและเลขประจำตัวผู้เสียภาษีอัตโนมัติ
- **Master Data Integration**: โหลดข้อมูลจังหวัด อำเภอ ตำบล และประเภทธุรกิจ

### ✅ การจัดการข้อมูล
- **Authentication**: ใช้ Bearer Token สำหรับการยืนยันตัวตน
- **Error Handling**: จัดการข้อผิดพลาดอย่างครอบคลุม
- **Success Feedback**: แจ้งผลการบันทึกข้อมูลแบบ real-time
- **Data Consistency**: อัพเดทข้อมูลใน local state และ backend

## 📋 Database Schema

### master_customers Table
```sql
CREATE TABLE `master_customers` (
  `cus_id` char(36) NOT NULL DEFAULT uuid(),
  `cus_mcg_id` char(36) DEFAULT NULL,
  `cus_no` char(10) DEFAULT NULL,
  `cus_channel` tinyint(4) DEFAULT NULL,
  `cus_bt_id` char(36) DEFAULT NULL,
  `cus_firstname` varchar(100) DEFAULT NULL,
  `cus_lastname` varchar(100) DEFAULT NULL,
  `cus_name` varchar(100) DEFAULT NULL,
  `cus_depart` varchar(100) DEFAULT NULL,
  `cus_company` varchar(255) DEFAULT NULL,
  `cus_tel_1` char(20) DEFAULT NULL,
  `cus_tel_2` char(20) DEFAULT NULL,
  `cus_email` varchar(100) DEFAULT NULL,
  `cus_tax_id` char(13) DEFAULT NULL,
  `cus_pro_id` char(36) DEFAULT NULL,
  `cus_dis_id` char(36) DEFAULT NULL,
  `cus_sub_id` char(36) DEFAULT NULL,
  `cus_zip_code` char(5) DEFAULT NULL,
  `cus_address` text DEFAULT NULL,
  `cus_manage_by` bigint(20) DEFAULT NULL,
  `cus_is_use` tinyint(1) NOT NULL DEFAULT 1,
  `cus_created_date` timestamp NULL DEFAULT current_timestamp(),
  `cus_created_by` bigint(20) DEFAULT NULL,
  `cus_updated_date` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `cus_updated_by` bigint(20) DEFAULT NULL,
  PRIMARY KEY (`cus_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

## 🔌 API Integration

### Authentication
```javascript
const authToken = localStorage.getItem("authToken") || localStorage.getItem("token");
const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': `Bearer ${authToken}`
};
```

### Customer Update API
```javascript
PUT /api/v1/customers/{customer_id}
Content-Type: application/json
Authorization: Bearer {token}

{
    "cus_company": "บริษัท ทีเอ็นพี จำกัด",
    "cus_firstname": "สมชาย",
    "cus_lastname": "ใจดี",
    "cus_name": "ชาย",
    "cus_depart": "ฝ่ายขาย",
    "cus_tel_1": "0812345678",
    "cus_tel_2": "0898765432",
    "cus_email": "somchai@tnp.com",
    "cus_tax_id": "1234567890123",
    "cus_address": "123 ถ.สุขุมวิท แขวงคลองตัน เขตคลองตัน",
    "cus_zip_code": "10110",
    "cus_channel": 1,
    "cus_bt_id": "uuid-business-type",
    "cus_pro_id": "uuid-province",
    "cus_dis_id": "uuid-district",
    "cus_sub_id": "uuid-subdistrict"
}
```

### Master Data APIs
```javascript
GET /api/v1/get-all-business-types     # ประเภทธุรกิจ
GET /api/v1/locations                  # จังหวัด
GET /api/v1/locations?province_sort_id={id}    # อำเภอ
GET /api/v1/locations?district_sort_id={id}    # ตำบล
```

## 🎨 UI/UX Design

### Design System
- **Color Palette**: TNP Brand Colors (#900F0F, #B20000, #E36264)
- **Typography**: Material-UI Typography Scale
- **Spacing**: 8px Grid System
- **Animations**: Smooth transitions (0.3s ease-in-out)

### Component States
1. **Display Mode**: แสดงข้อมูลแบบ read-only
2. **Edit Mode**: ฟอร์มแก้ไขข้อมูลพร้อม validation
3. **Saving Mode**: แสดง loading indicator ขณะบันทึก
4. **Success Mode**: แสดงข้อความสำเร็จชั่วคราว
5. **Error Mode**: แสดงข้อผิดพลาดพร้อมคำแนะนำ

### Responsive Breakpoints
- **Desktop**: >= 1200px (Full layout)
- **Tablet**: 768px - 1199px (Adaptive layout)
- **Mobile**: < 768px (Stacked layout)

## 🧪 Validation Rules

### Required Fields
- `cus_company` - ชื่อบริษัท
- `cus_firstname` - ชื่อ
- `cus_lastname` - นามสกุล
- `cus_name` - ชื่อเล่น
- `cus_tel_1` - เบอร์โทรศัพท์หลัก

### Format Validation
- **Phone**: 9-10 digits only
- **Email**: Standard email format
- **Tax ID**: 13 digits only
- **Zip Code**: 5 digits

### Business Rules
- Phone numbers auto-cleaned (remove non-digits)
- Tax ID auto-cleaned (remove non-digits)
- Province/District/Subdistrict cascade loading
- Auto-fill zip code from subdistrict selection

## 🚀 Usage Example

### Integration in CreateQuotationForm
```jsx
import CustomerEditCard from './CustomerEditCard';

// In component
<CustomerEditCard 
    customer={formData.customer}
    onUpdate={(updatedCustomer) => {
        setFormData(prev => ({
            ...prev,
            customer: updatedCustomer
        }));
    }}
/>
```

### Props Interface
```typescript
interface CustomerEditCardProps {
    customer: Customer;                    // Customer object
    onUpdate?: (customer: Customer) => void;  // Callback for updates
    onCancel?: () => void;                 // Callback for cancel action
}
```

## 🔍 Error Handling

### Frontend Errors
- **Validation Errors**: Real-time field validation
- **Network Errors**: Connection timeout/failure handling
- **Authentication Errors**: Token expiry handling
- **API Errors**: Server response error handling

### Error Display
- **Field Level**: Individual field error messages
- **Form Level**: General form error alerts
- **Success Messages**: Confirmation of successful operations

## 📈 Performance Considerations

### Optimization Strategies
- **Lazy Loading**: Master data loaded on demand
- **Debounced Validation**: Reduce API calls during typing
- **Memoization**: Prevent unnecessary re-renders
- **Efficient Updates**: Only send changed fields

### Caching Strategy
- **Master Data**: Cache provinces, districts, business types
- **Customer Data**: Local state management
- **API Responses**: Leverage browser cache headers

## 🔧 Development Setup

### Prerequisites
- React 18+
- Material-UI 5.x
- Laravel 9+ Backend
- MySQL Database

### Installation
```bash
# Frontend dependencies already included in main project
# Component files already created in:
# /src/pages/Accounting/PricingIntegration/components/
```

### Testing
```bash
# Manual testing scenarios
1. Load customer data from pricing request
2. Edit customer information
3. Validate required fields
4. Save changes successfully
5. Handle API errors gracefully
6. Test responsive design
```

## 🎯 Future Enhancements

### Phase 2 Features
- **Bulk Edit**: แก้ไขลูกค้าหลายรายพร้อมกัน
- **History Tracking**: ติดตามการเปลี่ยนแปลงข้อมูล
- **Advanced Search**: ค้นหาลูกค้าแบบซับซ้อน
- **Export Options**: ส่งออกข้อมูลลูกค้า

### Performance Improvements
- **Virtualization**: สำหรับรายการข้อมูลขนาดใหญ่
- **Progressive Loading**: โหลดข้อมูลแบบค่อยเป็นค่อยไป
- **Offline Support**: รองรับการทำงานแบบ offline

## 👥 Team Credits

### Frontend Development
- **แต้ม (TNP Developer)** - Full-stack Developer
- Focus: UI/UX Design, React Components, API Integration

### Backend Integration
- **Laravel API** - Existing customer management system
- **Database Schema** - TNP Database structure

---

## 📝 Change Log

### Version 1.0.0 (August 2025)
- ✅ Initial implementation
- ✅ Customer edit functionality
- ✅ Master data integration
- ✅ Validation and error handling
- ✅ Responsive design
- ✅ Authentication integration

---

**Documentation Generated**: August 2025  
**Last Updated**: August 7, 2025  
**Version**: 1.0.0
