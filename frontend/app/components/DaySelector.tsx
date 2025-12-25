'use client';

import { useState, useRef, useEffect } from 'react';

interface DaySelectorProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

export default function DaySelector({ selectedDate, onDateChange }: DaySelectorProps) {
  const [showCalendar, setShowCalendar] = useState(false);
  const [viewDate, setViewDate] = useState(new Date(selectedDate));
  const [mounted, setMounted] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);

  // Fix hydration mismatch - only render date after client mount
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setViewDate(new Date(selectedDate));
  }, [selectedDate]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setShowCalendar(false);
      }
    };

    if (showCalendar) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCalendar]);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const goToPreviousDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    onDateChange(newDate);
  };

  const goToNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    onDateChange(newDate);
  };

  const goToToday = () => {
    onDateChange(new Date());
  };

  const isToday = () => {
    const today = new Date();
    return (
      selectedDate.getDate() === today.getDate() &&
      selectedDate.getMonth() === today.getMonth() &&
      selectedDate.getFullYear() === today.getFullYear()
    );
  };

  const toggleCalendar = () => {
    setShowCalendar(!showCalendar);
    setViewDate(new Date(selectedDate));
  };

  const goToPreviousMonth = () => {
    const newDate = new Date(viewDate);
    newDate.setMonth(newDate.getMonth() - 1);
    setViewDate(newDate);
  };

  const goToNextMonth = () => {
    const newDate = new Date(viewDate);
    newDate.setMonth(newDate.getMonth() + 1);
    setViewDate(newDate);
  };

  const goToPreviousYear = () => {
    const newDate = new Date(viewDate);
    newDate.setFullYear(newDate.getFullYear() - 1);
    setViewDate(newDate);
  };

  const goToNextYear = () => {
    const newDate = new Date(viewDate);
    newDate.setFullYear(newDate.getFullYear() + 1);
    setViewDate(newDate);
  };

  const selectDate = (day: number) => {
    const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    onDateChange(newDate);
    setShowCalendar(false);
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const isSameDay = (day: number) => {
    return (
      day === selectedDate.getDate() &&
      viewDate.getMonth() === selectedDate.getMonth() &&
      viewDate.getFullYear() === selectedDate.getFullYear()
    );
  };

  const isTodayDate = (day: number) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      viewDate.getMonth() === today.getMonth() &&
      viewDate.getFullYear() === today.getFullYear()
    );
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(viewDate);
    const firstDay = getFirstDayOfMonth(viewDate);
    const days = [];
    const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const isSelected = isSameDay(day);
      const isCurrentDay = isTodayDate(day);
      days.push(
        <button
          key={day}
          className={`calendar-day ${isSelected ? 'selected' : ''} ${isCurrentDay ? 'today' : ''}`}
          onClick={() => selectDate(day)}
        >
          {day}
        </button>
      );
    }

    return (
      <div className="calendar-dropdown" ref={calendarRef}>
        <div className="calendar-header">
          <button className="calendar-nav-btn" onClick={goToPreviousYear} aria-label="Previous year">
            ««
          </button>
          <button className="calendar-nav-btn" onClick={goToPreviousMonth} aria-label="Previous month">
            «
          </button>
          <span className="calendar-title" suppressHydrationWarning>
            {mounted ? viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : ''}
          </span>
          <button className="calendar-nav-btn" onClick={goToNextMonth} aria-label="Next month">
            »
          </button>
          <button className="calendar-nav-btn" onClick={goToNextYear} aria-label="Next year">
            »»
          </button>
        </div>
        <div className="calendar-weekdays">
          {weekDays.map((day) => (
            <div key={day} className="calendar-weekday">
              {day}
            </div>
          ))}
        </div>
        <div className="calendar-grid">{days}</div>
      </div>
    );
  };

  return (
    <div className="day-selector">
      <div className="calendar-container">
        <button className="day-btn calendar-btn" onClick={toggleCalendar} aria-label="Open calendar">
          📅
        </button>
        {showCalendar && renderCalendar()}
      </div>
      <button className="day-btn" onClick={goToPreviousDay} aria-label="Previous day">
        ←
      </button>
      <span className="current-date" suppressHydrationWarning>
        {mounted ? formatDate(selectedDate) : ''}
      </span>
      <button className="day-btn" onClick={goToNextDay} aria-label="Next day">
        →
      </button>
      <button className="today-btn" onClick={goToToday} disabled={isToday()}>
        Today
      </button>
    </div>
  );
}
