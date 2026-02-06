import React, { useState } from "react";
import { Calendar } from "lucide-react";

const DateRangeFilter = ({
  onDateRangeChange,
  onGroupByChange,
  selectedGroupBy,
  selectedDateRange,
}) => {
  const [fromDate, setFromDate] = useState(selectedDateRange.from || "");
  const [toDate, setToDate] = useState(selectedDateRange.to || "");

  const handleApplyFilter = () => {
    onDateRangeChange(fromDate, toDate);
  };

  const handleQuickFilter = (days) => {
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
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Quick Filters */}
        <div className="flex flex-wrap gap-2">
          <span className="text-sm font-medium text-gray-700 self-center mr-2">
            Quick Filter:
          </span>
          <button
            onClick={() => handleQuickFilter(7)}
            className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Last 7 Days
          </button>
          <button
            onClick={() => handleQuickFilter(30)}
            className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Last 30 Days
          </button>
          <button
            onClick={() => handleQuickFilter(90)}
            className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Last 90 Days
          </button>
        </div>

        {/* Custom Date Range */}
        <div className="flex flex-wrap items-center gap-2 lg:ml-auto">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="From"
            />
            <span className="text-gray-500">to</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="To"
            />
          </div>

          <button
            onClick={handleApplyFilter}
            className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Apply
          </button>
          <button
            onClick={handleClearFilter}
            className="px-4 py-1.5 text-sm bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Clear
          </button>
        </div>

        {/* Group By Selector */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Group By:</span>
          <select
            value={selectedGroupBy}
            onChange={(e) => onGroupByChange(e.target.value)}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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