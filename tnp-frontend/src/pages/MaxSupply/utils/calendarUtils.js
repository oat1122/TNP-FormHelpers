import { format, parseISO, differenceInDays, isValid } from 'date-fns';
import { CALENDAR_CONFIG, PRIORITY_ORDER } from './constants';

// Calculate event timeline position and width for multi-day spanning
export const calculateEventTimeline = (event, calendarDays) => {
  console.log('=== TIMELINE CALCULATION START ===');
  console.log('Event data:', {
    id: event.id,
    title: event.title,
    customer_name: event.customer_name,
    start_date: event.start_date,
    expected_completion_date: event.expected_completion_date,
    due_date: event.due_date,
    production_type: event.production_type,
    status: event.status
  });
  
  if (!event.start_date) {
    console.log('No start_date, returning null');
    return null;
  }
  
  try {
    const eventStart = typeof event.start_date === 'string' ? parseISO(event.start_date) : event.start_date;
    
    // Use expected_completion_date, fallback to due_date if not available
    const endDateStr = event.expected_completion_date || event.due_date;
    if (!endDateStr) {
      console.log('No end date found, returning null');
      return null;
    }
    
    const eventEnd = typeof endDateStr === 'string' ? parseISO(endDateStr) : endDateStr;
    
    if (!isValid(eventStart) || !isValid(eventEnd)) {
      console.log('Invalid dates, returning null');
      return null;
    }
    
    // Convert to date strings for comparison
    const eventStartStr = format(eventStart, 'yyyy-MM-dd');
    const eventEndStr = format(eventEnd, 'yyyy-MM-dd');
    
    console.log('Parsed dates:', {
      eventStart: eventStartStr,
      eventEnd: eventEndStr,
      eventStartObj: eventStart,
      eventEndObj: eventEnd
    });
    
    // Find start and end positions in calendar
    const startIndex = calendarDays.findIndex(day => 
      format(day, 'yyyy-MM-dd') === eventStartStr
    );
    const endIndex = calendarDays.findIndex(day => 
      format(day, 'yyyy-MM-dd') === eventEndStr
    );

    // Calendar range for debugging
    const calendarStart = calendarDays[0];
    const calendarEnd = calendarDays[calendarDays.length - 1];
    
    // Enhanced debug logging
    console.log('=== CALCULATING TIMELINE ===');
    console.log('Event:', event.id, event.title || event.customer_name);
    console.log('Event dates:', eventStartStr, 'to', eventEndStr);
    console.log('Calendar range:', format(calendarStart, 'yyyy-MM-dd'), 'to', format(calendarEnd, 'yyyy-MM-dd'));
    console.log('Start index:', startIndex, 'End index:', endIndex);
    
    // Handle events that span beyond the current calendar view
    let actualStart, actualEnd;
    
    // Check if event has any intersection with current calendar view
    const eventIntersectsCalendar = (eventStart <= calendarEnd && eventEnd >= calendarStart);
    console.log('Event intersects calendar:', eventIntersectsCalendar);
    
    if (!eventIntersectsCalendar) {
      // Event is completely outside current calendar view
      console.log('Event completely outside calendar view');
      return null;
    }
    
    if (startIndex === -1 && endIndex === -1) {
      // Event spans across the entire calendar view
      if (eventStart <= calendarStart && eventEnd >= calendarEnd) {
        actualStart = 0;
        actualEnd = calendarDays.length - 1;
        console.log('Event spans entire calendar view');
      } else {
        console.log('Event outside calendar view (case 2)');
        return null;
      }
    } else if (startIndex === -1) {
      // Event starts before calendar view but ends within
      actualStart = 0;
      actualEnd = endIndex;
      console.log('Event starts before calendar, ends within');
    } else if (endIndex === -1) {
      // Event starts within calendar view but ends after
      actualStart = startIndex;
      actualEnd = calendarDays.length - 1;
      console.log('Event starts within calendar, ends after', { startIndex, actualStart, actualEnd });
    } else {
      // Event is completely within calendar view
      actualStart = startIndex;
      actualEnd = endIndex;
      console.log('Event completely within calendar view', { startIndex, endIndex, actualStart, actualEnd });
    }
    
    const width = actualStart <= actualEnd ? actualEnd - actualStart + 1 : 0;
    if (width <= 0) {
      console.log('Invalid width:', width);
      return null;
    }
    
    const duration = differenceInDays(eventEnd, eventStart) + 1;
    
    console.log('Final result:', {
      actualStart,
      actualEnd,
      width,
      duration,
      leftPercent: (actualStart / calendarDays.length) * 100,
      widthPercent: (width / calendarDays.length) * 100,
      totalCalendarDays: calendarDays.length,
      startIndex,
      endIndex
    });
    console.log('=== END TIMELINE CALCULATION ===');

    return {
      startCol: actualStart,
      width,
      event,
      duration,
      startIndex,
      endIndex,
      actualStart,
      actualEnd,
      eventStart,
      eventEnd,
      eventStartStr,
      eventEndStr,
    };
  } catch (error) {
    console.error('Error calculating timeline for event:', event.id, error);
    return null;
  }
};

// Organize events into rows to avoid overlap with limitations
export const organizeEventsInRows = (events, calendarDays) => {
  const MAX_ROWS = CALENDAR_CONFIG.MAX_ROWS;
  const MAX_EVENTS_PER_ROW = CALENDAR_CONFIG.MAX_EVENTS_PER_ROW;
  const MAX_TOTAL_EVENTS = MAX_ROWS * MAX_EVENTS_PER_ROW; // 6 events max
  
  const timelines = events
    .map(event => calculateEventTimeline(event, calendarDays))
    .filter(Boolean)
    .sort((a, b) => {
      // Sort by priority first, then by start date, then by duration
      const priorityA = PRIORITY_ORDER[a.event.priority] || 3;
      const priorityB = PRIORITY_ORDER[b.event.priority] || 3;
      
      if (priorityA !== priorityB) return priorityA - priorityB;
      if (a.startCol !== b.startCol) return a.startCol - b.startCol;
      return b.width - a.width;
    });
  
  console.log('=== ORGANIZING TIMELINE ROWS (LIMITED) ===');
  console.log('Total timelines to organize:', timelines.length);
  console.log('Maximum displayable timelines:', MAX_TOTAL_EVENTS);
  
  const rows = [];
  const displayedTimelines = [];
  const overflowTimelines = [];
  
  // Process timelines with row and count limitations
  timelines.forEach((timeline, index) => {
    const currentStart = timeline.startCol;
    const currentEnd = timeline.startCol + timeline.width - 1;
    
    console.log(`\nProcessing timeline ${index + 1}:`, {
      eventId: timeline.event.id,
      title: timeline.event.title || timeline.event.customer_name,
      priority: timeline.event.priority,
      startCol: currentStart,
      endCol: currentEnd,
      width: timeline.width,
      range: `${currentStart}-${currentEnd}`
    });
    
    // Check if we've reached the maximum total events
    if (displayedTimelines.length >= MAX_TOTAL_EVENTS) {
      overflowTimelines.push(timeline);
      console.log(`  ⚠️ Added to overflow (total limit reached: ${MAX_TOTAL_EVENTS})`);
      return;
    }
    
    let placed = false;
    
    // Try to place in existing rows
    for (let rowIndex = 0; rowIndex < rows.length && rowIndex < MAX_ROWS; rowIndex++) {
      const row = rows[rowIndex];
      
      // Check if this row has reached its limit
      if (row.length >= MAX_EVENTS_PER_ROW) {
        console.log(`  ✗ Row ${rowIndex} is full (${row.length}/${MAX_EVENTS_PER_ROW})`);
        continue;
      }
      
      // Check for overlap with any timeline in this row
      const hasOverlap = row.some(existingTimeline => {
        const existingStart = existingTimeline.startCol;
        const existingEnd = existingTimeline.startCol + existingTimeline.width - 1;
        
        // Two timelines overlap if one starts before the other ends
        const overlaps = !(existingEnd < currentStart || currentEnd < existingStart);
        
        if (overlaps) {
          console.log(`  Overlap detected with existing timeline in row ${rowIndex}:`, {
            existingId: existingTimeline.event.id,
            existingRange: `${existingStart}-${existingEnd}`,
            currentRange: `${currentStart}-${currentEnd}`
          });
        }
        
        return overlaps;
      });
      
      if (!hasOverlap) {
        row.push(timeline);
        displayedTimelines.push(timeline);
        placed = true;
        console.log(`  ✓ Placed in existing row ${rowIndex} (${row.length}/${MAX_EVENTS_PER_ROW})`);
        break;
      } else {
        console.log(`  ✗ Cannot place in row ${rowIndex} (overlap detected)`);
      }
    }
    
    // If no suitable row found and we can create a new row
    if (!placed && rows.length < MAX_ROWS) {
      rows.push([timeline]);
      displayedTimelines.push(timeline);
      console.log(`  ✓ Created new row ${rows.length - 1} (1/${MAX_EVENTS_PER_ROW})`);
      placed = true;
    }
    
    // If still not placed, add to overflow
    if (!placed) {
      overflowTimelines.push(timeline);
      console.log(`  ⚠️ Added to overflow (no available rows)`);
    }
  });
  
  // Final debug output
  console.log('\n=== FINAL ROW ORGANIZATION (LIMITED) ===');
  console.log(`Displayed timelines: ${displayedTimelines.length}/${MAX_TOTAL_EVENTS}`);
  console.log(`Overflow timelines: ${overflowTimelines.length}`);
  
  rows.forEach((row, rowIndex) => {
    console.log(`Row ${rowIndex} (${row.length}/${MAX_EVENTS_PER_ROW} timelines):`);
    row.forEach((timeline, timelineIndex) => {
      console.log(`  ${timelineIndex + 1}. ${timeline.event.title || timeline.event.customer_name} (${timeline.event.priority}) (${timeline.startCol}-${timeline.startCol + timeline.width - 1})`);
    });
  });
  
  if (overflowTimelines.length > 0) {
    console.log(`\nOverflow (${overflowTimelines.length} timelines):`);
    overflowTimelines.forEach((timeline, index) => {
      console.log(`  ${index + 1}. ${timeline.event.title || timeline.event.customer_name} (${timeline.event.priority})`);
    });
  }
  
  console.log('=== END ROW ORGANIZATION ===\n');

  return {
    rows,
    displayedTimelines,
    overflowTimelines,
    totalTimelines: timelines.length,
    maxDisplayable: MAX_TOTAL_EVENTS
  };
};

// Get events for a specific date (for dots display)
export const getEventsForDate = (date, events) => {
  const dateStr = format(date, 'yyyy-MM-dd');
  return events.filter(job => {
    if (!job.start_date) return false;
    
    // Use expected_completion_date, fallback to due_date if not available
    const endDateStr = job.expected_completion_date || job.due_date;
    if (!endDateStr) return false;
    
    try {
      const startDate = format(parseISO(job.start_date), 'yyyy-MM-dd');
      const endDate = format(parseISO(endDateStr), 'yyyy-MM-dd');
      return dateStr >= startDate && dateStr <= endDate;
    } catch {
      return false;
    }
  });
}; 