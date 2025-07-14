import { useState, useEffect, useMemo } from 'react';
import { startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, format } from 'date-fns';
import { organizeEventsInRows, getEventsForDate } from '../utils/calendarUtils';

export const useCalendarEvents = (currentDate, maxSupplies = []) => {
  const [filter, setFilter] = useState({ type: 'all', status: 'all' });
  const [selectedJob, setSelectedJob] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [dayEventsDialogOpen, setDayEventsDialogOpen] = useState(false);
  const [hoveredTimeline, setHoveredTimeline] = useState(null);

  // ถ้าไม่มี maxSupplies ให้ใช้ข้อมูล mock พื้นฐาน
  const defaultMockData = useMemo(() => {
    if (maxSupplies.length > 0) return [];
    
    return [
      {
        id: 'mock-1',
        title: 'เสื้อโปโล ABC Company',
        customer_name: 'ABC Company',
        production_type: 'screen',
        start_date: new Date(2025, 6, 12).toISOString(), // วันนี้ (12 ก.ค.)
        expected_completion_date: new Date(2025, 6, 15).toISOString(),
        status: 'in_progress',
        total_quantity: 500,
        priority: 'high',
      },
      {
        id: 'mock-2',
        title: 'เสื้อยืด XYZ Corp',
        customer_name: 'XYZ Corp',
        production_type: 'dtf',
        start_date: new Date(2025, 6, 15).toISOString(),
        expected_completion_date: new Date(2025, 6, 22).toISOString(),
        status: 'pending',
        total_quantity: 300,
        priority: 'normal',
      },
      {
        id: 'mock-3',
        title: 'เสื้อกีฬา DEF Ltd',
        customer_name: 'DEF Ltd',
        production_type: 'sublimation',
        start_date: new Date(2025, 6, 20).toISOString(),
        expected_completion_date: new Date(2025, 6, 25).toISOString(),
        status: 'pending',
        total_quantity: 150,
        priority: 'low',
      },
      {
        id: 'mock-4',
        title: 'เสื้อปัก GHI Inc',
        customer_name: 'GHI Inc',
        production_type: 'embroidery',
        start_date: new Date(2025, 6, 17).toISOString(),
        expected_completion_date: new Date(2025, 6, 20).toISOString(),
        status: 'completed',
        total_quantity: 200,
        priority: 'urgent',
      },
      {
        id: 'mock-5',
        title: 'เสื้อแจ็คเก็ต JKL Corp',
        customer_name: 'JKL Corp',
        production_type: 'screen',
        start_date: new Date(2025, 6, 28).toISOString(),
        expected_completion_date: new Date(2025, 6, 31).toISOString(),
        status: 'pending',
        total_quantity: 100,
        priority: 'normal',
      },
    ];
  }, [maxSupplies.length]);

  const workingData = maxSupplies.length > 0 ? maxSupplies : defaultMockData;

  // Get calendar days for the current month - แสดงตามจำนวนสัปดาห์ที่จำเป็น
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 }); // Sunday
    
    // สร้างช่วงวันที่จาก calendarStart ถึง calendarEnd
    const days = eachDayOfInterval({
      start: calendarStart,
      end: calendarEnd
    });
    
    return days;
  }, [currentDate]);

  // Filter events based on current filter
  const filteredEvents = useMemo(() => {
    return workingData.filter(job => {
      const typeMatch = filter.type === 'all' || job.production_type === filter.type;
      const statusMatch = filter.status === 'all' || job.status === filter.status;
      const isNotCompleted = job.status !== 'completed'; // ไม่แสดง Timeline Bar ถ้าสถานะเป็น completed
      return typeMatch && statusMatch && isNotCompleted;
    });
  }, [workingData, filter]);

  // Organize events into rows
  const eventRowsData = useMemo(() => {
    const result = organizeEventsInRows(filteredEvents, calendarDays);
    return result;
  }, [filteredEvents, calendarDays]);

  // Get events for a specific date
  const getEventsByDate = (date) => {
    return getEventsForDate(date, filteredEvents);
  };

  // Handle day click
  const handleDayClick = (date) => {
    const dayEvents = getEventsByDate(date);
    if (dayEvents.length > 0) {
      setSelectedDate(date);
      setDayEventsDialogOpen(true);
    }
  };

  // Handle day events dialog close
  const handleDayEventsDialogClose = () => {
    setDayEventsDialogOpen(false);
    setSelectedDate(null);
  };

  // Handle timeline click
  const handleTimelineClick = (job) => {
    setSelectedJob(job);
  };

  // Handle job selection
  const handleJobSelect = (job) => {
    setSelectedJob(job);
  };

  // Handle job close
  const handleJobClose = () => {
    setSelectedJob(null);
  };

  // Auto-debug when data changes
  useEffect(() => {
    console.log('=== CALENDAR EVENTS DEBUG ===');
    console.log('Current date:', format(currentDate, 'yyyy-MM-dd'));
    console.log('Calendar range:', format(calendarDays[0], 'yyyy-MM-dd'), 'to', format(calendarDays[calendarDays.length - 1], 'yyyy-MM-dd'));
    console.log('Input maxSupplies:', maxSupplies.length);
    console.log('Working data:', workingData.length);
    console.log('Filtered events:', filteredEvents.length);
    console.log('Event rows:', eventRowsData.rows.length);
    console.log('Overflow timelines:', eventRowsData.overflowTimelines.length);
    console.log('Total timelines:', eventRowsData.totalTimelines);
    console.log('=== END CALENDAR EVENTS DEBUG ===');
  }, [currentDate, calendarDays, maxSupplies, workingData, filteredEvents, eventRowsData]);

  return {
    // State
    filter,
    setFilter,
    selectedJob,
    selectedDate,
    dayEventsDialogOpen,
    hoveredTimeline,
    setHoveredTimeline,
    
    // Computed data
    calendarDays,
    filteredEvents,
    eventRows: eventRowsData.rows,
    overflowTimelines: eventRowsData.overflowTimelines,
    totalTimelines: eventRowsData.totalTimelines,
    
    // Handlers
    handleDayClick,
    handleDayEventsDialogClose,
    handleTimelineClick,
    handleJobSelect,
    handleJobClose,
    getEventsByDate,
  };
}; 