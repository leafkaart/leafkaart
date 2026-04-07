import React from "react";
import { ShoppingCart, DollarSign, Package, Users } from "lucide-react";

const OverviewCards = ({ data, loading }) => {
  const overview = data || {};
  console.log(overview, "overviewoverviewoverview")
  const formatCurrency = (value) => {
    return `₹${Number(value || 0).toLocaleString("en-IN")}`;
  };

  const getChangeType = (value) => {
    if (value > 0) return "increase";
    if (value < 0) return "decrease";
    return "neutral";
  };

  const formatGrowth = (value) => {
    if (value === 0) return "0%";
    return `${value > 0 ? "+" : ""}${value}%`;
  };

  const cards = [
    {
      title: "Total Orders",
      value: overview.totalOrders ?? 0,
      icon: ShoppingCart,
      bgColor: "bg-blue-50",
      iconColor: "text-blue-600",
      change: formatGrowth(overview.ordersGrowth),
      changeType: getChangeType(overview.ordersGrowth),
    },
    {
      title: "Total Revenue",
      value: formatCurrency(overview.totalRevenue),
      icon: DollarSign,
      bgColor: "bg-green-50",
      iconColor: "text-green-600",
      change: formatGrowth(overview.revenueGrowth),
      changeType: getChangeType(overview.revenueGrowth),
    },
    {
      title: "Total Products",
      value: overview.totalProducts ?? 0,
      icon: Package,
      bgColor: "bg-purple-50",
      iconColor: "text-purple-600",
      change: null, // API not providing growth
    },
    {
      title: "Total Dealers",
      value: overview.totalDealers ?? 0,
      icon: Users,
      bgColor: "bg-orange-50",
      iconColor: "text-orange-600",
      change: null,
    },
  ];

  // ✅ Loading
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-lg border p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/3"></div>
          </div>
        ))}
      </div>
    );
  }

  // ✅ Cards
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card) => (
        <OverviewCard key={card.title} {...card} />
      ))}
    </div>
  );
};

const OverviewCard = ({
  title,
  value,
  icon: Icon,
  bgColor,
  iconColor,
  change,
  changeType,
}) => {
  return (
    <div className="bg-white rounded-lg border p-6 hover:shadow-md transition">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-gray-600">{title}</span>
        <div className={`p-3 rounded-lg ${bgColor}`}>
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-3xl font-bold text-gray-900">{value}</h3>

        {change !== null && (
          <div className="flex items-center gap-1">
            <span
              className={`text-sm font-medium ${
                changeType === "increase"
                  ? "text-green-600"
                  : changeType === "decrease"
                  ? "text-red-600"
                  : "text-gray-500"
              }`}
            >
              {change}
            </span>
            <span className="text-xs text-gray-500">vs last period</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default OverviewCards;
