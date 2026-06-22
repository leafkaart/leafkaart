import React from "react";
import { TrendingUp, Package, DollarSign, AlertCircle } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useGetDashboardQuery } from "../../store/api/analyticsApi";
import { setDateRange, setGroupBy } from "../../store/slices/analyticsSlice";

import OverviewCards from "./OverviewCards";
import DateRangeFilter from "./DateRangeFilter";

const DashboardAnalytics = () => {
  const dispatch = useDispatch();

  const { selectedDateRange, selectedGroupBy } = useSelector(
    (state) => state.analytics
  );

  const {
    data: dashboardData,
    isLoading,
    isFetching,
    error,
  } = useGetDashboardQuery(
    {
      from: selectedDateRange?.from || undefined,
      to: selectedDateRange?.to || undefined,
      groupBy: selectedGroupBy || "day",
    },
    { refetchOnMountOrArgChange: true }
  );
  const overview = dashboardData?.data?.overview || {};
  const lowStockProducts = dashboardData?.data?.lowStockProducts || [];

  const avgOrderValue =
    overview.totalOrders > 0 ? overview.totalRevenue / overview.totalOrders : 0;

  const productsPerOrder =
    overview.totalOrders > 0
      ? overview.totalProducts / overview.totalOrders
      : 0;

  const handleDateRangeChange = (from, to) => {
    dispatch(setDateRange({ from: from ?? "", to: to ?? "" }));
  };

  const handleGroupByChange = (groupBy) => {
    dispatch(setGroupBy(groupBy));
  };

  if (error) {
    return (
      <div className="flex items-center gap-3 p-6 bg-red-50 border border-red-200 rounded-xl text-red-700">
        <AlertCircle className="w-5 h-5 shrink-0" />
        <div>
          <p className="font-medium">Failed to load dashboard data</p>
          <p className="text-sm text-red-500 mt-0.5">
            {error?.data?.message ||
              error?.error ||
              "An unexpected error occurred."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DateRangeFilter
        onDateRangeChange={handleDateRangeChange}
        onGroupByChange={handleGroupByChange}
        selectedGroupBy={selectedGroupBy}
        selectedDateRange={selectedDateRange}
      />

      <OverviewCards data={overview} loading={isLoading || isFetching} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Average Order Value"
          value={`₹${avgOrderValue.toFixed(2)}`}
          icon={DollarSign}
          loading={isLoading || isFetching}
        />
        <StatCard
          title="Conversion Rate"
          value="3.24%"
          icon={TrendingUp}
          loading={isLoading || isFetching}
        />
        <StatCard
          title="Products per Order"
          value={productsPerOrder.toFixed(1)}
          icon={Package}
          loading={isLoading || isFetching}
        />
      </div>

      <div className="bg-white rounded-2xl border border-amber-200 p-5 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Low Stock Alerts</h3>
            <p className="text-sm text-gray-500">
              Products with stock below 20 units
            </p>
          </div>
          <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-sm font-medium">
            {lowStockProducts.length} items
          </span>
        </div>

        {lowStockProducts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {lowStockProducts.map((product) => (
              <div
                key={product._id}
                className="rounded-xl border border-gray-200 bg-gray-50 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-gray-900">
                      {product.title || "Untitled Product"}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      SKU: {product.sku || "N/A"}
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                    {product.stock} left
                  </span>
                </div>

                {product.dealerId && (
                  <p className="text-xs text-gray-500 mt-3">
                    Dealer:{" "}
                    {product.dealerId.storeName ||
                      product.dealerId.name ||
                      "N/A"}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center">
            <p className="text-sm text-gray-500">No low stock products right now.</p>
          </div>
        )}
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon: Icon, loading }) => {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-sm transition">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-gray-500">{title}</span>
        <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center">
          <Icon className="w-4 h-4 text-gray-400" />
        </div>
      </div>

      {loading ? (
        <div className="h-8 w-28 bg-gray-100 rounded-md animate-pulse" />
      ) : (
        <span className="text-2xl font-semibold text-gray-900">{value}</span>
      )}
    </div>
  );
};

export default DashboardAnalytics;
