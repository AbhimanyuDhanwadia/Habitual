import React, { useState, useEffect } from 'react';
import CalendarHeatmap from '../../components/CalendarHeatmap/CalendarHeatmap';
import { tasksAPI, todosAPI } from '../../services/api';
import { useNotification } from '../../contexts/NotificationContext';
import './Streaks.css';

export default function Streaks() {
  const [history, setHistory] = useState([]);
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const currentDate = new Date();
  const [year, setYear] = useState(currentDate.getFullYear());
  const [month, setMonth] = useState(currentDate.getMonth() + 1);

  const { showNotification } = useNotification();

  useEffect(() => {
    fetchData(year, month);
  }, [year, month]);

  const fetchData = async (y, m) => {
    try {
      setLoading(true);
      const [historyRes, todosRes] = await Promise.all([
        tasksAPI.getHistory(m, y),
        todosAPI.getAll()
      ]);
      setHistory(historyRes.data.history);
      setTodos(todosRes.data.todos || []);
    } catch (error) {
      console.error(error);
      showNotification({ message: 'Error loading streak data', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handlePrevMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear(y => y - 1);
    } else {
      setMonth(m => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (month === 12) {
      setMonth(1);
      setYear(y => y + 1);
    } else {
      setMonth(m => m + 1);
    }
  };

  return (
    <div className="streaks-page page-container fade-in">
      <header className="streaks-header animate-fade-in-up">
        <div>
          <h1>Your Streaks</h1>
          <p className="streaks-subtitle">Track your daily task completion over time</p>
        </div>
      </header>

      <div className="streaks-content">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading your streaks...</p>
          </div>
        ) : (
          <CalendarHeatmap 
            year={year} 
            month={month} 
            historyData={history} 
            todos={todos} 
            onPrevMonth={handlePrevMonth}
            onNextMonth={handleNextMonth}
            onToday={() => {
              setYear(currentDate.getFullYear());
              setMonth(currentDate.getMonth() + 1);
            }}
          />
        )}
      </div>
    </div>
  );
}
