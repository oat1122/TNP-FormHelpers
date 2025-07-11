import { useMemo } from 'react';
import { addDays, subDays } from 'date-fns';

export const useFallbackData = () => {
  const fallbackData = useMemo(() => {
    const now = new Date();
    
    return [
      {
        id: 'demo-1',
        title: 'เสื้อโปโล ABC Company',
        customer_name: 'ABC Company',
        production_type: 'screen',
        start_date: subDays(now, 3).toISOString(),
        expected_completion_date: addDays(now, 2).toISOString(),
        due_date: addDays(now, 5).toISOString(),
        status: 'in_progress',
        total_quantity: 500,
        priority: 'high',
        shirt_type: 'polo',
        work_calculations: {
          screen: {
            points: 2,
            total_quantity: 500,
            total_work: 1000,
            description: 'Screen Printing 2 จุด เสื้อทั้งหมด 500 ตัว (2×500=1000) งาน Screen Printing มีงาน 1000'
          }
        },
      },
      {
        id: 'demo-2',
        title: 'เสื้อยืด XYZ Corp',
        customer_name: 'XYZ Corp',
        production_type: 'dtf',
        start_date: addDays(now, 1).toISOString(),
        expected_completion_date: addDays(now, 7).toISOString(),
        due_date: addDays(now, 10).toISOString(),
        status: 'pending',
        total_quantity: 300,
        priority: 'normal',
        shirt_type: 't-shirt',
        work_calculations: {
          dtf: {
            points: 3,
            total_quantity: 300,
            total_work: 900,
            description: 'DTF (Direct Film Transfer) 3 จุด เสื้อทั้งหมด 300 ตัว (3×300=900) งาน DTF มีงาน 900'
          }
        },
      },
      {
        id: 'demo-3',
        title: 'เสื้อฮูดี้ DEF Ltd',
        customer_name: 'DEF Ltd',
        production_type: 'sublimation',
        start_date: addDays(now, 5).toISOString(),
        expected_completion_date: addDays(now, 10).toISOString(),
        due_date: addDays(now, 12).toISOString(),
        status: 'pending',
        total_quantity: 150,
        priority: 'low',
        shirt_type: 'hoodie',
        work_calculations: {
          sublimation: {
            points: 1,
            total_quantity: 150,
            total_work: 150,
            description: 'Sublimation/Flex 1 จุด เสื้อทั้งหมด 150 ตัว (1×150=150) งาน Sublimation/Flex มีงาน 150'
          }
        },
      },
      {
        id: 'demo-4',
        title: 'เสื้อโปโล GHI Inc',
        customer_name: 'GHI Inc',
        production_type: 'embroidery',
        start_date: addDays(now, 2).toISOString(),
        expected_completion_date: addDays(now, 5).toISOString(),
        due_date: addDays(now, 7).toISOString(),
        status: 'completed',
        total_quantity: 200,
        priority: 'urgent',
        shirt_type: 'polo',
        work_calculations: {
          embroidery: {
            points: 2,
            total_quantity: 200,
            total_work: 400,
            description: 'Embroidery (ปัก) 2 จุด เสื้อทั้งหมด 200 ตัว (2×200=400) งาน Embroidery มีงาน 400'
          }
        },
      },
      {
        id: 'demo-5',
        title: 'เสื้อกีฬา JKL Team',
        customer_name: 'JKL Team',
        production_type: 'screen',
        start_date: addDays(now, 3).toISOString(),
        expected_completion_date: addDays(now, 6).toISOString(),
        due_date: addDays(now, 8).toISOString(),
        status: 'pending',
        total_quantity: 250,
        priority: 'normal',
        shirt_type: 't-shirt',
        work_calculations: {
          screen: {
            points: 1,
            total_quantity: 250,
            total_work: 250,
            description: 'Screen Printing 1 จุด เสื้อทั้งหมด 250 ตัว (1×250=250) งาน Screen Printing มีงาน 250'
          }
        },
      },
      {
        id: 'demo-6',
        title: 'เสื้อโปโล MNO School',
        customer_name: 'MNO School',
        production_type: 'dtf',
        start_date: addDays(now, 4).toISOString(),
        expected_completion_date: addDays(now, 8).toISOString(),
        due_date: addDays(now, 11).toISOString(),
        status: 'pending',
        total_quantity: 180,
        priority: 'high',
        shirt_type: 'polo',
        work_calculations: {
          dtf: {
            points: 2,
            total_quantity: 180,
            total_work: 360,
            description: 'DTF (Direct Film Transfer) 2 จุด เสื้อทั้งหมด 180 ตัว (2×180=360) งาน DTF มีงาน 360'
          }
        },
      },
      {
        id: 'demo-7',
        title: 'เสื้อทำงาน PQR Corp',
        customer_name: 'PQR Corp',
        production_type: 'sublimation',
        start_date: addDays(now, 6).toISOString(),
        expected_completion_date: addDays(now, 9).toISOString(),
        due_date: addDays(now, 12).toISOString(),
        status: 'pending',
        total_quantity: 120,
        priority: 'normal',
        shirt_type: 'polo',
        work_calculations: {
          sublimation: {
            points: 1,
            total_quantity: 120,
            total_work: 120,
            description: 'Sublimation/Flex 1 จุด เสื้อทั้งหมด 120 ตัว (1×120=120) งาน Sublimation/Flex มีงาน 120'
          }
        },
      },
      {
        id: 'demo-8',
        title: 'เสื้อยูนิฟอร์ม STU Ltd',
        customer_name: 'STU Ltd',
        production_type: 'embroidery',
        start_date: addDays(now, 7).toISOString(),
        expected_completion_date: addDays(now, 11).toISOString(),
        due_date: addDays(now, 14).toISOString(),
        status: 'pending',
        total_quantity: 90,
        priority: 'low',
        shirt_type: 'polo',
        work_calculations: {
          embroidery: {
            points: 3,
            total_quantity: 90,
            total_work: 270,
            description: 'Embroidery (ปัก) 3 จุด เสื้อทั้งหมด 90 ตัว (3×90=270) งาน Embroidery มีงาน 270'
          }
        },
      },
      {
        id: 'demo-9',
        title: 'เสื้อ Event VWX Club',
        customer_name: 'VWX Club',
        production_type: 'screen',
        start_date: addDays(now, 8).toISOString(),
        expected_completion_date: addDays(now, 12).toISOString(),
        due_date: addDays(now, 15).toISOString(),
        status: 'pending',
        total_quantity: 400,
        priority: 'urgent',
        shirt_type: 't-shirt',
        work_calculations: {
          screen: {
            points: 2,
            total_quantity: 400,
            total_work: 800,
            description: 'Screen Printing 2 จุด เสื้อทั้งหมด 400 ตัว (2×400=800) งาน Screen Printing มีงาน 800'
          }
        },
      },
      {
        id: 'demo-10',
        title: 'เสื้อโปรโมท YZA Brand',
        customer_name: 'YZA Brand',
        production_type: 'dtf',
        start_date: addDays(now, 9).toISOString(),
        expected_completion_date: addDays(now, 13).toISOString(),
        due_date: addDays(now, 16).toISOString(),
        status: 'pending',
        total_quantity: 220,
        priority: 'normal',
        shirt_type: 't-shirt',
        work_calculations: {
          dtf: {
            points: 2,
            total_quantity: 220,
            total_work: 440,
            description: 'DTF (Direct Film Transfer) 2 จุด เสื้อทั้งหมด 220 ตัว (2×220=440) งาน DTF มีงาน 440'
          }
        },
      },
    ];
  }, []);

  const fallbackStatistics = useMemo(() => ({
    total: 10,
    pending: 8,
    in_progress: 1,
    completed: 1,
    cancelled: 0,
    by_production_type: {
      screen: 3,
      dtf: 3,
      sublimation: 2,
      embroidery: 2,
    },
    work_calculations: {
      current_workload: {
        screen: 2050,    // 1000 + 250 + 800
        dtf: 1700,       // 900 + 360 + 440
        sublimation: 270, // 150 + 120
        embroidery: 670,  // 400 + 270
      },
      capacity: {
        daily: { dtf: 2500, screen: 3000, sublimation: 500, embroidery: 400 },
        weekly: { dtf: 17500, screen: 21000, sublimation: 3500, embroidery: 2800 },
        monthly: { dtf: 75000, screen: 90000, sublimation: 15000, embroidery: 12000 },
      },
      utilization: {
        screen: 68,   // 2050/3000 * 100
        dtf: 68,      // 1700/2500 * 100
        sublimation: 54, // 270/500 * 100
        embroidery: 168,  // 670/400 * 100 (over capacity)
      },
      remaining_capacity: {
        daily: { 
          dtf: 800,      // 2500 - 1700
          screen: 950,   // 3000 - 2050
          sublimation: 230, // 500 - 270
          embroidery: -270,  // 400 - 670 (negative = over capacity)
        },
        weekly: { 
          dtf: 15800,     // 17500 - 1700
          screen: 18950,  // 21000 - 2050
          sublimation: 3230, // 3500 - 270
          embroidery: 2130,  // 2800 - 670
        },
        monthly: { 
          dtf: 73300,     // 75000 - 1700
          screen: 87950,  // 90000 - 2050
          sublimation: 14730, // 15000 - 270
          embroidery: 11330,  // 12000 - 670
        },
      },
    }
  }), []);

  const getEventsForDate = (date) => {
    return fallbackData.filter(event => {
      if (!event.start_date) return false;
      
      const eventStart = new Date(event.start_date);
      const eventEnd = event.expected_completion_date ? 
        new Date(event.expected_completion_date) : eventStart;
      
      // Reset time to compare only dates
      const targetDate = new Date(date);
      targetDate.setHours(0, 0, 0, 0);
      eventStart.setHours(0, 0, 0, 0);
      eventEnd.setHours(0, 0, 0, 0);
      
      return targetDate >= eventStart && targetDate <= eventEnd;
    });
  };

  const getUpcomingDeadlines = (days = 7) => {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(now.getDate() + days);

    return fallbackData
      .filter(item => {
        if (!item.due_date) return false;
        const dueDate = new Date(item.due_date);
        return dueDate >= now && dueDate <= futureDate;
      })
      .sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
  };

  return {
    data: fallbackData,
    statistics: fallbackStatistics,
    getEventsForDate,
    getUpcomingDeadlines,
  };
}; 