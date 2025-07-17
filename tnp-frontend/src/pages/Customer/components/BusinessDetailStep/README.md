# BusinessDetailStep Components Structure

## 📁 โครงสร้างใหม่หลังแยก Component

```
📁 BusinessDetailStep/
├── BusinessDetailStepSimple.jsx            # Main shell และรวม logic
├── HeaderSection.jsx                       # Header สีแดง + Progress indicator
├── ContactInfoSection.jsx                  # Accordion ข้อมูลติดต่อ
├── GpsAutoFillSection.jsx                  # Accordion และ logic GPS
├── AddressFormSection.jsx                  # Accordion กรอกที่อยู่
├── useGpsHelper.js                         # Custom Hook: GPS, reverse geocode, localStorage
├── GpsDebugLogs.jsx                        # แสดง Debug Logs
├── AccuracyChip.jsx                        # แสดง Chip ความแม่นยำ
└── index.js                                # Export all components
```

## ✅ ข้อดีของการแยก Component

### 🔧 ง่ายต่อการดูแล / แก้ไขเฉพาะส่วน
- แต่ละ component มีความรับผิดชอบที่ชัดเจน
- แก้ไข GPS ก็แก้แค่ `GpsAutoFillSection.jsx` และ `useGpsHelper.js`
- แก้ไข Address Form ก็แก้แค่ `AddressFormSection.jsx`

### 🔍 ลดขนาด BusinessDetailStepSimple.jsx
- จากเดิม ~1,338 บรรทัด
- เหลือเพียง ~125 บรรทัด (ลดลง 90%)

### 🧪 รองรับการเขียน Unit Test / Integration Test
- แต่ละ component สามารถเขียน test แยกได้
- Custom Hook `useGpsHelper` สามารถ test logic GPS ได้อิสระ

### ♻️ ใช้ซ้ำในหน้าดูรายละเอียด (View Mode)
- Components สามารถนำไปใช้ใน View Mode ได้ง่าย
- Props-based configuration สำหรับ mode ต่างๆ

## 📋 Component Details

### 1. HeaderSection.jsx
**หน้าที่:** แสดง Header สีแดงพร้อม Progress indicator
**Props:**
- `mode`: create/edit/view
- `PRIMARY_RED`, `SECONDARY_RED`: สี theme

### 2. ContactInfoSection.jsx  
**หน้าที่:** Accordion ข้อมูลติดต่อ (เบอร์โทร, อีเมล)
**Props:**
- `inputList`, `errors`, `handleInputChange`
- `mode`, `PRIMARY_RED`, `BACKGROUND_COLOR`

### 3. GpsAutoFillSection.jsx
**หน้าที่:** Accordion GPS Auto-fill พร้อม UI controls
**Props:**
- `mode`, `PRIMARY_RED`, `BACKGROUND_COLOR`
- GPS Hook values: `isGettingLocation`, `locationStatus`, `gpsResult`, etc.
- GPS Actions: `setWatchLonger`, `handleGetCurrentLocation`

### 4. AddressFormSection.jsx
**หน้าที่:** Accordion ฟอร์มกรอกที่อยู่
**Props:**
- `inputList`, `errors`, `handleInputChange`
- `mode`, `PRIMARY_RED`, `BACKGROUND_COLOR`

### 5. useGpsHelper.js (Custom Hook)
**หน้าที่:** จัดการ GPS logic ทั้งหมด
**Returns:**
```javascript
{
  // States
  isGettingLocation,
  locationStatus,
  gpsResult,
  hasFilledFromGps,
  watchLonger,
  gpsDebugLogs,
  
  // Actions
  setWatchLonger,
  handleGetCurrentLocation,
}
```

### 6. AccuracyChip.jsx
**หน้าที่:** แสดง Chip ความแม่นยำ GPS แบบ color-coded
**Props:**
- `accuracy`: ค่าความแม่นยำ (เมตร)

### 7. GpsDebugLogs.jsx
**หน้าที่:** แสดง Debug Logs สำหรับ GPS testing
**Props:**
- `gpsDebugLogs`: array ของ debug logs

## 🔄 การใช้งาน

### Import Components
```javascript
import HeaderSection from "./BusinessDetailStep/HeaderSection";
import ContactInfoSection from "./BusinessDetailStep/ContactInfoSection";
import GpsAutoFillSection from "./BusinessDetailStep/GpsAutoFillSection";
import AddressFormSection from "./BusinessDetailStep/AddressFormSection";
import { useGpsHelper } from "./BusinessDetailStep/useGpsHelper";

// หรือ import จาก index.js
import {
  HeaderSection,
  ContactInfoSection,
  GpsAutoFillSection,
  AddressFormSection,
  useGpsHelper
} from "./BusinessDetailStep";
```

### ใช้งานใน Main Component
```javascript
const BusinessDetailStepSimple = ({ inputList, errors, handleInputChange, mode }) => {
  const gpsHelperProps = useGpsHelper(inputList);

  return (
    <Box>
      <HeaderSection mode={mode} PRIMARY_RED={PRIMARY_RED} SECONDARY_RED={SECONDARY_RED} />
      
      <Container maxWidth="md">
        <ContactInfoSection {...formProps} />
        <GpsAutoFillSection {...formProps} {...gpsHelperProps} />
        <AddressFormSection {...formProps} />
      </Container>
    </Box>
  );
};
```

## 🚀 การพัฒนาต่อ

### เพิ่ม Component ใหม่
1. สร้างไฟล์ใน `BusinessDetailStep/`
2. เพิ่ม export ใน `index.js`
3. Import และใช้งานใน main component

### การ Test
```javascript
// Test แยกตาม component
test('HeaderSection renders correctly', () => { ... });
test('GPS Helper Hook works', () => { ... });
test('Address Form validates input', () => { ... });
```

### Performance Optimization
- ใช้ `React.memo()` สำหรับ components ที่ไม่ค่อยเปลี่ยน
- ใช้ `useMemo()` และ `useCallback()` ใน custom hooks
- Lazy load components ที่ไม่จำเป็นต้องโหลดทันที
