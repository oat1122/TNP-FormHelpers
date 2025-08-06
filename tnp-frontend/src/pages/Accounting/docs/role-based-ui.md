# Role-Based UI Components & Permissions

## 🎯 วัตถุประสงค์
สร้าง UI Components ที่แสดงเนื้อหาและฟังก์ชันต่างกันตาม Role (Sales และ Account) พร้อมระบบ Permission Checking แบบ Real-time

---

## 👥 Role Definitions

### 🔵 Sales Role
```javascript
const SALES_PERMISSIONS = {
  quotations: {
    create: true,           // สร้างใบเสนอราคาจาก Pricing
    editOwn: true,         // แก้ไขที่ตัวเองสร้าง (draft only)
    submitForReview: true, // ส่งตรวจสอบ
    sendToCustomer: true,  // ส่งให้ลูกค้า
    uploadEvidence: true,  // อัปโหลดหลักฐาน
    viewOwn: true         // ดูที่ตัวเองสร้าง
  },
  invoices: {
    viewRelated: true     // ดูที่เกี่ยวข้องกับงานตัวเอง
  },
  receipts: {
    viewRelated: true     // ดูที่เกี่ยวข้องกับงานตัวเอง
  },
  deliveryNotes: {
    viewRelated: true,    // ดูที่เกี่ยวข้องกับงานตัวเอง
    updateStatus: true,   // อัปเดตสถานะบางอย่าง
    markDelivered: true   // ยืนยันการส่งสำเร็จ
  },
  reports: {
    viewOwn: true         // ดูรายงานงานตัวเอง
  }
};
```

### 🟢 Account Role
```javascript
const ACCOUNT_PERMISSIONS = {
  quotations: {
    create: true,
    editAll: true,        // แก้ไขได้ทุกอัน
    approve: true,        // อนุมัติ
    reject: true,         // ปฏิเสธ
    rollback: true,       // ย้อนกลับสถานะ
    convertToInvoice: true,
    viewAll: true
  },
  invoices: {
    create: true,
    editAll: true,
    approve: true,
    recordPayment: true,  // บันทึกการชำระ
    sendReminder: true,   // ส่งการแจ้งเตือน
    convertToReceipt: true,
    viewAll: true
  },
  receipts: {
    create: true,
    editAll: true,
    approve: true,
    generateTaxNumber: true,
    convertToDeliveryNote: true,
    viewAll: true
  },
  deliveryNotes: {
    create: true,
    editAll: true,
    updateAllStatus: true,
    markDelivered: true,
    rollback: true,
    viewAll: true
  },
  adjustments: {
    createDebitNote: true,
    createCreditNote: true,
    processReturns: true
  },
  reports: {
    viewAll: true,        // ดูรายงานทั้งหมด
    exportReports: true   // Export รายงาน
  }
};
```

---

## 🎨 Role-Based UI Components

### Dashboard Component

```jsx
// RoleDashboard.jsx
import { useAuthContext } from '@/contexts/AuthContext';
import SalesDashboard from './SalesDashboard';
import AccountDashboard from './AccountDashboard';

const RoleDashboard = () => {
  const { user } = useAuthContext();
  
  return (
    <div className="role-dashboard">
      {user.role === 'sales' && <SalesDashboard />}
      {user.role === 'account' && <AccountDashboard />}
    </div>
  );
};

// SalesDashboard.jsx
const SalesDashboard = () => {
  return (
    <div className="sales-dashboard">
      <div className="dashboard-header">
        <h1>🔵 Sales Dashboard</h1>
        <p>จัดการงานขายและใบเสนอราคา</p>
      </div>
      
      <div className="dashboard-stats">
        <StatCard 
          title="งานใหม่จาก Pricing" 
          count={5} 
          color="blue"
          action="ดูงานใหม่"
          href="/quotations/new-from-pricing"
        />
        
        <StatCard 
          title="ใบเสนอราคาของฉัน" 
          count={12} 
          color="green"
          action="จัดการ"
          href="/quotations/my-quotations"
        />
        
        <StatCard 
          title="รอส่งลูกค้า" 
          count={3} 
          color="orange"
          action="ส่งเลย"
          href="/quotations?status=approved"
        />
        
        <StatCard 
          title="สำเร็จแล้ววันนี้" 
          count={2} 
          color="purple"
          action="ดูรายงาน"
          href="/reports/my-completed"
        />
      </div>
      
      <div className="recent-activities">
        <h3>กิจกรรมล่าสุด</h3>
        <RecentActivitiesList userRole="sales" />
      </div>
    </div>
  );
};

// AccountDashboard.jsx
const AccountDashboard = () => {
  return (
    <div className="account-dashboard">
      <div className="dashboard-header">
        <h1>🟢 Account Dashboard</h1>
        <p>จัดการการเงินและอนุมัติเอกสาร</p>
      </div>
      
      <div className="dashboard-stats">
        <StatCard 
          title="รอตรวจสอบ" 
          count={8} 
          color="red"
          action="ตรวจสอบ"
          href="/quotations?status=pending_review"
          urgent
        />
        
        <StatCard 
          title="ใบแจ้งหนี้เกินกำหนด" 
          count={4} 
          color="red"
          action="ติดตาม"
          href="/invoices?status=overdue"
          urgent
        />
        
        <StatCard 
          title="รอบันทึกการชำระ" 
          count={6} 
          color="orange"
          action="บันทึก"
          href="/invoices?status=sent"
        />
        
        <StatCard 
          title="ยอดขายวันนี้" 
          count="฿125,000"
          color="green"
          action="ดูรายงาน"
          href="/reports/daily-sales"
        />
      </div>
      
      <div className="approval-queue">
        <h3>คิวการอนุมัติ</h3>
        <ApprovalQueueList />
      </div>
      
      <div className="financial-summary">
        <h3>สรุปการเงิน</h3>
        <FinancialSummaryWidget />
      </div>
    </div>
  );
};
```

### Document List with Role-Based Actions

```jsx
// DocumentList.jsx
import { usePermissions } from '@/hooks/usePermissions';

const DocumentList = ({ documents, type }) => {
  const { hasPermission, getAvailableActions } = usePermissions();
  
  return (
    <div className="document-list">
      {documents.map(doc => (
        <DocumentCard 
          key={doc.id}
          document={doc}
          actions={getAvailableActions(type, doc.status)}
        />
      ))}
    </div>
  );
};

// DocumentCard.jsx
const DocumentCard = ({ document, actions }) => {
  return (
    <div className="document-card">
      <div className="document-info">
        <h4>{document.number}</h4>
        <p>{document.customer_name}</p>
        <StatusBadge status={document.status} />
        <span className="amount">฿{document.total_amount.toLocaleString()}</span>
      </div>
      
      <div className="document-actions">
        {actions.includes('edit') && (
          <ActionButton 
            icon="edit" 
            label="แก้ไข"
            onClick={() => handleEdit(document.id)}
          />
        )}
        
        {actions.includes('approve') && (
          <ActionButton 
            icon="check" 
            label="อนุมัติ"
            onClick={() => handleApprove(document.id)}
            variant="success"
          />
        )}
        
        {actions.includes('reject') && (
          <ActionButton 
            icon="x" 
            label="ปฏิเสธ"
            onClick={() => handleReject(document.id)}
            variant="danger"
          />
        )}
        
        {actions.includes('send_email') && (
          <ActionButton 
            icon="mail" 
            label="ส่งอีเมล"
            onClick={() => handleSendEmail(document.id)}
          />
        )}
        
        {actions.includes('download_pdf') && (
          <ActionButton 
            icon="download" 
            label="ดาวน์โหลด"
            onClick={() => handleDownloadPDF(document.id)}
          />
        )}
      </div>
    </div>
  );
};
```

### Navigation Menu with Role-Based Items

```jsx
// NavigationMenu.jsx
import { useAuthContext } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';

const NavigationMenu = () => {
  const { user } = useAuthContext();
  const { hasPermission } = usePermissions();
  
  const menuItems = [
    {
      label: 'Dashboard',
      icon: 'home',
      href: '/dashboard',
      roles: ['sales', 'account']
    },
    {
      label: 'งานใหม่จาก Pricing',
      icon: 'plus-circle',
      href: '/quotations/new-from-pricing',
      roles: ['sales', 'account']
    },
    {
      label: 'ใบเสนอราคา',
      icon: 'file-text',
      href: '/quotations',
      roles: ['sales', 'account'],
      badge: user.role === 'account' ? 'pending_count' : 'my_count'
    },
    {
      label: 'ใบแจ้งหนี้',
      icon: 'credit-card',
      href: '/invoices',
      roles: ['account'],
      salesView: 'view-only'
    },
    {
      label: 'ใบเสร็จ/ใบกำกับภาษี',
      icon: 'receipt',
      href: '/receipts',
      roles: ['account'],
      salesView: 'view-only'
    },
    {
      label: 'ใบส่งของ',
      icon: 'truck',
      href: '/delivery-notes',
      roles: ['account'],
      salesView: 'limited'
    },
    {
      label: 'รายงาน',
      icon: 'bar-chart',
      href: '/reports',
      roles: ['sales', 'account'],
      subItems: [
        {
          label: 'รายงานขาย',
          href: '/reports/sales',
          roles: ['account']
        },
        {
          label: 'รายงานการเงิน',
          href: '/reports/financial',
          roles: ['account']
        },
        {
          label: 'งานของฉัน',
          href: '/reports/my-work',
          roles: ['sales']
        }
      ]
    },
    {
      label: 'การตั้งค่า',
      icon: 'settings',
      href: '/settings',
      roles: ['account']
    }
  ];
  
  const filteredMenuItems = menuItems.filter(item => 
    item.roles.includes(user.role) || 
    (item.salesView && user.role === 'sales')
  );
  
  return (
    <nav className="navigation-menu">
      {filteredMenuItems.map(item => (
        <NavItem 
          key={item.href}
          item={item}
          userRole={user.role}
        />
      ))}
    </nav>
  );
};
```

### Form Components with Role Restrictions

```jsx
// QuotationForm.jsx
const QuotationForm = ({ quotation, mode }) => {
  const { user } = useAuthContext();
  const { canEdit, canApprove } = usePermissions();
  
  const isEditable = canEdit('quotation', quotation);
  const showApprovalSection = canApprove('quotation', quotation);
  
  return (
    <form className="quotation-form">
      {/* Basic Information - Always visible */}
      <FormSection title="ข้อมูลพื้นฐาน">
        <InputField 
          label="ลูกค้า"
          value={quotation.customer_name}
          disabled
        />
        <InputField 
          label="ยอดรวม"
          value={quotation.total_amount}
          disabled
        />
      </FormSection>
      
      {/* Items Section - Editable based on role */}
      <FormSection title="รายการสินค้า">
        <ItemsList 
          items={quotation.items}
          editable={isEditable}
        />
        {isEditable && (
          <AddItemButton onClick={handleAddItem} />
        )}
      </FormSection>
      
      {/* Payment Terms - Sales can edit when draft */}
      {(isEditable || user.role === 'account') && (
        <FormSection title="เงื่อนไขการชำระ">
          <SelectField 
            label="ระยะเวลาชำระ"
            value={quotation.payment_terms}
            options={PAYMENT_TERMS_OPTIONS}
            disabled={!isEditable}
          />
          <InputField 
            label="เงินมัดจำ (%)"
            value={quotation.deposit_percentage}
            disabled={!isEditable}
          />
        </FormSection>
      )}
      
      {/* Approval Section - Account only */}
      {showApprovalSection && (
        <FormSection title="การอนุมัติ">
          <TextareaField 
            label="หมายเหตุการตรวจสอบ"
            placeholder="บันทึกข้อสังเกตหรือคำแนะนำ..."
          />
          <div className="approval-actions">
            <Button 
              variant="success"
              onClick={handleApprove}
            >
              ✅ อนุมัติ
            </Button>
            <Button 
              variant="danger"
              onClick={handleReject}
            >
              ❌ ปฏิเสธ
            </Button>
            <Button 
              variant="warning"
              onClick={handleSendBackForEdit}
            >
              ✏️ ส่งกลับแก้ไข
            </Button>
          </div>
        </FormSection>
      )}
      
      {/* Sales Actions */}
      {user.role === 'sales' && isEditable && (
        <div className="form-actions">
          <Button onClick={handleSave}>
            บันทึกร่าง
          </Button>
          <Button 
            variant="primary"
            onClick={handleSubmitForReview}
          >
            ส่งตรวจสอบ
          </Button>
        </div>
      )}
    </form>
  );
};
```

---

## 🔧 Permission Hooks

### usePermissions Hook

```javascript
// hooks/usePermissions.js
import { useAuthContext } from '@/contexts/AuthContext';
import { PERMISSIONS } from '@/constants/permissions';

export const usePermissions = () => {
  const { user } = useAuthContext();
  
  const hasPermission = (resource, action, document = null) => {
    const permission = PERMISSIONS[resource]?.[user.role]?.[action];
    
    if (permission === true) return true;
    if (permission === false) return false;
    
    // Handle special cases
    if (permission === 'own' && document) {
      return document.created_by === user.id;
    }
    
    if (permission === 'own_draft' && document) {
      return document.created_by === user.id && document.status === 'draft';
    }
    
    if (permission === 'related' && document) {
      return isRelatedToUser(document, user.id);
    }
    
    return false;
  };
  
  const canEdit = (resource, document) => {
    if (user.role === 'account') return true;
    
    if (user.role === 'sales') {
      return document.created_by === user.id && document.status === 'draft';
    }
    
    return false;
  };
  
  const canApprove = (resource, document) => {
    return user.role === 'account' && 
           ['pending_review', 'draft'].includes(document.status);
  };
  
  const getAvailableActions = (documentType, status) => {
    const actionMap = {
      quotation: {
        draft: {
          sales: ['edit', 'delete', 'submit'],
          account: ['edit', 'delete', 'approve', 'reject']
        },
        pending_review: {
          sales: ['view'],
          account: ['approve', 'reject', 'send_back']
        },
        approved: {
          sales: ['view', 'download_pdf', 'send_email', 'mark_completed'],
          account: ['view', 'edit', 'convert_to_invoice']
        }
      },
      // ... other document types
    };
    
    return actionMap[documentType]?.[status]?.[user.role] || [];
  };
  
  return {
    hasPermission,
    canEdit,
    canApprove,
    getAvailableActions,
    userRole: user.role
  };
};
```

### useRoleBasedData Hook

```javascript
// hooks/useRoleBasedData.js
import { useQuery } from '@tanstack/react-query';
import { useAuthContext } from '@/contexts/AuthContext';

export const useRoleBasedData = (resource, filters = {}) => {
  const { user } = useAuthContext();
  
  const queryKey = [resource, user.role, filters];
  
  const queryFn = async () => {
    const params = new URLSearchParams();
    
    // เพิ่ม role-based filters
    if (user.role === 'sales') {
      params.append('created_by', user.id); // Sales เห็นเฉพาะที่ตัวเองสร้าง
    }
    
    // เพิ่ม filters อื่นๆ
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    
    const response = await fetch(`/api/${resource}?${params}`);
    return response.json();
  };
  
  return useQuery({
    queryKey,
    queryFn,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook สำหรับดึงข้อมูล Pricing Request (Auto-fill)
export const usePricingRequestData = (pr_id) => {
  return useQuery({
    queryKey: ['pricing-request-autofill', pr_id],
    queryFn: async () => {
      const response = await fetch(`/api/quotations/autofill/pricing-request/${pr_id}`);
      return response.json();
    },
    enabled: !!pr_id
  });
};

// Hook สำหรับ Cascade Auto-fill
export const useCascadeAutofill = (sourceType, sourceId, targetType) => {
  return useQuery({
    queryKey: ['cascade-autofill', sourceType, sourceId, targetType],
    queryFn: async () => {
      const response = await fetch(`/api/${targetType}/autofill/${sourceType}/${sourceId}`);
      return response.json();
    },
    enabled: !!(sourceId && targetType)
  });
};
  
  const queryFn = async () => {
    const params = new URLSearchParams();
    
    // Add role-based filters
    if (user.role === 'sales') {
      params.append('created_by', user.id);
    }
    
    // Add custom filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    
    const response = await fetch(`/api/${resource}?${params}`);
    return response.json();
  };
  
  return useQuery({
    queryKey,
    queryFn,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
```

---

## 🎨 UI State Management

### Role-Based Store

```javascript
// stores/roleStore.js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useRoleStore = create(
  persist(
    (set, get) => ({
      // UI Preferences
      preferences: {
        sales: {
          defaultView: 'my-documents',
          showOnlyMyDocuments: true,
          autoRefresh: true
        },
        account: {
          defaultView: 'pending-approval',
          showAllDocuments: true,
          showApprovalQueue: true
        }
      },
      
      // Dashboard Configuration
      dashboardConfig: {
        sales: {
          widgets: ['new-jobs', 'my-quotations', 'pending-send', 'completed'],
          layout: 'compact'
        },
        account: {
          widgets: ['pending-approval', 'overdue-invoices', 'payment-queue', 'daily-sales'],
          layout: 'detailed'
        }
      },
      
      // Actions
      updatePreferences: (role, newPreferences) => {
        set((state) => ({
          preferences: {
            ...state.preferences,
            [role]: { ...state.preferences[role], ...newPreferences }
          }
        }));
      },
      
      getDashboardConfig: (role) => {
        return get().dashboardConfig[role];
      }
    }),
    {
      name: 'role-preferences'
    }
  )
);

export default useRoleStore;
```

---

## 🚀 AI Commands for Role-Based UI

```bash
# Component Generation พร้อม Auto-fill
"สร้าง Role-based UI Components ที่แสดงเนื้อหาต่างกันตาม Sales และ Account 
พร้อม Auto-fill จาก Pricing Request ตาม technical-implementation.md"

# Permission System with Auto-fill
"สร้างระบบ Permission Checking แบบ Real-time สำหรับ UI Components 
พร้อมรองรับ Cascade Auto-fill ระหว่างเอกสาร"

# Dashboard Creation with Data Flow
"สร้าง Dashboard แยกตาม Role พร้อม widgets และ metrics ที่เหมาะสม
รองรับการแสดงข้อมูลจาก Pricing Request ถึง Delivery Note"

# Navigation Menu with Context
"สร้าง Navigation Menu ที่แสดงเมนูต่างกันตาม Role และ Permissions
พร้อมแสดงสถานะงานตั้งแต่ Pricing Request ถึงปิดงาน"

# Form Components with Auto-fill
"สร้าง Form Components ที่ปรับ fields และ actions ตาม Role permissions
พร้อม Auto-fill ข้อมูลตาม CustomerAutofillDTO และ PricingRequestAutofillDTO"

# Data Hooks with Cascade Support
"สร้าง Custom Hooks สำหรับดึงข้อมูลตาม Role และ filter อัตโนมัติ
พร้อมรองรับ Cascade Auto-fill workflow ตาม technical-implementation.md"
```
