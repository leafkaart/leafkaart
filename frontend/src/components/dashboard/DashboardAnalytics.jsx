import React, { useState } from "react";
import {
  TrendingUp,
  ShoppingCart,
  Package,
  Users,
  DollarSign,
  Calendar,
  Download,
} from "lucide-react";
import { useGetOverviewQuery, useGetSalesReportQuery } from "../../store/api/analyticsApi";
import { useDispatch, useSelector } from "react-redux";
import { setDateRange, setGroupBy } from "../../store/slices/analyticsSlice";
import OverviewCards from "./OverviewCards";
import SalesChart from "./SalesChart";
import DateRangeFilter from "./DateRangeFilter";

const DashboardAnalytics = () => {
  const dispatch = useDispatch();
  const { selectedDateRange, selectedGroupBy } = useSelector(
    (state) => state.analytics
  );

  // Fetch overview data
  const {
    data: overviewData,
    isLoading: overviewLoading,
    error: overviewError,
  } = useGetOverviewQuery();

  // Fetch sales report with filters
  const {
    data: salesReportData,
    isLoading: salesLoading,
    error: salesError,
  } = useGetSalesReportQuery({
    from: selectedDateRange.from,
    to: selectedDateRange.to,
    groupBy: selectedGroupBy,
  });

  const handleDateRangeChange = (from, to) => {
    dispatch(setDateRange({ from, to }));
  };

  const handleGroupByChange = (groupBy) => {
    dispatch(setGroupBy(groupBy));
  };

  const handleExportReport = () => {
    // Export logic here
    console.log("Exporting sales report...");
  };

  // Always show UI, handle loading and errors within components
  const safeOverviewData = overviewData?.data || {
    ordersCount: 0,
    revenue: 0,
    productsCount: 0,
    dealersCount: 0,
  };

  const safeSalesData = salesReportData?.data || [];

  return (
    <div className="space-y-6">
      {/* Error Banner - Only show if there's an error */}
      {/* {overviewError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">
            ⚠️ Error loading dashboard data. Showing default values.
          </p>
        </div>
      )} */}

      {/* Overview Cards */}
      <OverviewCards data={safeOverviewData} loading={overviewLoading} />

      {/* Sales Report Section */}
      {/* <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Sales Report</h2>
              <p className="text-sm text-gray-600 mt-1">
                Track your sales performance over time
              </p>
            </div>
            <button
              onClick={handleExportReport}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export Report
            </button>
          </div>

          <DateRangeFilter
            onDateRangeChange={handleDateRangeChange}
            onGroupByChange={handleGroupByChange}
            selectedGroupBy={selectedGroupBy}
            selectedDateRange={selectedDateRange}
          />

          <SalesChart
            data={safeSalesData}
            loading={salesLoading}
            groupBy={selectedGroupBy}
            error={salesError}
          />
        </div>
      </div> */}

      {/* Additional Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Average Order Value"
          value={
            safeOverviewData.ordersCount > 0
              ? `₹${(
                  safeOverviewData.revenue / safeOverviewData.ordersCount
                ).toFixed(2)}`
              : "₹0.00"
          }
          icon={DollarSign}
          trend="+12.5%"
          trendUp={true}
        />
        <StatCard
          title="Conversion Rate"
          value="3.24%"
          icon={TrendingUp}
          trend="+2.1%"
          trendUp={true}
        />
        <StatCard
          title="Products per Order"
          value="2.4"
          icon={Package}
          trend="-0.3%"
          trendUp={false}
        />
      </div>
    </div>
  );
};

// Small Stat Card Component
const StatCard = ({ title, value, icon: Icon, trend, trendUp }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-600">{title}</span>
        <Icon className="w-5 h-5 text-gray-400" />
      </div>
      <div className="flex items-end justify-between">
        <span className="text-2xl font-bold text-gray-900">{value}</span>
        {trend && (
          <span
            className={`text-sm font-medium ${
              trendUp ? "text-green-600" : "text-red-600"
            }`}
          >
            {trend}
          </span>
        )}
      </div>
    </div>
  );
};

export default DashboardAnalytics;