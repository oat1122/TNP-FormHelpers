import React from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import { useCalendar } from '../../features/MaxSupply/maxSupplyApi';

const localizer = momentLocalizer(moment);

const MaxSupplyCalendar = () => {
  const { data } = useCalendar();

  return (
    <div style={{ height: 500 }}>
      <Calendar
        localizer={localizer}
        events={data || []}
        startAccessor="start"
        endAccessor="end"
      />
    </div>
  );
};

export default MaxSupplyCalendar;
