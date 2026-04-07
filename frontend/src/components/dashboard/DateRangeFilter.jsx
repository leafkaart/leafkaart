"use client";

import React, { useState, useEffect } from "react";
import { Calendar } from "lucide-react";

const DateRangeFilter = ({
  onDateRangeChange,
  onGroupByChange,
  selectedGroupBy,
  selectedDateRange,
}) => {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  useEffect(() => {
    setFromDate(selectedDateRange?.from || "");
    setToDate(selectedDateRange?.to || "");
  }, [selectedDateRange]);

  const handleApplyFilter = () => {
    if (!fromDate || !toDate) return;

    if (new Date(fromDate) > new Date(toDate)) {
      alert("From date cannot be greater than To date");
      return;
    }

    onDateRangeChange(fromDate, toDate);
  };

  const handleQuickFilter = (value) => {
    if (!value) return;

    const days = Number(value);
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - days);

    const fromStr = from.toISOString().split("T")[0];
    const toStr = to.toISOString().split("T")[0];

    setFromDate(fromStr);
    setToDate(toStr);
    onDateRangeChange(fromStr, toStr);
  };

  const handleClearFilter = () => {
    setFromDate("");
    setToDate("");
    onDateRangeChange(null, null);
  };

  return (
    <div className="bg-gray-50 rounded-lg p-4 mb-6">
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-end">
        {/* Quick Filter Dropdown */}
        <div className="w-full sm:w-auto">
          <label className="text-xs font-medium text-gray-600 mb-1 block">
            Quick Filter
          </label>
          <select
            onChange={(e) => handleQuickFilter(e.target.value)}
            className="w-full sm:w-[160px] px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select</option>
            <option value="7">Last 7 Days</option>
            <option value="30">Last 30 Days</option>
            <option value="90">Last 90 Days</option>
          </select>
        </div>

        {/* Date Range */}
        <div className="w-full">
          <label className="text-xs font-medium text-gray-600 mb-1 block">
            Date Range
          </label>

          <div className="flex flex-col sm:flex-row items-center gap-2">
            <div className="flex items-center gap-2 w-full">
              <Calendar className="w-4 h-4 text-gray-500" />

              <input
                type="date"
                value={fromDate}
                max={toDate || undefined}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />

              <span className="text-gray-500 text-sm">to</span>

              <input
                type="date"
                value={toDate}
                min={fromDate || undefined}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex gap-2 w-full sm:w-auto">
              <button
                onClick={handleApplyFilter}
                disabled={!fromDate || !toDate}
                className="w-full sm:w-auto px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                Apply
              </button>

              <button
                onClick={handleClearFilter}
                className="w-full sm:w-auto px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-100"
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        {/* Group By Dropdown */}
        <div className="w-full sm:w-auto">
          <label className="text-xs font-medium text-gray-600 mb-1 block">
            Group By
          </label>
          <select
            value={selectedGroupBy}
            onChange={(e) => onGroupByChange(e.target.value)}
            className="w-full sm:w-[140px] px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="day">Daily</option>
            <option value="month">Monthly</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default DateRangeFilter;
