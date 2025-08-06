# 🔧 Multiple Jobs Troubleshooting Guide

## 🚨 ปัญหา: เลือก 2 งาน แต่แสดงแค่ 1 งาน

### 🔍 วิธีการ Debug

#### 1. เปิด Browser Console
```javascript
// กด F12 -> Console tab
// ดูข้อความ Debug ที่ขึ้นต้นด้วย:
// 🔍 Debug CreateQuotationForm - selectedPricingRequests:
// 📊 จำนวน selectedPricingRequests:
// 👤 Customer data:
// 📝 Processing PR 1:
// 📝 Processing PR 2:
// ✅ Processed items:
```

#### 2. ตรวจสอบข้อมูลที่เข้าสู่ Component
```javascript
// ใน CreateQuotationForm.jsx มี debug code:
console.log('🔍 Debug CreateQuotationForm - selectedPricingRequests:', selectedPricingRequests);
console.log('📊 จำนวน selectedPricingRequests:', selectedPricingRequests.length);
```

#### 3. ทดสอบด้วย Mock Data
```jsx
// ใช้ TestMultipleJobs component สำหรับทดสอบ
import { TestMultipleJobs } from './components';

<TestMultipleJobs />
```

### 🛠️ สาเหตุที่เป็นไปได้

#### 1. **Data Structure ไม่ตรงกัน**
```javascript
// Expected structure:
[
  {
    pr_id: 1,
    pr_work_name: 'ผ้ากันเปื้อน',
    pr_pattern: '-',
    pr_fabric_type: 'แคนวาน',
    pr_quantity: 100,
    customer: { ... }
  },
  {
    pr_id: 2,
    pr_work_name: 'เสื้อฮู้ด',
    pr_pattern: 'ธนพลัสแขนยาว',
    pr_fabric_type: 'สำลี',
    pr_quantity: 100,
    customer: { ... }
  }
]
```

#### 2. **selectedPricingRequests ถูกส่งไม่ครบ**
- ตรวจสอบใน parent component ที่เรียก CreateQuotationForm
- ดูว่า state management (Redux/Context) ทำงานถูกต้องมั้ย

#### 3. **Field names ไม่ตรงกัน**
```javascript
// Component รองรับ field names หลายแบบ:
id: pr.pr_id || pr.id || `temp_${index}`,
name: pr.pr_work_name || pr.work_name || 'ไม่ระบุชื่องาน',
pattern: pr.pr_pattern || pr.pattern || '',
fabricType: pr.pr_fabric_type || pr.fabric_type || pr.material || '',
```

### 💡 วิธีแก้ไข

#### 1. **แก้ที่ parent component**
```jsx
// ตรวจสอบว่า selectedPricingRequests ถูกส่งครบ
const handleCreateQuotation = () => {
  console.log('Selected items before passing:', selectedItems);
  
  // ส่ง array ที่ครบถ้วน
  setShowCreateForm(true);
  setSelectedPricingRequests(selectedItems); // ← ต้องมีทั้ง 2 งาน
};
```

#### 2. **แก้ใน CreateQuotationForm**
```jsx
// เพิ่ม validation
useEffect(() => {
  if (!selectedPricingRequests || selectedPricingRequests.length === 0) {
    console.error('❌ No pricing requests provided!');
    return;
  }
  
  // Rest of the code...
}, [selectedPricingRequests]);
```

#### 3. **แก้ใน state management**
```javascript
// ถ้าใช้ Redux
const selectedPricingRequests = useSelector(state => 
  state.pricing.selectedItems // ← ต้องเป็น array ที่มี 2 elements
);

// ถ้าใช้ local state
const [selectedItems, setSelectedItems] = useState([]);
```

### 📋 Checklist การตรวจสอบ

- [ ] selectedPricingRequests.length === จำนวนที่เลือก
- [ ] formData.items.length === selectedPricingRequests.length  
- [ ] ไม่มี error ใน Console
- [ ] ข้อมูล customer ครบถ้วน
- [ ] field names ตรงกับ API response

### 🧪 ทดสอบด้วย TestMultipleJobs

```jsx
// เพิ่มใน App.js หรือ page ที่ต้องการทดสอบ
import { TestMultipleJobs } from './path/to/components';

function App() {
  return (
    <div>
      <TestMultipleJobs />
    </div>
  );
}
```

### 📞 Contact Developer

**แต้ม - Fullstack Developer**  
เชี่ยวชาญ: React + Material-UI + Laravel  
เน้น: User Experience & Beautiful Design  

---

*หากยังแก้ไม่ได้ กรุณาส่ง Console log มาให้ดู* 🙏
