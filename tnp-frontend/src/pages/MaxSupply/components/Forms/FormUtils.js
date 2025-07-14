import dayjs from 'dayjs';

// Process worksheet data from API
export const processWorksheetData = (data) => {
  if (!data) return [];
  
  try {
    let worksheetItems = [];
    
    if (Array.isArray(data)) {
      worksheetItems = data;
    } else if (data.data && Array.isArray(data.data)) {
      worksheetItems = data.data;
    } else if (typeof data === 'object') {
      const arrayProps = Object.keys(data).filter(key => Array.isArray(data[key]));
      if (arrayProps.length > 0) {
        worksheetItems = data[arrayProps[0]];
      }
    }
    
    // Generate unique IDs and labels for worksheets
    return worksheetItems
      .filter(ws => ws && (ws.worksheet_id || ws.id || ws.work_id))
      .filter(ws => ws.has_production !== true)
      .map((ws, index) => {
        // Create a unique ID for each worksheet
        const worksheetId = ws.worksheet_id || ws.id || ws.work_id || `ws-${index}`;
        const uniqueId = `${worksheetId}-${index}`;
        
        // Create a descriptive label
        const customerName = ws.customer_name || 'ไม่ระบุ';
        const productName = ws.product_name || ws.work_name || ws.title || 'ไม่ระบุ';
        let label = `${customerName} - ${productName}`;
        
        // Add some additional identification if available
        if (ws.work_id) {
          label += ` (ID: ${ws.work_id})`;
        }
        if (ws.created_at) {
          const createdDate = dayjs(ws.created_at).format('DD/MM/YYYY');
          label += ` - ${createdDate}`;
        }
        
        return {
          id: uniqueId,
          originalId: worksheetId,
          label: label,
          ...ws,
        };
      });
  } catch (error) {
    console.error('Error processing worksheet data:', error);
    return [];
  }
};

// Parse print locations from worksheet data
export const parsePrintLocations = (worksheet) => {
  const printLocations = {
    screen: { enabled: false, position: '', points: 0 },
    dtf: { enabled: false, position: '', points: 0 },
    sublimation: { enabled: false, position: '', points: 0 },
    embroidery: { enabled: false, position: '', points: 0 },
  };
  
  if (import.meta.env.DEV) {
    console.log('Parsing print locations from NewWorksNet:', worksheet);
  }
  
  // Parse screen details from NewWorksNet format
  if (worksheet.screen_detail) {
    const screenDetail = worksheet.screen_detail.toLowerCase();
    
    // Extract positions from screen_detail
    const extractPositions = (text) => {
      const positions = [];
      if (text.includes('หน้า') || text.includes('ด้านหน้า')) positions.push('หน้า');
      if (text.includes('หลัง') || text.includes('ด้านหลัง')) positions.push('หลัง');
      if (text.includes('แขน')) positions.push('แขน');
      if (text.includes('ข้าง')) positions.push('ข้าง');
      if (text.includes('คอ')) positions.push('คอ');
      return positions.join(', ') || 'ไม่ระบุ';
    };
    
    // Check for DTF/DFT printing - use screen_dft as print points
    if ((screenDetail.includes('dtf') || screenDetail.includes('dft')) && worksheet.screen_dft) {
      printLocations.dtf.enabled = true;
      printLocations.dtf.points = parseInt(worksheet.screen_dft) || 0;
      printLocations.dtf.position = extractPositions(screenDetail);
      if (import.meta.env.DEV) {
        console.log('DTF enabled with points:', printLocations.dtf.points);
      }
    }
    
    // Check for Screen printing - use screen_point as print points
    if (screenDetail.includes('สกรีน') && worksheet.screen_point) {
      printLocations.screen.enabled = true;
      printLocations.screen.points = parseInt(worksheet.screen_point) || 0;
      printLocations.screen.position = extractPositions(screenDetail);
      if (import.meta.env.DEV) {
        console.log('Screen enabled with points:', printLocations.screen.points);
      }
    }
    
    // Check for Embroidery - use screen_embroider as print points
    if ((screenDetail.includes('ปัก') || screenDetail.includes('embroider')) && worksheet.screen_embroider) {
      printLocations.embroidery.enabled = true;
      printLocations.embroidery.points = parseInt(worksheet.screen_embroider) || 1;
      printLocations.embroidery.position = extractPositions(screenDetail);
      if (import.meta.env.DEV) {
        console.log('Embroidery enabled with points:', printLocations.embroidery.points);
      }
    }
    
    // Check for Flex/Vinyl - use screen_flex as print points
    if (screenDetail.includes('flex') && worksheet.screen_flex) {
      // Use sublimation slot for flex printing
      printLocations.sublimation.enabled = true;
      printLocations.sublimation.points = parseInt(worksheet.screen_flex) || 0;
      printLocations.sublimation.position = extractPositions(screenDetail);
      if (import.meta.env.DEV) {
        console.log('Flex/Sublimation enabled with points:', printLocations.sublimation.points);
      }
    }
  }
  
  // Important: Enable printing types based on available point fields even without screen_detail
  // This handles cases where NewWorksNet has point data but no detailed description
  if (!printLocations.dtf.enabled && worksheet.screen_dft && parseInt(worksheet.screen_dft) > 0) {
    printLocations.dtf.enabled = true;
    printLocations.dtf.points = parseInt(worksheet.screen_dft);
    printLocations.dtf.position = 'ไม่ระบุ';
    if (import.meta.env.DEV) {
      console.log('DTF fallback enabled with points:', printLocations.dtf.points);
    }
  }
  
  if (!printLocations.screen.enabled && worksheet.screen_point && parseInt(worksheet.screen_point) > 0) {
    printLocations.screen.enabled = true;
    printLocations.screen.points = parseInt(worksheet.screen_point);
    printLocations.screen.position = 'ไม่ระบุ';
    if (import.meta.env.DEV) {
      console.log('Screen fallback enabled with points:', printLocations.screen.points);
    }
  }
  
  if (!printLocations.embroidery.enabled && worksheet.screen_embroider && parseInt(worksheet.screen_embroider) > 0) {
    printLocations.embroidery.enabled = true;
    printLocations.embroidery.points = parseInt(worksheet.screen_embroider);
    printLocations.embroidery.position = 'ไม่ระบุ';
    if (import.meta.env.DEV) {
      console.log('Embroidery fallback enabled with points:', printLocations.embroidery.points);
    }
  }
  
  if (!printLocations.sublimation.enabled && worksheet.screen_flex && parseInt(worksheet.screen_flex) > 0) {
    printLocations.sublimation.enabled = true;
    printLocations.sublimation.points = parseInt(worksheet.screen_flex);
    printLocations.sublimation.position = 'ไม่ระบุ';
    if (import.meta.env.DEV) {
      console.log('Sublimation fallback enabled with points:', printLocations.sublimation.points);
    }
  }
  
  return printLocations;
};

// Parse size breakdown from worksheet data
export const parseSizeBreakdown = (worksheet) => {
  const sizeBreakdown = [];
  
  if (!worksheet) return sizeBreakdown;
  
  // Parse size data from NewWorksNet format
  const sizeFields = ['size_xs', 'size_s', 'size_m', 'size_l', 'size_xl', 'size_xxl', 'size_xxxl'];
  const sizeLabels = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
  
  sizeFields.forEach((field, index) => {
    const quantity = parseInt(worksheet[field]) || 0;
    if (quantity > 0) {
      sizeBreakdown.push({
        size: sizeLabels[index],
        quantity: quantity,
      });
    }
  });
  
  return sizeBreakdown;
};

// Map shirt types from worksheet data
export const mapShirtType = (typeShirt) => {
  if (!typeShirt) return '';
  
  const typeLower = typeShirt.toLowerCase();
  
  // Map different variations to standard types
  if (typeLower.includes('polo')) return 'polo';
  if (typeLower.includes('เสื้อยืด') || typeLower.includes('t-shirt') || typeLower.includes('tshirt')) return 't-shirt';
  if (typeLower.includes('hoodie') || typeLower.includes('ฮู')) return 'hoodie';
  if (typeLower.includes('กล้าม') || typeLower.includes('tank')) return 'tank-top';
  
  return typeShirt; // Return original if no match found
};

// Determine production type from worksheet data
export const determineProductionType = (worksheet) => {
  const printLocations = parsePrintLocations(worksheet);
  
  // Priority order: screen > dtf > sublimation > embroidery
  if (printLocations.screen.enabled && printLocations.screen.points > 0) {
    return 'screen';
  }
  if (printLocations.dtf.enabled && printLocations.dtf.points > 0) {
    return 'dtf';
  }
  if (printLocations.sublimation.enabled && printLocations.sublimation.points > 0) {
    return 'sublimation';
  }
  if (printLocations.embroidery.enabled && printLocations.embroidery.points > 0) {
    return 'embroidery';
  }
  
  return 'screen'; // Default fallback
};

// Form validation
export const validateStep = (step, formData) => {
  const newErrors = {};
  
  switch (step) {
    case 0: // Basic Info
      if (!formData.worksheet_id) {
        newErrors.worksheet_id = 'กรุณาเลือก Worksheet';
      }
      if (!formData.title?.trim()) {
        newErrors.title = 'กรุณาระบุชื่อเรื่อง';
      }
      if (!formData.customer_name?.trim()) {
        newErrors.customer_name = 'กรุณาระบุชื่อลูกค้า';
      }
      if (!formData.start_date) {
        newErrors.start_date = 'กรุณาระบุวันที่เริ่ม';
      }
      if (!formData.expected_completion_date) {
        newErrors.expected_completion_date = 'กรุณาระบุวันที่คาดว่าจะเสร็จ';
      }
      if (!formData.priority) {
        newErrors.priority = 'กรุณาระบุระดับความสำคัญ';
      }
      break;
      
    case 1: // Production Info
      if (!formData.production_type) {
        newErrors.production_type = 'กรุณาเลือกประเภทการผลิต';
      }
      if (!formData.shirt_type) {
        newErrors.shirt_type = 'กรุณาเลือกประเภทเสื้อ';
      }
      if (!formData.total_quantity || formData.total_quantity <= 0) {
        newErrors.total_quantity = 'กรุณาระบุจำนวนที่ถูกต้อง';
      }
      if (!formData.size_breakdown || formData.size_breakdown.length === 0) {
        newErrors.size_breakdown = 'กรุณาระบุรายละเอียดไซต์';
      }
      break;
      
    case 2: // Notes
      // Optional step - no required fields
      break;
      
    default:
      break;
  }
  
  return newErrors;
}; 