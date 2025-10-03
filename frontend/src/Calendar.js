import React, { useState } from 'react';
import './Calendar.css';

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const today = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Get first day of month and number of days
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
  const firstDayWeekday = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();

  // Sample events for demonstration
  const events = {
    3: 'Meeting at 2PM',
    10: 'Project deadline',
    15: 'Team standup',
    22: 'Client call',
    28: 'Review session'
  };

  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const isToday = (day) => {
    return today.getDate() === day && 
           today.getMonth() === currentMonth && 
           today.getFullYear() === currentYear;
  };

  const hasEvent = (day) => {
    return events[day];
  };

  const renderCalendarDays = () => {
    const days = [];
    
    // Empty cells for days before first day of month
    for (let i = 0; i < firstDayWeekday; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const isCurrentDay = isToday(day);
      const event = hasEvent(day);
      
      days.push(
        <div 
          key={day} 
          className={`calendar-day ${isCurrentDay ? 'today' : ''} ${event ? 'has-event' : ''}`}
          title={event || ''}
        >
          <span className="day-number">{day}</span>
          {event && <div className="event-indicator"></div>}
        </div>
      );
    }

    return days;
  };

  return (
    <div className="crm-calendar">
      {/* Calendar Header */}
      <div className="calendar-header">
        <button className="nav-btn" onClick={() => navigateMonth(-1)}>‹</button>
        <h3 className="month-year">
          {monthNames[currentMonth]} {currentYear}
        </h3>
        <button className="nav-btn" onClick={() => navigateMonth(1)}>›</button>
      </div>

      {/* Day Headers */}
      <div className="calendar-days-header">
        {dayNames.map(day => (
          <div key={day} className="day-header">{day}</div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="calendar-grid">
        {renderCalendarDays()}
      </div>

      {/* Upcoming Events */}
      <div className="upcoming-events">
        <h4>Upcoming</h4>
        <ul>
          <li><span className="event-date">Oct 10</span> Project deadline</li>
          <li><span className="event-date">Oct 15</span> Team standup</li>
          <li><span className="event-date">Oct 22</span> Client call</li>
        </ul>
      </div>
    </div>
  );
};

export default Calendar;