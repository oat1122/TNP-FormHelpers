# 🧠 UX Improvement: ปรับตำแหน่งฟิลด์และเพิ่มสถานะในฟอร์มเพิ่มข้อมูลลูกค้า

## 🎯 เป้าหมาย

1. **ปรับตำแหน่งของฟิลด์ "ตำแหน่ง"** ให้อยู่ในตำแหน่งที่เหมาะสม โดยย้ายจากแถวเดี่ยวด้านล่างไปเป็นส่วนหนึ่งของ Grid ระบบในแถวเดียวกันกับชื่อจริง นามสกุล และชื่อเล่น
2. **เพิ่มการแสดงสถานะ** หลังแท็บในแต่ละแท็บ เพื่อให้ผู้ใช้ทราบสถานะการกรอกข้อมูล:
   - <CheckCircle color="success" /> กรอกข้อมูลครบแล้ว
   - <Error color="error" /> ข้อมูลยังไม่ครบ
   - <InfoOutlined color="info" /> ไม่จำเป็นต้องกรอก แต่ถ้ากรอกจะมีประโยชน์
   - เมื่อกรอกข้อมูลที่จำเป็นครบแล้ว จะแสดงเครื่องหมายถูกหลังชื่อแท็บ
   - มีการแยกตรวจสอบสถานะระหว่างแท็บย่อยและแท็บหลัก

## 📋 ไฟล์ที่ต้องแก้ไข

- `src/pages/Customer/CustomerList.jsx`
- `src/pages/Customer/components/DialogForm.jsx`
- `src/pages/Customer/components/CustomerTabs.jsx` (หากมี)

---

## 📌 รายละเอียดการปรับปรุง

### 1. ปรับตำแหน่งฟิลด์ "ตำแหน่ง" 

ปรับโครงสร้าง Grid ของฟิลด์ชื่อจริง นามสกุล ชื่อเล่น และตำแหน่ง ให้อยู่ในแถวเดียวกันโดยเปลี่ยนจาก md={4} เป็น md={3} เพื่อให้มีพื้นที่สำหรับ 4 ฟิลด์ในแถวเดียวกัน:

```jsx
<Grid container spacing={2}>
  <Grid item md={3} xs={12}>
    <TextField 
      variant="outlined"
      size="small"
      fullWidth
      required
      label="ชื่อจริง"
      name="cus_firstname"
      placeholder="ชื่อจริง"
    />
  </Grid>
  <Grid item md={3} xs={12}>
    <TextField 
      variant="outlined"
      size="small"
      fullWidth
      required
      label="นามสกุล"
      name="cus_lastname"
      placeholder="นามสกุล"
    />
  </Grid>
  <Grid item md={3} xs={12}>
    <TextField 
      variant="outlined"
      size="small"
      fullWidth
      required
      label="ชื่อเล่น"
      name="cus_name"
      placeholder="ชื่อเล่น"
    />
  </Grid>
  <Grid item md={3} xs={12}>
    <TextField 
      variant="outlined"
      size="small"
      fullWidth
      label="ตำแหน่ง"
      name="cus_depart"
      placeholder="ตำแหน่ง"
    />
  </Grid>
</Grid>
```

### 2. เพิ่มการแสดงสถานะในแท็บ

เพิ่มตัวบ่งชี้สถานะหลังชื่อแท็บเพื่อแสดงความครบถ้วนของข้อมูล โดยใช้ไอคอนจาก MUI:

```jsx
import { CheckCircle, Error, InfoOutlined } from '@mui/icons-material';
import { Box, Tab, Tabs } from '@mui/material';

// ตัวอย่าง Component สำหรับ Tab ที่มีไอคอนแสดงสถานะ
<Tab 
  icon={<Person />}
  label={
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      ข้อมูลพื้นฐาน
      {tabStatus.basicInfo === 'complete' && <CheckCircle color="success" fontSize="small" />}
      {tabStatus.basicInfo === 'incomplete' && <Error color="error" fontSize="small" />}
      {tabStatus.basicInfo === 'optional' && <InfoOutlined color="info" fontSize="small" />}
    </Box>
  }
/>
```

### 3. ตรวจสอบความครบถ้วนของแต่ละแท็บ

เพิ่มระบบตรวจสอบความครบถ้วนของข้อมูลในแต่ละแท็บโดยใช้ state เก็บสถานะ:

```jsx
// สร้าง state สำหรับเก็บสถานะของแต่ละแท็บ
const [tabStatus, setTabStatus] = useState({
  basicInfo: 'incomplete',
  address: 'optional',
  companyInfo: 'optional',
  preferences: 'optional'
});

// ฟังก์ชันตรวจสอบความครบถ้วนของข้อมูลในแท็บ "ข้อมูลพื้นฐาน"
const validateBasicInfoTab = (formData) => {
  // ฟิลด์ที่จำเป็นในแท็บข้อมูลพื้นฐาน
  const requiredFields = ['cus_firstname', 'cus_lastname', 'cus_name', 'cus_tel_1'];
  return requiredFields.every(field => formData[field] && formData[field].trim() !== '');
};

// ฟังก์ชันตรวจสอบความครบถ้วนของข้อมูลในแท็บ "ที่อยู่"
const validateAddressTab = (formData) => {
  // ถ้าไม่มีข้อมูลที่อยู่เลย ถือว่าเป็น optional
  if (!formData.cus_address || formData.cus_address.trim() === '') {
    return true;
  }
  
  // ถ้ามีที่อยู่ ต้องมีจังหวัดด้วย
  return !!formData.cus_pro_id;
};

// ฟังก์ชันปรับปรุงสถานะแท็บเมื่อข้อมูลเปลี่ยนแปลง
const updateTabStatus = (formData) => {
  setTabStatus({
    basicInfo: validateBasicInfoTab(formData) ? 'complete' : 'incomplete',
    address: validateAddressTab(formData) ? 'complete' : 'incomplete',
    companyInfo: 'optional', // แท็บที่ไม่บังคับกรอก
    preferences: 'optional'  // แท็บที่ไม่บังคับกรอก
  });
};

// ใช้ useEffect เพื่ออัพเดทสถานะเมื่อข้อมูลในฟอร์มเปลี่ยนแปลง
useEffect(() => {
  updateTabStatus(formData);
}, [formData]);
```

### 4. มาตรฐานการใช้ TextField ในทุกฟิลด์

ทุกฟิลด์ควรใช้ MUI TextField โดยมีคุณสมบัติพื้นฐานดังนี้:

- `variant="outlined"`
- `size="small"`
- `fullWidth`
- `required` → สำหรับช่องที่บังคับกรอก
- `label` → ชื่อฟิลด์
- `type` → กำหนดตามประเภทข้อมูล เช่น "email", "tel", "number"
- ใช้ `InputAdornment` สำหรับไอคอนประกอบ

สำหรับ### 5. ฟิลด์ที่ต้องตรวจสอบความครบถ้วน:

1. แท็บข้อมูลพื้นฐาน:
   - ชื่อจริง (cus_firstname) - บังคับกรอก
   - นามสกุล (cus_lastname) - บังคับกรอก
   - ชื่อเล่น (cus_name) - บังคับกรอก
   - เบอร์โทรศัพท์ (cus_tel_1) - บังคับกรอก

2. แท็บที่อยู่ (ไม่บังคับกรอกทุกฟิลด์ แต่ถ้ากรอกที่อยู่ควรกรอกจังหวัดด้วย):
   - ที่อยู่ (cus_address)
   - จังหวัด (cus_pro_id)
   - อำเภอ/เขต (cus_dis_id)
   - ตำบล/แขวง (cus_sub_id)
   - รหัสไปรษณีย์ (cus_zip_code)

### 6. ตัวอย่างการปรับปรุงรูปแบบฟอร์ม

#### 6.1 ปรับตำแหน่งฟิลด์ "ตำแหน่ง" (ก่อนปรับปรุง)

โครงสร้างเดิมของฟอร์มมีปัญหาดังนี้:
- ฟิลด์ "ตำแหน่ง" อยู่ในแถวแยกต่างหาก ทำให้สิ้นเปลืองพื้นที่
- ใช้ Grid แบบเต็มแถวแทนที่จะแบ่งเป็นคอลัมน์เดียวกับฟิลด์อื่นๆ

```jsx
<Grid container spacing={2}>
  <Grid item md={4} xs={12}> {/* ชื่อจริง */} </Grid>
  <Grid item md={4} xs={12}> {/* นามสกุล */} </Grid>
  <Grid item md={4} xs={12}> {/* ชื่อเล่น */} </Grid>
  <Grid item xs={12}> {/* ตำแหน่ง */} </Grid> {/* <-- ปัญหาอยู่ตรงนี้ */}
</Grid>
```

#### 6.2 การปรับปรุง Grid สำหรับข้อมูลส่วนบุคคล

ปรับให้ฟิลด์ "ตำแหน่ง" อยู่ในแถวเดียวกับฟิลด์อื่นๆ โดยปรับ Grid ดังนี้:

```jsx
<Grid container spacing={2}>
  <Grid item md={3} xs={12}>
    <TextField 
      variant="outlined"
      size="small"
      fullWidth
      required
      label="ชื่อจริง"
      name="cus_firstname"
      placeholder="ชื่อจริง"
    />
  </Grid>
  <Grid item md={3} xs={12}>
    <TextField 
      variant="outlined"
      size="small"
      fullWidth
      required
      label="นามสกุล"
      name="cus_lastname"
      placeholder="นามสกุล"
    />
  </Grid>
  <Grid item md={3} xs={12}>
    <TextField 
      variant="outlined"
      size="small"
      fullWidth
      required
      label="ชื่อเล่น"
      name="cus_name"
      placeholder="ชื่อเล่น"
    />
  </Grid>
  <Grid item md={3} xs={12}>
    <TextField 
      variant="outlined"
      size="small"
      fullWidth
      label="ตำแหน่ง"
      name="cus_depart"
      placeholder="ตำแหน่ง"
    />
  </Grid>
</Grid>
```

#### 6.3 การเพิ่มสถานะในแท็บ

เพิ่มการแสดงสถานะต่อท้ายชื่อแท็บ เช่น:

```jsx
<Tabs value={activeTab} onChange={handleTabChange}>
  <Tab 
    icon={<Person />}
    label={
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        ข้อมูลพื้นฐาน
        {formStatus.basicInfo === 'complete' && 
          <CheckCircle fontSize="small" color="success" />
        }
        {formStatus.basicInfo === 'incomplete' && 
          <Error fontSize="small" color="error" />
        }
      </Box>
    }
  />
  <Tab 
    icon={<LocationOn />}
    label={
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        ที่อยู่
        {formStatus.address === 'complete' && 
          <CheckCircle fontSize="small" color="success" />
        }
        {formStatus.address === 'optional' && 
          <InfoOutlined fontSize="small" color="info" />
        }
      </Box>
    }
  />
  {/* แท็บอื่นๆ */}
</Tabs>
```

#### 6.4 ฟังก์ชันตรวจสอบความครบถ้วนของข้อมูล

```jsx
// ตรวจสอบความครบถ้วนของข้อมูลในแต่ละแท็บ
const validateTabs = (formData) => {
  // แท็บข้อมูลพื้นฐาน: ต้องมีชื่อจริง นามสกุล ชื่อเล่น และเบอร์โทร
  const isBasicInfoComplete = 
    formData.cus_firstname?.trim() && 
    formData.cus_lastname?.trim() && 
    formData.cus_name?.trim() && 
    formData.cus_tel_1?.trim();
    
  // แท็บที่อยู่: ไม่จำเป็นต้องกรอกทุกฟิลด์ แต่ถ้ากรอกที่อยู่ควรกรอกจังหวัดด้วย
  const hasAddress = formData.cus_address?.trim();
  const hasProvince = formData.cus_pro_id;
  const isAddressComplete = !hasAddress || (hasAddress && hasProvince);
  
  return {
    basicInfo: isBasicInfoComplete ? 'complete' : 'incomplete',
    address: isAddressComplete ? 'optional' : 'incomplete',
    // แท็บอื่นๆ...
  };
};

// อัพเดทสถานะแท็บเมื่อข้อมูลเปลี่ยน
useEffect(() => {
  const tabStatus = validateTabs(formData);
  setFormStatus(tabStatus);
}, [formData]);
ฟิวที่ต้องปรับ ```<div class="MuiGrid-root MuiGrid-container MuiGrid-spacing-xs-2 css-1ntijh8-MuiGrid-root"><div class="MuiGrid-root MuiGrid-grid-md-4 css-1ppdlb3-MuiGrid-root" size="12"><div class="MuiFormControl-root MuiFormControl-fullWidth MuiTextField-root css-ptfpl-MuiFormControl-root-MuiTextField-root"><label class="MuiFormLabel-root MuiInputLabel-root MuiInputLabel-formControl MuiInputLabel-animated MuiInputLabel-sizeSmall MuiInputLabel-outlined MuiFormLabel-colorPrimary Mui-required MuiInputLabel-root MuiInputLabel-formControl MuiInputLabel-animated MuiInputLabel-sizeSmall MuiInputLabel-outlined css-1avtt59-MuiFormLabel-root-MuiInputLabel-root" data-shrink="false" for=":rbt:" id=":rbt:-label">ชื่อจริง<span aria-hidden="true" class="MuiFormLabel-asterisk MuiInputLabel-asterisk css-2sz6ty-MuiFormLabel-asterisk"> *</span></label><div class="MuiInputBase-root MuiOutlinedInput-root MuiInputBase-colorPrimary MuiInputBase-fullWidth MuiInputBase-formControl MuiInputBase-sizeSmall css-p8izd5-MuiInputBase-root-MuiOutlinedInput-root"><input aria-invalid="false" id=":rbt:" name="cus_firstname" placeholder="ชื่อจริง" required="" type="text" class="MuiInputBase-input MuiOutlinedInput-input MuiInputBase-inputSizeSmall css-1rl3ew7-MuiInputBase-input-MuiOutlinedInput-input" value=""><fieldset aria-hidden="true" class="MuiOutlinedInput-notchedOutline css-1v24f9t-MuiOutlinedInput-notchedOutline"><legend class="css-81qg8w"><span>ชื่อจริง *</span></legend></fieldset></div></div></div><div class="MuiGrid-root MuiGrid-grid-md-4 css-1ppdlb3-MuiGrid-root" size="12"><div class="MuiFormControl-root MuiFormControl-fullWidth MuiTextField-root css-ptfpl-MuiFormControl-root-MuiTextField-root"><label class="MuiFormLabel-root MuiInputLabel-root MuiInputLabel-formControl MuiInputLabel-animated MuiInputLabel-sizeSmall MuiInputLabel-outlined MuiFormLabel-colorPrimary Mui-required MuiInputLabel-root MuiInputLabel-formControl MuiInputLabel-animated MuiInputLabel-sizeSmall MuiInputLabel-outlined css-1avtt59-MuiFormLabel-root-MuiInputLabel-root" data-shrink="false" for=":rbv:" id=":rbv:-label">นามสกุล<span aria-hidden="true" class="MuiFormLabel-asterisk MuiInputLabel-asterisk css-2sz6ty-MuiFormLabel-asterisk"> *</span></label><div class="MuiInputBase-root MuiOutlinedInput-root MuiInputBase-colorPrimary MuiInputBase-fullWidth MuiInputBase-formControl MuiInputBase-sizeSmall css-p8izd5-MuiInputBase-root-MuiOutlinedInput-root"><input aria-invalid="false" id=":rbv:" name="cus_lastname" placeholder="นามสกุล" required="" type="text" class="MuiInputBase-input MuiOutlinedInput-input MuiInputBase-inputSizeSmall css-1rl3ew7-MuiInputBase-input-MuiOutlinedInput-input" value=""><fieldset aria-hidden="true" class="MuiOutlinedInput-notchedOutline css-1v24f9t-MuiOutlinedInput-notchedOutline"><legend class="css-81qg8w"><span>นามสกุล *</span></legend></fieldset></div></div></div><div class="MuiGrid-root MuiGrid-grid-md-4 css-1ppdlb3-MuiGrid-root" size="12"><div class="MuiFormControl-root MuiFormControl-fullWidth MuiTextField-root css-ptfpl-MuiFormControl-root-MuiTextField-root"><label class="MuiFormLabel-root MuiInputLabel-root MuiInputLabel-formControl MuiInputLabel-animated MuiInputLabel-sizeSmall MuiInputLabel-outlined MuiFormLabel-colorPrimary Mui-required MuiInputLabel-root MuiInputLabel-formControl MuiInputLabel-animated MuiInputLabel-sizeSmall MuiInputLabel-outlined css-1avtt59-MuiFormLabel-root-MuiInputLabel-root" data-shrink="false" for=":rc1:" id=":rc1:-label">ชื่อเล่น<span aria-hidden="true" class="MuiFormLabel-asterisk MuiInputLabel-asterisk css-2sz6ty-MuiFormLabel-asterisk"> *</span></label><div class="MuiInputBase-root MuiOutlinedInput-root MuiInputBase-colorPrimary MuiInputBase-fullWidth MuiInputBase-formControl MuiInputBase-sizeSmall css-p8izd5-MuiInputBase-root-MuiOutlinedInput-root"><input aria-invalid="false" id=":rc1:" name="cus_name" placeholder="ชื่อเล่น" required="" type="text" class="MuiInputBase-input MuiOutlinedInput-input MuiInputBase-inputSizeSmall css-1rl3ew7-MuiInputBase-input-MuiOutlinedInput-input" value=""><fieldset aria-hidden="true" class="MuiOutlinedInput-notchedOutline css-1v24f9t-MuiOutlinedInput-notchedOutline"><legend class="css-81qg8w"><span>ชื่อเล่น *</span></legend></fieldset></div></div></div><div class="MuiGrid-root css-vj1n65-MuiGrid-root" size="12"><div class="MuiFormControl-root MuiFormControl-fullWidth MuiTextField-root css-ptfpl-MuiFormControl-root-MuiTextField-root"><label class="MuiFormLabel-root MuiInputLabel-root MuiInputLabel-formControl MuiInputLabel-animated MuiInputLabel-sizeSmall MuiInputLabel-outlined MuiFormLabel-colorPrimary MuiInputLabel-root MuiInputLabel-formControl MuiInputLabel-animated MuiInputLabel-sizeSmall MuiInputLabel-outlined css-1avtt59-MuiFormLabel-root-MuiInputLabel-root" data-shrink="false" for=":rc3:" id=":rc3:-label">ตำแหน่ง</label><div class="MuiInputBase-root MuiOutlinedInput-root MuiInputBase-colorPrimary MuiInputBase-fullWidth MuiInputBase-formControl MuiInputBase-sizeSmall css-p8izd5-MuiInputBase-root-MuiOutlinedInput-root"><input aria-invalid="false" id=":rc3:" name="cus_depart" placeholder="ตำแหน่ง" type="text" class="MuiInputBase-input MuiOutlinedInput-input MuiInputBase-inputSizeSmall css-1rl3ew7-MuiInputBase-input-MuiOutlinedInput-input" value=""><fieldset aria-hidden="true" class="MuiOutlinedInput-notchedOutline css-1v24f9t-MuiOutlinedInput-notchedOutline"><legend class="css-81qg8w"><span>ตำแหน่ง</span></legend></fieldset></div></div></div></div>

<div class="MuiGrid-root MuiGrid-container MuiGrid-spacing-xs-2 css-1ntijh8-MuiGrid-root"><div class="MuiGrid-root MuiGrid-grid-md-6 css-dulzw9-MuiGrid-root" size="12"><div class="MuiFormControl-root MuiFormControl-fullWidth MuiTextField-root css-ptfpl-MuiFormControl-root-MuiTextField-root"><label class="MuiFormLabel-root MuiInputLabel-root MuiInputLabel-formControl MuiInputLabel-animated MuiInputLabel-shrink MuiInputLabel-sizeSmall MuiInputLabel-outlined MuiFormLabel-colorPrimary Mui-required MuiInputLabel-root MuiInputLabel-formControl MuiInputLabel-animated MuiInputLabel-shrink MuiInputLabel-sizeSmall MuiInputLabel-outlined css-m8yete-MuiFormLabel-root-MuiInputLabel-root" data-shrink="true" for=":rlt:" id=":rlt:-label">เบอร์โทรศัพท์<span aria-hidden="true" class="MuiFormLabel-asterisk MuiInputLabel-asterisk css-2sz6ty-MuiFormLabel-asterisk"> *</span></label><div class="MuiInputBase-root MuiOutlinedInput-root MuiInputBase-colorPrimary MuiInputBase-fullWidth MuiInputBase-formControl MuiInputBase-sizeSmall MuiInputBase-adornedStart css-1n8urv5-MuiInputBase-root-MuiOutlinedInput-root"><div class="MuiInputAdornment-root MuiInputAdornment-positionStart MuiInputAdornment-outlined MuiInputAdornment-sizeSmall css-navhnp-MuiInputAdornment-root"><span class="notranslate" aria-hidden="true">​</span><svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path fill="none" d="M0 0h24v24H0z"></path><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"></path></svg></div><input aria-invalid="false" id=":rlt:" name="cus_tel_1" placeholder="เบอร์" required="" type="text" class="MuiInputBase-input MuiOutlinedInput-input MuiInputBase-inputSizeSmall MuiInputBase-inputAdornedStart css-1y1qifh-MuiInputBase-input-MuiOutlinedInput-input" value=""><fieldset aria-hidden="true" class="MuiOutlinedInput-notchedOutline css-1v24f9t-MuiOutlinedInput-notchedOutline"><legend class="css-w1u3ce"><span>เบอร์โทรศัพท์ *</span></legend></fieldset></div></div></div><div class="MuiGrid-root MuiGrid-grid-md-6 css-dulzw9-MuiGrid-root" size="12"><div class="MuiFormControl-root MuiFormControl-fullWidth MuiTextField-root css-ptfpl-MuiFormControl-root-MuiTextField-root"><label class="MuiFormLabel-root MuiInputLabel-root MuiInputLabel-formControl MuiInputLabel-animated MuiInputLabel-shrink MuiInputLabel-sizeSmall MuiInputLabel-outlined MuiFormLabel-colorPrimary MuiInputLabel-root MuiInputLabel-formControl MuiInputLabel-animated MuiInputLabel-shrink MuiInputLabel-sizeSmall MuiInputLabel-outlined css-m8yete-MuiFormLabel-root-MuiInputLabel-root" data-shrink="true" for=":rlv:" id=":rlv:-label">เบอร์สำรอง</label><div class="MuiInputBase-root MuiOutlinedInput-root MuiInputBase-colorPrimary MuiInputBase-fullWidth MuiInputBase-formControl MuiInputBase-sizeSmall MuiInputBase-adornedStart css-1n8urv5-MuiInputBase-root-MuiOutlinedInput-root"><div class="MuiInputAdornment-root MuiInputAdornment-positionStart MuiInputAdornment-outlined MuiInputAdornment-sizeSmall css-navhnp-MuiInputAdornment-root"><span class="notranslate" aria-hidden="true">​</span><svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path fill="none" d="M0 0h24v24H0z"></path><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"></path></svg></div><input aria-invalid="false" id=":rlv:" name="cus_tel_2" placeholder="เบอร์สำรอง" type="text" class="MuiInputBase-input MuiOutlinedInput-input MuiInputBase-inputSizeSmall MuiInputBase-inputAdornedStart css-1y1qifh-MuiInputBase-input-MuiOutlinedInput-input" value=""><fieldset aria-hidden="true" class="MuiOutlinedInput-notchedOutline css-1v24f9t-MuiOutlinedInput-notchedOutline"><legend class="css-w1u3ce"><span>เบอร์สำรอง</span></legend></fieldset></div></div></div><div class="MuiGrid-root css-vj1n65-MuiGrid-root" size="12"><div class="MuiFormControl-root MuiFormControl-fullWidth MuiTextField-root css-ptfpl-MuiFormControl-root-MuiTextField-root"><label class="MuiFormLabel-root MuiInputLabel-root MuiInputLabel-formControl MuiInputLabel-animated MuiInputLabel-shrink MuiInputLabel-sizeSmall MuiInputLabel-outlined MuiFormLabel-colorPrimary MuiInputLabel-root MuiInputLabel-formControl MuiInputLabel-animated MuiInputLabel-shrink MuiInputLabel-sizeSmall MuiInputLabel-outlined css-m8yete-MuiFormLabel-root-MuiInputLabel-root" data-shrink="true" for=":rm1:" id=":rm1:-label">อีเมล</label><div class="MuiInputBase-root MuiOutlinedInput-root MuiInputBase-colorPrimary MuiInputBase-fullWidth MuiInputBase-formControl MuiInputBase-sizeSmall MuiInputBase-adornedStart css-1n8urv5-MuiInputBase-root-MuiOutlinedInput-root"><div class="MuiInputAdornment-root MuiInputAdornment-positionStart MuiInputAdornment-outlined MuiInputAdornment-sizeSmall css-navhnp-MuiInputAdornment-root"><span class="notranslate" aria-hidden="true">​</span><svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path fill="none" d="M0 0h24v24H0z"></path><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z"></path></svg></div><input aria-invalid="false" id=":rm1:" name="cus_email" placeholder="อีเมล" type="text" class="MuiInputBase-input MuiOutlinedInput-input MuiInputBase-inputSizeSmall MuiInputBase-inputAdornedStart css-1y1qifh-MuiInputBase-input-MuiOutlinedInput-input" value=""><fieldset aria-hidden="true" class="MuiOutlinedInput-notchedOutline css-1v24f9t-MuiOutlinedInput-notchedOutline"><legend class="css-w1u3ce"><span>อีเมล</span></legend></fieldset></div></div></div><div class="MuiGrid-root css-vj1n65-MuiGrid-root" size="12"><div class="MuiFormControl-root MuiFormControl-fullWidth MuiTextField-root css-ptfpl-MuiFormControl-root-MuiTextField-root"><label class="MuiFormLabel-root MuiInputLabel-root MuiInputLabel-formControl MuiInputLabel-animated MuiInputLabel-sizeSmall MuiInputLabel-outlined MuiFormLabel-colorPrimary MuiInputLabel-root MuiInputLabel-formControl MuiInputLabel-animated MuiInputLabel-sizeSmall MuiInputLabel-outlined css-1avtt59-MuiFormLabel-root-MuiInputLabel-root" data-shrink="false" for=":rm3:" id=":rm3:-label">เลขผู้เสียภาษี</label><div class="MuiInputBase-root MuiOutlinedInput-root MuiInputBase-colorPrimary MuiInputBase-fullWidth MuiInputBase-formControl MuiInputBase-sizeSmall css-p8izd5-MuiInputBase-root-MuiOutlinedInput-root"><input aria-invalid="false" id=":rm3:" name="cus_tax_id" placeholder="เลขผู้เสียภาษี" type="text" class="MuiInputBase-input MuiOutlinedInput-input MuiInputBase-inputSizeSmall css-1rl3ew7-MuiInputBase-input-MuiOutlinedInput-input" value=""><fieldset aria-hidden="true" class="MuiOutlinedInput-notchedOutline css-1v24f9t-MuiOutlinedInput-notchedOutline"><legend class="css-81qg8w"><span>เลขผู้เสียภาษี</span></legend></fieldset></div></div></div></div>


<div class="MuiGrid-root MuiGrid-container MuiGrid-spacing-xs-2 css-1ntijh8-MuiGrid-root"><div class="MuiGrid-root css-vj1n65-MuiGrid-root" size="12"><div class="MuiFormControl-root MuiFormControl-fullWidth MuiTextField-root css-ptfpl-MuiFormControl-root-MuiTextField-root"><label class="MuiFormLabel-root MuiInputLabel-root MuiInputLabel-formControl MuiInputLabel-animated MuiInputLabel-shrink MuiInputLabel-sizeSmall MuiInputLabel-outlined MuiFormLabel-colorPrimary MuiInputLabel-root MuiInputLabel-formControl MuiInputLabel-animated MuiInputLabel-shrink MuiInputLabel-sizeSmall MuiInputLabel-outlined css-m8yete-MuiFormLabel-root-MuiInputLabel-root" data-shrink="true" for=":rm5:" id=":rm5:-label">ที่อยู่</label><div class="MuiInputBase-root MuiOutlinedInput-root MuiInputBase-colorPrimary MuiInputBase-fullWidth MuiInputBase-formControl MuiInputBase-sizeSmall MuiInputBase-adornedStart css-1n8urv5-MuiInputBase-root-MuiOutlinedInput-root"><div class="MuiInputAdornment-root MuiInputAdornment-positionStart MuiInputAdornment-outlined MuiInputAdornment-sizeSmall css-navhnp-MuiInputAdornment-root"><span class="notranslate" aria-hidden="true">​</span><svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path fill="none" d="M0 0h24v24H0z"></path><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 0 1 0-5 2.5 2.5 0 0 1 0 5z"></path></svg></div><input aria-invalid="false" id=":rm5:" name="cus_address" placeholder="บ้านเลขที่/ถนน/ซอย/หมู่บ้าน" type="text" class="MuiInputBase-input MuiOutlinedInput-input MuiInputBase-inputSizeSmall MuiInputBase-inputAdornedStart css-1y1qifh-MuiInputBase-input-MuiOutlinedInput-input" value=""><fieldset aria-hidden="true" class="MuiOutlinedInput-notchedOutline css-1v24f9t-MuiOutlinedInput-notchedOutline"><legend class="css-w1u3ce"><span>ที่อยู่</span></legend></fieldset></div></div></div><div class="MuiGrid-root MuiGrid-grid-md-6 css-dulzw9-MuiGrid-root" size="12"><div class="MuiFormControl-root MuiFormControl-fullWidth css-ytlejw-MuiFormControl-root"><label class="MuiFormLabel-root MuiInputLabel-root MuiInputLabel-formControl MuiInputLabel-animated MuiInputLabel-sizeSmall MuiInputLabel-outlined MuiFormLabel-colorPrimary MuiInputLabel-root MuiInputLabel-formControl MuiInputLabel-animated MuiInputLabel-sizeSmall MuiInputLabel-outlined css-1avtt59-MuiFormLabel-root-MuiInputLabel-root" data-shrink="false">จังหวัด</label><div class="MuiInputBase-root MuiOutlinedInput-root MuiInputBase-colorPrimary MuiInputBase-formControl MuiInputBase-sizeSmall css-phlunr-MuiInputBase-root-MuiOutlinedInput-root-MuiSelect-root"><div tabindex="0" role="combobox" aria-controls=":rm7:" aria-expanded="false" aria-haspopup="listbox" aria-labelledby="mui-component-select-cus_pro_id" id="mui-component-select-cus_pro_id" class="MuiSelect-select MuiSelect-outlined MuiInputBase-input MuiOutlinedInput-input MuiInputBase-inputSizeSmall css-1cru2we-MuiSelect-select-MuiInputBase-input-MuiOutlinedInput-input"><span class="notranslate" aria-hidden="true">​</span></div><input aria-invalid="false" name="cus_pro_id" aria-hidden="true" tabindex="-1" class="MuiSelect-nativeInput css-j0riat-MuiSelect-nativeInput" value=""><svg class="MuiSvgIcon-root MuiSvgIcon-fontSizeMedium MuiSelect-icon MuiSelect-iconOutlined css-ikpuqy-MuiSvgIcon-root-MuiSelect-icon" focusable="false" aria-hidden="true" viewBox="0 0 24 24" data-testid="ArrowDropDownIcon"><path d="M7 10l5 5 5-5z"></path></svg><fieldset aria-hidden="true" class="MuiOutlinedInput-notchedOutline css-1v24f9t-MuiOutlinedInput-notchedOutline"><legend class="css-81qg8w"><span>จังหวัด</span></legend></fieldset></div></div></div><div class="MuiGrid-root MuiGrid-grid-md-6 css-dulzw9-MuiGrid-root" size="12"><div class="MuiFormControl-root MuiFormControl-fullWidth css-ytlejw-MuiFormControl-root"><label class="MuiFormLabel-root MuiInputLabel-root MuiInputLabel-formControl MuiInputLabel-animated MuiInputLabel-sizeSmall MuiInputLabel-outlined MuiFormLabel-colorPrimary MuiInputLabel-root MuiInputLabel-formControl MuiInputLabel-animated MuiInputLabel-sizeSmall MuiInputLabel-outlined css-1avtt59-MuiFormLabel-root-MuiInputLabel-root" data-shrink="false">เขต/อำเภอ</label><div class="MuiInputBase-root MuiOutlinedInput-root MuiInputBase-colorPrimary MuiInputBase-formControl MuiInputBase-sizeSmall css-phlunr-MuiInputBase-root-MuiOutlinedInput-root-MuiSelect-root"><div tabindex="0" role="combobox" aria-controls=":rm9:" aria-expanded="false" aria-haspopup="listbox" aria-labelledby="mui-component-select-cus_dis_id" id="mui-component-select-cus_dis_id" class="MuiSelect-select MuiSelect-outlined MuiInputBase-input MuiOutlinedInput-input MuiInputBase-inputSizeSmall css-1cru2we-MuiSelect-select-MuiInputBase-input-MuiOutlinedInput-input"><span class="notranslate" aria-hidden="true">​</span></div><input aria-invalid="false" name="cus_dis_id" aria-hidden="true" tabindex="-1" class="MuiSelect-nativeInput css-j0riat-MuiSelect-nativeInput" value=""><svg class="MuiSvgIcon-root MuiSvgIcon-fontSizeMedium MuiSelect-icon MuiSelect-iconOutlined css-ikpuqy-MuiSvgIcon-root-MuiSelect-icon" focusable="false" aria-hidden="true" viewBox="0 0 24 24" data-testid="ArrowDropDownIcon"><path d="M7 10l5 5 5-5z"></path></svg><fieldset aria-hidden="true" class="MuiOutlinedInput-notchedOutline css-1v24f9t-MuiOutlinedInput-notchedOutline"><legend class="css-81qg8w"><span>เขต/อำเภอ</span></legend></fieldset></div></div></div><div class="MuiGrid-root MuiGrid-grid-md-6 css-dulzw9-MuiGrid-root" size="12"><div class="MuiFormControl-root MuiFormControl-fullWidth css-ytlejw-MuiFormControl-root"><label class="MuiFormLabel-root MuiInputLabel-root MuiInputLabel-formControl MuiInputLabel-animated MuiInputLabel-sizeSmall MuiInputLabel-outlined MuiFormLabel-colorPrimary MuiInputLabel-root MuiInputLabel-formControl MuiInputLabel-animated MuiInputLabel-sizeSmall MuiInputLabel-outlined css-1avtt59-MuiFormLabel-root-MuiInputLabel-root" data-shrink="false">แขวง/ตำบล</label><div class="MuiInputBase-root MuiOutlinedInput-root MuiInputBase-colorPrimary MuiInputBase-formControl MuiInputBase-sizeSmall css-phlunr-MuiInputBase-root-MuiOutlinedInput-root-MuiSelect-root"><div tabindex="0" role="combobox" aria-controls=":rmb:" aria-expanded="false" aria-haspopup="listbox" aria-labelledby="mui-component-select-cus_sub_id" id="mui-component-select-cus_sub_id" class="MuiSelect-select MuiSelect-outlined MuiInputBase-input MuiOutlinedInput-input MuiInputBase-inputSizeSmall css-1cru2we-MuiSelect-select-MuiInputBase-input-MuiOutlinedInput-input"><span class="notranslate" aria-hidden="true">​</span></div><input aria-invalid="false" name="cus_sub_id" aria-hidden="true" tabindex="-1" class="MuiSelect-nativeInput css-j0riat-MuiSelect-nativeInput" value=""><svg class="MuiSvgIcon-root MuiSvgIcon-fontSizeMedium MuiSelect-icon MuiSelect-iconOutlined css-ikpuqy-MuiSvgIcon-root-MuiSelect-icon" focusable="false" aria-hidden="true" viewBox="0 0 24 24" data-testid="ArrowDropDownIcon"><path d="M7 10l5 5 5-5z"></path></svg><fieldset aria-hidden="true" class="MuiOutlinedInput-notchedOutline css-1v24f9t-MuiOutlinedInput-notchedOutline"><legend class="css-81qg8w"><span>แขวง/ตำบล</span></legend></fieldset></div></div></div><div class="MuiGrid-root MuiGrid-grid-md-6 css-dulzw9-MuiGrid-root" size="12"><div class="MuiFormControl-root MuiFormControl-fullWidth MuiTextField-root css-ptfpl-MuiFormControl-root-MuiTextField-root"><label class="MuiFormLabel-root MuiInputLabel-root MuiInputLabel-formControl MuiInputLabel-animated MuiInputLabel-sizeSmall MuiInputLabel-outlined MuiFormLabel-colorPrimary MuiInputLabel-root MuiInputLabel-formControl MuiInputLabel-animated MuiInputLabel-sizeSmall MuiInputLabel-outlined css-1avtt59-MuiFormLabel-root-MuiInputLabel-root" data-shrink="false" for=":rmd:" id=":rmd:-label">รหัสไปรษณีย์</label><div class="MuiInputBase-root MuiOutlinedInput-root MuiInputBase-colorPrimary MuiInputBase-fullWidth MuiInputBase-formControl MuiInputBase-sizeSmall css-p8izd5-MuiInputBase-root-MuiOutlinedInput-root"><input aria-invalid="false" id=":rmd:" name="cus_zip_code" placeholder="รหัสไปรษณีย์" type="text" class="MuiInputBase-input MuiOutlinedInput-input MuiInputBase-inputSizeSmall css-1rl3ew7-MuiInputBase-input-MuiOutlinedInput-input" value=""><fieldset aria-hidden="true" class="MuiOutlinedInput-notchedOutline css-1v24f9t-MuiOutlinedInput-notchedOutline"><legend class="css-81qg8w"><span>รหัสไปรษณีย์</span></legend></fieldset></div></div></div></div>

<div class="MuiGrid-root MuiGrid-container MuiGrid-spacing-xs-2 css-1ntijh8-MuiGrid-root"><div class="MuiGrid-root css-vj1n65-MuiGrid-root" size="12"><div class="MuiFormControl-root MuiFormControl-fullWidth MuiTextField-root css-ptfpl-MuiFormControl-root-MuiTextField-root"><label class="MuiFormLabel-root MuiInputLabel-root MuiInputLabel-formControl MuiInputLabel-animated MuiInputLabel-sizeSmall MuiInputLabel-outlined MuiFormLabel-colorPrimary MuiInputLabel-root MuiInputLabel-formControl MuiInputLabel-animated MuiInputLabel-sizeSmall MuiInputLabel-outlined css-1avtt59-MuiFormLabel-root-MuiInputLabel-root" data-shrink="false" for=":rmf:" id=":rmf:-label">Note</label><div class="MuiInputBase-root MuiOutlinedInput-root MuiInputBase-colorPrimary MuiInputBase-fullWidth MuiInputBase-formControl MuiInputBase-sizeSmall MuiInputBase-multiline css-1vxk4mt-MuiInputBase-root-MuiOutlinedInput-root"><textarea aria-invalid="false" id=":rmf:" name="cd_note" class="MuiInputBase-input MuiOutlinedInput-input MuiInputBase-inputMultiline MuiInputBase-inputSizeSmall css-1cliafe-MuiInputBase-input-MuiOutlinedInput-input" style="height: 69px;"></textarea><textarea aria-hidden="true" class="MuiInputBase-input MuiOutlinedInput-input MuiInputBase-inputMultiline MuiInputBase-inputSizeSmall css-1cliafe-MuiInputBase-input-MuiOutlinedInput-input" readonly="" tabindex="-1" style="visibility: hidden; position: absolute; overflow: hidden; height: 0px; top: 0px; left: 0px; transform: translateZ(0px); padding-top: 0px; padding-bottom: 0px; width: 185px;"></textarea><fieldset aria-hidden="true" class="MuiOutlinedInput-notchedOutline css-1v24f9t-MuiOutlinedInput-notchedOutline"><legend class="css-81qg8w"><span>Note</span></legend></fieldset></div></div></div><div class="MuiGrid-root css-vj1n65-MuiGrid-root" size="12"><div class="MuiFormControl-root MuiFormControl-fullWidth MuiTextField-root css-ptfpl-MuiFormControl-root-MuiTextField-root"><label class="MuiFormLabel-root MuiInputLabel-root MuiInputLabel-formControl MuiInputLabel-animated MuiInputLabel-sizeSmall MuiInputLabel-outlined MuiFormLabel-colorPrimary MuiInputLabel-root MuiInputLabel-formControl MuiInputLabel-animated MuiInputLabel-sizeSmall MuiInputLabel-outlined css-1avtt59-MuiFormLabel-root-MuiInputLabel-root" data-shrink="false" for=":rmh:" id=":rmh:-label">รายละเอียดเพิ่มเติม</label><div class="MuiInputBase-root MuiOutlinedInput-root MuiInputBase-colorPrimary MuiInputBase-fullWidth MuiInputBase-formControl MuiInputBase-sizeSmall MuiInputBase-multiline css-1vxk4mt-MuiInputBase-root-MuiOutlinedInput-root"><textarea aria-invalid="false" id=":rmh:" name="cd_remark" class="MuiInputBase-input MuiOutlinedInput-input MuiInputBase-inputMultiline MuiInputBase-inputSizeSmall css-1cliafe-MuiInputBase-input-MuiOutlinedInput-input" style="height: 115px;"></textarea><textarea aria-hidden="true" class="MuiInputBase-input MuiOutlinedInput-input MuiInputBase-inputMultiline MuiInputBase-inputSizeSmall css-1cliafe-MuiInputBase-input-MuiOutlinedInput-input" readonly="" tabindex="-1" style="visibility: hidden; position: absolute; overflow: hidden; height: 0px; top: 0px; left: 0px; transform: translateZ(0px); padding-top: 0px; padding-bottom: 0px; width: 185px;"></textarea><fieldset aria-hidden="true" class="MuiOutlinedInput-notchedOutline css-1v24f9t-MuiOutlinedInput-notchedOutline"><legend class="css-81qg8w"><span>รายละเอียดเพิ่มเติม</span></legend></fieldset></div></div></div></div>
```

ฟิลด์ที่ต้องปรับตำแหน่ง:
- ตำแหน่ง
---


ฟิวที่ต้องปรับ ```<div class="MuiGrid-root MuiGrid-container MuiGrid-spacing-xs-2 css-1ntijh8-MuiGrid-root"><div class="MuiGrid-root MuiGrid-grid-md-4 css-1ppdlb3-MuiGrid-root" size="12"><div class="MuiFormControl-root MuiFormControl-fullWidth MuiTextField-root css-ptfpl-MuiFormControl-root-MuiTextField-root"><label class="MuiFormLabel-root MuiInputLabel-root MuiInputLabel-formControl MuiInputLabel-animated MuiInputLabel-sizeSmall MuiInputLabel-outlined MuiFormLabel-colorPrimary Mui-required MuiInputLabel-root MuiInputLabel-formControl MuiInputLabel-animated MuiInputLabel-sizeSmall MuiInputLabel-outlined css-1avtt59-MuiFormLabel-root-MuiInputLabel-root" data-shrink="false" for=":rbt:" id=":rbt:-label">ชื่อจริง<span aria-hidden="true" class="MuiFormLabel-asterisk MuiInputLabel-asterisk css-2sz6ty-MuiFormLabel-asterisk"> *</span></label><div class="MuiInputBase-root MuiOutlinedInput-root MuiInputBase-colorPrimary MuiInputBase-fullWidth MuiInputBase-formControl MuiInputBase-sizeSmall css-p8izd5-MuiInputBase-root-MuiOutlinedInput-root"><input aria-invalid="false" id=":rbt:" name="cus_firstname" placeholder="ชื่อจริง" required="" type="text" class="MuiInputBase-input MuiOutlinedInput-input MuiInputBase-inputSizeSmall css-1rl3ew7-MuiInputBase-input-MuiOutlinedInput-input" value=""><fieldset aria-hidden="true" class="MuiOutlinedInput-notchedOutline css-1v24f9t-MuiOutlinedInput-notchedOutline"><legend class="css-81qg8w"><span>ชื่อจริง *</span></legend></fieldset></div></div></div><div class="MuiGrid-root MuiGrid-grid-md-4 css-1ppdlb3-MuiGrid-root" size="12"><div class="MuiFormControl-root MuiFormControl-fullWidth MuiTextField-root css-ptfpl-MuiFormControl-root-MuiTextField-root"><label class="MuiFormLabel-root MuiInputLabel-root MuiInputLabel-formControl MuiInputLabel-animated MuiInputLabel-sizeSmall MuiInputLabel-outlined MuiFormLabel-colorPrimary Mui-required MuiInputLabel-root MuiInputLabel-formControl MuiInputLabel-animated MuiInputLabel-sizeSmall MuiInputLabel-outlined css-1avtt59-MuiFormLabel-root-MuiInputLabel-root" data-shrink="false" for=":rbv:" id=":rbv:-label">นามสกุล<span aria-hidden="true" class="MuiFormLabel-asterisk MuiInputLabel-asterisk css-2sz6ty-MuiFormLabel-asterisk"> *</span></label><div class="MuiInputBase-root MuiOutlinedInput-root MuiInputBase-colorPrimary MuiInputBase-fullWidth MuiInputBase-formControl MuiInputBase-sizeSmall css-p8izd5-MuiInputBase-root-MuiOutlinedInput-root"><input aria-invalid="false" id=":rbv:" name="cus_lastname" placeholder="นามสกุล" required="" type="text" class="MuiInputBase-input MuiOutlinedInput-input MuiInputBase-inputSizeSmall css-1rl3ew7-MuiInputBase-input-MuiOutlinedInput-input" value=""><fieldset aria-hidden="true" class="MuiOutlinedInput-notchedOutline css-1v24f9t-MuiOutlinedInput-notchedOutline"><legend class="css-81qg8w"><span>นามสกุล *</span></legend></fieldset></div></div></div><div class="MuiGrid-root MuiGrid-grid-md-4 css-1ppdlb3-MuiGrid-root" size="12"><div class="MuiFormControl-root MuiFormControl-fullWidth MuiTextField-root css-ptfpl-MuiFormControl-root-MuiTextField-root"><label class="MuiFormLabel-root MuiInputLabel-root MuiInputLabel-formControl MuiInputLabel-animated MuiInputLabel-sizeSmall MuiInputLabel-outlined MuiFormLabel-colorPrimary Mui-required MuiInputLabel-root MuiInputLabel-formControl MuiInputLabel-animated MuiInputLabel-sizeSmall MuiInputLabel-outlined css-1avtt59-MuiFormLabel-root-MuiInputLabel-root" data-shrink="false" for=":rc1:" id=":rc1:-label">ชื่อเล่น<span aria-hidden="true" class="MuiFormLabel-asterisk MuiInputLabel-asterisk css-2sz6ty-MuiFormLabel-asterisk"> *</span></label><div class="MuiInputBase-root MuiOutlinedInput-root MuiInputBase-colorPrimary MuiInputBase-fullWidth MuiInputBase-formControl MuiInputBase-sizeSmall css-p8izd5-MuiInputBase-root-MuiOutlinedInput-root"><input aria-invalid="false" id=":rc1:" name="cus_name" placeholder="ชื่อเล่น" required="" type="text" class="MuiInputBase-input MuiOutlinedInput-input MuiInputBase-inputSizeSmall css-1rl3ew7-MuiInputBase-input-MuiOutlinedInput-input" value=""><fieldset aria-hidden="true" class="MuiOutlinedInput-notchedOutline css-1v24f9t-MuiOutlinedInput-notchedOutline"><legend class="css-81qg8w"><span>ชื่อเล่น *</span></legend></fieldset></div></div></div><div class="MuiGrid-root css-vj1n65-MuiGrid-root" size="12"><div class="MuiFormControl-root MuiFormControl-fullWidth MuiTextField-root css-ptfpl-MuiFormControl-root-MuiTextField-root"><label class="MuiFormLabel-root MuiInputLabel-root MuiInputLabel-formControl MuiInputLabel-animated MuiInputLabel-sizeSmall MuiInputLabel-outlined MuiFormLabel-colorPrimary MuiInputLabel-root MuiInputLabel-formControl MuiInputLabel-animated MuiInputLabel-sizeSmall MuiInputLabel-outlined css-1avtt59-MuiFormLabel-root-MuiInputLabel-root" data-shrink="false" for=":rc3:" id=":rc3:-label">ตำแหน่ง</label><div class="MuiInputBase-root MuiOutlinedInput-root MuiInputBase-colorPrimary MuiInputBase-fullWidth MuiInputBase-formControl MuiInputBase-sizeSmall css-p8izd5-MuiInputBase-root-MuiOutlinedInput-root"><input aria-invalid="false" id=":rc3:" name="cus_depart" placeholder="ตำแหน่ง" type="text" class="MuiInputBase-input MuiOutlinedInput-input MuiInputBase-inputSizeSmall css-1rl3ew7-MuiInputBase-input-MuiOutlinedInput-input" value=""><fieldset aria-hidden="true" class="MuiOutlinedInput-notchedOutline css-1v24f9t-MuiOutlinedInput-notchedOutline"><legend class="css-81qg8w"><span>ตำแหน่ง</span></legend></fieldset></div></div></div></div>

<div class="MuiGrid-root MuiGrid-container MuiGrid-spacing-xs-2 css-1ntijh8-MuiGrid-root"><div class="MuiGrid-root MuiGrid-grid-md-6 css-dulzw9-MuiGrid-root" size="12"><div class="MuiFormControl-root MuiFormControl-fullWidth MuiTextField-root css-ptfpl-MuiFormControl-root-MuiTextField-root"><label class="MuiFormLabel-root MuiInputLabel-root MuiInputLabel-formControl MuiInputLabel-animated MuiInputLabel-shrink MuiInputLabel-sizeSmall MuiInputLabel-outlined MuiFormLabel-colorPrimary Mui-required MuiInputLabel-root MuiInputLabel-formControl MuiInputLabel-animated MuiInputLabel-shrink MuiInputLabel-sizeSmall MuiInputLabel-outlined css-m8yete-MuiFormLabel-root-MuiInputLabel-root" data-shrink="true" for=":rlt:" id=":rlt:-label">เบอร์โทรศัพท์<span aria-hidden="true" class="MuiFormLabel-asterisk MuiInputLabel-asterisk css-2sz6ty-MuiFormLabel-asterisk"> *</span></label><div class="MuiInputBase-root MuiOutlinedInput-root MuiInputBase-colorPrimary MuiInputBase-fullWidth MuiInputBase-formControl MuiInputBase-sizeSmall MuiInputBase-adornedStart css-1n8urv5-MuiInputBase-root-MuiOutlinedInput-root"><div class="MuiInputAdornment-root MuiInputAdornment-positionStart MuiInputAdornment-outlined MuiInputAdornment-sizeSmall css-navhnp-MuiInputAdornment-root"><span class="notranslate" aria-hidden="true">​</span><svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path fill="none" d="M0 0h24v24H0z"></path><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"></path></svg></div><input aria-invalid="false" id=":rlt:" name="cus_tel_1" placeholder="เบอร์" required="" type="text" class="MuiInputBase-input MuiOutlinedInput-input MuiInputBase-inputSizeSmall MuiInputBase-inputAdornedStart css-1y1qifh-MuiInputBase-input-MuiOutlinedInput-input" value=""><fieldset aria-hidden="true" class="MuiOutlinedInput-notchedOutline css-1v24f9t-MuiOutlinedInput-notchedOutline"><legend class="css-w1u3ce"><span>เบอร์โทรศัพท์ *</span></legend></fieldset></div></div></div><div class="MuiGrid-root MuiGrid-grid-md-6 css-dulzw9-MuiGrid-root" size="12"><div class="MuiFormControl-root MuiFormControl-fullWidth MuiTextField-root css-ptfpl-MuiFormControl-root-MuiTextField-root"><label class="MuiFormLabel-root MuiInputLabel-root MuiInputLabel-formControl MuiInputLabel-animated MuiInputLabel-shrink MuiInputLabel-sizeSmall MuiInputLabel-outlined MuiFormLabel-colorPrimary MuiInputLabel-root MuiInputLabel-formControl MuiInputLabel-animated MuiInputLabel-shrink MuiInputLabel-sizeSmall MuiInputLabel-outlined css-m8yete-MuiFormLabel-root-MuiInputLabel-root" data-shrink="true" for=":rlv:" id=":rlv:-label">เบอร์สำรอง</label><div class="MuiInputBase-root MuiOutlinedInput-root MuiInputBase-colorPrimary MuiInputBase-fullWidth MuiInputBase-formControl MuiInputBase-sizeSmall MuiInputBase-adornedStart css-1n8urv5-MuiInputBase-root-MuiOutlinedInput-root"><div class="MuiInputAdornment-root MuiInputAdornment-positionStart MuiInputAdornment-outlined MuiInputAdornment-sizeSmall css-navhnp-MuiInputAdornment-root"><span class="notranslate" aria-hidden="true">​</span><svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path fill="none" d="M0 0h24v24H0z"></path><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"></path></svg></div><input aria-invalid="false" id=":rlv:" name="cus_tel_2" placeholder="เบอร์สำรอง" type="text" class="MuiInputBase-input MuiOutlinedInput-input MuiInputBase-inputSizeSmall MuiInputBase-inputAdornedStart css-1y1qifh-MuiInputBase-input-MuiOutlinedInput-input" value=""><fieldset aria-hidden="true" class="MuiOutlinedInput-notchedOutline css-1v24f9t-MuiOutlinedInput-notchedOutline"><legend class="css-w1u3ce"><span>เบอร์สำรอง</span></legend></fieldset></div></div></div><div class="MuiGrid-root css-vj1n65-MuiGrid-root" size="12"><div class="MuiFormControl-root MuiFormControl-fullWidth MuiTextField-root css-ptfpl-MuiFormControl-root-MuiTextField-root"><label class="MuiFormLabel-root MuiInputLabel-root MuiInputLabel-formControl MuiInputLabel-animated MuiInputLabel-shrink MuiInputLabel-sizeSmall MuiInputLabel-outlined MuiFormLabel-colorPrimary MuiInputLabel-root MuiInputLabel-formControl MuiInputLabel-animated MuiInputLabel-shrink MuiInputLabel-sizeSmall MuiInputLabel-outlined css-m8yete-MuiFormLabel-root-MuiInputLabel-root" data-shrink="true" for=":rm1:" id=":rm1:-label">อีเมล</label><div class="MuiInputBase-root MuiOutlinedInput-root MuiInputBase-colorPrimary MuiInputBase-fullWidth MuiInputBase-formControl MuiInputBase-sizeSmall MuiInputBase-adornedStart css-1n8urv5-MuiInputBase-root-MuiOutlinedInput-root"><div class="MuiInputAdornment-root MuiInputAdornment-positionStart MuiInputAdornment-outlined MuiInputAdornment-sizeSmall css-navhnp-MuiInputAdornment-root"><span class="notranslate" aria-hidden="true">​</span><svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path fill="none" d="M0 0h24v24H0z"></path><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z"></path></svg></div><input aria-invalid="false" id=":rm1:" name="cus_email" placeholder="อีเมล" type="text" class="MuiInputBase-input MuiOutlinedInput-input MuiInputBase-inputSizeSmall MuiInputBase-inputAdornedStart css-1y1qifh-MuiInputBase-input-MuiOutlinedInput-input" value=""><fieldset aria-hidden="true" class="MuiOutlinedInput-notchedOutline css-1v24f9t-MuiOutlinedInput-notchedOutline"><legend class="css-w1u3ce"><span>อีเมล</span></legend></fieldset></div></div></div><div class="MuiGrid-root css-vj1n65-MuiGrid-root" size="12"><div class="MuiFormControl-root MuiFormControl-fullWidth MuiTextField-root css-ptfpl-MuiFormControl-root-MuiTextField-root"><label class="MuiFormLabel-root MuiInputLabel-root MuiInputLabel-formControl MuiInputLabel-animated MuiInputLabel-sizeSmall MuiInputLabel-outlined MuiFormLabel-colorPrimary MuiInputLabel-root MuiInputLabel-formControl MuiInputLabel-animated MuiInputLabel-sizeSmall MuiInputLabel-outlined css-1avtt59-MuiFormLabel-root-MuiInputLabel-root" data-shrink="false" for=":rm3:" id=":rm3:-label">เลขผู้เสียภาษี</label><div class="MuiInputBase-root MuiOutlinedInput-root MuiInputBase-colorPrimary MuiInputBase-fullWidth MuiInputBase-formControl MuiInputBase-sizeSmall css-p8izd5-MuiInputBase-root-MuiOutlinedInput-root"><input aria-invalid="false" id=":rm3:" name="cus_tax_id" placeholder="เลขผู้เสียภาษี" type="text" class="MuiInputBase-input MuiOutlinedInput-input MuiInputBase-inputSizeSmall css-1rl3ew7-MuiInputBase-input-MuiOutlinedInput-input" value=""><fieldset aria-hidden="true" class="MuiOutlinedInput-notchedOutline css-1v24f9t-MuiOutlinedInput-notchedOutline"><legend class="css-81qg8w"><span>เลขผู้เสียภาษี</span></legend></fieldset></div></div></div></div>


<div class="MuiGrid-root MuiGrid-container MuiGrid-spacing-xs-2 css-1ntijh8-MuiGrid-root"><div class="MuiGrid-root css-vj1n65-MuiGrid-root" size="12"><div class="MuiFormControl-root MuiFormControl-fullWidth MuiTextField-root css-ptfpl-MuiFormControl-root-MuiTextField-root"><label class="MuiFormLabel-root MuiInputLabel-root MuiInputLabel-formControl MuiInputLabel-animated MuiInputLabel-shrink MuiInputLabel-sizeSmall MuiInputLabel-outlined MuiFormLabel-colorPrimary MuiInputLabel-root MuiInputLabel-formControl MuiInputLabel-animated MuiInputLabel-shrink MuiInputLabel-sizeSmall MuiInputLabel-outlined css-m8yete-MuiFormLabel-root-MuiInputLabel-root" data-shrink="true" for=":rm5:" id=":rm5:-label">ที่อยู่</label><div class="MuiInputBase-root MuiOutlinedInput-root MuiInputBase-colorPrimary MuiInputBase-fullWidth MuiInputBase-formControl MuiInputBase-sizeSmall MuiInputBase-adornedStart css-1n8urv5-MuiInputBase-root-MuiOutlinedInput-root"><div class="MuiInputAdornment-root MuiInputAdornment-positionStart MuiInputAdornment-outlined MuiInputAdornment-sizeSmall css-navhnp-MuiInputAdornment-root"><span class="notranslate" aria-hidden="true">​</span><svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path fill="none" d="M0 0h24v24H0z"></path><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 0 1 0-5 2.5 2.5 0 0 1 0 5z"></path></svg></div><input aria-invalid="false" id=":rm5:" name="cus_address" placeholder="บ้านเลขที่/ถนน/ซอย/หมู่บ้าน" type="text" class="MuiInputBase-input MuiOutlinedInput-input MuiInputBase-inputSizeSmall MuiInputBase-inputAdornedStart css-1y1qifh-MuiInputBase-input-MuiOutlinedInput-input" value=""><fieldset aria-hidden="true" class="MuiOutlinedInput-notchedOutline css-1v24f9t-MuiOutlinedInput-notchedOutline"><legend class="css-w1u3ce"><span>ที่อยู่</span></legend></fieldset></div></div></div><div class="MuiGrid-root MuiGrid-grid-md-6 css-dulzw9-MuiGrid-root" size="12"><div class="MuiFormControl-root MuiFormControl-fullWidth css-ytlejw-MuiFormControl-root"><label class="MuiFormLabel-root MuiInputLabel-root MuiInputLabel-formControl MuiInputLabel-animated MuiInputLabel-sizeSmall MuiInputLabel-outlined MuiFormLabel-colorPrimary MuiInputLabel-root MuiInputLabel-formControl MuiInputLabel-animated MuiInputLabel-sizeSmall MuiInputLabel-outlined css-1avtt59-MuiFormLabel-root-MuiInputLabel-root" data-shrink="false">จังหวัด</label><div class="MuiInputBase-root MuiOutlinedInput-root MuiInputBase-colorPrimary MuiInputBase-formControl MuiInputBase-sizeSmall css-phlunr-MuiInputBase-root-MuiOutlinedInput-root-MuiSelect-root"><div tabindex="0" role="combobox" aria-controls=":rm7:" aria-expanded="false" aria-haspopup="listbox" aria-labelledby="mui-component-select-cus_pro_id" id="mui-component-select-cus_pro_id" class="MuiSelect-select MuiSelect-outlined MuiInputBase-input MuiOutlinedInput-input MuiInputBase-inputSizeSmall css-1cru2we-MuiSelect-select-MuiInputBase-input-MuiOutlinedInput-input"><span class="notranslate" aria-hidden="true">​</span></div><input aria-invalid="false" name="cus_pro_id" aria-hidden="true" tabindex="-1" class="MuiSelect-nativeInput css-j0riat-MuiSelect-nativeInput" value=""><svg class="MuiSvgIcon-root MuiSvgIcon-fontSizeMedium MuiSelect-icon MuiSelect-iconOutlined css-ikpuqy-MuiSvgIcon-root-MuiSelect-icon" focusable="false" aria-hidden="true" viewBox="0 0 24 24" data-testid="ArrowDropDownIcon"><path d="M7 10l5 5 5-5z"></path></svg><fieldset aria-hidden="true" class="MuiOutlinedInput-notchedOutline css-1v24f9t-MuiOutlinedInput-notchedOutline"><legend class="css-81qg8w"><span>จังหวัด</span></legend></fieldset></div></div></div><div class="MuiGrid-root MuiGrid-grid-md-6 css-dulzw9-MuiGrid-root" size="12"><div class="MuiFormControl-root MuiFormControl-fullWidth css-ytlejw-MuiFormControl-root"><label class="MuiFormLabel-root MuiInputLabel-root MuiInputLabel-formControl MuiInputLabel-animated MuiInputLabel-sizeSmall MuiInputLabel-outlined MuiFormLabel-colorPrimary MuiInputLabel-root MuiInputLabel-formControl MuiInputLabel-animated MuiInputLabel-sizeSmall MuiInputLabel-outlined css-1avtt59-MuiFormLabel-root-MuiInputLabel-root" data-shrink="false">เขต/อำเภอ</label><div class="MuiInputBase-root MuiOutlinedInput-root MuiInputBase-colorPrimary MuiInputBase-formControl MuiInputBase-sizeSmall css-phlunr-MuiInputBase-root-MuiOutlinedInput-root-MuiSelect-root"><div tabindex="0" role="combobox" aria-controls=":rm9:" aria-expanded="false" aria-haspopup="listbox" aria-labelledby="mui-component-select-cus_dis_id" id="mui-component-select-cus_dis_id" class="MuiSelect-select MuiSelect-outlined MuiInputBase-input MuiOutlinedInput-input MuiInputBase-inputSizeSmall css-1cru2we-MuiSelect-select-MuiInputBase-input-MuiOutlinedInput-input"><span class="notranslate" aria-hidden="true">​</span></div><input aria-invalid="false" name="cus_dis_id" aria-hidden="true" tabindex="-1" class="MuiSelect-nativeInput css-j0riat-MuiSelect-nativeInput" value=""><svg class="MuiSvgIcon-root MuiSvgIcon-fontSizeMedium MuiSelect-icon MuiSelect-iconOutlined css-ikpuqy-MuiSvgIcon-root-MuiSelect-icon" focusable="false" aria-hidden="true" viewBox="0 0 24 24" data-testid="ArrowDropDownIcon"><path d="M7 10l5 5 5-5z"></path></svg><fieldset aria-hidden="true" class="MuiOutlinedInput-notchedOutline css-1v24f9t-MuiOutlinedInput-notchedOutline"><legend class="css-81qg8w"><span>เขต/อำเภอ</span></legend></fieldset></div></div></div><div class="MuiGrid-root MuiGrid-grid-md-6 css-dulzw9-MuiGrid-root" size="12"><div class="MuiFormControl-root MuiFormControl-fullWidth css-ytlejw-MuiFormControl-root"><label class="MuiFormLabel-root MuiInputLabel-root MuiInputLabel-formControl MuiInputLabel-animated MuiInputLabel-sizeSmall MuiInputLabel-outlined MuiFormLabel-colorPrimary MuiInputLabel-root MuiInputLabel-formControl MuiInputLabel-animated MuiInputLabel-sizeSmall MuiInputLabel-outlined css-1avtt59-MuiFormLabel-root-MuiInputLabel-root" data-shrink="false">แขวง/ตำบล</label><div class="MuiInputBase-root MuiOutlinedInput-root MuiInputBase-colorPrimary MuiInputBase-formControl MuiInputBase-sizeSmall css-phlunr-MuiInputBase-root-MuiOutlinedInput-root-MuiSelect-root"><div tabindex="0" role="combobox" aria-controls=":rmb:" aria-expanded="false" aria-haspopup="listbox" aria-labelledby="mui-component-select-cus_sub_id" id="mui-component-select-cus_sub_id" class="MuiSelect-select MuiSelect-outlined MuiInputBase-input MuiOutlinedInput-input MuiInputBase-inputSizeSmall css-1cru2we-MuiSelect-select-MuiInputBase-input-MuiOutlinedInput-input"><span class="notranslate" aria-hidden="true">​</span></div><input aria-invalid="false" name="cus_sub_id" aria-hidden="true" tabindex="-1" class="MuiSelect-nativeInput css-j0riat-MuiSelect-nativeInput" value=""><svg class="MuiSvgIcon-root MuiSvgIcon-fontSizeMedium MuiSelect-icon MuiSelect-iconOutlined css-ikpuqy-MuiSvgIcon-root-MuiSelect-icon" focusable="false" aria-hidden="true" viewBox="0 0 24 24" data-testid="ArrowDropDownIcon"><path d="M7 10l5 5 5-5z"></path></svg><fieldset aria-hidden="true" class="MuiOutlinedInput-notchedOutline css-1v24f9t-MuiOutlinedInput-notchedOutline"><legend class="css-81qg8w"><span>แขวง/ตำบล</span></legend></fieldset></div></div></div><div class="MuiGrid-root MuiGrid-grid-md-6 css-dulzw9-MuiGrid-root" size="12"><div class="MuiFormControl-root MuiFormControl-fullWidth MuiTextField-root css-ptfpl-MuiFormControl-root-MuiTextField-root"><label class="MuiFormLabel-root MuiInputLabel-root MuiInputLabel-formControl MuiInputLabel-animated MuiInputLabel-sizeSmall MuiInputLabel-outlined MuiFormLabel-colorPrimary MuiInputLabel-root MuiInputLabel-formControl MuiInputLabel-animated MuiInputLabel-sizeSmall MuiInputLabel-outlined css-1avtt59-MuiFormLabel-root-MuiInputLabel-root" data-shrink="false" for=":rmd:" id=":rmd:-label">รหัสไปรษณีย์</label><div class="MuiInputBase-root MuiOutlinedInput-root MuiInputBase-colorPrimary MuiInputBase-fullWidth MuiInputBase-formControl MuiInputBase-sizeSmall css-p8izd5-MuiInputBase-root-MuiOutlinedInput-root"><input aria-invalid="false" id=":rmd:" name="cus_zip_code" placeholder="รหัสไปรษณีย์" type="text" class="MuiInputBase-input MuiOutlinedInput-input MuiInputBase-inputSizeSmall css-1rl3ew7-MuiInputBase-input-MuiOutlinedInput-input" value=""><fieldset aria-hidden="true" class="MuiOutlinedInput-notchedOutline css-1v24f9t-MuiOutlinedInput-notchedOutline"><legend class="css-81qg8w"><span>รหัสไปรษณีย์</span></legend></fieldset></div></div></div></div>

<div class="MuiGrid-root MuiGrid-container MuiGrid-spacing-xs-2 css-1ntijh8-MuiGrid-root"><div class="MuiGrid-root css-vj1n65-MuiGrid-root" size="12"><div class="MuiFormControl-root MuiFormControl-fullWidth MuiTextField-root css-ptfpl-MuiFormControl-root-MuiTextField-root"><label class="MuiFormLabel-root MuiInputLabel-root MuiInputLabel-formControl MuiInputLabel-animated MuiInputLabel-sizeSmall MuiInputLabel-outlined MuiFormLabel-colorPrimary MuiInputLabel-root MuiInputLabel-formControl MuiInputLabel-animated MuiInputLabel-sizeSmall MuiInputLabel-outlined css-1avtt59-MuiFormLabel-root-MuiInputLabel-root" data-shrink="false" for=":rmf:" id=":rmf:-label">Note</label><div class="MuiInputBase-root MuiOutlinedInput-root MuiInputBase-colorPrimary MuiInputBase-fullWidth MuiInputBase-formControl MuiInputBase-sizeSmall MuiInputBase-multiline css-1vxk4mt-MuiInputBase-root-MuiOutlinedInput-root"><textarea aria-invalid="false" id=":rmf:" name="cd_note" class="MuiInputBase-input MuiOutlinedInput-input MuiInputBase-inputMultiline MuiInputBase-inputSizeSmall css-1cliafe-MuiInputBase-input-MuiOutlinedInput-input" style="height: 69px;"></textarea><textarea aria-hidden="true" class="MuiInputBase-input MuiOutlinedInput-input MuiInputBase-inputMultiline MuiInputBase-inputSizeSmall css-1cliafe-MuiInputBase-input-MuiOutlinedInput-input" readonly="" tabindex="-1" style="visibility: hidden; position: absolute; overflow: hidden; height: 0px; top: 0px; left: 0px; transform: translateZ(0px); padding-top: 0px; padding-bottom: 0px; width: 185px;"></textarea><fieldset aria-hidden="true" class="MuiOutlinedInput-notchedOutline css-1v24f9t-MuiOutlinedInput-notchedOutline"><legend class="css-81qg8w"><span>Note</span></legend></fieldset></div></div></div><div class="MuiGrid-root css-vj1n65-MuiGrid-root" size="12"><div class="MuiFormControl-root MuiFormControl-fullWidth MuiTextField-root css-ptfpl-MuiFormControl-root-MuiTextField-root"><label class="MuiFormLabel-root MuiInputLabel-root MuiInputLabel-formControl MuiInputLabel-animated MuiInputLabel-sizeSmall MuiInputLabel-outlined MuiFormLabel-colorPrimary MuiInputLabel-root MuiInputLabel-formControl MuiInputLabel-animated MuiInputLabel-sizeSmall MuiInputLabel-outlined css-1avtt59-MuiFormLabel-root-MuiInputLabel-root" data-shrink="false" for=":rmh:" id=":rmh:-label">รายละเอียดเพิ่มเติม</label><div class="MuiInputBase-root MuiOutlinedInput-root MuiInputBase-colorPrimary MuiInputBase-fullWidth MuiInputBase-formControl MuiInputBase-sizeSmall MuiInputBase-multiline css-1vxk4mt-MuiInputBase-root-MuiOutlinedInput-root"><textarea aria-invalid="false" id=":rmh:" name="cd_remark" class="MuiInputBase-input MuiOutlinedInput-input MuiInputBase-inputMultiline MuiInputBase-inputSizeSmall css-1cliafe-MuiInputBase-input-MuiOutlinedInput-input" style="height: 115px;"></textarea><textarea aria-hidden="true" class="MuiInputBase-input MuiOutlinedInput-input MuiInputBase-inputMultiline MuiInputBase-inputSizeSmall css-1cliafe-MuiInputBase-input-MuiOutlinedInput-input" readonly="" tabindex="-1" style="visibility: hidden; position: absolute; overflow: hidden; height: 0px; top: 0px; left: 0px; transform: translateZ(0px); padding-top: 0px; padding-bottom: 0px; width: 185px;"></textarea><fieldset aria-hidden="true" class="MuiOutlinedInput-notchedOutline css-1v24f9t-MuiOutlinedInput-notchedOutline"><legend class="css-81qg8w"><span>รายละเอียดเพิ่มเติม</span></legend></fieldset></div></div></div></div>
```
