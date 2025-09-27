// Import React for the hook
import React from "react";

// Translation utilities for MaxSupply form
export const translations = {
  th: {
    // Headers
    title: "สร้างงาน Max Supply ใหม่",
    editTitle: "แก้ไขงาน Max Supply",
    back: "กลับ",

    // Steps
    stepBasicInfo: "ข้อมูลพื้นฐาน",
    stepBasicInfoDesc: "เลือก Worksheet และกรอกข้อมูลพื้นฐาน",
    stepProductionInfo: "ข้อมูลการผลิต",
    stepProductionInfoDesc: "กำหนดรายละเอียดการผลิตและจุดพิมพ์",
    stepNotes: "หมายเหตุ",
    stepNotesDesc: "เพิ่มหมายเหตุและข้อมูลเพิ่มเติม",

    // Navigation
    previous: "ย้อนกลับ",
    next: "ถัดไป",
    cancel: "ยกเลิก",
    save: "บันทึก",
    create: "สร้างงาน",
    update: "อัปเดต",
    saving: "กำลังบันทึก...",

    // Form fields
    worksheet: "เลือก Worksheet",
    title_field: "ชื่องาน",
    customer: "ชื่อลูกค้า",
    productionType: "ประเภทการผลิต",
    startDate: "วันที่เริ่มงาน",
    expectedCompletion: "วันที่คาดว่าจะเสร็จ",
    dueDate: "วันครบกำหนด",
    shirtType: "ประเภทเสื้อ",
    totalQuantity: "จำนวนรวม",
    priority: "ระดับความสำคัญ",
    notes: "หมายเหตุ",
    specialInstructions: "คำแนะนำพิเศษ",

    // Priority levels
    lowPriority: "ต่ำ",
    normalPriority: "ปกติ",
    highPriority: "สูง",
    urgentPriority: "ด่วน",

    // Shirt types
    polo: "เสื้อโปโล",
    tshirt: "เสื้อยืด",
    hoodie: "เสื้อฮูดี้",
    tankTop: "เสื้อกล้าม",

    // Production types
    screen: "Screen Printing",
    dtf: "DTF (Direct Film Transfer)",
    sublimation: "Sublimation",

    // Language toggle
    language: "ภาษา",
    thai: "ไทย",
    myanmar: "မြန်မာ",

    // Messages
    autoFillMessage: "ข้อมูลถูกกรอกอัตโนมัติจาก NewWorkSheet:",
    customerLabel: "ลูกค้า:",
    quantityLabel: "จำนวน:",
    typeLabel: "ประเภท:",
    dueDateLabel: "ครบกำหนด:",
    codeLabel: "รหัส:",
    fabricLabel: "ผ้า:",
    pieces: "ตัว",

    // Additional UI elements
    refreshInstructions: "วิธีการใช้งาน:",
    refreshStep1: "คลิกปุ่มรีเฟรช",
    refreshStep2: "เลือกรายการที่ต้องการจากรายการ NewWorkSheet ด้านบน",
    refreshStep3: "ระบบจะกรอกข้อมูลให้อัตโนมัติตามข้อมูลที่มีใน NewWorkSheet",
    refreshToGetLatestData: "เพื่อดึงข้อมูลล่าสุดจากระบบ NewWorkSheet",

    // Date fields
    scheduleTime: "กำหนดเวลา",
    startDateCurrent: "วันที่เริ่มต้น (วันที่ปัจจุบัน)",
    startDateHelper: "วันที่เริ่มต้นงาน (ตั้งเป็นวันที่ปัจจุบัน)",
    expectedCompletionDate: "วันที่คาดว่าจะเสร็จ",
    dueDateFromNewWorks: "วันที่ครบกำหนดจาก NewWorksNet",

    // Print types
    printType: "ประเภทการพิมพ์",
    printTypeSelection: "เลือกประเภทการพิมพ์",

    // Worksheet selector
    noWorksheetSelected: "ยังไม่ได้เลือก Worksheet",
    selectWorksheet: "เลือก Worksheet",
    worksheetRequired: "กรุณาเลือก Worksheet",
    refreshWorksheets: "รีเฟรช Worksheet",
    loadingWorksheets: "กำลังโหลด Worksheet...",

    // Basic info
    basicInformation: "ข้อมูลพื้นฐาน",
    titleRequired: "กรุณาใส่ชื่องาน",
    customerRequired: "กรุณาใส่ชื่อลูกค้า",

    // Production info
    productionDetails: "รายละเอียดการผลิต",
    shirtTypeRequired: "กรุณาเลือกประเภทเสื้อ",
    productionTypeRequired: "กรุณาเลือกประเภทการผลิต",
    quantityRequired: "กรุณาใส่จำนวน",

    // Sizes
    sizeBreakdown: "แยกตามไซส์",
    size: "ไซส์",
    quantity: "จำนวน",
    totalPieces: "รวมทั้งหมด",

    // Sample image
    sampleImage: "รูปตัวอย่าง",
    uploadImage: "อัปโหลดรูป",
    noImageUploaded: "ยังไม่ได้อัปโหลดรูป",

    // Work calculation
    workCalculationByType: "การคำนวณงานแต่ละประเภทการพิมพ์",
    workCalculationFromWorksheet: "การคำนวณงานจาก WorkSheet:",
    screenPrintingWork: "งาน Screen Printing มีงาน",
    dtfWork: "งาน DTF มีงาน",
    sublimationWork: "งาน Sublimation มีงาน",
    embroideryWork: "งาน Embroidery มีงาน",
    pointsLabel: "จุด",
    totalShirts: "เสื้อทั้งหมด",
    calculationFormula: "({points}×{total}={result})",
  },

  my: {
    // Headers
    title: "Max Supply အလုပ်အသစ် ဖန်တီးရန်",
    editTitle: "Max Supply အလုပ် တည်းဖြတ်ရန်",
    back: "နောက်သို့",

    // Steps
    stepBasicInfo: "အခြေခံအချက်အလက်",
    stepBasicInfoDesc: "Worksheet ရွေးချယ်ပြီး အခြေခံအချက်အလက် ဖြည့်စွက်ရန်",
    stepProductionInfo: "ထုတ်လုပ်မှုအချက်အလက်",
    stepProductionInfoDesc: "ထုတ်လုပ်မှုအသေးစိတ်နှင့် ပရင့်နေရာများ သတ်မှတ်ရန်",
    stepNotes: "မှတ်စုများ",
    stepNotesDesc: "မှတ်စုများနှင့် နောက်ထပ်အချက်အလက်များ ထည့်ရန်",

    // Navigation
    previous: "ယခင်",
    next: "နောက်တစ်ခု",
    cancel: "ပယ်ဖျက်ရန်",
    save: "သိမ်းရန်",
    create: "အလုပ်ဖန်တီးရန်",
    update: "မွမ်းမံရန်",
    saving: "သိမ်းနေသည်...",

    // Form fields
    worksheet: "Worksheet ရွေးချယ်ရန်",
    title_field: "အလုပ်အမည်",
    customer: "ဖောက်သည်အမည်",
    productionType: "ထုတ်လုပ်မှုအမျိုးအစား",
    startDate: "စတင်သည့်ရက်စွဲ",
    expectedCompletion: "ပြီးမြောက်ရန် မျှော်လင့်သောရက်စွဲ",
    dueDate: "ကာလဆုံးရက်စွဲ",
    shirtType: "အင်္ကျီအမျိုးအစား",
    totalQuantity: "စုစုပေါင်းအရေအတွက်",
    priority: "ဦးစားပေးအဆင့်",
    notes: "မှတ်စုများ",
    specialInstructions: "အထူးညွှန်ကြားချက်များ",

    // Priority levels
    lowPriority: "နိမ့်",
    normalPriority: "ပုံမှန်",
    highPriority: "မြင့်",
    urgentPriority: "အရေးကြီး",

    // Shirt types
    polo: "ပိုလိုအင်္ကျီ",
    tshirt: "တီရှပ်",
    hoodie: "ဟူးဒီး",
    tankTop: "ကွက်လပ်အင်္ကျီ",

    // Production types
    screen: "Screen Printing",
    dtf: "DTF (Direct Film Transfer)",
    sublimation: "Sublimation",

    // Language toggle
    language: "ဘာသာစကား",
    thai: "ထိုင်း",
    myanmar: "မြန်မာ",

    // Messages
    autoFillMessage: "NewWorkSheet မှ အလိုအလျောက် ဖြည့်စွက်ထားသည်:",
    customerLabel: "ဖောက်သည်:",
    quantityLabel: "အရေအတွက်:",
    typeLabel: "အမျိုးအစား:",
    dueDateLabel: "ကာလဆုံး:",
    codeLabel: "ကုဒ်:",
    fabricLabel: "အထည်:",
    pieces: "ခု",

    // Additional UI elements
    refreshInstructions: "အသုံးပြုပုံ:",
    refreshStep1: "ပြန်လည်စတင်ခလုတ်ကို နှိပ်ပါ",
    refreshStep2: "အပေါ်ရှိ NewWorkSheet စာရင်းမှ လိုအပ်သောအရာကို ရွေးချယ်ပါ",
    refreshStep3: "စနစ်သည် NewWorkSheet ရှိအချက်အလက်များအတိုင်း အလိုအလျောက် ဖြည့်စွက်ပေးပါမည်",
    refreshToGetLatestData: "NewWorkSheet စနစ်မှ နောက်ဆုံးအချက်အလက်များရယူရန်",

    // Date fields
    scheduleTime: "အချိန်ဇယား",
    startDateCurrent: "စတင်သည့်ရက်စွဲ (လက်ရှိရက်စွဲ)",
    startDateHelper: "အလုပ်စတင်သည့်ရက်စွဲ (လက်ရှိရက်စွဲအဖြစ် သတ်မှတ်ထား)",
    expectedCompletionDate: "ပြီးမြောက်ရန် မျှော်လင့်သောရက်စွဲ",
    dueDateFromNewWorks: "NewWorksNet မှ ကာလဆုံးရက်စွဲ",

    // Print types
    printType: "ပရင့်အမျိုးအစား",
    printTypeSelection: "ပရင့်အမျိုးအစား ရွေးချယ်ပါ",

    // Worksheet selector
    noWorksheetSelected: "Worksheet မရွေးချယ်ရသေး",
    selectWorksheet: "Worksheet ရွေးချယ်ပါ",
    worksheetRequired: "Worksheet ရွေးချယ်ပေးပါ",
    refreshWorksheets: "Worksheet ပြန်လည်စတင်ပါ",
    loadingWorksheets: "Worksheet များ လုပ်ဆောင်နေသည်...",

    // Basic info
    basicInformation: "အခြေခံအချက်အလက်",
    titleRequired: "အလုပ်အမည် ထည့်ပေးပါ",
    customerRequired: "ဖောက်သည်အမည် ထည့်ပေးပါ",

    // Production info
    productionDetails: "ထုတ်လုပ်မှုအသေးစိတ်",
    shirtTypeRequired: "အင်္ကျီအမျိုးအစား ရွေးချယ်ပေးပါ",
    productionTypeRequired: "ထုတ်လုပ်မှုအမျိုးအစား ရွေးချယ်ပေးပါ",
    quantityRequired: "အရေအတွက် ထည့်ပေးပါ",

    // Sizes
    sizeBreakdown: "အရွယ်အစားအလိုက် ခွဲခြား",
    size: "အရွယ်အစား",
    quantity: "အရေအတွက်",
    totalPieces: "စုစုပေါင်း",

    // Sample image
    sampleImage: "နမူနာပုံ",
    uploadImage: "ပုံတင်ရန်",
    noImageUploaded: "ပုံမတင်ရသေးပါ",

    // Work calculation
    workCalculationByType: "ပရင့်အမျိုးအစားအလိုက် အလုပ်တွက်ချက်မှု",
    workCalculationFromWorksheet: "WorkSheet မှ အလုပ်တွက်ချက်မှု:",
    screenPrintingWork: "Screen Printing အလုပ်ရှိသည်",
    dtfWork: "DTF အလုပ်ရှိသည်",
    sublimationWork: "Sublimation အလုပ်ရှိသည်",
    embroideryWork: "Embroidery အလုပ်ရှိသည်",
    pointsLabel: "အမှတ်",
    totalShirts: "အင်္ကျီအားလုံး",
    calculationFormula: "({points}×{total}={result})",
  },
};

export const getTranslation = (key, language = "th") => {
  return translations[language]?.[key] || translations.th[key] || key;
};

// Hook for using translations
export const useTranslation = (initialLanguage = "th") => {
  const [language, setLanguage] = React.useState(
    localStorage.getItem("maxSupplyLanguage") || initialLanguage
  );

  const t = (key) => getTranslation(key, language);

  const changeLanguage = (newLanguage) => {
    setLanguage(newLanguage);
    localStorage.setItem("maxSupplyLanguage", newLanguage);
  };

  return { t, language, changeLanguage };
};
