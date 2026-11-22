"use client";
import { useState, useEffect, useMemo, useCallback } from "react";
import api from "@/api/axios";

// Helper: Formats YYYY-MM-DD into readable date (e.g., "Sun, 24 Nov 2026")
function formatDisplayDate(dateStr) {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

// Helper: Adds N days to YYYY-MM-DD
function addDaysStr(dateStr, n) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + n));
  return dt.toISOString().split("T")[0];
}

export default function HotelAvailabilityCalendar({
  hotelId,
  roomId = null,
  roomName = "",
  selectedCheckIn = "",
  selectedCheckOut = "",
  onSelectDates,
  className = "",
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [calendarData, setCalendarData] = useState(null);
  const [rangeError, setRangeError] = useState("");

  // Current viewing month (0: current month of todayIST, 1: next month)
  const [viewMonthOffset, setViewMonthOffset] = useState(0);

  // Internal selection state
  const [checkIn, setCheckIn] = useState(selectedCheckIn || "");
  const [checkOut, setCheckOut] = useState(selectedCheckOut || "");

  // Sync with props if updated externally
  useEffect(() => {
    if (selectedCheckIn !== undefined) setCheckIn(selectedCheckIn);
    if (selectedCheckOut !== undefined) setCheckOut(selectedCheckOut);
  }, [selectedCheckIn, selectedCheckOut]);

  // Fetch real-time availability from backend
  const fetchAvailability = useCallback(async () => {
    if (!hotelId) return;
    setLoading(true);
    setError("");
    setRangeError("");

    try {
      const q = new URLSearchParams();
      if (roomId) q.set("roomId", roomId);

      const res = await api.get(`/api/items/${hotelId}/hotel-availability?${q.toString()}`);
      if (res.data?.ok) {
        setCalendarData(res.data.data);
      } else {
        throw new Error(res.data?.error || "Failed to load hotel availability");
      }
    } catch (err) {
      console.error("[HotelAvailabilityCalendar] Fetch error:", err);
      setError(
        err.response?.data?.error || err.message || "Failed to load real-time room availability"
      );
    } finally {
      setLoading(false);
    }
  }, [hotelId, roomId]);

  useEffect(() => {
    fetchAvailability();
  }, [fetchAvailability]);

  // Map dates to lookup dictionary for quick O(1) checks
  const availabilityMap = useMemo(() => {
    const map = new Map();
    if (calendarData?.calendar) {
      for (const day of calendarData.calendar) {
        map.set(day.date, day);
      }
    }
    return map;
  }, [calendarData]);

  const todayIST = calendarData?.today || new Date().toISOString().split("T")[0];
  const maxBookingDate = calendarData?.maxBookingDate || addDaysStr(todayIST, 30);

  // Determine calendar months to show (Month 0: Today's month, Month 1: Next month)
  const displayedMonthInfo = useMemo(() => {
    const [todayY, todayM] = todayIST.split("-").map(Number);
    // target month
    const targetDate = new Date(Date.UTC(todayY, todayM - 1 + viewMonthOffset, 1));
    const year = targetDate.getUTCFullYear();
    const month = targetDate.getUTCMonth(); // 0-indexed

    const monthName = targetDate.toLocaleDateString("en-IN", {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    });

    // Days in this month
    const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    // First day of month (0: Sun, 1: Mon...)
    const firstDayOfWeek = new Date(Date.UTC(year, month, 1)).getUTCDay();

    const days = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const mm = String(month + 1).padStart(2, "0");
      const dd = String(d).padStart(2, "0");
      const dateStr = `${year}-${mm}-${dd}`;
      days.push({
        dayNumber: d,
        dateStr,
      });
    }

    return {
      monthName,
      firstDayOfWeek,
      days,
      year,
      month,
    };
  }, [todayIST, viewMonthOffset]);

  // Handle clicking a date cell
  const handleDateClick = (dateStr) => {
    setRangeError("");
    const dayData = availabilityMap.get(dateStr);

    // Rule: past dates and dates beyond 1 month are disabled
    if (!dayData || dayData.isPast || dayData.isBeyond) return;

    // Rule: Customers must not be able to select unavailable or disabled dates
    if (!dayData.available) {
      if (dayData.isBlocked) {
        setRangeError(`${formatDisplayDate(dateStr)} has been blocked by the hotel and is unavailable.`);
      } else {
        setRangeError(`${formatDisplayDate(dateStr)} is fully booked.`);
      }
      return;
    }

    // Step 1: No Check-in selected yet, or clicking earlier date than current check-in
    if (!checkIn || (checkIn && checkOut) || dateStr < checkIn) {
      setCheckIn(dateStr);
      setCheckOut("");
      if (onSelectDates) {
        onSelectDates({
          checkIn: dateStr,
          checkOut: "",
          nights: 1,
          isComplete: false,
        });
      }
      return;
    }

    // Step 2: Clicking the exact same date as checkIn => single night stay
    if (dateStr === checkIn) {
      setCheckOut(dateStr);
      if (onSelectDates) {
        onSelectDates({
          checkIn: dateStr,
          checkOut: dateStr,
          nights: 1,
          isComplete: true,
        });
      }
      return;
    }

    // Step 3: Selecting Check-out date (> checkIn)
    // Multi-day stay: Verify that EVERY night in the range [checkIn ... dateStr - 1] is available!
    let cur = checkIn;
    const nights = [];
    let blockedDateFound = null;

    while (cur < dateStr) {
      const curData = availabilityMap.get(cur);
      if (!curData || !curData.available) {
        blockedDateFound = cur;
        break;
      }
      nights.push(cur);
      cur = addDaysStr(cur, 1);
      if (nights.length > 35) break;
    }

    if (blockedDateFound) {
      setRangeError(
        `Cannot select this stay: ${formatDisplayDate(blockedDateFound)} is fully booked or unavailable. Please choose consecutive available dates.`
      );
      return;
    }

    // Valid check-out selection
    setCheckOut(dateStr);
    if (onSelectDates) {
      onSelectDates({
        checkIn,
        checkOut: dateStr,
        nights: nights.length,
        isComplete: true,
      });
    }
  };

  // Helper to check cell styling
  const getCellState = (dateStr) => {
    const dayData = availabilityMap.get(dateStr);

    if (!dayData || dayData.isPast || dayData.isBeyond) {
      return "disabled";
    }

    if (!dayData.available) {
      return "unavailable";
    }

    // Selection indicators
    if (checkIn && dateStr === checkIn) {
      return "selected-start";
    }
    if (checkOut && dateStr === checkOut) {
      return "selected-end";
    }
    if (checkIn && checkOut && dateStr > checkIn && dateStr < checkOut) {
      return "selected-range";
    }

    return "available";
  };

  const handleReset = () => {
    setCheckIn("");
    setCheckOut("");
    setRangeError("");
    if (onSelectDates) {
      onSelectDates({
        checkIn: "",
        checkOut: "",
        nights: 0,
        isComplete: false,
      });
    }
  };

  return (
    <div className={`bg-white rounded-2xl border border-brand-100 p-4 sm:p-6 shadow-sm ${className}`}>
      {/* Calendar Header with Room / Hotel context & Month Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-brand-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-lg">📅</span>
            <h3 className="font-serif text-lg sm:text-xl font-bold text-ink">
              Select Stay Dates & Check Availability
            </h3>
          </div>
          <p className="text-xs text-muted mt-0.5">
            {roomName ? (
              <span>
                Real-time room availability for: <strong className="text-brand-700">{roomName}</strong>
              </span>
            ) : (
              <span>
                Live inventory for <strong className="text-brand-700">{calendarData?.hotelTitle || "Hotel"}</strong>
              </span>
            )}
            {" "}(Bookings open up to 1 month in advance)
          </p>
        </div>

        {/* Month Navigation Buttons */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setViewMonthOffset((prev) => Math.max(0, prev - 1))}
            disabled={viewMonthOffset === 0}
            className={`p-2 rounded-xl text-xs font-bold border transition ${
              viewMonthOffset === 0
                ? "border-gray-200 text-gray-300 cursor-not-allowed bg-gray-50"
                : "border-brand-200 text-brand-700 hover:bg-brand-50 bg-white shadow-xs"
            }`}
            title="Previous Month"
          >
            ← Prev
          </button>

          <span className="text-xs sm:text-sm font-bold text-ink min-w-[120px] text-center px-2 py-1.5 rounded-lg bg-brand-50/60 border border-brand-100">
            {displayedMonthInfo.monthName}
          </span>

          <button
            type="button"
            onClick={() => setViewMonthOffset((prev) => Math.min(1, prev + 1))}
            disabled={viewMonthOffset >= 1}
            className={`p-2 rounded-xl text-xs font-bold border transition ${
              viewMonthOffset >= 1
                ? "border-gray-200 text-gray-300 cursor-not-allowed bg-gray-50"
                : "border-brand-200 text-brand-700 hover:bg-brand-50 bg-white shadow-xs"
            }`}
            title="Next Month"
          >
            Next →
          </button>
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading ? (
        <div className="py-10 text-center space-y-3">
          <div className="inline-block w-8 h-8 border-3 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
          <p className="text-xs sm:text-sm text-muted font-medium animate-pulse">
            Checking live room availability & inventory…
          </p>
          <div className="grid grid-cols-7 gap-2 max-w-md mx-auto pt-2 opacity-40">
            {Array.from({ length: 14 }).map((_, i) => (
              <div key={i} className="h-14 bg-gray-200 rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
      ) : error ? (
        /* Error banner with retry */
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={fetchAvailability}
            className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs shrink-0 cursor-pointer transition"
          >
            Retry Fetch
          </button>
        </div>
      ) : (
        /* Interactive Calendar Grid */
        <div className="space-y-4">
          {/* Day of Week Headers */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center text-[11px] sm:text-xs font-bold text-muted uppercase tracking-wider">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, idx) => (
              <div
                key={day}
                className={`py-1 rounded-md ${
                  idx === 0 || idx === 6 ? "text-brand-600" : "text-ink"
                }`}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {/* Empty offset padding for days before the 1st */}
            {Array.from({ length: displayedMonthInfo.firstDayOfWeek }).map((_, i) => (
              <div key={`offset-${i}`} className="h-14 sm:h-16 rounded-xl bg-transparent" />
            ))}

            {/* Month Days */}
            {displayedMonthInfo.days.map(({ dayNumber, dateStr }) => {
              const state = getCellState(dateStr);
              const dayData = availabilityMap.get(dateStr);

              // Color styles per specification:
              // Green: Available
              // Red: Fully booked or unavailable
              // Blue: Selected date / range
              // Grey: Disabled date (past or > 1 month)
              let cellClass = "";
              let badgeText = "";
              let badgeClass = "";

              switch (state) {
                case "selected-start":
                case "selected-end":
                  cellClass =
                    "bg-blue-600 text-white font-bold border-blue-600 shadow-md shadow-blue-500/30 scale-102 ring-2 ring-blue-300";
                  badgeText = state === "selected-start" ? "Check-in" : "Check-out";
                  badgeClass = "bg-white/20 text-white";
                  break;

                case "selected-range":
                  cellClass =
                    "bg-blue-100 text-blue-900 font-semibold border-blue-300 hover:bg-blue-200/80";
                  badgeText = "Stay";
                  badgeClass = "bg-blue-200 text-blue-900";
                  break;

                case "available":
                  cellClass =
                    "bg-emerald-50/90 hover:bg-emerald-100 border-emerald-300 text-emerald-950 hover:border-emerald-500 cursor-pointer shadow-xs active:scale-95";
                  badgeText =
                    dayData?.remainingRooms > 0
                      ? `${dayData.remainingRooms} left`
                      : "Available";
                  badgeClass = "bg-emerald-100 text-emerald-800 font-bold border border-emerald-200/70";
                  break;

                case "unavailable":
                  cellClass =
                    "bg-rose-50/70 border-rose-200/80 text-rose-400 cursor-not-allowed opacity-75";
                  badgeText = dayData?.isBlocked ? "Blocked" : "Sold out";
                  badgeClass = "bg-rose-100 text-rose-600 font-medium";
                  break;

                case "disabled":
                default:
                  cellClass =
                    "bg-gray-100/70 border-gray-200 text-gray-300 cursor-not-allowed opacity-40";
                  badgeText = "";
                  badgeClass = "";
                  break;
              }

              return (
                <button
                  key={dateStr}
                  type="button"
                  onClick={() => handleDateClick(dateStr)}
                  disabled={state === "disabled" || state === "unavailable"}
                  className={`relative flex flex-col items-center justify-between p-1.5 sm:p-2 h-14 sm:h-16 rounded-xl border transition-all text-left ${cellClass}`}
                  title={
                    dayData?.isBlocked
                      ? `${formatDisplayDate(dateStr)}: Blocked by Hotel`
                      : dayData?.available
                      ? `${formatDisplayDate(dateStr)}: ${dayData.remainingRooms} room(s) available`
                      : `${formatDisplayDate(dateStr)}: Fully booked`
                  }
                >
                  <span className="text-xs sm:text-sm font-semibold">{dayNumber}</span>

                  {badgeText && (
                    <span
                      className={`text-[9px] sm:text-[10px] leading-tight px-1 py-0.5 rounded-md truncate max-w-full text-center ${badgeClass}`}
                    >
                      {badgeText}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Validation Range Error Alert */}
          {rangeError && (
            <div className="p-3 bg-amber-50 border border-amber-300 text-amber-900 rounded-xl text-xs sm:text-sm flex items-start gap-2 shadow-xs animate-shake">
              <span className="text-base shrink-0">⚠️</span>
              <div className="flex-1">
                <span className="font-bold">Date Selection Notice:</span> {rangeError}
              </div>
            </div>
          )}

          {/* Selected Stay Summary Card */}
          {checkIn && (
            <div className="p-3.5 sm:p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50/80 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div className="space-y-1">
                <div className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">
                  Selected Stay Reservation
                </div>
                <div className="text-xs sm:text-sm font-semibold text-ink flex flex-wrap items-center gap-1.5">
                  <span className="px-2 py-0.5 bg-blue-600 text-white rounded-md text-xs font-bold">
                    Check-in: {formatDisplayDate(checkIn)}
                  </span>
                  <span>➔</span>
                  <span
                    className={`px-2 py-0.5 rounded-md text-xs font-bold ${
                      checkOut
                        ? "bg-blue-600 text-white"
                        : "bg-blue-100 text-blue-800 border border-blue-300"
                    }`}
                  >
                    Check-out: {checkOut ? formatDisplayDate(checkOut) : "Select date above (Optional)"}
                  </span>
                  {checkIn && checkOut && (
                    <span className="ml-1 text-xs text-indigo-700 font-bold bg-white px-2 py-0.5 rounded-md border border-indigo-200">
                      {checkIn === checkOut
                        ? "1 Day / Night Stay"
                        : `${Math.round(
                            (new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24)
                          )} Night(s)`}
                    </span>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={handleReset}
                className="self-start sm:self-auto px-3 py-1.5 rounded-lg bg-white hover:bg-gray-50 border border-blue-300 text-blue-700 font-bold text-xs shadow-xs transition cursor-pointer"
              >
                Reset / Change Dates
              </button>
            </div>
          )}

          {/* Availability Legend per specification */}
          <div className="pt-2 border-t border-brand-100/70">
            <div className="text-[11px] font-bold text-muted uppercase tracking-wider mb-2">
              Availability Legend
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-ink">
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-md bg-emerald-100 border border-emerald-400 shrink-0" />
                <span>
                  <strong className="text-emerald-800 font-semibold">Green:</strong> Available
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-md bg-rose-100 border border-rose-300 shrink-0" />
                <span>
                  <strong className="text-rose-700 font-semibold">Red:</strong> Fully Booked
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-md bg-blue-600 border border-blue-600 shrink-0" />
                <span>
                  <strong className="text-blue-700 font-semibold">Blue:</strong> Selected Stay
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-md bg-gray-100 border border-gray-300 shrink-0" />
                <span>
                  <strong className="text-gray-500 font-semibold">Grey:</strong> Disabled (Past/&gt;1 mo)
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
