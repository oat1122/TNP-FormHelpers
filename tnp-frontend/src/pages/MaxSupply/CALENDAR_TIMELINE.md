# Calendar Timeline System

## Overview
ระบบ Calendar Timeline ใหม่ที่ปรับปรุงแล้ว ออกแบบมาให้แสดงงานผลิตในรูปแบบ timeline bars ที่ข้ามหลายวัน พร้อม UX/UI ที่ดีกว่าเดิม

## Core Features

### 🎯 **Timeline Bar System**
- **EventTimelineBar Component**: แทนที่ EventCard เดิม
- **Multi-day spanning**: Timeline bars ที่ข้ามหลายวัน
- **Row-based layout**: จัดการ events ไม่ให้ซ้อนทับกัน
- **Auto-positioning**: คำนวณตำแหน่งและขนาดอัตโนมัติ

### 🎨 **Visual Design**
- **Color scheme**: 
  - Screen: `#7c3aed` (Purple)
  - DTF: `#0ea5e9` (Blue)
  - Sublimation: `#16a34a` (Green)
  - Embroidery: `#dc2626` (Red)
- **Hover effects**: Shadow, transform, และ z-index animation
- **Tooltips**: แสดงรายละเอียดเมื่อ hover
- **Badge indicators**: แสดงจำนวนงานในแต่ละวัน

### 📊 **Layout System**
- **Grid overlay**: Absolute positioning บน calendar grid
- **28px row height**: เพื่อให้ timeline bars ไม่ซ้อนทับ
- **Responsive spacing**: ปรับขนาดตามหน้าจอ
- **Legend**: แสดงประเภทงานผลิต

## Technical Implementation

### 1. **Timeline Calculation Algorithm**
```javascript
const calculateEventTimeline = (event, calendarDays) => {
  const eventStart = new Date(event.start_date);
  const eventEnd = new Date(event.expected_completion_date);
  
  // Find positions in calendar
  const startIndex = calendarDays.findIndex(day => 
    format(day, 'yyyy-MM-dd') === format(eventStart, 'yyyy-MM-dd')
  );
  const endIndex = calendarDays.findIndex(day => 
    format(day, 'yyyy-MM-dd') === format(eventEnd, 'yyyy-MM-dd')
  );

  // Calculate position and width
  const actualStart = Math.max(0, startIndex);
  const actualEnd = Math.min(calendarDays.length - 1, endIndex >= 0 ? endIndex : startIndex);
  const width = actualEnd - actualStart + 1;

  return {
    startCol: actualStart,
    width,
    event,
  };
};
```

### 2. **Row Organization Algorithm**
```javascript
const organizeEventsInRows = (events, calendarDays) => {
  const timelines = events
    .map(event => calculateEventTimeline(event, calendarDays))
    .filter(Boolean);

  const rows = [];
  
  timelines.forEach(timeline => {
    let placed = false;
    
    // Try to place in existing rows
    for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
      const row = rows[rowIndex];
      const hasOverlap = row.some(existingTimeline => {
        const existingEnd = existingTimeline.startCol + existingTimeline.width - 1;
        const currentEnd = timeline.startCol + timeline.width - 1;
        
        return !(existingEnd < timeline.startCol || currentEnd < existingTimeline.startCol);
      });
      
      if (!hasOverlap) {
        row.push(timeline);
        placed = true;
        break;
      }
    }
    
    // If no suitable row found, create new row
    if (!placed) {
      rows.push([timeline]);
    }
  });

  return rows;
};
```

### 3. **EventTimelineBar Component**
```javascript
const EventTimelineBar = ({ timeline, rowIndex }) => {
  const event = timeline.event;
  const bgColor = productionColors[event.production_type];
  const duration = differenceInDays(new Date(event.expected_completion_date), new Date(event.start_date)) + 1;
  
  return (
    <Tooltip
      title={/* Rich tooltip content */}
      placement="top"
      arrow
    >
      <Box
        onClick={() => handleEventClick(event)}
        sx={{
          position: 'absolute',
          left: `${(timeline.startCol / 7) * 100}%`,
          width: `${(timeline.width / 7) * 100}%`,
          height: 24,
          top: rowIndex * 28,
          backgroundColor: bgColor,
          borderRadius: 1,
          // ... hover effects
        }}
      >
        <Typography variant="caption">
          {productionIcons[event.production_type]} {event.title}
        </Typography>
      </Box>
    </Tooltip>
  );
};
```

## Grid Overlay System

### **Calendar Structure**
```jsx
<Box sx={{ position: 'relative' }}>
  {/* Calendar grid */}
  <Grid container spacing={1}>
    {/* Day cells */}
  </Grid>

  {/* Timeline overlay */}
  <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
    {eventRows.map((row, rowIndex) =>
      row.map((timeline, timelineIndex) => (
        <Box key={`${rowIndex}-${timelineIndex}`}>
          <EventTimelineBar timeline={timeline} rowIndex={rowIndex} />
        </Box>
      ))
    )}
  </Box>
</Box>
```

### **Positioning Logic**
- **Horizontal**: `left: ${(timeline.startCol / 7) * 100}%`
- **Width**: `width: ${(timeline.width / 7) * 100}%`
- **Vertical**: `top: 40 + rowIndex * 28` (40px for date, 28px per row)

## Color Scheme & Icons

### **Production Types**
| Type | Color | Icon | Description |
|------|-------|------|-------------|
| Screen | `#7c3aed` | 📺 | Screen Printing |
| DTF | `#0ea5e9` | 📱 | Direct Film Transfer |
| Sublimation | `#16a34a` | ⚽ | Sublimation Printing |
| Embroidery | `#dc2626` | 🧵 | Embroidery Work |

### **Status Colors**
| Status | Color | Label |
|--------|-------|-------|
| Pending | `#f59e0b` | 🟡 รอเริ่ม |
| In Progress | `#3b82f6` | 🔵 กำลังผลิต |
| Completed | `#10b981` | 🟢 เสร็จสิ้น |
| Cancelled | `#ef4444` | 🔴 ยกเลิก |

## User Experience Features

### **Interactive Elements**
- **Hover Effects**: Transform, shadow, และ z-index changes
- **Tooltips**: แสดงรายละเอียดโดยไม่ต้องคลิก
- **Click Navigation**: คลิกเพื่อดูรายละเอียดเต็ม
- **Badge Indicators**: แสดงจำนวนงานในแต่ละวัน

### **Responsive Design**
- **Mobile**: ปรับขนาด timeline bars และ tooltips
- **Tablet**: Layout ที่เหมาะสม
- **Desktop**: เต็มรูปแบบพร้อม hover effects

### **Loading States**
- **Mock Data**: สำหรับ development และ testing
- **Loading Indicators**: แสดงสถานะการโหลด
- **Error Handling**: จัดการข้อผิดพลาด

## Usage Examples

### **Basic Timeline**
```javascript
// Event data
const event = {
  id: 1,
  title: 'เสื้อโปโล ABC Company',
  production_type: 'screen',
  start_date: '2025-01-15',
  expected_completion_date: '2025-01-18',
  total_quantity: 500,
};

// Timeline calculation
const timeline = calculateEventTimeline(event, calendarDays);
// Result: { startCol: 2, width: 4, event: {...} }
```

### **Multi-Event Layout**
```javascript
const events = [
  { start_date: '2025-01-15', expected_completion_date: '2025-01-18' },
  { start_date: '2025-01-16', expected_completion_date: '2025-01-22' },
  { start_date: '2025-01-20', expected_completion_date: '2025-01-25' },
];

const eventRows = organizeEventsInRows(events, calendarDays);
// Result: [
//   [timeline1, timeline3],  // Row 0
//   [timeline2]              // Row 1
// ]
```

## Performance Considerations

### **Optimization**
- **Memoization**: ใช้ `useMemo` สำหรับ timeline calculations
- **Lazy Loading**: โหลดข้อมูลตามความจำเป็น
- **Debounced Filters**: ป้องกันการเรียก API บ่อยเกินไป

### **Scalability**
- **Virtualization**: สำหรับ large datasets
- **Pagination**: แบ่งข้อมูลเป็นหน้า
- **Caching**: เก็บ timeline calculations

## Testing

### **Unit Tests**
- Timeline calculation algorithm
- Row organization logic
- Event positioning

### **Integration Tests**
- Calendar view rendering
- Event interaction
- Filter functionality

### **E2E Tests**
- User workflow
- Responsive behavior
- Performance benchmarks

## Browser Compatibility

### **Supported Browsers**
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### **Fallbacks**
- CSS Grid fallback
- Tooltip polyfill
- Date-fns locale support

## Future Enhancements

### **Planned Features**
- **Drag & Drop**: ย้าย events ระหว่างวัน
- **Resize**: ปรับขนาด timeline bars
- **Multi-Select**: เลือกหลาย events
- **Keyboard Navigation**: ใช้คีย์บอร์ดนำทาง

### **Technical Improvements**
- **Virtual Scrolling**: สำหรับ large datasets
- **WebWorker**: สำหรับ heavy calculations
- **PWA Support**: Offline functionality

## Maintenance Notes

### **Code Structure**
- **Modular Design**: แต่ละ component แยกหน้าที่ชัดเจน
- **TypeScript**: พิจารณาเพิ่ม type safety
- **Documentation**: Comments และ JSDoc

### **Performance Monitoring**
- **Bundle Size**: ติดตามขนาดไฟล์
- **Render Performance**: วัดเวลาการแสดงผล
- **Memory Usage**: ตรวจสอบการใช้หน่วยความจำ

---

## Migration Guide

### **From EventCard to EventTimelineBar**
1. Update imports
2. Replace EventCard usage
3. Add timeline calculation
4. Update styling

### **Breaking Changes**
- Event data structure changes
- CSS class name changes
- API response format updates

---

*Last updated: January 2025* 