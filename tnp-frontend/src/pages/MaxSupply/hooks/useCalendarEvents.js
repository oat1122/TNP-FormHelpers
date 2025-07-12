import { useState, useEffect, useMemo } from 'react';
import { startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, format } from 'date-fns';
import { organizeEventsInRows, getEventsForDate } from '../utils/calendarUtils';

export const useCalendarEvents = (currentDate, maxSupplies) => {
  const [filter, setFilter] = useState({ type: 'all', status: 'all' });
  const [selectedJob, setSelectedJob] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [dayEventsDialogOpen, setDayEventsDialogOpen] = useState(false);
  const [hoveredTimeline, setHoveredTimeline] = useState(null);

  // Get calendar days for the current month
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentDate]);

  // Filter events based on current filter
  const filteredEvents = useMemo(() => {
    return maxSupplies.filter(job => {
      const typeMatch = filter.type === 'all' || job.production_type === filter.type;
      const statusMatch = filter.status === 'all' || job.status === filter.status;
      return typeMatch && statusMatch;
    });
  }, [maxSupplies, filter]);

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
    console.log('Total events:', maxSupplies.length);
    console.log('Filtered events:', filteredEvents.length);
    console.log('Event rows:', eventRowsData.rows.length);
    console.log('Overflow timelines:', eventRowsData.overflowTimelines.length);
    console.log('Total timelines:', eventRowsData.totalTimelines);
    console.log('=== END CALENDAR EVENTS DEBUG ===');
  }, [currentDate, calendarDays, maxSupplies, filteredEvents, eventRowsData]);

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