import React from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const SalesChart = ({ data, loading, groupBy, error }) => {
  if (loading) {
    return (
      <div className="h-80 flex items-center justify-center bg-gray-50 rounded-lg">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Show empty state UI instead of just a message
  if (!data || data.length === 0) {
    return (
      <div className="space-y-4">
        {/* Error message if there's an error */}
        {error && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-700">
              ⚠️ Unable to load sales data. Please try again later.
            </p>
          </div>
        )}

        {/* Empty State UI */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">
            Revenue Trend
          </h3>
          <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
            <div className="text-center">
              <p className="text-gray-500 mb-2">No sales data available</p>
              <p className="text-sm text-gray-400">
                {error
                  ? "There was an error loading the data"
                  : "Try adjusting your date range filter"}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">
            Sales Volume
          </h3>
          <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
            <div className="text-center">
              <p className="text-gray-500 mb-2">No sales data available</p>
              <p className="text-sm text-gray-400">
                {error
                  ? "There was an error loading the data"
                  : "Try adjusting your date range filter"}
              </p>
            </div>
          </div>
        </div>

        {/* Summary Stats with zeros */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <SummaryCard label="Total Sales" value="0" />
          <SummaryCard label="Total Revenue" value="₹0" />
          <SummaryCard label="Average Sales" value="0" />
          <SummaryCard label="Avg Revenue" value="₹0" />
        </div>
      </div>
    );
  }

  // Transform data for the chart
  const chartData = data.map((item) => ({
    date: item._id,
    sales: item.totalSales,
    revenue: item.revenue,
  }));

  return (
    <div className="space-y-4">
      {/* Line Chart for Revenue */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">
          Revenue Trend
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="date"
              stroke="#6b7280"
              style={{ fontSize: "12px" }}
            />
            <YAxis stroke="#6b7280" style={{ fontSize: "12px" }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
              }}
              formatter={(value) => [`₹${value.toLocaleString()}`, "Revenue"]}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ fill: "#3b82f6", r: 4 }}
              activeDot={{ r: 6 }}
              name="Revenue"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Bar Chart for Sales Count */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">
          Sales Volume
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="date"
              stroke="#6b7280"
              style={{ fontSize: "12px" }}
            />
            <YAxis stroke="#6b7280" style={{ fontSize: "12px" }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
              }}
              formatter={(value) => [value, "Sales"]}
            />
            <Legend />
            <Bar
              dataKey="sales"
              fill="#10b981"
              radius={[8, 8, 0, 0]}
              name="Sales"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
        <SummaryCard
          label="Total Sales"
          value={chartData.reduce((sum, item) => sum + item.sales, 0)}
        />
        <SummaryCard
          label="Total Revenue"
          value={`₹${chartData
            .reduce((sum, item) => sum + item.revenue, 0)
            .toLocaleString()}`}
        />
        <SummaryCard
          label="Average Sales"
          value={Math.round(
            chartData.reduce((sum, item) => sum + item.sales, 0) /
              chartData.length
          )}
        />
        <SummaryCard
          label="Avg Revenue"
          value={`₹${Math.round(
            chartData.reduce((sum, item) => sum + item.revenue, 0) /
              chartData.length
          ).toLocaleString()}`}
        />
      </div>
    </div>
  );
};

const SummaryCard = ({ label, value }) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <p className="text-xs text-gray-600 mb-1">{label}</p>
      <p className="text-lg font-bold text-gray-900">{value}</p>
    </div>
  );
};

export default SalesChart;