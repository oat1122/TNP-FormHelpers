แก้ไข form view ข้อมูลลูกค้า ตามนี้
# Customer View Page Design - หน้าดูข้อมูลลูกค้า

## 🎯 แนวคิดการออกแบบ

### หลักการสำคัญ
1. **เน้นการอ่าน** - ไม่ใช่การกรอกข้อมูล
2. **จัดกลุ่มตามความสำคัญ** - ข้อมูลสำคัญอยู่ด้านบน
3. **Visual Hierarchy** - ใช้ขนาด สี และระยะห่างสร้างลำดับความสำคัญ
4. **Quick Actions** - ปุ่มที่จำเป็นอยู่ตำแหน่งที่หาง่าย

---

## 📱 Layout Structure

### Desktop Layout
```
┌─────────────────────────────────────────────────────────────┐
│ Header: ชื่อลูกค้า + Actions                                  │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ │
│ │   Company Info  │ │  Contact Info   │ │   Quick Stats   │ │
│ │   (Primary)     │ │   (Primary)     │ │   (Secondary)   │ │
│ └─────────────────┘ └─────────────────┘ └─────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────┐ ┌─────────────────┐ │
│ │           Address Info              │ │   Notes Panel   │ │
│ │          (Secondary)                │ │  (Collapsible)  │ │
│ └─────────────────────────────────────┘ └─────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Mobile Layout  
```
┌─────────────────────┐
│ Header + Actions    │
├─────────────────────┤
│ Company Info        │
├─────────────────────┤
│ Contact Info        │
├─────────────────────┤
│ Address Info        │
├─────────────────────┤
│ Notes (Collapsible) │
├─────────────────────┤
│ Quick Stats         │
└─────────────────────┘
```

---

## 🎨 Detailed Design

### 1. Header Section
```
┌─────────────────────────────────────────────────────────────┐
│ ← ย้อนกลับ                                    [แก้ไข]         │
├─────────────────────────────────────────────────────────────┤
│ 🏢 บริษัท ABC จำกัด                                         │
│    💼 ประเภท: ร้านค้าปลีก  📊 ช่องทาง: Sales               │
│    👤 ผู้ดูแล: สมชาย ใจดี   📅 สร้างเมื่อ: 15 ธ.ค. 2567     │
│                                                             │
│    ⏰ อัปเดตล่าสุด: 2 วันที่แล้ว                            │
└─────────────────────────────────────────────────────────────┘
```

### 2. Primary Information Cards

#### Company & Contact Info (2 คอลัมน์)
```
┌─────────────────────────────┐ ┌─────────────────────────────┐
│ 🏢 ข้อมูลบริษัท              │ │ 📞 ข้อมูลติดต่อ              │
├─────────────────────────────┤ ├─────────────────────────────┤
│                             │ │                             │
│ ชื่อบริษัท                   │ │ ผู้ติดต่อหลัก                │
│ บริษัท ABC จำกัด            │ │ สมชาย ใจดี                  │
│                             │ │                             │
│ ประเภทธุรกิจ                 │ │ ตำแหน่ง                     │
│ ร้านค้าปลีก                 │ │ ผู้จัดการฝ่ายขาย            │
│                             │ │                             │
│ ช่องทางติดต่อ                │ │ เบอร์โทรศัพท์                │
│ Sales                      │ │ 📱 081-234-5678            │
│                             │ │ 📞 089-876-5432 (สำรอง)   │
│ ผู้ดูแลลูกค้า                │ │                             │
│ สมชาย ใจดี                  │ │ อีเมล                       │
│                             │ │ ✉️ contact@abc.co.th       │
│                             │ │                             │
│                             │ │ เลขผู้เสียภาษี               │
│                             │ │ 🏛️ 1234567890123          │
└─────────────────────────────┘ └─────────────────────────────┘
```

### 3. Secondary Information

#### Address Information (Full Width)
```
┌─────────────────────────────────────────────────────────────┐
│ 📍 ที่อยู่                                                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ที่อยู่                                                      │
│ 123/45 ถนนสุขุมวิท แขวงคลองตัน เขตวัฒนา                      │
│                                                             │
│ รายละเอียดที่ตั้ง                                             │
│ 📍 แขวงคลองตัน เขตวัฒนา กรุงเทพมหานคร 10110                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 4. Notes Panel (Collapsible)
```
┌─────────────────────────────────────────────────────────────┐
│ 📝 บันทึกและหมายเหตุ                              [▼ ดูเพิ่ม] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ⚠️ หมายเหตุสำคัญ                                             │
│ ลูกค้าต้องการติดต่อช่วงบ่าย หลัง 14:00 น. เท่านั้น           │
│                                                             │
│ 📋 รายละเอียดเพิ่มเติม                                       │
│ - เป็นลูกค้าประจำมา 3 ปี                                     │
│ - สั่งซื้อสินค้าเฉลี่ย 50,000 บาท/เดือน                      │
│ - ชอบสินค้าคุณภาพดี ราคาไม่แพงเกินไป                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 5. Quick Stats Sidebar
```
┌─────────────────────┐
│ 📊 สถิติสำคัญ        │
├─────────────────────┤
│                     │
│ 👥 ลูกค้าตั้งแต่      │
│ 15 ธ.ค. 2567        │
│                     │
│ 📈 อัปเดตล่าสุด     │
│ 2 วันที่แล้ว        │
│                     │
│ 🏷️ รหัสลูกค้า       │
│ CUS-2024-001       │
│                     │
│ 📋 กลุ่มลูกค้า       │
│ VIP Premium        │
│                     │
│ 🎯 สถานะ            │
│ ✅ ใช้งานปกติ        │
│                     │
└─────────────────────┘
```

---

## 🎨 Visual Design System

### Color Scheme
```
Primary Colors:
- ข้อมูลสำคัญ: #1976d2 (Blue)
- Status ดี: #4caf50 (Green)  
- คำเตือน: #ff9800 (Orange)
- ข้อผิดพลาด: #f44336 (Red)

Background:
- Card Background: #ffffff
- Page Background: #f8f9fa
- Section Divider: #e0e0e0

Text:
- Primary Text: #212121
- Secondary Text: #757575
- Caption Text: #9e9e9e
```

### Typography Scale
```
Header Title: 24px, Bold
Section Title: 18px, Medium
Field Label: 14px, Medium
Field Value: 16px, Regular
Caption: 12px, Regular
```

### Spacing System
```
Section Spacing: 24px
Card Padding: 20px
Field Spacing: 16px
Icon Margin: 8px
```

---

## 🔧 Component Structure

### CustomerViewPage.jsx
```jsx
const CustomerViewPage = ({ customerData, onEdit, onExport, onBack }) => {
  return (
    <Box sx={{ bgcolor: '#f8f9fa', minHeight: '100vh' }}>
      {/* Header */}
      <CustomerViewHeader />
      
      {/* Main Content */}
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Grid container spacing={3}>
          {/* Primary Info */}
          <Grid item xs={12} md={8}>
            <Stack spacing={3}>
              <CompanyInfoCard />
              <ContactInfoCard />
              <AddressInfoCard />
              <NotesPanel />
            </Stack>
          </Grid>
          
          {/* Sidebar */}
          <Grid item xs={12} md={4}>
            <QuickStatsCard />
          </Grid>
        </Grid>
      </Container>
    </Box>
  )
}
```

### CompanyInfoCard.jsx
```jsx
const CompanyInfoCard = ({ data }) => {
  return (
    <Card elevation={1} sx={{ borderRadius: 2 }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <BusinessIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6" fontWeight={600}>
            ข้อมูลบริษัท
          </Typography>
        </Box>
        
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <InfoField 
              label="ชื่อบริษัท"
              value={data.cus_company}
              variant="primary"
            />
          </Grid>
          <Grid item xs={6}>
            <InfoField 
              label="ประเภทธุรกิจ"
              value={data.businessType?.bt_name}
            />
          </Grid>
          <Grid item xs={6}>
            <InfoField 
              label="ช่องทางติดต่อ"
              value={data.cus_channel}
            />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  )
}
```

### InfoField.jsx  
```jsx
const InfoField = ({ label, value, variant = 'default', icon }) => {
  return (
    <Box sx={{ mb: 2 }}>
      <Typography 
        variant="caption" 
        sx={{ 
          color: 'text.secondary',
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          fontWeight: 500
        }}
      >
        {label}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
        {icon && <Box sx={{ mr: 1 }}>{icon}</Box>}
        <Typography 
          variant={variant === 'primary' ? 'h6' : 'body1'}
          sx={{ 
            fontWeight: variant === 'primary' ? 600 : 400,
            color: variant === 'primary' ? 'primary.main' : 'text.primary'
          }}
        >
          {value || '-'}
        </Typography>
      </Box>
    </Box>
  )
}
```

---

## 📱 Responsive Behavior

### Breakpoints
```
xs: 0px    - Mobile (Stack everything)
sm: 600px  - Tablet (2 columns for some sections)  
md: 900px  - Desktop (3 columns + sidebar)
lg: 1200px - Large Desktop (Full layout)
```

### Mobile Adaptations
1. **Header**: Stack title และ actions
2. **Cards**: Full width, stack vertically
3. **Info Fields**: Single column layout
4. **Actions**: Floating action button
5. **Notes**: Always collapsed by default

---

## 🚀 Interactive Features

### 1. Quick Actions
```
Actions Bar:
[แก้ไข] [ส่งออก PDF] [ส่งออก Excel] [พิมพ์] [ลบ]
```

### 2. Smart Links
- เบอร์โทร → เปิด dialer
- อีเมล → เปิด email client  
- ที่อยู่ → เปิด Google Maps

### 3. Copy to Clipboard
- คลิกข้อมูลแล้วคัดลอกได้ (เบอร์โทร, อีเมล, รหัสผู้เสียภาษี)

### 4. Timeline (Optional)
```
┌─────────────────────────────────┐
│ 📅 ประวัติการอัปเดต              │
├─────────────────────────────────┤
│ 🔄 2 วันที่แล้ว                 │
│    แก้ไขเบอร์โทรศัพท์            │
│                                 │
│ 📝 1 สัปดาห์ที่แล้ว             │
│    เพิ่มหมายเหตุสำคัญ            │
│                                 │
│ ➕ 1 เดือนที่แล้ว                │
│    สร้างข้อมูลลูกค้า             │
└─────────────────────────────────┘
```

---

## ✅ Implementation Checklist

### Phase 1: Basic View
- [ ] CustomerViewPage component
- [ ] InfoField reusable component  
- [ ] CompanyInfoCard
- [ ] ContactInfoCard
- [ ] Basic responsive layout

### Phase 2: Enhanced UX
- [ ] AddressInfoCard with map integration
- [ ] NotesPanel with expand/collapse
- [ ] QuickStatsCard
- [ ] Action buttons functionality

### Phase 3: Advanced Features  
- [ ] Smart links (tel:, mailto:, maps)
- [ ] Copy to clipboard
- [ ] Export functionality
- [ ] Print-friendly view
- [ ] Timeline/history (optional)

---

## 🎯 Success Metrics

### User Experience Goals
- ผู้ใช้หาข้อมูลที่ต้องการภายใน 5 วินาที
- ลดการคลิกเพื่อดูข้อมูลจาก 3-4 คลิก เหลือ 1-2 คลิก
- เพิ่มการใช้งานบนมือถือ 40%
- Accessibility score ≥ 90%

### Technical Goals  
- Page load time < 2 วินาที
- Mobile responsiveness score 100%
- No layout shift (CLS = 0)
- SEO friendly structure