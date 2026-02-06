import React from "react";
import { ShoppingCart, DollarSign, Package, Users } from "lucide-react";

const OverviewCards = ({ data, loading }) => {
  // Use data or fallback to zeros
  const safeData = data || {
    ordersCount: 0,
    revenue: 0,
    productsCount: 0,
    dealersCount: 0,
  };

  const cards = [
    {
      title: "Total Orders",
      value: safeData.ordersCount || 0,
      icon: ShoppingCart,
      bgColor: "bg-blue-50",
      iconColor: "text-blue-600",
      change: "+12.5%",
      changeType: "increase",
    },
    {
      title: "Total Revenue",
      value: `₹${safeData.revenue?.toLocaleString() || 0}`,
      icon: DollarSign,
      bgColor: "bg-green-50",
      iconColor: "text-green-600",
      change: "+18.2%",
      changeType: "increase",
    },
    {
      title: "Total Products",
      value: safeData.productsCount || 0,
      icon: Package,
      bgColor: "bg-purple-50",
      iconColor: "text-purple-600",
      change: "+5 new",
      changeType: "increase",
    },
    {
      title: "Total Dealers",
      value: safeData.dealersCount || 0,
      icon: Users,
      bgColor: "bg-orange-50",
      iconColor: "text-orange-600",
      change: "+3 new",
      changeType: "increase",
    },
  ];

  // Show loading skeleton while loading
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse"
          >
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/3"></div>
          </div>
        ))}
      </div>
    );
  }

  // Always render cards, even with zero values
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => (
        <OverviewCard key={index} {...card} />
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
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-gray-600">{title}</span>
        <div className={`p-3 rounded-lg ${bgColor}`}>
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
      </div>
      <div className="space-y-2">
        <h3 className="text-3xl font-bold text-gray-900">{value}</h3>
        {change && (
          <div className="flex items-center gap-1">
            <span
              className={`text-sm font-medium ${
                changeType === "increase" ? "text-green-600" : "text-red-600"
              }`}
            >
              {change}
            </span>
            <span className="text-xs text-gray-500">from last month</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default OverviewCards;