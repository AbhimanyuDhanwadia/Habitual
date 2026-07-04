import React from 'react';
import './CalendarHeatmap.css';

const MONTH_NAMES = [
  'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
  'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'
];

export default function CalendarHeatmap({ year, month, historyData }) {
  // month is 1-indexed (1-12)
  const firstDay = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  
  const days = [];
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  // Ensure trailing empty cells to complete the grid
  while (days.length % 7 !== 0) {
    days.push(null);
  }

  // Create lookup for rates and tasks
  const dataMap = {};
  if (historyData) {
    historyData.forEach(item => {
      // item.date is like "2026-07-03"
      const dateParts = item.date.split('-');
      if (dateParts.length === 3) {
        // match day, stripping leading zeros via parseInt
        const day = parseInt(dateParts[2], 10);
        dataMap[day] = {
          rate: item.rate, // 0-100
          tasks: item.tasksList || []
        };
      }
    });
  }

  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && (today.getMonth() + 1) === month;
  const currentDay = today.getDate();

  return (
    <div className="calendar-heatmap-full fade-in">
      <div className="calendar-header-full">
        <h3>{MONTH_NAMES[month - 1]} {year}</h3>
      </div>
      
      <div className="calendar-grid-full">
        <div className="day-name-full">SUN</div>
        <div className="day-name-full">MON</div>
        <div className="day-name-full">TUE</div>
        <div className="day-name-full">WED</div>
        <div className="day-name-full">THU</div>
        <div className="day-name-full">FRI</div>
        <div className="day-name-full">SAT</div>

        {days.map((day, index) => {
          if (day === null) {
            return <div key={`empty-${index}`} className="calendar-cell-full empty"></div>;
          }

          const dayData = dataMap[day] || { rate: 0, tasks: [] };
          const isToday = isCurrentMonth && day === currentDay;
          const { rate, tasks } = dayData;

          // truncate logic: show 3 items, then "+X more"
          const MAX_VISIBLE = 3;
          const visibleTasks = tasks.slice(0, MAX_VISIBLE);
          const hiddenCount = tasks.length - MAX_VISIBLE;

          return (
            <div key={`day-${day}`} className={`calendar-cell-full ${isToday ? 'today' : ''}`}>
              <div 
                className="water-level-fill" 
                style={{ height: `${rate}%` }}
              ></div>
              <div className="cell-content-layer">
                <div className="date-label">{day}</div>
                <div className="task-list">
                  {visibleTasks.map((t, idx) => (
                    <div key={idx} className={`task-item ${t.completed ? 'completed' : ''}`}>
                      <span className="task-dot"></span>
                      <span className="task-title">{t.title}</span>
                    </div>
                  ))}
                  {hiddenCount > 0 && (
                    <div className="task-more">+{hiddenCount} more</div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
