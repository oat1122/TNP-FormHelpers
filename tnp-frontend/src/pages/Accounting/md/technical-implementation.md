# Technical Implementation: Database & API Specification

---

## 📋 Data Transfer Objects (DTOs) สำหรับ Auto-fill

### Customer Auto-fill DTO

```javascript
const CustomerAutofillDTO = {
  customer_id: "cus_id",
  customer_company: "cus_company", 
  customer_tax_id: "cus_tax_id",
  customer_address: "cus_address",
  customer_zip_code: "cus_zip_code",
  customer_tel_1: "cus_tel_1",
  customer_email: "cus_email",
  customer_firstname: "cus_firstname",
  customer_lastname: "cus_lastname"
};
```

### Pricing Request Auto-fill DTO

```javascript
const PricingRequestAutofillDTO = {
  pricing_request_id: "pr_id",
  work_name: "pr_work_name",
  pattern: "pr_pattern", 
  fabric_type: "pr_fabric_type",
  color: "pr_color",
  sizes: "pr_sizes",
  quantity: "pr_quantity",
  due_date: "pr_due_date",
  silk_screen: "pr_silk",
  dft_screen: "pr_dft",
  embroider: "pr_embroider",
  sub_screen: "pr_sub",
  other_screen: "pr_other_screen",
  product_image: "pr_image",
  // รวมข้อมูลลูกค้าจาก pricing_request -> customer
  customer: CustomerAutofillDTO
};
```

### Pricing Request Notes DTO

```javascript
const PricingRequestNotesDTO = {
  note_id: "prn_id",
  pricing_request_id: "prn_pr_id", 
  note_text: "prn_text",
  note_type: "prn_note_type", // 1=sale, 2=price, 3=manager
  created_by: "prn_created_by",
  created_date: "prn_created_date"
};
```

---

## 🔄 Auto-fill Business Logic

### การดึงข้อมูลสำหรับสร้าง Quotation

```sql
-- Query สำหรับดึงข้อมูล Pricing Request พร้อมลูกค้า
SELECT 
  pr.*, 
  mc.cus_company,
  mc.cus_tax_id,
  mc.cus_address,
  mc.cus_zip_code,
  mc.cus_tel_1,
  mc.cus_email,
  mc.cus_firstname,
  mc.cus_lastname
FROM pricing_requests pr
LEFT JOIN master_customers mc ON pr.pr_cus_id = mc.cus_id
WHERE pr.pr_id = ?
AND pr.pr_is_deleted = 0;

-- Query สำหรับดึง Notes ของ Pricing Request
SELECT *
FROM pricing_request_notes prn
WHERE prn.prn_pr_id = ?
AND prn.prn_is_deleted = 0
ORDER BY prn.prn_created_date ASC;
```

### Auto-fill Workflow

```javascript
const AutofillWorkflow = {
  // 1. เลือก Pricing Request
  selectPricingRequest: async (pr_id) => {
    const pricingData = await fetchPricingRequestWithCustomer(pr_id);
    const notes = await fetchPricingRequestNotes(pr_id);
    
    return {
      ...pricingData,
      notes: notes
    };
  },
  
  // 2. Auto-fill ข้อมูลใน Quotation Form
  autofillQuotationForm: (pricingData) => {
    return {
      // ข้อมูลจาก Pricing Request
      pricing_request_id: pricingData.pr_id,
      work_name: pricingData.pr_work_name,
      fabric_type: pricingData.pr_fabric_type,
      pattern: pricingData.pr_pattern,
      color: pricingData.pr_color,
      sizes: pricingData.pr_sizes,
      quantity: pricingData.pr_quantity,
      due_date: pricingData.pr_due_date,
      
      // ข้อมูลลูกค้า
      customer_id: pricingData.pr_cus_id,
      customer_company: pricingData.cus_company,
      customer_tax_id: pricingData.cus_tax_id,
      customer_address: pricingData.cus_address,
      customer_zip_code: pricingData.cus_zip_code,
      
      // สร้าง Notes จาก Pricing Request Notes
      initial_notes: pricingData.notes.map(note => 
        `[${note.note_type_label}] ${note.prn_text}`
      ).join('\n')
    };
  },
  
  // 3. Cascade Auto-fill สำหรับ Invoice, Receipt, Delivery Note
  cascadeAutofill: (sourceDocument, targetType) => {
    const baseData = {
      customer_id: sourceDocument.customer_id,
      customer_company: sourceDocument.customer_company,
      customer_tax_id: sourceDocument.customer_tax_id,
      customer_address: sourceDocument.customer_address,
      customer_zip_code: sourceDocument.customer_zip_code
    };
    
    switch(targetType) {
      case 'invoice':
        return {
          ...baseData,
          quotation_id: sourceDocument.id,
          subtotal: sourceDocument.subtotal,
          tax_amount: sourceDocument.tax_amount,
          total_amount: sourceDocument.total_amount,
          due_date: sourceDocument.due_date
        };
        
      case 'receipt':
        return {
          ...baseData,
          invoice_id: sourceDocument.id,
          subtotal: sourceDocument.subtotal,
          tax_amount: sourceDocument.tax_amount,
          total_amount: sourceDocument.total_amount
        };
        
      case 'delivery_note':
        return {
          ...baseData,
          receipt_id: sourceDocument.id,
          delivery_address: sourceDocument.customer_address
        };
    }
  }
};
```

---

## � Frontend Auto-fill Implementation

### React Components สำหรับ Auto-fill

```jsx
// PricingRequestSelector.jsx - Component สำหรับเลือก Pricing Request
const PricingRequestSelector = ({ onSelect, selectedPricingRequest }) => {
  const [pricingRequests, setPricingRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const fetchPricingRequests = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/pricing/completed-requests');
      setPricingRequests(response.data);
    } catch (error) {
      console.error('Error fetching pricing requests:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSelect = async (pr_id) => {
    try {
      const response = await api.get(`/api/quotations/autofill/pricing-request/${pr_id}`);
      onSelect(response.data);
    } catch (error) {
      console.error('Error fetching pricing request details:', error);
    }
  };
  
  return (
    <Select
      placeholder="เลือก Pricing Request สำหรับ Auto-fill"
      loading={loading}
      onDropdownVisibleChange={(open) => {
        if (open && pricingRequests.length === 0) {
          fetchPricingRequests();
        }
      }}
      onChange={handleSelect}
      value={selectedPricingRequest?.pr_id}
      style={{ width: '100%' }}
    >
      {pricingRequests.map(pr => (
        <Option key={pr.pr_id} value={pr.pr_id}>
          <div>
            <div><strong>{pr.pr_work_name}</strong></div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              {pr.cus_company} - {pr.pr_quantity} ชิ้น
            </div>
          </div>
        </Option>
      ))}
    </Select>
  );
};

// CustomerSelector.jsx - Component สำหรับเลือกลูกค้าแบบ Auto-complete
const CustomerSelector = ({ onSelect, selectedCustomer }) => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const searchCustomers = async (searchText) => {
    if (searchText.length < 2) return;
    
    setLoading(true);
    try {
      const response = await api.get(`/api/customers/search?q=${searchText}`);
      setCustomers(response.data);
    } catch (error) {
      console.error('Error searching customers:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSelect = async (cus_id) => {
    try {
      const response = await api.get(`/api/customers/${cus_id}/details`);
      onSelect(response.data);
    } catch (error) {
      console.error('Error fetching customer details:', error);
    }
  };
  
  return (
    <AutoComplete
      placeholder="ค้นหาลูกค้า (ชื่อบริษัท, เลขภาษี, ชื่อ-นามสกุล)"
      onSearch={debounce(searchCustomers, 300)}
      onSelect={handleSelect}
      value={selectedCustomer?.cus_company}
      style={{ width: '100%' }}
    >
      {customers.map(customer => (
        <Option key={customer.cus_id} value={customer.cus_id}>
          <div>
            <div><strong>{customer.cus_company}</strong></div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              {customer.cus_firstname} {customer.cus_lastname} - {customer.cus_tax_id}
            </div>
          </div>
        </Option>
      ))}
    </AutoComplete>
  );
};

// QuotationForm.jsx - ฟอร์มหลักที่มี Auto-fill
const QuotationForm = () => {
  const [form] = Form.useForm();
  const [autoFillSource, setAutoFillSource] = useState('pricing_request'); // หรือ 'customer'
  
  // Auto-fill จาก Pricing Request
  const handlePricingRequestSelect = (pricingData) => {
    form.setFieldsValue({
      pricing_request_id: pricingData.pr_id,
      customer_id: pricingData.pr_cus_id,
      customer_company: pricingData.cus_company,
      customer_tax_id: pricingData.cus_tax_id,
      customer_address: pricingData.cus_address,
      customer_zip_code: pricingData.cus_zip_code,
      work_name: pricingData.pr_work_name,
      fabric_type: pricingData.pr_fabric_type,
      pattern: pricingData.pr_pattern,
      color: pricingData.pr_color,
      sizes: pricingData.pr_sizes,
      quantity: pricingData.pr_quantity,
      due_date: moment(pricingData.pr_due_date),
      notes: pricingData.initial_notes
    });
    
    // แจ้งให้ผู้ใช้ทราบว่าข้อมูลถูก auto-fill แล้ว
    message.success('ข้อมูลถูก Auto-fill จาก Pricing Request เรียบร้อยแล้ว');
  };
  
  // Auto-fill จากลูกค้า
  const handleCustomerSelect = (customerData) => {
    form.setFieldsValue({
      customer_id: customerData.cus_id,
      customer_company: customerData.cus_company,
      customer_tax_id: customerData.cus_tax_id,
      customer_address: customerData.cus_address,
      customer_zip_code: customerData.cus_zip_code
    });
    
    message.success('ข้อมูลลูกค้าถูก Auto-fill เรียบร้อยแล้ว');
  };
  
  return (
    <Form form={form} layout="vertical">
      <Card title="เลือกข้อมูลสำหรับ Auto-fill" style={{ marginBottom: 16 }}>
        <Radio.Group 
          value={autoFillSource} 
          onChange={(e) => setAutoFillSource(e.target.value)}
          style={{ marginBottom: 16 }}
        >
          <Radio.Button value="pricing_request">จาก Pricing Request</Radio.Button>
          <Radio.Button value="customer">จากข้อมูลลูกค้า</Radio.Button>
        </Radio.Group>
        
        {autoFillSource === 'pricing_request' && (
          <PricingRequestSelector onSelect={handlePricingRequestSelect} />
        )}
        
        {autoFillSource === 'customer' && (
          <CustomerSelector onSelect={handleCustomerSelect} />
        )}
      </Card>
      
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item 
            label="ชื่อบริษัท" 
            name="customer_company"
            rules={[{ required: true, message: 'กรุณากรอกชื่อบริษัท' }]}
          >
            <Input placeholder="ชื่อบริษัทลูกค้า" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item 
            label="เลขประจำตัวผู้เสียภาษี" 
            name="customer_tax_id"
          >
            <Input placeholder="เลขประจำตัวผู้เสียภาษี 13 หลัก" />
          </Form.Item>
        </Col>
      </Row>
      
      <Form.Item 
        label="ที่อยู่" 
        name="customer_address"
      >
        <TextArea rows={3} placeholder="ที่อยู่ลูกค้า" />
      </Form.Item>
      
      <Row gutter={16}>
        <Col span={8}>
          <Form.Item 
            label="รหัสไปรษณีย์" 
            name="customer_zip_code"
          >
            <Input placeholder="รหัสไปรษณีย์" />
          </Form.Item>
        </Col>
        <Col span={16}>
          <Form.Item 
            label="ชื่องาน" 
            name="work_name"
            rules={[{ required: true, message: 'กรุณากรอกชื่องาน' }]}
          >
            <Input placeholder="ชื่องานที่ขอใบเสนอราคา" />
          </Form.Item>
        </Col>
      </Row>
      
      {/* เพิ่มฟิลด์อื่นๆ ตามต้องการ */}
    </Form>
  );
};
```

### Auto-fill Hooks

```javascript
// useAutoFill.js - Custom Hook สำหรับ Auto-fill
export const useAutoFill = () => {
  const [loading, setLoading] = useState(false);
  
  const autoFillFromPricingRequest = async (pr_id) => {
    setLoading(true);
    try {
      const response = await api.get(`/api/quotations/autofill/pricing-request/${pr_id}`);
      return response.data;
    } catch (error) {
      message.error('เกิดข้อผิดพลาดในการดึงข้อมูล Pricing Request');
      throw error;
    } finally {
      setLoading(false);
    }
  };
  
  const autoFillFromCustomer = async (cus_id) => {
    setLoading(true);
    try {
      const response = await api.get(`/api/customers/${cus_id}/details`);
      return response.data;
    } catch (error) {
      message.error('เกิดข้อผิดพลาดในการดึงข้อมูลลูกค้า');
      throw error;
    } finally {
      setLoading(false);
    }
  };
  
  const cascadeAutoFill = async (sourceDocumentId, sourceType, targetType) => {
    setLoading(true);
    try {
      const response = await api.get(
        `/api/${sourceType}s/${sourceDocumentId}/autofill-for/${targetType}`
      );
      return response.data;
    } catch (error) {
      message.error('เกิดข้อผิดพลาดในการ Auto-fill ข้อมูล');
      throw error;
    } finally {
      setLoading(false);
    }
  };
  
  return {
    loading,
    autoFillFromPricingRequest,
    autoFillFromCustomer,
    cascadeAutoFill
  };
};
```

---

## �🎯 วัตถุประสงค์
กำหนด Database Schema, API Endpoints, Permission System และ Technical Architecture สำหรับระบบ Account Management

---

## 🗃️ Database Schema

### Core Tables

```sql
-- ตารางหลักสำหรับเอกสารแต่ละประเภท
CREATE TABLE quotations (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  number VARCHAR(50) UNIQUE NOT NULL,
  pricing_request_id CHAR(36) REFERENCES pricing_requests(pr_id),
  customer_id CHAR(36) REFERENCES master_customers(cus_id),
  -- ข้อมูลลูกค้าที่ autofill จาก master_customers
  customer_company VARCHAR(255),
  customer_tax_id CHAR(13),
  customer_address TEXT,
  customer_zip_code CHAR(5),
  -- ข้อมูลงานที่ autofill จาก pricing_requests
  work_name VARCHAR(100),
  fabric_type VARCHAR(255),
  pattern VARCHAR(255),
  color VARCHAR(255),
  sizes VARCHAR(255),
  quantity VARCHAR(10),
  -- สถานะและเงื่อนไข
  status ENUM('draft', 'pending_review', 'approved', 'rejected', 'sent', 'completed') DEFAULT 'draft',
  subtotal DECIMAL(15,2) NOT NULL,
  tax_amount DECIMAL(15,2) DEFAULT 0,
  total_amount DECIMAL(15,2) NOT NULL,
  deposit_percentage INT DEFAULT 0,
  deposit_amount DECIMAL(15,2) DEFAULT 0,
  payment_terms VARCHAR(50),
  due_date DATE,
  notes TEXT,
  created_by CHAR(36),
  approved_by CHAR(36),
  approved_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP()
);

CREATE TABLE invoices (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  number VARCHAR(50) UNIQUE NOT NULL,
  quotation_id CHAR(36) REFERENCES quotations(id),
  customer_id CHAR(36) REFERENCES master_customers(cus_id),
  -- ข้อมูลลูกค้าที่ autofill จาก quotations/master_customers
  customer_company VARCHAR(255),
  customer_tax_id CHAR(13),
  customer_address TEXT,
  customer_zip_code CHAR(5),
  status ENUM('draft', 'pending', 'approved', 'sent', 'partial_paid', 'fully_paid', 'overdue') DEFAULT 'draft',
  subtotal DECIMAL(15,2) NOT NULL,
  tax_amount DECIMAL(15,2) DEFAULT 0,
  total_amount DECIMAL(15,2) NOT NULL,
  paid_amount DECIMAL(15,2) DEFAULT 0,
  due_date DATE,
  payment_method VARCHAR(50),
  created_by CHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP()
);

CREATE TABLE receipts (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  number VARCHAR(50) UNIQUE NOT NULL,
  invoice_id CHAR(36) REFERENCES invoices(id),
  customer_id CHAR(36) REFERENCES master_customers(cus_id),
  -- ข้อมูลลูกค้าที่ autofill
  customer_company VARCHAR(255),
  customer_tax_id CHAR(13),
  customer_address TEXT,
  type ENUM('receipt', 'tax_invoice', 'full_tax_invoice') DEFAULT 'receipt',
  status ENUM('draft', 'approved', 'sent') DEFAULT 'draft',
  subtotal DECIMAL(15,2) NOT NULL,
  tax_amount DECIMAL(15,2) DEFAULT 0,
  total_amount DECIMAL(15,2) NOT NULL,
  payment_method VARCHAR(50),
  payment_reference VARCHAR(100),
  tax_invoice_number VARCHAR(50),
  issued_by CHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
);

CREATE TABLE delivery_notes (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  number VARCHAR(50) UNIQUE NOT NULL,
  receipt_id CHAR(36) REFERENCES receipts(id),
  customer_id CHAR(36) REFERENCES master_customers(cus_id),
  -- ข้อมูลลูกค้าที่ autofill
  customer_company VARCHAR(255),
  customer_address TEXT,
  customer_zip_code CHAR(5),
  status ENUM('preparing', 'shipping', 'in_transit', 'delivered', 'completed', 'failed') DEFAULT 'preparing',
  delivery_method ENUM('self_delivery', 'courier', 'customer_pickup') DEFAULT 'courier',
  courier_company VARCHAR(100),
  tracking_number VARCHAR(100),
  delivery_address TEXT,
  recipient_name VARCHAR(255),
  recipient_phone VARCHAR(50),
  delivery_date DATE,
  delivered_at TIMESTAMP NULL,
  created_by CHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP()
);
```

### Support Tables

```sql
-- ตารางสำหรับติดตามการเปลี่ยนแปลงสถานะ
CREATE TABLE document_history (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  document_type ENUM('quotation', 'invoice', 'receipt', 'delivery_note', 'credit_note', 'debit_note'),
  document_id CHAR(36) NOT NULL,
  previous_status VARCHAR(50),
  new_status VARCHAR(50),
  action VARCHAR(100),
  notes TEXT,
  action_by CHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
);

-- ตารางสำหรับติดตามจำนวนคงเหลือ
CREATE TABLE order_items_tracking (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  quotation_id CHAR(36) REFERENCES quotations(id),
  pricing_request_id CHAR(36) REFERENCES pricing_requests(pr_id),
  -- ข้อมูลสินค้าที่ autofill จาก pricing_requests
  work_name VARCHAR(100),
  fabric_type VARCHAR(255),
  pattern VARCHAR(255),
  color VARCHAR(255),
  sizes VARCHAR(255),
  ordered_quantity INT NOT NULL,
  delivered_quantity INT DEFAULT 0,
  remaining_quantity INT GENERATED ALWAYS AS (ordered_quantity - delivered_quantity) STORED,
  returned_quantity INT DEFAULT 0,
  unit_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP()
);

-- ตารางสำหรับเก็บไฟล์แนบ
CREATE TABLE document_attachments (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  document_type ENUM('quotation', 'invoice', 'receipt', 'delivery_note'),
  document_id CHAR(36) NOT NULL,
  filename VARCHAR(255) NOT NULL,
  original_filename VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size INT,
  mime_type VARCHAR(100),
  uploaded_by CHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
);

-- ตารางสำหรับ Credit/Debit Notes
CREATE TABLE adjustment_notes (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  number VARCHAR(50) UNIQUE NOT NULL,
  type ENUM('credit_note', 'debit_note') NOT NULL,
  reference_type ENUM('quotation', 'invoice', 'receipt', 'delivery_note'),
  reference_id CHAR(36) NOT NULL,
  customer_id CHAR(36) REFERENCES master_customers(cus_id),
  -- ข้อมูลลูกค้าที่ autofill
  customer_company VARCHAR(255),
  customer_tax_id CHAR(13),
  amount DECIMAL(15,2) NOT NULL,
  reason TEXT NOT NULL,
  status ENUM('draft', 'approved') DEFAULT 'draft',
  created_by CHAR(36),
  approved_by CHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
);

-- ตารางสำหรับการคืนสินค้า
CREATE TABLE product_returns (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  number VARCHAR(50) UNIQUE NOT NULL,
  delivery_note_id CHAR(36) REFERENCES delivery_notes(id),
  customer_id CHAR(36) REFERENCES master_customers(cus_id),
  -- ข้อมูลลูกค้าที่ autofill
  customer_company VARCHAR(255),
  return_date DATE NOT NULL,
  reason TEXT NOT NULL,
  total_refund_amount DECIMAL(15,2) NOT NULL,
  status ENUM('pending', 'approved', 'processed') DEFAULT 'pending',
  created_by CHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
);

-- ตารางอ้างอิงจากระบบเดิม (เพื่อใช้ autofill)
-- ไม่ต้องสร้างใหม่ แต่ใช้ที่มีอยู่แล้ว
-- master_customers, pricing_requests, pricing_request_notes
```

### Indexes for Performance

```sql
-- Indexes สำหรับ Performance
CREATE INDEX idx_quotations_status ON quotations(status);
CREATE INDEX idx_quotations_customer ON quotations(customer_id);
CREATE INDEX idx_quotations_pricing_request ON quotations(pricing_request_id);
CREATE INDEX idx_quotations_created_date ON quotations(created_at);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_customer ON invoices(customer_id);
CREATE INDEX idx_document_history_document ON document_history(document_type, document_id);
CREATE INDEX idx_delivery_notes_tracking ON delivery_notes(tracking_number);
CREATE INDEX idx_order_tracking_quotation ON order_items_tracking(quotation_id);
CREATE INDEX idx_order_tracking_pricing_request ON order_items_tracking(pricing_request_id);
CREATE INDEX idx_master_customers_tax_id ON master_customers(cus_tax_id);
CREATE INDEX idx_master_customers_company ON master_customers(cus_company);
CREATE INDEX idx_pricing_requests_customer ON pricing_requests(pr_cus_id);
CREATE INDEX idx_pricing_request_notes_pr ON pricing_request_notes(prn_pr_id);
```

---

## 🔌 API Endpoints

### Authentication & Authorization

```javascript
// Authentication APIs
POST   /api/auth/login
POST   /api/auth/logout  
GET    /api/auth/me
POST   /api/auth/refresh-token
```

### Pricing Integration

```javascript
// Pricing System Integration
GET    /api/pricing/completed-requests        // ดึงรายการ pricing requests ที่เสร็จแล้ว
GET    /api/pricing/requests/:id              // ดึงข้อมูล pricing request ตาม ID
GET    /api/pricing/requests/:id/notes        // ดึง notes ของ pricing request
POST   /api/pricing/requests/:id/mark-used    // มาร์คว่าใช้แล้วสำหรับสร้าง quotation

// Customer Data Integration  
GET    /api/customers/:id/details             // ดึงข้อมูลลูกค้าเต็ม (autofill)
GET    /api/customers/search                  // ค้นหาลูกค้า
GET    /api/customers/:id/pricing-history     // ประวัติการขอราคา
```

### Quotation APIs

```javascript
// Quotation Management
GET    /api/quotations                    // List with filters
POST   /api/quotations                    // Create new (รับ pricing_request_id สำหรับ autofill)
GET    /api/quotations/:id                // Get detail
PUT    /api/quotations/:id                // Update
DELETE /api/quotations/:id               // Delete

// Quotation Auto-fill Helpers
GET    /api/quotations/autofill/pricing-request/:pr_id  // ดึงข้อมูลสำหรับ autofill จาก pricing request
GET    /api/quotations/autofill/customer/:cus_id        // ดึงข้อมูลลูกค้าสำหรับ autofill

// Quotation Actions
POST   /api/quotations/:id/submit         // Submit for review
POST   /api/quotations/:id/approve        // Approve
POST   /api/quotations/:id/reject         // Reject  
POST   /api/quotations/:id/rollback       // Rollback status

// Quotation Conversions
POST   /api/quotations/:id/convert-to-invoice

// File Operations
GET    /api/quotations/:id/pdf            // Generate PDF
POST   /api/quotations/:id/send-email     // Send email
POST   /api/quotations/:id/upload-evidence // Upload evidence
```

### Invoice APIs

```javascript
// Invoice Management
GET    /api/invoices                      // List with filters
POST   /api/invoices                      // Create new
GET    /api/invoices/:id                  // Get detail
PUT    /api/invoices/:id                  // Update
DELETE /api/invoices/:id                 // Delete

// Payment Management
POST   /api/invoices/:id/record-payment   // Record payment
GET    /api/invoices/:id/payment-history  // Payment history
POST   /api/invoices/:id/send-reminder    // Send reminder

// Invoice Conversions
POST   /api/invoices/:id/convert-to-receipt

// Status Management
PUT    /api/invoices/:id/status           // Update status
```

### Receipt APIs

```javascript
// Receipt Management
GET    /api/receipts                      // List with filters
POST   /api/receipts                      // Create new
GET    /api/receipts/:id                  // Get detail
PUT    /api/receipts/:id                  // Update

// Receipt Actions
POST   /api/receipts/:id/approve          // Approve
POST   /api/receipts/:id/generate-tax-number // Generate tax number

// Receipt Conversions
POST   /api/receipts/:id/convert-to-delivery-note

// File Operations
GET    /api/receipts/:id/pdf              // Generate PDF
```

### Delivery Note APIs

```javascript
// Delivery Note Management
GET    /api/delivery-notes                // List with filters
POST   /api/delivery-notes                // Create new
GET    /api/delivery-notes/:id            // Get detail
PUT    /api/delivery-notes/:id            // Update

// Delivery Tracking
PUT    /api/delivery-notes/:id/status     // Update status
PUT    /api/delivery-notes/:id/tracking   // Update tracking
POST   /api/delivery-notes/:id/mark-delivered // Mark as delivered
GET    /api/delivery-notes/:id/timeline   // Get tracking timeline
```

### Exception Handling APIs

```javascript
// Document Rollback
POST   /api/documents/:type/:id/rollback

// Adjustment Notes
POST   /api/adjustments/debit-notes       // Create debit note
POST   /api/adjustments/credit-notes      // Create credit note
GET    /api/adjustments/:id               // Get adjustment detail

// Product Returns
POST   /api/returns                       // Create return
GET    /api/returns/:id                   // Get return detail
POST   /api/returns/:id/process           // Process return

// Partial Delivery
POST   /api/orders/:id/partial-delivery   // Record partial delivery
GET    /api/orders/:id/tracking           // Get order tracking
```

### Reporting APIs

```javascript
// Dashboard & Reports
GET    /api/reports/dashboard             // Main dashboard data
GET    /api/reports/sales                 // Sales reports
GET    /api/reports/payments              // Payment reports
GET    /api/reports/delivery              // Delivery reports
GET    /api/reports/profit-loss           // P&L reports
```

---

## 🔐 Permission System

### Role-Based Permission Matrix

```javascript
const PERMISSIONS = {
  quotations: {
    sales: {
      create: true,
      read: 'own',        // เฉพาะที่ตัวเองสร้าง
      update: 'own_draft', // เฉพาะร่างที่ตัวเองสร้าง
      delete: 'own_draft',
      submit: 'own',
      approve: false,
      reject: false,
      rollback: false,
      convert: false
    },
    account: {
      create: true,
      read: true,         // ทั้งหมด
      update: true,       // ทั้งหมด
      delete: true,
      submit: true,
      approve: true,
      reject: true,
      rollback: true,
      convert: true
    }
  },
  
  invoices: {
    sales: {
      create: false,      // สร้างได้เฉพาะผ่าน conversion
      read: 'related',    // ที่เกี่ยวข้องกับใบเสนอราคาตัวเอง
      update: false,
      recordPayment: false,
      approve: false,
      convert: false
    },
    account: {
      create: true,
      read: true,
      update: true,
      recordPayment: true,
      approve: true,
      convert: true,
      rollback: true
    }
  },
  
  receipts: {
    sales: {
      create: false,
      read: 'related',
      update: false,
      approve: false
    },
    account: {
      create: true,
      read: true,
      update: true,
      approve: true,
      generateTaxNumber: true,
      convert: true
    }
  },
  
  deliveryNotes: {
    sales: {
      create: false,
      read: 'related',
      update: 'status_only', // อัปเดตสถานะได้บางอย่าง
      markDelivered: 'related'
    },
    account: {
      create: true,
      read: true,
      update: true,
      markDelivered: true,
      rollback: true
    }
  }
};
```

### Permission Check Function

```javascript
const hasPermission = (userRole, resource, action, document = null) => {
  const permission = PERMISSIONS[resource]?.[userRole]?.[action];
  
  if (permission === true) return true;
  if (permission === false) return false;
  
  // Special permission cases
  if (permission === 'own' && document) {
    return document.created_by === getCurrentUser().id;
  }
  
  if (permission === 'own_draft' && document) {
    return document.created_by === getCurrentUser().id && 
           document.status === 'draft';
  }
  
  if (permission === 'related' && document) {
    return isRelatedToUser(document, getCurrentUser().id);
  }
  
  return false;
};
```

---

## ⚡ Performance Optimization

### Database Optimization

```javascript
const DB_OPTIMIZATION = {
  // Connection Pooling
  connectionPool: {
    min: 5,
    max: 20,
    idle: 10000
  },
  
  // Query Optimization
  useSelectFields: true, // ไม่ใช้ SELECT *
  usePagination: true,   // แบ่งหน้าเสมอ
  cacheQueries: true,    // Cache queries ที่ใช้บ่อย
  
  // Index Strategy
  indexStrategy: [
    'status columns for filtering',
    'foreign keys for joins',
    'date columns for sorting',
    'composite indexes for complex queries'
  ]
};
```

### API Optimization

```javascript
const API_OPTIMIZATION = {
  // Response Compression
  compression: true,
  
  // Rate Limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // requests per window
  },
  
  // Caching Strategy
  caching: {
    staticData: '1h',      // Customer, Product lists
    documentList: '5m',    // Document listings
    reports: '15m'         // Report data
  },
  
  // Response Optimization
  responseOptimization: {
    useETags: true,
    cacheHeaders: true,
    compressResponse: true,
    selectFields: true
  }
};
```

### Frontend Optimization

```javascript
const FRONTEND_OPTIMIZATION = {
  // Code Splitting
  lazyLoading: [
    'DocumentForm',
    'ReportDashboard', 
    'AdvancedSearch',
    'BulkOperations'
  ],
  
  // State Management
  stateOptimization: {
    persistOnlyRequired: true,
    useShallowEqual: true,
    debounceUserInputs: 300, // ms
    virtualizeListsOver: 100 // items
  },
  
  // Asset Optimization
  assetOptimization: {
    imageCompression: true,
    bundleSplitting: true,
    treeShaking: true,
    minification: true
  }
};
```

---

## 🔒 Security Implementation

```javascript
const SECURITY_MEASURES = {
  // Authentication
  authentication: {
    jwtExpiry: '24h',
    refreshTokenExpiry: '7d',
    bcryptRounds: 12,
    sessionTimeout: '4h',
    multiFactorAuth: false // Future enhancement
  },
  
  // Authorization
  authorization: {
    roleBasedAccess: true,
    resourceLevelPermissions: true,
    documentOwnershipCheck: true,
    auditTrail: true
  },
  
  // Data Protection
  dataProtection: {
    encryptSensitiveData: true,
    auditTrail: true,
    dataRetention: '7 years',
    personalDataProtection: true,
    backupEncryption: true
  },
  
  // API Security
  apiSecurity: {
    inputValidation: true,
    sqlInjectionPrevention: true,
    xssProtection: true,
    csrfProtection: true,
    rateLimiting: true,
    requestSizeLimit: '10MB'
  }
};
```

---

## 📊 Monitoring & Logging

```javascript
const MONITORING_STRATEGY = {
  // Application Monitoring
  applicationMetrics: [
    'response_time',
    'error_rate', 
    'throughput',
    'active_users',
    'document_processing_time'
  ],
  
  // Business Metrics
  businessMetrics: [
    'quotations_created_per_day',
    'approval_rate',
    'payment_processing_time',
    'delivery_success_rate'
  ],
  
  // Error Tracking
  errorTracking: {
    captureClientErrors: true,
    captureServerErrors: true,
    notifyOnCriticalErrors: true,
    errorAggregation: true
  },
  
  // Audit Logging
  auditLogging: {
    documentChanges: true,
    userActions: true,
    permissionChecks: true,
    dataAccess: true
  }
};
```

---

---

## � API Response Examples

### Auto-fill จาก Pricing Request Response

```json
{
  "success": true,
  "data": {
    "pr_id": "550e8400-e29b-41d4-a716-446655440000",
    "pr_work_name": "เสื้อโปโล บริษัท ABC",
    "pr_pattern": "Plain",
    "pr_fabric_type": "Cotton 100%",
    "pr_color": "Navy Blue",
    "pr_sizes": "S, M, L, XL",
    "pr_quantity": "100",
    "pr_due_date": "2025-09-01",
    "pr_silk": "Logo หน้า-หลัง",
    "pr_dft": "",
    "pr_embroider": "ปักชื่อบริษัท",
    "pr_sub": "",
    "pr_other_screen": "",
    "pr_image": "/uploads/pr_images/abc_polo.jpg",
    
    // ข้อมูลลูกค้าที่ Join มา
    "pr_cus_id": "660e8400-e29b-41d4-a716-446655440001",
    "cus_company": "บริษัท ABC จำกัด",
    "cus_tax_id": "0123456789012",
    "cus_address": "123 ถนนสุขุมวิท แขวงคลองตัน เขตคลองตัน",
    "cus_zip_code": "10110",
    "cus_tel_1": "02-123-4567",
    "cus_email": "contact@abc.co.th",
    "cus_firstname": "สมชาย",
    "cus_lastname": "ใจดี",
    
    // Notes ที่รวมจาก pricing_request_notes
    "initial_notes": "[Sale] ลูกค้าต้องการเสื้อคุณภาพดี\n[Price] ราคาต้องแข่งขันได้\n[Manager] อนุมัติราคาพิเศษได้",
    "notes": [
      {
        "prn_id": "770e8400-e29b-41d4-a716-446655440002",
        "prn_text": "ลูกค้าต้องการเสื้อคุณภาพดี",
        "prn_note_type": 1,
        "note_type_label": "Sale",
        "prn_created_by": "user123",
        "prn_created_date": "2025-08-01T10:00:00Z"
      },
      {
        "prn_id": "880e8400-e29b-41d4-a716-446655440003", 
        "prn_text": "ราคาต้องแข่งขันได้",
        "prn_note_type": 2,
        "note_type_label": "Price",
        "prn_created_by": "user456",
        "prn_created_date": "2025-08-01T14:30:00Z"
      }
    ]
  }
}
```

### Auto-fill จากลูกค้า Response

```json
{
  "success": true,
  "data": {
    "cus_id": "660e8400-e29b-41d4-a716-446655440001",
    "cus_company": "บริษัท ABC จำกัด",
    "cus_tax_id": "0123456789012",
    "cus_address": "123 ถนนสุขุมวิท แขวงคลองตัน เขตคลองตัน",
    "cus_zip_code": "10110",
    "cus_tel_1": "02-123-4567",
    "cus_tel_2": "02-123-4568",
    "cus_email": "contact@abc.co.th",
    "cus_firstname": "สมชาย",
    "cus_lastname": "ใจดี",
    "cus_depart": "ฝ่ายจัดซื้อ",
    
    // ประวัติการขอราคาล่าสุด
    "recent_pricing_requests": [
      {
        "pr_id": "550e8400-e29b-41d4-a716-446655440000",
        "pr_work_name": "เสื้อโปโล บริษัท ABC",
        "pr_created_date": "2025-08-01T10:00:00Z"
      }
    ]
  }
}
```

---

## �🚀 AI Commands for Implementation (Updated)

```bash
# Database Setup with Auto-fill Integration
"สร้าง Database Schema ตาม specification พร้อม Foreign Keys สำหรับ autofill จาก master_customers, pricing_requests, และ pricing_request_notes"

# API Development with Auto-fill Endpoints
"สร้าง RESTful API endpoints พร้อม autofill functionality จาก pricing_requests และ master_customers"

# Auto-fill Business Logic Implementation  
"สร้าง Business Logic สำหรับ autofill ข้อมูลจาก pricing_requests (รวม notes) และ master_customers"

# Frontend Auto-fill Components
"สร้าง React Components สำหรับ Pricing Request Selector และ Customer Auto-complete พร้อม autofill form fields"

# Database Relationships & Joins
"ตั้งค่า Database Relationships: pricing_request_notes.prn_pr_id -> pricing_requests.pr_id -> master_customers.cus_id"

# Performance Optimization for Auto-fill
"ปรับแต่ง Indexes และ Query Performance สำหรับ autofill operations"

# Auto-fill Validation & Error Handling
"สร้าง Validation และ Error Handling สำหรับ autofill data integrity"

# Complete Integration Testing
"ทดสอบ Integration ระหว่าง Pricing System, Customer Data, และ Accounting Documents"
```

---

## 📋 Implementation Checklist

### Backend Implementation
- [ ] อัพเดต Database Schema ตาม specification ใหม่
- [ ] สร้าง API endpoints สำหรับ autofill
- [ ] สร้าง Business Logic สำหรับดึงข้อมูล join tables
- [ ] เพิ่ม Indexes สำหรับ performance
- [ ] สร้าง DTOs และ Validation
- [ ] ทดสอบ API endpoints

### Frontend Implementation  
- [ ] สร้าง PricingRequestSelector component
- [ ] สร้าง CustomerSelector component
- [ ] สร้าง useAutoFill custom hook
- [ ] อัพเดต QuotationForm ให้รองรับ autofill
- [ ] สร้าง Invoice/Receipt/DeliveryNote forms พร้อม cascade autofill
- [ ] เพิ่ม Loading states และ Error handling
- [ ] ทดสอบ User Experience

### Integration & Testing
- [ ] ทดสอบ autofill จาก pricing_requests
- [ ] ทดสอบ autofill จาก master_customers  
- [ ] ทดสอบ cascade autofill ระหว่าง documents
- [ ] ทดสอบ performance กับข้อมูลจำนวนมาก
- [ ] ทดสอบ edge cases และ error scenarios
