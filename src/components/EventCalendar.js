"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, MapPin } from "lucide-react";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const STATUS_COLORS = {
  DRAFT: { dot: "#94A3B8", bg: "rgba(148,163,184,0.12)" },
  WAITING_FOR_FACULTY: { dot: "#D97706", bg: "rgba(217,119,6,0.10)" },
  WAITING_FOR_DEAN: { dot: "#D97706", bg: "rgba(217,119,6,0.10)" },
  WAITING_FOR_PRINCIPAL: { dot: "#D97706", bg: "rgba(217,119,6,0.10)" },
  WAITING_FOR_ADMIN: { dot: "#D97706", bg: "rgba(217,119,6,0.10)" },
  APPROVED: { dot: "#059669", bg: "rgba(5,150,105,0.10)" },
  REJECTED: { dot: "#DC2626", bg: "rgba(220,38,38,0.10)" },
  IN_PROGRESS: { dot: "#2563EB", bg: "rgba(37,99,235,0.10)" },
  COMPLETED: { dot: "#059669", bg: "rgba(5,150,105,0.10)" },
  ARCHIVED: { dot: "#94A3B8", bg: "rgba(148,163,184,0.12)" },
};

export default function EventCalendar() {
  const { apiFetch } = useAuth();
  const router = useRouter();

  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth() + 1); // 1-indexed
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch(`/api/events/calendar?year=${currentYear}&month=${currentMonth}`);
      setEvents(data.events || []);
    } catch {
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [apiFetch, currentYear, currentMonth]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Navigation
  const goToPrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
    setSelectedDate(null);
  };

  const goToNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
    setSelectedDate(null);
  };

  const goToToday = () => {
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth() + 1);
    setSelectedDate(null);
  };

  // Calendar grid computation
  const firstDayOfMonth = new Date(currentYear, currentMonth - 1, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
  const daysInPrevMonth = new Date(currentYear, currentMonth - 1, 0).getDate();

  // Map events by date string "YYYY-MM-DD"
  const eventsByDate = {};
  events.forEach((evt) => {
    if (!evt.eventDate) return;
    const d = new Date(evt.eventDate);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    if (!eventsByDate[key]) eventsByDate[key] = [];
    eventsByDate[key].push(evt);
  });

  // Build grid cells
  const cells = [];

  // Previous month padding
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    cells.push({ day: daysInPrevMonth - i, isCurrentMonth: false, dateKey: null });
  }

  // Current month
  for (let d = 1; d <= daysInMonth; d++) {
    const dateKey = `${currentYear}-${String(currentMonth).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    cells.push({ day: d, isCurrentMonth: true, dateKey });
  }

  // Next month padding — fill to complete the final row (always multiple of 7)
  const totalRows = Math.ceil(cells.length / 7);
  const totalCells = totalRows * 7;
  for (let d = 1; cells.length < totalCells; d++) {
    cells.push({ day: d, isCurrentMonth: false, dateKey: null });
  }

  const isToday = (day) =>
    day === today.getDate() &&
    currentMonth === today.getMonth() + 1 &&
    currentYear === today.getFullYear();

  const selectedDateEvents = selectedDate && eventsByDate[selectedDate]
    ? eventsByDate[selectedDate]
    : [];

  const formatSelectedDate = (dateKey) => {
    if (!dateKey) return "";
    const [y, m, d] = dateKey.split("-").map(Number);
    return `${d} ${MONTH_NAMES[m - 1]} ${y}`;
  };

  return (
    <div className="event-calendar card">
      {/* Header */}
      <div className="ec-header">
        <div className="ec-title-row">
          <h2 className="card-title" style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
            Event Calendar
          </h2>
          <button className="btn btn-ghost btn-sm" onClick={goToToday} style={{ fontSize: "var(--text-xs)" }}>
            Today
          </button>
        </div>
        <div className="ec-nav">
          <button className="ec-nav-btn" onClick={goToPrevMonth} aria-label="Previous month">
            <ChevronLeft size={18} />
          </button>
          <span className="ec-month-label">
            {MONTH_NAMES[currentMonth - 1]} {currentYear}
          </span>
          <button className="ec-nav-btn" onClick={goToNextMonth} aria-label="Next month">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Day names */}
      <div className="ec-day-names">
        {DAY_NAMES.map((d) => (
          <div key={d} className="ec-day-name">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className={`ec-grid ${loading ? "ec-loading" : ""}`}>
        {cells.map((cell, idx) => {
          const dayEvents = cell.dateKey ? (eventsByDate[cell.dateKey] || []) : [];
          const hasEvents = dayEvents.length > 0;
          const isTodayCell = cell.isCurrentMonth && isToday(cell.day);
          const isSelected = cell.dateKey === selectedDate;

          return (
            <div
              key={idx}
              className={[
                "ec-cell",
                !cell.isCurrentMonth && "ec-cell-outside",
                isTodayCell && "ec-cell-today",
                isSelected && "ec-cell-selected",
                hasEvents && "ec-cell-has-events",
              ].filter(Boolean).join(" ")}
              onClick={() => {
                if (cell.isCurrentMonth && cell.dateKey) {
                  setSelectedDate(isSelected ? null : cell.dateKey);
                }
              }}
            >
              <span className="ec-day-number">{cell.day}</span>
              {hasEvents && (
                <div className="ec-dots">
                  {dayEvents.slice(0, 3).map((evt, i) => (
                    <span
                      key={i}
                      className="ec-dot"
                      style={{ background: (STATUS_COLORS[evt.status] || STATUS_COLORS.DRAFT).dot }}
                    />
                  ))}
                  {dayEvents.length > 3 && (
                    <span className="ec-dot-more">+{dayEvents.length - 3}</span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Selected date event list */}
      {selectedDate && (
        <div className="ec-event-list">
          <div className="ec-event-list-header">
            <span className="ec-event-list-date">{formatSelectedDate(selectedDate)}</span>
            <span className="ec-event-list-count">
              {selectedDateEvents.length} event{selectedDateEvents.length !== 1 ? "s" : ""}
            </span>
          </div>
          {selectedDateEvents.length === 0 ? (
            <div className="ec-no-events">No events scheduled for this date</div>
          ) : (
            <div className="ec-event-items">
              {selectedDateEvents.map((evt) => {
                const color = (STATUS_COLORS[evt.status] || STATUS_COLORS.DRAFT);
                return (
                  <div
                    key={evt.id}
                    className="ec-event-item"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/events/${evt.id}`);
                    }}
                    style={{ borderLeftColor: color.dot }}
                  >
                    <div className="ec-event-item-title">{evt.title}</div>
                    <div className="ec-event-item-meta">
                      {evt.club && <span>{evt.club.name}</span>}
                      {evt.venue && (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
                          <MapPin size={11} /> {evt.venue}
                        </span>
                      )}
                      <span
                        className="ec-event-status"
                        style={{ background: color.bg, color: color.dot }}
                      >
                        {evt.status.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="ec-legend">
        <div className="ec-legend-item">
          <span className="ec-dot" style={{ background: STATUS_COLORS.APPROVED.dot }} />
          <span>Approved</span>
        </div>
        <div className="ec-legend-item">
          <span className="ec-dot" style={{ background: STATUS_COLORS.WAITING_FOR_DEAN.dot }} />
          <span>Pending</span>
        </div>
        <div className="ec-legend-item">
          <span className="ec-dot" style={{ background: STATUS_COLORS.REJECTED.dot }} />
          <span>Rejected</span>
        </div>
        <div className="ec-legend-item">
          <span className="ec-dot" style={{ background: STATUS_COLORS.IN_PROGRESS.dot }} />
          <span>In Progress</span>
        </div>
      </div>
    </div>
  );
}
