import React, { useState, useEffect } from 'react';
import CalendarHeatmap from '../../components/CalendarHeatmap/CalendarHeatmap';
import { tasksAPI } from '../../services/api';
import { useNotification } from '../../contexts/NotificationContext';
import './Streaks.css';

export default function Streaks() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const currentDate = new Date();
  const [year, setYear] = useState(currentDate.getFullYear());
  const [month, setMonth] = useState(currentDate.getMonth() + 1);

  const { showNotification } = useNotification();

  useEffect(() => {
    fetchHistory(year, month);
  }, [year, month]);

  const fetchHistory = async (y, m) => {
    try {
      setLoading(true);
      const res = await tasksAPI.getHistory(m, y);
      setHistory(res.data.history);
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
        <div className="calendar-controls">
          <button className="btn btn-secondary" onClick={handlePrevMonth}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
            Prev
          </button>
          <button className="btn btn-outline" onClick={() => {
            setYear(currentDate.getFullYear());
            setMonth(currentDate.getMonth() + 1);
          }}>Today</button>
          <button className="btn btn-secondary" onClick={handleNextMonth}>
            Next
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
          </button>
        </div>
        
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading your streaks...</p>
          </div>
        ) : (
          <CalendarHeatmap year={year} month={month} historyData={history} />
        )}
      </div>
    </div>
  );
}
