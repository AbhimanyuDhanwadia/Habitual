import React from 'react';
import './CalendarHeatmap.css';

const MONTH_NAMES = [
  'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
  'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'
];

export default function CalendarHeatmap({ year, month, historyData, todos = [], hideHeader = false, onPrevMonth, onToday, onNextMonth }) {
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
        };
      }
    });
  }

  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && (today.getMonth() + 1) === month;
  const currentDay = today.getDate();

  return (
    <div className="calendar-heatmap-full fade-in">
      {!hideHeader && (
        <div className="calendar-header-full" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ width: '100px', display: 'flex', justifyContent: 'flex-start' }}>
            {onPrevMonth && <button className="btn-ghost" onClick={onPrevMonth} style={{ fontSize: '1.2rem', padding: '0.25rem 0.75rem' }}>←</button>}
          </div>
          <h3 style={{ margin: 0, flex: 1, textAlign: 'center' }}>{MONTH_NAMES[month - 1]} {year}</h3>
          <div style={{ width: '100px', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
            {onToday && <button className="btn-ghost" onClick={onToday} style={{ fontSize: '0.9rem', padding: '0.25rem 0.5rem' }}>TODAY</button>}
            {onNextMonth && <button className="btn-ghost" onClick={onNextMonth} style={{ fontSize: '1.2rem', padding: '0.25rem 0.75rem' }}>→</button>}
          </div>
        </div>
      )}
      
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

          const dayData = dataMap[day] || { rate: 0 };
          const isToday = isCurrentMonth && day === currentDay;
          const { rate } = dayData;
          
          const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const dayTodos = todos.filter(todo => todo.deadline && todo.deadline.split('T')[0] === dateStr);

          // truncate logic: show 3 items, then "+X more"
          const MAX_VISIBLE = 3;
          const visibleTasks = dayTodos.slice(0, MAX_VISIBLE);
          const hiddenCount = dayTodos.length - MAX_VISIBLE;

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
