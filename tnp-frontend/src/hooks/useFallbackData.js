import { useMemo } from 'react';
import { addDays, subDays } from 'date-fns';

export const useFallbackData = () => {
  const fallbackData = useMemo(() => {
    const now = new Date();
    
    return [
      {
        id: 'demo-1',
        title: 'ตัวอย่างงาน Screen Printing',
        customer_name: 'บริษัท ABC จำกัด',
        production_type: 'screen',
        start_date: subDays(now, 2).toISOString(),
        expected_completion_date: addDays(now, 3).toISOString(),
        due_date: addDays(now, 5).toISOString(),
        status: 'in_progress',
        total_quantity: 150,
        priority: 'normal',
        shirt_type: 't-shirt',
        work_calculations: {
          screen: {
            points: 2,
            total_quantity: 150,
            total_work: 300,
            description: 'Screen Printing 2 จุด เสื้อทั้งหมด 150 ตัว (2×150=300) งาน Screen Printing มีงาน 300'
          }
        },
      },
      {
        id: 'demo-2', 
        title: 'ตัวอย่างงาน DTF',
        customer_name: 'ร้าน XYZ',
        production_type: 'dtf',
        start_date: now.toISOString(),
        expected_completion_date: addDays(now, 2).toISOString(),
        due_date: addDays(now, 4).toISOString(),
        status: 'pending',
        total_quantity: 80,
        priority: 'high',
        shirt_type: 'polo',
        work_calculations: {
          dtf: {
            points: 3,
            total_quantity: 80,
            total_work: 240,
            description: 'DTF (Direct Film Transfer) 3 จุด เสื้อทั้งหมด 80 ตัว (3×80=240) งาน DTF มีงาน 240'
          }
        },
      },
      {
        id: 'demo-3',
        title: 'ตัวอย่างงาน Sublimation',
        customer_name: 'โรงเรียน DEF',
        production_type: 'sublimation',
        start_date: addDays(now, 1).toISOString(),
        expected_completion_date: addDays(now, 6).toISOString(),
        due_date: addDays(now, 8).toISOString(),
        status: 'pending',
        total_quantity: 200,
        priority: 'normal',
        shirt_type: 'hoodie',
        work_calculations: {
          sublimation: {
            points: 1,
            total_quantity: 200,
            total_work: 200,
            description: 'Sublimation/Flex 1 จุด เสื้อทั้งหมด 200 ตัว (1×200=200) งาน Sublimation/Flex มีงาน 200'
          }
        },
      },
      {
        id: 'demo-4',
        title: 'ตัวอย่างงาน Embroidery',
        customer_name: 'องค์กร GHI',
        production_type: 'embroidery',
        start_date: subDays(now, 5).toISOString(),
        expected_completion_date: subDays(now, 1).toISOString(),
        due_date: now.toISOString(),
        status: 'completed',
        total_quantity: 50,
        priority: 'urgent',
        shirt_type: 'polo',
        work_calculations: {
          embroidery: {
            points: 2,
            total_quantity: 50,
            total_work: 100,
            description: 'Embroidery (ปัก) 2 จุด เสื้อทั้งหมด 50 ตัว (2×50=100) งาน Embroidery มีงาน 100'
          }
        },
      },
    ];
  }, []);

  const fallbackStatistics = useMemo(() => ({
    total: 4,
    pending: 2,
    in_progress: 1,
    completed: 1,
    cancelled: 0,
    by_production_type: {
      screen: 1,
      dtf: 1,
      sublimation: 1,
      embroidery: 1,
    },
    work_calculations: {
      current_workload: {
        screen: 300,    // From demo-1
        dtf: 240,       // From demo-2
        sublimation: 200, // From demo-3
        embroidery: 100,  // From demo-4
      },
      capacity: {
        daily: { dtf: 2500, screen: 3000, sublimation: 500, embroidery: 400 },
        weekly: { dtf: 17500, screen: 21000, sublimation: 3500, embroidery: 2800 },
        monthly: { dtf: 75000, screen: 90000, sublimation: 15000, embroidery: 12000 },
      },
      utilization: {
        screen: 10,   // 300/3000 * 100 = 10%
        dtf: 10,      // 240/2500 * 100 = 9.6% ≈ 10%
        sublimation: 40, // 200/500 * 100 = 40%
        embroidery: 25,  // 100/400 * 100 = 25%
      },
      remaining_capacity: {
        daily: { 
          dtf: 2260,      // 2500 - 240
          screen: 2700,   // 3000 - 300
          sublimation: 300, // 500 - 200
          embroidery: 300,  // 400 - 100
        },
        weekly: { 
          dtf: 17260,     // 17500 - 240
          screen: 20700,  // 21000 - 300
          sublimation: 3300, // 3500 - 200
          embroidery: 2700,  // 2800 - 100
        },
        monthly: { 
          dtf: 74760,     // 75000 - 240
          screen: 89700,  // 90000 - 300
          sublimation: 14800, // 15000 - 200
          embroidery: 11900,  // 12000 - 100
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