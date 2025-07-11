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